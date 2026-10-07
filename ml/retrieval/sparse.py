"""
BM25-style sparse vectors for Qdrant.

Documents carry the term-frequency half of BM25; Qdrant applies the IDF half
at query time (collection is created with `Modifier.IDF`). Token ids are a
stable hash, so no vocabulary file has to be stored or shipped.
"""

from __future__ import annotations

import re
import zlib
from collections import Counter

K1 = 1.2
B = 0.75
# Rough average chunk length in tokens; only affects length normalisation.
AVG_DOC_LEN = 120.0

_TOKEN_RE = re.compile(r"[a-z0-9]+")
_STOPWORDS = frozenset(
    "a an and are as at be been but by can do does for from had has have i if in into is it its "
    "me my no not of on or our so than that the their them then there these they this to was we "
    "were what when which who will with you your am im ive".split()
)


def _stem(token: str) -> str:
    """Very light suffix stripping so 'headaches' matches 'headache'."""
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 4 and token.endswith("es") and not token.endswith("ses"):
        return token[:-1]
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def tokenize(text: str) -> list[str]:
    return [
        _stem(tok)
        for tok in _TOKEN_RE.findall((text or "").lower())
        if tok not in _STOPWORDS and len(tok) > 1
    ]


def _token_id(token: str) -> int:
    return zlib.crc32(token.encode("utf-8"))


def encode_document(text: str) -> tuple[list[int], list[float]]:
    tokens = tokenize(text)
    if not tokens:
        return [], []
    counts = Counter(tokens)
    norm = K1 * (1 - B + B * len(tokens) / AVG_DOC_LEN)
    weights: dict[int, float] = {}
    for token, tf in counts.items():
        # Hash collisions are rare; keep the larger weight if one happens.
        idx = _token_id(token)
        weights[idx] = max(weights.get(idx, 0.0), tf * (K1 + 1) / (tf + norm))
    return list(weights.keys()), list(weights.values())


def encode_query(text: str) -> tuple[list[int], list[float]]:
    ids = sorted({_token_id(tok) for tok in tokenize(text)})
    return ids, [1.0] * len(ids)
