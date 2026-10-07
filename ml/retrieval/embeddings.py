"""Lazy singletons for the embedding model and the cross-encoder reranker."""

from __future__ import annotations

import threading
from functools import lru_cache

import config

_lock = threading.Lock()
_embedder = None
_reranker = None


def get_embedder():
    global _embedder
    if _embedder is None:
        with _lock:
            if _embedder is None:
                from sentence_transformers import SentenceTransformer
                print(f"📦 Retrieval: loading embedding model {config.EMBEDDING_MODEL}")
                _embedder = SentenceTransformer(config.EMBEDDING_MODEL, device=config.EMBEDDING_DEVICE)
    return _embedder


def get_reranker():
    global _reranker
    if _reranker is None:
        with _lock:
            if _reranker is None:
                from sentence_transformers import CrossEncoder
                print(f"📦 Retrieval: loading reranker {config.RERANK_MODEL}")
                _reranker = CrossEncoder(config.RERANK_MODEL, device=config.EMBEDDING_DEVICE)
    return _reranker


def embedding_dim() -> int:
    return int(get_embedder().get_sentence_embedding_dimension())


def embed_documents(texts: list[str]) -> list[list[float]]:
    return get_embedder().encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()


@lru_cache(maxsize=512)
def embed_query(text: str) -> tuple:
    vector = get_embedder().encode(
        [config.EMBED_QUERY_PREFIX + text], normalize_embeddings=True, show_progress_bar=False
    )[0]
    return tuple(float(x) for x in vector)


def rerank_scores(query: str, passages: list[str]) -> list[float]:
    """Relevance probability (0..1) for each passage."""
    if not passages:
        return []
    import numpy as np
    logits = np.asarray(get_reranker().predict([(query, p) for p in passages]), dtype=float)
    # ms-marco cross-encoders may already apply a sigmoid; only squash raw logits.
    if logits.min() < 0.0 or logits.max() > 1.0:
        logits = 1.0 / (1.0 + np.exp(-logits))
    return [float(x) for x in logits]
