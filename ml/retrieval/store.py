"""
Qdrant access: one collection with a dense vector and a BM25 sparse vector
per chunk.

Two modes, chosen by environment:
  • server   — QDRANT_URL or QDRANT_HOST is set (Docker Compose, Kubernetes)
  • embedded — nothing set; an in-memory index is built from the corpus when
               the process starts (local dev, single-container hosts)
"""

from __future__ import annotations

import re
import threading

from qdrant_client import QdrantClient, models

import config
from . import embeddings, sparse
from .corpus import load_chunks

DENSE = "dense"
SPARSE = "sparse"

_lock = threading.RLock()
_client = None
_ready_collection = None


def is_embedded() -> bool:
    return not (config.QDRANT_URL or config.QDRANT_HOST)


def collection_name() -> str:
    """The embedding model is part of the name, so changing models never
    mixes vectors of different sizes in one collection."""
    slug = re.sub(r"[^a-z0-9]+", "_", config.EMBEDDING_MODEL.split("/")[-1].lower()).strip("_")
    return f"medical_kb__{slug}"


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        with _lock:
            if _client is None:
                if config.QDRANT_URL:
                    _client = QdrantClient(url=config.QDRANT_URL, api_key=config.QDRANT_API_KEY or None, timeout=10)
                elif config.QDRANT_HOST:
                    _client = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT, timeout=10)
                else:
                    _client = QdrantClient(":memory:")
    return _client


def reset() -> None:
    """Drops cached handles (used by tests and by the eval harness)."""
    global _client, _ready_collection
    with _lock:
        _client = None
        _ready_collection = None
    embeddings.embed_query.cache_clear()


def ingest(recreate: bool = False) -> int:
    """Embeds the corpus and upserts it. Chunk ids are deterministic, so
    running this twice (or from two replicas at once) is harmless."""
    client = get_client()
    name = collection_name()
    with _lock:
        if recreate and client.collection_exists(name):
            client.delete_collection(name)
        if not client.collection_exists(name):
            client.create_collection(
                collection_name=name,
                vectors_config={DENSE: models.VectorParams(size=embeddings.embedding_dim(), distance=models.Distance.COSINE)},
                sparse_vectors_config={SPARSE: models.SparseVectorParams(modifier=models.Modifier.IDF)},
            )
            if not is_embedded():
                client.create_payload_index(name, field_name="categories", field_schema=models.PayloadSchemaType.KEYWORD)

        chunks = load_chunks(config.CORPUS_DIR)
        if not chunks:
            print(f"⚠️ Retrieval: no corpus files found in {config.CORPUS_DIR}")
            return 0

        vectors = embeddings.embed_documents([c["embed_text"] for c in chunks])
        points = []
        for chunk, vector in zip(chunks, vectors):
            indices, values = sparse.encode_document(chunk["embed_text"])
            payload = {k: v for k, v in chunk.items() if k not in ("id", "embed_text")}
            points.append(models.PointStruct(
                id=chunk["id"],
                vector={DENSE: vector, SPARSE: models.SparseVector(indices=indices, values=values)},
                payload=payload,
            ))
        client.upsert(collection_name=name, points=points, wait=True)

        # Remove chunks that no longer exist in the corpus.
        keep = {c["id"] for c in chunks}
        stale, offset = [], None
        while True:
            batch, offset = client.scroll(name, limit=256, offset=offset, with_payload=False, with_vectors=False)
            stale.extend(p.id for p in batch if str(p.id) not in keep)
            if offset is None:
                break
        if stale:
            client.delete(name, points_selector=models.PointIdsList(points=stale), wait=True)

        print(f"✅ Retrieval: indexed {len(points)} chunks into '{name}'")
        return len(points)


def ensure_ready() -> str:
    """Returns the collection name, building the index first if it is empty."""
    global _ready_collection
    name = collection_name()
    if _ready_collection == name:
        return name
    with _lock:
        if _ready_collection != name:
            client = get_client()
            if not client.collection_exists(name) or client.count(name, exact=True).count == 0:
                ingest()
            _ready_collection = name
    return name


def chunk_count() -> int:
    return get_client().count(ensure_ready(), exact=True).count


def _points(result) -> list[dict]:
    return [{**(p.payload or {}), "id": str(p.id), "score": float(p.score)} for p in result.points]


def search(query: str, limit: int, mode: str = "hybrid", categories: list[str] | None = None) -> list[dict]:
    """
    Returns candidate chunks, each with `dense_score` (cosine, 0..1) and
    `sparse_score` (BM25, unbounded; 0 when the chunk shares no query terms).

    mode: "hybrid" (union of the dense and sparse top results), "dense" or "sparse".
    categories: optional lower-case category names; only chunks tagged with
          at least one of them are returned.
    """
    name = ensure_ready()
    client = get_client()
    conditions = []
    if categories:
        conditions.append(models.FieldCondition(key="categories", match=models.MatchAny(any=categories)))
    query_filter = models.Filter(must=conditions) if conditions else None

    dense_query = list(embeddings.embed_query(query))
    s_idx, s_val = sparse.encode_query(query)
    sparse_query = models.SparseVector(indices=s_idx, values=s_val)

    def run(vector, using, flt, n):
        return _points(client.query_points(name, query=vector, using=using, limit=n, query_filter=flt, with_payload=True))

    def only_ids(ids):
        return models.Filter(must=conditions + [models.HasIdCondition(has_id=ids)])

    # The embedded client is not built for concurrent use.
    guard = _lock if is_embedded() else threading.RLock()
    with guard:
        dense_hits = run(dense_query, DENSE, query_filter, limit) if mode in ("dense", "hybrid") else []
        sparse_hits = run(sparse_query, SPARSE, query_filter, limit) if mode in ("sparse", "hybrid") and s_idx else []

        merged: dict[str, dict] = {}
        for hit in dense_hits:
            merged[hit["id"]] = {**hit, "dense_score": hit["score"], "sparse_score": 0.0}
        for hit in sparse_hits:
            if hit["id"] in merged:
                merged[hit["id"]]["sparse_score"] = hit["score"]
            else:
                merged[hit["id"]] = {**hit, "dense_score": None, "sparse_score": hit["score"]}

        # Fill in the score each chunk is missing so both are always present.
        need_dense = [i for i, c in merged.items() if c["dense_score"] is None]
        if need_dense:
            for hit in run(dense_query, DENSE, only_ids(need_dense), len(need_dense)):
                merged[hit["id"]]["dense_score"] = hit["score"]
        need_sparse = [c["id"] for c in dense_hits if merged[c["id"]]["sparse_score"] == 0.0] if s_idx and mode == "hybrid" else []
        if need_sparse:
            for hit in run(sparse_query, SPARSE, only_ids(need_sparse), len(need_sparse)):
                merged[hit["id"]]["sparse_score"] = hit["score"]

    out = []
    for chunk in merged.values():
        chunk.pop("score", None)
        chunk["dense_score"] = max(0.0, float(chunk["dense_score"] or 0.0))
        out.append(chunk)
    return out
