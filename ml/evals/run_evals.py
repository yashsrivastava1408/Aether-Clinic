"""
Offline evaluation of retrieval, context grading and emergency screening.

Run from the ml/ directory:
    python -m evals.run_evals            # default configuration
    python -m evals.run_evals --compare  # also compare dense / sparse / hybrid

No LLM is called. Results are printed and written to evals/results.json.
"""

from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve().parent
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

import config  # noqa: E402
from consult.emergency import detect_emergency  # noqa: E402
from retrieval import grade_context, retrieve  # noqa: E402


def _load(name: str) -> list[dict]:
    return [json.loads(line) for line in (HERE / name).read_text().splitlines() if line.strip()]


def eval_retrieval(mode: str = "hybrid", rerank: bool | None = None) -> dict:
    """hit@1 / hit@3 / MRR over protocols, plus whether the expected protocol
    survives into the context that is actually given to the model."""
    gold = _load("gold_retrieval.jsonl")
    hit1 = hit3 = in_context = 0
    mrr = 0.0
    misses = []
    for item in gold:
        ranked = retrieve(item["query"], top_k=8, mode=mode, rerank=rerank, rel_cutoff=0.0)
        titles: list[str] = []
        for chunk in ranked:
            if chunk["title"] not in titles:
                titles.append(chunk["title"])
        rank = titles.index(item["expected"]) + 1 if item["expected"] in titles else 0
        hit1 += rank == 1
        hit3 += 0 < rank <= 3
        mrr += 1 / rank if rank else 0
        if rank != 1:
            misses.append({"query": item["query"], "got": titles[0] if titles else None, "rank": rank})
        served = retrieve(item["query"], mode=mode, rerank=rerank)
        in_context += any(c["title"] == item["expected"] for c in served)
    n = len(gold)
    return {
        "queries": n, "hit@1": round(hit1 / n, 3), "hit@3": round(hit3 / n, 3), "mrr": round(mrr / n, 3),
        "expected_protocol_in_context": round(in_context / n, 3), "top1_misses": misses,
    }


def eval_research() -> dict:
    """
    Messages with two unrelated problems. Compares one search over the whole
    message with one search per planned topic, merged the way the research
    step does. Counts how often BOTH expected protocols reach the model.
    The planned queries are given in the gold file, so this measures the
    searching and merging, not the model that writes the plan.
    """
    gold = _load("gold_multitopic.jsonl")
    single = planned = 0
    for item in gold:
        one = {c["title"] for c in retrieve(item["combined"])}
        single += all(title in one for title in item["expected"])

        merged: dict[str, dict] = {}
        leaders = []
        for query in item["queries"]:
            found = retrieve(query)
            if grade_context(found) == "none":
                continue
            leaders.append(found[0]["id"])
            for chunk in found:
                if chunk["id"] not in merged or chunk["relevance_score"] > merged[chunk["id"]]["relevance_score"]:
                    merged[chunk["id"]] = chunk
        ranked = sorted(merged.values(), key=lambda c: c["relevance_score"], reverse=True)
        kept = ([c for c in ranked if c["id"] in leaders] + [c for c in ranked if c["id"] not in leaders])[: config.RESEARCH_MAX_CHUNKS]
        planned += all(title in {c["title"] for c in kept} for title in item["expected"])
    n = len(gold)
    return {"messages": n, "both_protocols_single_search": round(single / n, 3), "both_protocols_planned_searches": round(planned / n, 3)}


def eval_grading() -> dict:
    """On-topic queries should be graded strong/weak, off-topic ones none."""
    on = [grade_context(retrieve(item["query"])) for item in _load("gold_retrieval.jsonl")]
    off = [grade_context(retrieve(item["query"])) for item in _load("gold_offtopic.jsonl")]
    return {
        "on_topic": {g: on.count(g) for g in ("strong", "weak", "none")},
        "off_topic": {g: off.count(g) for g in ("strong", "weak", "none")},
        "on_topic_kept": round(1 - on.count("none") / len(on), 3),
        "off_topic_rejected": round(off.count("none") / len(off), 3),
    }


def eval_emergency() -> dict:
    """Recall on messages that must trigger, and false alarms on ones that must not."""
    gold = _load("gold_emergency.jsonl")
    must = [g for g in gold if g["emergency"]]
    must_not = [g for g in gold if not g["emergency"]]
    missed = [g["text"] for g in must if not detect_emergency(g["text"])["is_emergency"]]
    wrong_kind = [
        {"text": g["text"], "expected": g["kind"], "got": detect_emergency(g["text"])["kind"]}
        for g in must if g.get("kind") and detect_emergency(g["text"])["is_emergency"] and detect_emergency(g["text"])["kind"] != g["kind"]
    ]
    false_alarms = [g["text"] for g in must_not if detect_emergency(g["text"])["is_emergency"]]
    return {
        "must_trigger": len(must), "recall": round(1 - len(missed) / len(must), 3), "missed": missed,
        "wrong_kind": wrong_kind,
        "must_not_trigger": len(must_not), "false_alarm_rate": round(len(false_alarms) / len(must_not), 3),
        "false_alarms": false_alarms,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--compare", action="store_true", help="compare dense, sparse and hybrid retrieval")
    args = parser.parse_args()

    results = {
        "config": {
            "embedding_model": config.EMBEDDING_MODEL, "sparse_weight": config.SPARSE_WEIGHT,
            "rerank": config.RERANK_ENABLED, "top_k": config.RETRIEVE_TOP_K, "rel_cutoff": config.RETRIEVE_REL_CUTOFF,
            "grade_strong": config.GRADE_STRONG, "grade_weak": config.GRADE_WEAK,
        },
        "retrieval": eval_retrieval(),
        "research": eval_research(),
        "grading": eval_grading(),
        "emergency": eval_emergency(),
    }
    if args.compare:
        results["comparison"] = {
            label: {k: v for k, v in eval_retrieval(mode, rerank).items() if k != "top1_misses"}
            for label, mode, rerank in [
                ("dense", "dense", False), ("sparse", "sparse", False),
                ("hybrid", "hybrid", False), ("hybrid+rerank", "hybrid", True),
            ]
        }

    print(json.dumps(results, indent=2, ensure_ascii=False))
    (HERE / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
