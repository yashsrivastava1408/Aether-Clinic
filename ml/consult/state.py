"""State carried through the consult graph, and the intake slot definitions."""

from __future__ import annotations

from typing import Any, Optional, TypedDict


class ConsultState(TypedDict, total=False):
    # ── per-turn inputs (set by the caller) ──────────────────────────────
    # The photo, the lab-report summary and the recovery transcript are NOT
    # part of the state: they travel in the run config (see `turn_inputs`),
    # so they are never written to the checkpoint store.
    user_message: str
    specialization: str
    tier: str
    user_ram: float
    force_final: bool

    # ── persisted across turns (saved by the checkpointer) ───────────────
    messages: list               # [{"role": "user" | "assistant", "content": str}]
    intake: dict                 # slot name → value
    turn_count: int              # user turns so far
    emergency_notified: list     # emergency kinds already answered with a fixed notice
    urgency: str                 # highest urgency seen: routine | urgent | emergency
    image_findings: Optional[str]
    session_complete: bool
    active_specialist: str       # category of the specialist currently "speaking"
    handoffs: list               # [{"from": category, "to": category, "turn": int}]

    # ── per-turn working values (reset at the start of every turn) ───────
    guardrail: dict
    triage: dict
    intent: str                  # symptom_report | health_question | smalltalk
    wants_assessment: bool
    has_image: bool
    mode: str                    # blocked | emergency | ask | assessment | answer | closed | unavailable
    next_slot: Optional[str]
    suggested_question: str      # question drafted by the analyze step, if any
    search_query: str
    search_queries: list         # the research plan: one query per topic
    research_round: int
    research_gaps: list          # planned searches that found nothing this round
    research_log: list           # [{"query", "grade", "titles", "round"}]
    handoff_note: str            # set on the turn a hand-off happens
    review_decision: dict        # clinician decision, when review mode paused the turn
    memory_entry: Optional[dict] # summary of a finished consultation, for long-term memory
    documents: list
    citations: list
    context: str
    context_grade: str           # strong | weak | none
    tool_results: list
    draft: str
    attempts: int
    retry_feedback: str
    safety: dict
    reply: str
    providers: list              # which LLM provider answered each call
    trace: list                  # [{"node": str, "ms": int}]


# Intake slots in the order they are asked about.
SLOTS: list[str] = [
    "chief_complaint",
    "location",
    "duration",
    "severity",
    "character",
    "triggers",
    "associated_symptoms",
    "relevant_history",
]

SLOT_DESCRIPTIONS: dict[str, str] = {
    "chief_complaint": "the main symptom or problem, in a few words",
    "location": "where on the body it is",
    "duration": "how long it has been going on or when it started",
    "severity": "how bad it is (mild / moderate / severe, or a 1-10 score)",
    "character": "what it feels like (sharp, dull, burning, constant, comes and goes...)",
    "triggers": "what makes it better or worse",
    "associated_symptoms": "other symptoms that come with it",
    "relevant_history": "relevant conditions, medicines or allergies the user mentioned",
}

# Used when the LLM cannot be reached or its question fails the safety check.
FALLBACK_QUESTIONS: dict[str, str] = {
    "chief_complaint": "What's the main thing bothering you today?",
    "location": "Where exactly do you feel it?",
    "duration": "How long has this been going on?",
    "severity": "How bad is it right now — mild, moderate or severe?",
    "character": "How would you describe it — sharp, dull, burning, or something else? Is it constant or does it come and go?",
    "triggers": "Does anything make it better or worse?",
    "associated_symptoms": "Have you noticed any other symptoms along with it?",
    "relevant_history": "Do you have any ongoing health conditions, or take any regular medicines?",
}

PER_TURN_DEFAULTS: dict[str, Any] = {
    "guardrail": {},
    "triage": {},
    "intent": "symptom_report",
    "wants_assessment": False,
    "has_image": False,
    "mode": "",
    "next_slot": None,
    "suggested_question": "",
    "search_query": "",
    "search_queries": [],
    "research_round": 0,
    "research_gaps": [],
    "research_log": [],
    "handoff_note": "",
    "review_decision": {},
    "memory_entry": None,
    "documents": [],
    "citations": [],
    "context": "",
    "context_grade": "none",
    "tool_results": [],
    "draft": "",
    "attempts": 0,
    "retry_feedback": "",
    "safety": {},
    "reply": "",
    "providers": [],
    "trace": [],
}
