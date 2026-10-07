"""
Retrieval pipeline: hybrid search → cross-encoder rerank → grade.

`grade_context` tells the consult graph whether the retrieved protocols are
good enough to ground an answer ("strong"), only loosely related ("weak"),
or not relevant at all ("none").
"""

from __future__ import annotations

import config
from . import embeddings, store


def lexical_score(sparse_score: float) -> float:
    """Squashes an unbounded BM25 score into 0..1."""
    return sparse_score / (sparse_score + config.SPARSE_SATURATION) if sparse_score > 0 else 0.0


def hybrid_score(chunk: dict) -> float:
    """Dense cosine similarity plus a weighted lexical-match bonus, capped at 1."""
    return min(1.0, chunk["dense_score"] + config.SPARSE_WEIGHT * lexical_score(chunk["sparse_score"]))


def retrieve(
    query: str,
    top_k: int | None = None,
    mode: str = "hybrid",
    rerank: bool | None = None,
    categories: list[str] | None = None,
    rel_cutoff: float | None = None,
) -> list[dict]:
    """Returns up to top_k chunks, best first, each with `relevance_score` (0..1)."""
    query = (query or "").strip()
    if not query:
        return []
    top_k = top_k or config.RETRIEVE_TOP_K
    rerank = config.RERANK_ENABLED if rerank is None else rerank

    candidates = store.search(query, limit=config.RETRIEVE_CANDIDATES, mode=mode, categories=categories)
    if categories and len(candidates) < top_k:
        # The category guess was too narrow; widen to the whole corpus.
        seen = {c["id"] for c in candidates}
        candidates += [c for c in store.search(query, limit=config.RETRIEVE_CANDIDATES, mode=mode) if c["id"] not in seen]
    if not candidates:
        return []

    for chunk in candidates:
        if mode == "dense":
            score = chunk["dense_score"]
        elif mode == "sparse":
            score = lexical_score(chunk["sparse_score"])
        else:
            score = hybrid_score(chunk)
        chunk["relevance_score"] = round(score, 4)
    candidates.sort(key=lambda c: c["relevance_score"], reverse=True)

    if rerank:
        # The cross-encoder only reorders; `relevance_score` stays on the
        # retrieval scale so context grading is the same with or without it.
        pool = candidates[: max(top_k * 2, 8)]
        scores = embeddings.rerank_scores(query, [f"{c['title']}\n{c['content']}" for c in pool])
        for chunk, score in zip(pool, scores):
            chunk["rerank_score"] = round(score, 4)
        pool.sort(key=lambda c: c["rerank_score"], reverse=True)
        candidates = pool

    best = max(c["relevance_score"] for c in candidates)
    floor = best * (config.RETRIEVE_REL_CUTOFF if rel_cutoff is None else rel_cutoff)
    return [c for c in candidates[:top_k] if c["relevance_score"] >= floor]


def grade_context(chunks: list[dict]) -> str:
    """"strong" | "weak" | "none" based on the best chunk's relevance."""
    if not chunks:
        return "none"
    best = max(c.get("relevance_score", 0.0) for c in chunks)
    if best >= config.GRADE_STRONG:
        return "strong"
    if best >= config.GRADE_WEAK:
        return "weak"
    return "none"


def format_context(chunks: list[dict]) -> str:
    """Groups chunks by protocol and numbers each protocol for inline citation."""
    grouped: dict[tuple, list[dict]] = {}
    for chunk in chunks:
        grouped.setdefault((chunk["title"], chunk["source"]), []).append(chunk)

    blocks = []
    for n, ((title, source), parts) in enumerate(grouped.items(), start=1):
        parts.sort(key=lambda c: c.get("chunk_index", 0))
        body = "\n\n".join(p["content"] for p in parts)
        blocks.append(f"[{n}] {title}\nSource: {source}\n{body}")
    return "\n\n".join(blocks)


def extract_citations(chunks: list[dict]) -> list[dict]:
    """Unique protocols in the same order `format_context` numbers them."""
    citations: list[dict] = []
    seen: dict[tuple, dict] = {}
    for chunk in chunks:
        key = (chunk["title"], chunk["source"])
        if key in seen:
            seen[key]["relevance"] = max(seen[key]["relevance"], chunk.get("relevance_score", 0.0))
            continue
        entry = {
            "index": len(citations) + 1,
            "title": chunk["title"],
            "source": chunk["source"],
            "category": chunk.get("category", "General"),
            "relevance": chunk.get("relevance_score", 0.0),
        }
        seen[key] = entry
        citations.append(entry)
    return citations
