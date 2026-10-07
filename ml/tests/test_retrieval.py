"""Retrieval tests. These load the real embedding model (a few seconds)."""

import pytest

import config
from retrieval import extract_citations, format_context, grade_context, retrieve, sparse, store
from retrieval.corpus import chunk_body, load_chunks, parse_protocol


@pytest.fixture(scope="module", autouse=True)
def embedded_index():
    store.reset()
    store.ensure_ready()
    yield


def test_corpus_chunks_keep_metadata_and_stable_ids():
    chunks = load_chunks(config.CORPUS_DIR)
    assert len(chunks) >= 17
    assert all(c["title"] != "Unknown Protocol" and c["categories"] for c in chunks)
    assert all(len(c["content"]) <= 1000 for c in chunks)
    assert all("TITLE:" not in c["content"] for c in chunks)       # headers are metadata, not body
    assert [c["id"] for c in chunks] == [c["id"] for c in load_chunks(config.CORPUS_DIR)]
    assert len({c["id"] for c in chunks}) == len(chunks)


def test_chunking_never_splits_inside_a_section_when_it_fits():
    body = "Intro line.\n\nRed flags:\n- one\n- two\n\nSelf care:\n- rest"
    assert chunk_body(body, max_chars=40) == ["Intro line.\n\nRed flags:\n- one\n- two", "Self care:\n- rest"]


def test_protocol_header_parsing():
    meta = parse_protocol("TITLE: A\nSOURCE: B\nCATEGORY: Cardiology | Emergency\n\nBody text")
    assert (meta["title"], meta["source"], meta["categories"], meta["body"]) == ("A", "B", ["Cardiology", "Emergency"], "Body text")


def test_ingest_is_idempotent():
    before = store.chunk_count()
    store.ingest()
    assert store.chunk_count() == before


def test_sparse_encoding_is_stable_and_stems_plurals():
    assert sparse.tokenize("Headaches and the migraines") == ["headache", "migraine"]
    assert sparse.encode_query("chest pain") == sparse.encode_query("pain chest")
    indices, values = sparse.encode_document("pain pain pain relief")
    assert len(indices) == 2 and max(values) > min(values)


@pytest.mark.parametrize("query,expected", [
    ("crushing chest pain spreading to my left arm with sweating", "Acute Coronary Syndrome"),
    ("lower back hurts after lifting a heavy box", "Low Back Pain"),
    ("throbbing one sided headache with nausea, light hurts", "Headache Classification"),
    ("wheezing at night and my inhaler is not helping", "Asthma"),
])
def test_symptom_queries_find_the_right_protocol(query, expected):
    top = retrieve(query)[0]
    assert top["title"].startswith(expected)
    assert grade_context(retrieve(query)) == "strong"


def test_exact_term_query_is_rescued_by_the_lexical_half():
    # Dense similarity alone scores this near 0.1 (graded "none"); the term match lifts it.
    query = "what does a reduced ejection fraction mean"
    dense_only = retrieve(query, mode="dense")
    hybrid = retrieve(query)
    assert hybrid[0]["title"].startswith("Heart Failure")
    assert hybrid[0]["relevance_score"] > dense_only[0]["relevance_score"]
    assert grade_context(hybrid) != "none"


@pytest.mark.parametrize("query", ["how do I change the oil in my car engine", "recipe for chocolate chip cookies", "who won the football world cup in 2018"])
def test_off_topic_queries_are_graded_none(query):
    assert grade_context(retrieve(query)) == "none"


def test_empty_query_and_empty_results():
    assert retrieve("   ") == []
    assert grade_context([]) == "none"


def test_low_scoring_chunks_are_trimmed_from_the_context():
    served = retrieve("what is a normal blood pressure reading")
    assert {c["title"] for c in served} == {"Hypertension Management - Primary Care Protocol"}
    untrimmed = retrieve("what is a normal blood pressure reading", rel_cutoff=0.0)
    assert len(untrimmed) > len(served)


def test_category_filter_restricts_then_widens():
    only = retrieve("chest pain", categories=["cardiology"], rel_cutoff=0.0)
    assert all("cardiology" in c["categories"] for c in only)
    widened = retrieve("chest pain", categories=["no-such-category"], rel_cutoff=0.0)
    assert widened                                                   # falls back to the whole corpus


def test_context_groups_chunks_by_protocol_and_numbers_match_citations():
    chunks = [
        {"title": "A", "source": "s1", "content": "second", "chunk_index": 1, "relevance_score": 0.5, "category": "X"},
        {"title": "B", "source": "s2", "content": "other", "chunk_index": 0, "relevance_score": 0.4, "category": "Y"},
        {"title": "A", "source": "s1", "content": "first", "chunk_index": 0, "relevance_score": 0.7, "category": "X"},
    ]
    context = format_context(chunks)
    assert context.index("first") < context.index("second")          # both chunks kept, in document order
    assert context.startswith("[1] A") and "[2] B" in context
    citations = extract_citations(chunks)
    assert [(c["index"], c["title"], c["relevance"]) for c in citations] == [(1, "A", 0.7), (2, "B", 0.4)]


def test_eval_thresholds_hold():
    """The numbers quoted in docs/ARCHITECTURE.md; fails if retrieval regresses."""
    from evals.run_evals import eval_grading, eval_retrieval
    retrieval = eval_retrieval()
    assert retrieval["hit@3"] == 1.0 and retrieval["hit@1"] >= 0.9
    assert retrieval["expected_protocol_in_context"] == 1.0
    grading = eval_grading()
    assert grading["on_topic_kept"] == 1.0 and grading["off_topic_rejected"] == 1.0


def test_planned_searches_cover_two_topics_better_than_one_search():
    from evals.run_evals import eval_research
    research = eval_research()
    assert research["both_protocols_planned_searches"] == 1.0
    assert research["both_protocols_planned_searches"] > research["both_protocols_single_search"]
