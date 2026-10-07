"""
Corpus loading and chunking.

Corpus files hold several protocols separated by `---` lines. Each protocol
starts with TITLE / SOURCE / CATEGORY headers. Protocols are split on blank
lines (their natural sections) and packed into chunks, so a chunk never cuts
a bullet list in half.
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path

MAX_CHUNK_CHARS = 900
_NAMESPACE = uuid.UUID("6f0c1f0e-6f5b-4c0e-9b53-0d8f6f6f2a11")
_HEADER_RE = re.compile(r"^(TITLE|SOURCE|CATEGORY):\s*(.+)$", re.MULTILINE)


def parse_protocol(block: str) -> dict:
    """Splits one protocol block into metadata and body text."""
    meta = {"title": "Unknown Protocol", "source": "Internal Medical Protocol", "categories": ["General Medicine"]}
    for key, value in _HEADER_RE.findall(block):
        value = value.strip()
        if key == "TITLE":
            meta["title"] = value
        elif key == "SOURCE":
            meta["source"] = value
        elif key == "CATEGORY":
            cats = [c.strip() for c in re.split(r"[|/,]", value) if c.strip()]
            if cats:
                meta["categories"] = cats
    meta["body"] = _HEADER_RE.sub("", block).strip()
    return meta


def split_protocols(file_content: str) -> list[str]:
    blocks = re.split(r"\n---\s*\n", file_content)
    return [b.strip() for b in blocks if len(b.strip()) > 50]


def chunk_body(body: str, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    """Packs blank-line-separated sections into chunks of at most max_chars."""
    sections = [s.strip() for s in re.split(r"\n\s*\n", body) if s.strip()]
    chunks: list[str] = []
    current = ""
    for section in sections:
        # A single oversized section is split on line breaks.
        pieces = [section]
        if len(section) > max_chars:
            pieces, buf = [], ""
            for line in section.splitlines():
                if buf and len(buf) + len(line) + 1 > max_chars:
                    pieces.append(buf)
                    buf = line
                else:
                    buf = f"{buf}\n{line}" if buf else line
            if buf:
                pieces.append(buf)
        for piece in pieces:
            if current and len(current) + len(piece) + 2 > max_chars:
                chunks.append(current)
                current = piece
            else:
                current = f"{current}\n\n{piece}" if current else piece
    if current:
        chunks.append(current)
    return chunks


def load_chunks(corpus_dir: Path) -> list[dict]:
    """Returns every chunk in the corpus with metadata and a stable id."""
    chunks: list[dict] = []
    for path in sorted(Path(corpus_dir).glob("*.txt")):
        for block in split_protocols(path.read_text(encoding="utf-8")):
            meta = parse_protocol(block)
            parts = chunk_body(meta["body"])
            for i, text in enumerate(parts):
                chunks.append({
                    "id": str(uuid.uuid5(_NAMESPACE, f"{path.name}|{meta['title']}|{i}")),
                    "content": text,
                    # The title and categories are embedded with the text so a
                    # chunk from the middle of a protocol keeps its topic.
                    "embed_text": f"{meta['title']} ({', '.join(meta['categories'])})\n{text}",
                    "title": meta["title"],
                    "source": meta["source"],
                    "category": ", ".join(meta["categories"]),
                    "categories": [c.lower() for c in meta["categories"]],
                    "filename": path.name,
                    "chunk_index": i,
                    "total_chunks": len(parts),
                })
    return chunks
