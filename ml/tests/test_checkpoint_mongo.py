"""
Conversation state in MongoDB. Needs a real MongoDB:

    TEST_MONGO_URI=mongodb://localhost:27099 python -m pytest tests/test_checkpoint_mongo.py
"""

import os

import pytest

pytestmark = pytest.mark.skipif(not os.getenv("TEST_MONGO_URI"), reason="set TEST_MONGO_URI to run")

KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
DB = "aether_consult_state_test"


@pytest.fixture
def mongo(monkeypatch):
    import config
    from pymongo import MongoClient
    monkeypatch.setattr(config, "MONGO_URI", os.environ["TEST_MONGO_URI"])
    monkeypatch.setattr(config, "ENCRYPTION_KEY", KEY)
    monkeypatch.setattr(config, "CHECKPOINT_DB", DB)
    client = MongoClient(os.environ["TEST_MONGO_URI"])
    client.drop_database(DB)
    yield client[DB]
    client.drop_database(DB)


def _service(llm):
    from conftest import FakeRetriever
    from consult import nodes
    from consult.checkpoint import build_checkpointer
    from consult.service import ConsultService
    from retrieval.retriever import extract_citations, format_context
    retriever = FakeRetriever()
    deps = nodes.Deps(llm=llm, retrieve=retriever.retrieve, grade=lambda d: "strong",
                      format_context=format_context, extract_citations=extract_citations)
    saver, info = build_checkpointer()
    return ConsultService(deps=deps, checkpointer=saver, checkpointer_info=info)


def _all_bytes(db) -> bytes:
    import bson
    return b"".join(bson.encode(doc) for name in db.list_collection_names() for doc in db[name].find())


def test_state_is_encrypted_pruned_shared_and_deletable(mongo, llm):
    first = _service(llm)
    assert first.checkpointer_info.startswith("mongodb")

    first.run("thread-1", {"message": "PLAINTEXT-MARKER my lower back hurts", "image_b64": "PHOTO-MARKER"})
    llm.question = "ASSISTANT-MARKER how long?"
    first.run("thread-1", {"message": "since yesterday"})

    # 1. nothing readable is stored: not the messages, not the reply, not the photo
    stored = _all_bytes(mongo)
    assert len(stored) > 500
    for marker in (b"PLAINTEXT-MARKER", b"ASSISTANT-MARKER", b"PHOTO-MARKER", b"lower back"):
        assert marker not in stored, marker

    # 2. one checkpoint per conversation is kept
    assert mongo["consult_checkpoints"].count_documents({"thread_id": "thread-1"}) == 1
    assert mongo["consult_checkpoint_writes"].count_documents({"thread_id": "thread-1"}) == 0

    # 3. a second instance (another replica, or after a restart) continues the conversation
    second = _service(llm)
    result = second.run("thread-1", {"message": "it is a dull ache"})
    assert result["turn_count"] == 3
    saved = second.graph.get_state({"configurable": {"thread_id": "thread-1"}}).values
    assert saved["messages"][0]["content"].startswith("PLAINTEXT-MARKER")       # decrypts correctly

    # 4. the TTL index exists so abandoned conversations expire
    assert any("expireAfterSeconds" in index for index in mongo["consult_checkpoints"].list_indexes())

    # 5. deleting the thread removes everything
    second.delete_thread("thread-1")
    assert mongo["consult_checkpoints"].count_documents({}) == 0
    assert second.run("thread-1", {"message": "hello"})["turn_count"] == 1


def test_review_pause_survives_a_restart_and_is_stored_encrypted(mongo, llm, monkeypatch):
    import config
    monkeypatch.setattr(config, "REVIEW_MODE", "all")
    full = "REVIEW-MARKER my lower back pain started 2 days ago, it is moderate and dull, no other symptoms"
    llm.analysis = {"intent": "symptom_report", "category": "orthopedics", "urgency": "routine", "chief_complaint": "lower back pain",
                    "duration": "2 days", "severity": "moderate", "character": "dull", "associated_symptoms": "none reported"}
    first = _service(llm)
    assert first.run("thread-r", {"message": full})["mode"] == "pending_review"

    stored = _all_bytes(mongo)
    for marker in (b"REVIEW-MARKER", b"Summary", b"lower back"):
        assert marker not in stored, marker
    assert mongo["consult_reviews"].count_documents({}) == 1

    # another replica lists the queue, shows the draft to the clinician and resumes the run
    second = _service(llm)
    queue = second.reviews.list()
    assert queue[0]["thread_id"] == "thread-r" and queue[0]["draft"].startswith("Summary")
    assert second.run("thread-r", {"message": "hello?"})["mode"] == "pending_review"
    result = second.resume("thread-r", "approve", reviewer="Dr. Rao")
    assert result["mode"] == "assessment" and result["session_complete"] and result["reply"].startswith("Summary")
    assert mongo["consult_reviews"].count_documents({}) == 0
    assert mongo["consult_checkpoints"].count_documents({"thread_id": "thread-r"}) == 1


def test_wrong_key_cannot_read_state(mongo, llm, monkeypatch):
    import config
    _service(llm).run("thread-2", {"message": "my lower back hurts"})
    monkeypatch.setattr(config, "ENCRYPTION_KEY", "ff" * 32)
    with pytest.raises(Exception):
        _service(llm).run("thread-2", {"message": "again"})


def test_no_key_means_no_database_writes(mongo, llm, monkeypatch):
    import config
    monkeypatch.setattr(config, "ENCRYPTION_KEY", "")
    service = _service(llm)
    assert service.checkpointer_info.startswith("memory")
    service.run("thread-3", {"message": "my lower back hurts"})
    assert mongo.list_collection_names() == []


def test_state_lives_in_the_apps_own_database_by_default(llm, monkeypatch):
    import config
    from pymongo import MongoClient
    uri = os.environ["TEST_MONGO_URI"].rstrip("/") + "/aether_app_db_test"
    monkeypatch.setattr(config, "MONGO_URI", uri)
    monkeypatch.setattr(config, "ENCRYPTION_KEY", KEY)
    monkeypatch.setattr(config, "CHECKPOINT_DB", "")
    client = MongoClient(uri)
    client.drop_database("aether_app_db_test")
    try:
        service = _service(llm)
        assert "aether_app_db_test" in service.checkpointer_info
        service.run("thread-5", {"message": "my lower back hurts"})
        assert set(client["aether_app_db_test"].list_collection_names()) == {"consult_checkpoints", "consult_checkpoint_writes"}
    finally:
        client.drop_database("aether_app_db_test")


def test_unreachable_mongo_falls_back_to_memory(llm, monkeypatch):
    import config
    monkeypatch.setattr(config, "MONGO_URI", "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=300")
    monkeypatch.setattr(config, "ENCRYPTION_KEY", KEY)
    service = _service(llm)
    assert service.checkpointer_info.startswith("memory")
    assert service.run("thread-4", {"message": "my lower back hurts"})["mode"] == "ask"
