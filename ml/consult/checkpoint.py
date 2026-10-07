"""
Conversation-state storage for the consult graph.

With MONGO_URI and ENCRYPTION_KEY set, state is saved in MongoDB, encrypted
with AES, and shared by every replica. Otherwise state lives in memory; after
a restart the gateway's transcript is used to rebuild it (see `prepare`).
"""

from __future__ import annotations

import binascii
import warnings

import config


def _aes_key() -> bytes | None:
    try:
        key = binascii.unhexlify(config.ENCRYPTION_KEY)
    except (binascii.Error, ValueError):
        return None
    return key if len(key) in (16, 24, 32) else None


def _memory():
    from langgraph.checkpoint.memory import MemorySaver
    return MemorySaver()


def build_checkpointer():
    """Returns (checkpointer, description)."""
    if not config.MONGO_URI:
        return _memory(), "memory (MONGO_URI not set; state is rebuilt from the transcript after a restart)"

    key = _aes_key()
    if key is None:
        # Patient messages are never written to the database unencrypted.
        return _memory(), "memory (ENCRYPTION_KEY missing or invalid; refusing to store state unencrypted)"

    try:
        from pymongo import MongoClient
        from langgraph.checkpoint.mongodb import MongoDBSaver
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from langgraph.checkpoint.serde.encrypted import EncryptedSerializer
            serde = EncryptedSerializer.from_pycryptodome_aes(key=key)

        client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=4000)
        client.admin.command("ping")
        db_name = config.CHECKPOINT_DB
        if not db_name:
            try:
                db_name = client.get_default_database().name
            except Exception:  # noqa: BLE001 - the URI names no database
                db_name = "aether_consult_state"
        saver = _EncryptedMongoSaver(
            client, db_name=db_name, ttl=config.CHECKPOINT_TTL_S,
            checkpoint_collection_name="consult_checkpoints",
            writes_collection_name="consult_checkpoint_writes",
        )
        saver.serde = serde
        return saver, f"mongodb (db '{db_name}', AES-encrypted, {config.CHECKPOINT_TTL_S // 86400}-day TTL)"
    except Exception as exc:  # noqa: BLE001
        print(f"Checkpointer: MongoDB unavailable ({type(exc).__name__}); using memory.")
        return _memory(), "memory (MongoDB unreachable at startup)"


try:
    from langgraph.checkpoint.mongodb import MongoDBSaver as _MongoDBSaver

    class _EncryptedMongoSaver(_MongoDBSaver):
        """MongoDBSaver that keeps node outputs out of the plain-text metadata."""

        def put(self, config, checkpoint, metadata, new_versions):
            safe = {k: v for k, v in dict(metadata).items() if k != "writes"}
            return super().put(config, checkpoint, safe, new_versions)

        def prune(self, thread_id: str) -> None:
            """Deletes every checkpoint of a thread except the newest one."""
            latest = self.checkpoint_collection.find_one({"thread_id": thread_id}, sort=[("checkpoint_id", -1)])
            if latest is None:
                return
            older = {"thread_id": thread_id, "checkpoint_id": {"$ne": latest["checkpoint_id"]}}
            self.checkpoint_collection.delete_many(older)
            self.writes_collection.delete_many(older)
except ImportError:  # the Mongo extra is optional for local development
    _EncryptedMongoSaver = None  # type: ignore[assignment]


class ReviewQueue:
    """
    Assessments waiting for a clinician. Kept next to the checkpoints:
    in MongoDB (payload AES-encrypted) when that is the state store, in
    memory otherwise.
    """

    def __init__(self, checkpointer=None):
        self._memory: dict[str, dict] = {}
        self._collection = None
        self._serde = None
        if _EncryptedMongoSaver is not None and isinstance(checkpointer, _EncryptedMongoSaver):
            self._collection = checkpointer.db["consult_reviews"]
            self._serde = checkpointer.serde

    def add(self, thread_id: str, payload: dict, created_at: str) -> None:
        if self._collection is None:
            self._memory[thread_id] = {"thread_id": thread_id, "created_at": created_at, **payload}
            return
        kind, blob = self._serde.dumps_typed(payload)
        self._collection.replace_one(
            {"_id": thread_id},
            {"_id": thread_id, "created_at": created_at, "type": kind, "payload": blob},
            upsert=True,
        )

    def _decode(self, doc: dict) -> dict:
        payload = self._serde.loads_typed((doc["type"], doc["payload"]))
        return {"thread_id": doc["_id"], "created_at": doc["created_at"], **payload}

    def get(self, thread_id: str):
        if self._collection is None:
            return self._memory.get(thread_id)
        doc = self._collection.find_one({"_id": thread_id})
        return self._decode(doc) if doc else None

    def has(self, thread_id: str) -> bool:
        if self._collection is None:
            return thread_id in self._memory
        return self._collection.count_documents({"_id": thread_id}, limit=1) > 0

    def list(self) -> list[dict]:
        if self._collection is None:
            return sorted(self._memory.values(), key=lambda r: r["created_at"])
        return [self._decode(doc) for doc in self._collection.find().sort("created_at", 1)]

    def remove(self, thread_id: str) -> None:
        if self._collection is None:
            self._memory.pop(thread_id, None)
        else:
            self._collection.delete_one({"_id": thread_id})
