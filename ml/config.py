"""
Aether Clinic — ML service settings
====================================
One place for every environment-driven setting used by the consult graph,
the retrieval stack and the LLM router. Values are read once at import.
"""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def _load_env_files() -> None:
    """
    Local development convenience: read ml/.env, then server/.env, without
    overriding anything already set in the real environment. In Docker and
    Kubernetes neither file exists and this does nothing.
    """
    for path in (BASE_DIR / ".env", BASE_DIR.parent / "server" / ".env"):
        try:
            lines = path.read_text().splitlines()
        except OSError:
            continue
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_env_files()


def _flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


# ── LLM providers ────────────────────────────────────────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "")  # empty = pick by device RAM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
# gpt-oss models think before answering; "low" keeps replies fast. Empty = do not send.
GROQ_REASONING_EFFORT = os.getenv("GROQ_REASONING_EFFORT", "low" if "gpt-oss" in GROQ_MODEL else "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
LLM_TIMEOUT_S = float(os.getenv("LLM_TIMEOUT_S", "60"))
# How long a provider is skipped after a connection-level failure.
LLM_COOLDOWN_S = float(os.getenv("LLM_COOLDOWN_S", "60"))

# ── Retrieval ────────────────────────────────────────────────────────────
CORPUS_DIR = Path(os.getenv("CORPUS_DIR", str(BASE_DIR / "data" / "medical_corpus")))
# Server mode when QDRANT_URL or QDRANT_HOST is set; otherwise an embedded
# in-memory index is built from the corpus at startup.
QDRANT_URL = os.getenv("QDRANT_URL", "")
QDRANT_HOST = os.getenv("QDRANT_HOST", "")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBED_QUERY_PREFIX = os.getenv("EMBED_QUERY_PREFIX", "")
# These models are tiny; on CPU a query embeds in a few milliseconds. Letting
# torch pick a GPU (e.g. Apple MPS) makes single queries far slower.
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")
# Hybrid score = dense cosine + SPARSE_WEIGHT * bm25 / (bm25 + SPARSE_SATURATION)
SPARSE_WEIGHT = float(os.getenv("SPARSE_WEIGHT", "0.3"))
SPARSE_SATURATION = float(os.getenv("SPARSE_SATURATION", "8"))
RERANK_ENABLED = _flag("RERANK_ENABLED", False)
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
RETRIEVE_CANDIDATES = int(os.getenv("RETRIEVE_CANDIDATES", "12"))
RETRIEVE_TOP_K = int(os.getenv("RETRIEVE_TOP_K", "4"))
# Chunks scoring below this fraction of the best chunk are dropped, so one
# strong protocol is not padded with loosely related ones.
RETRIEVE_REL_CUTOFF = float(os.getenv("RETRIEVE_REL_CUTOFF", "0.7"))
# Context grading thresholds on the hybrid relevance score (0..1). Chosen from
# evals/run_evals.py: off-topic queries top out near 0.18, on-topic start near 0.28.
GRADE_STRONG = float(os.getenv("GRADE_STRONG", "0.35"))
GRADE_WEAK = float(os.getenv("GRADE_WEAK", "0.22"))

# ── Consult graph ────────────────────────────────────────────────────────
MAX_INTAKE_TURNS = int(os.getenv("MAX_INTAKE_TURNS", "6"))
# Research agent: how many separate searches one assessment may plan, how many
# search rounds it may run, and how many chunks it may hand to the writer.
MAX_SEARCH_QUERIES = int(os.getenv("MAX_SEARCH_QUERIES", "3"))
RESEARCH_MAX_ROUNDS = int(os.getenv("RESEARCH_MAX_ROUNDS", "2"))
RESEARCH_MAX_CHUNKS = int(os.getenv("RESEARCH_MAX_CHUNKS", "6"))
# Clinician review before a final assessment is released:
#   off    - never pause
#   urgent - pause when urgency is not routine, or the answer is not fully grounded
#   all    - pause every final assessment
REVIEW_MODE = os.getenv("REVIEW_MODE", "off").strip().lower()
HISTORY_WINDOW = int(os.getenv("HISTORY_WINDOW", "20"))
# Second-model check that an answer's clinical claims are backed by the
# retrieved protocols: "auto" (only for answers from a hosted model),
# "always" or "never". Rule-based safety checks always run regardless.
GROUNDING_CHECK = os.getenv("GROUNDING_CHECK", "auto").strip().lower()

# ── Conversation state (LangGraph checkpointer) ──────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "")
# Database for saved consultation state. Empty = the database named in
# MONGO_URI (the app's own database), or "aether_consult_state" if it names none.
CHECKPOINT_DB = os.getenv("CHECKPOINT_DB", "")
CHECKPOINT_TTL_S = int(os.getenv("CHECKPOINT_TTL_S", str(30 * 24 * 3600)))
# Without MongoDB, at most this many conversations are held in memory.
MEMORY_MAX_THREADS = int(os.getenv("MEMORY_MAX_THREADS", "500"))
# Same 64-hex-char AES key the Node backend uses for chat transcripts.
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")

# ── Feedback flywheel (shared volume with the Node backend) ──────────────
FEEDBACK_PATHS = [
    Path("/app/shared/feedback_logs.json"),
    BASE_DIR.parent / "server" / "feedback_logs.json",
]
