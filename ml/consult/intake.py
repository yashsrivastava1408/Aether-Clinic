"""
Intake logic: turning what the user has said into slots, deciding whether
there is enough to assess, and a rule-based fallback for when no LLM answers.
"""

from __future__ import annotations

import re
from typing import Optional

import config
from agents.triage_classifier import SPECIALIZATION_MAP, classify_query
from .state import SLOTS

CATEGORIES = list(SPECIALIZATION_MAP.keys())
URGENCY_RANK = {"routine": 0, "urgent": 1, "emergency": 2}
INTENTS = ("symptom_report", "health_question", "smalltalk")

_EMPTY_VALUES = {"", "null", "none given", "unknown", "not mentioned", "not stated", "not specified", "not provided", "unspecified"}
# "n/a" means the slot does not apply to this complaint: filled, but not shown.
_NOT_APPLICABLE = {"n/a", "na", "not applicable"}

_GREETING_RE = re.compile(r"^\s*(hi|hello|hey|hii+|good (morning|afternoon|evening)|namaste|thanks|thank you|ok|okay)\b[\s!.,]*$", re.I)
_QUESTION_RE = re.compile(r"^\s*(what|how|why|when|which|who|is|are|can|could|does|do|should|will)\b", re.I)
_FIRST_PERSON_RE = re.compile(r"\b(i|i'm|im|i've|my|me|mine)\b", re.I)
_WANTS_ASSESSMENT_RE = re.compile(
    r"(what (is|could|might|can) (it|this|the problem) be|what('s| is) (wrong|the issue|my problem)|"
    r"(give|show) me (a|the|my) (summary|assessment|report|conclusion)|"
    r"(should i|do i need to|must i) (see|visit|go to|consult)|"
    r"is (it|this) (serious|bad|dangerous|normal|okay))", re.I)
_ASSESSMENT_WORDS_RE = re.compile(r"\?|\b(summary|summari[sz]e|assessment|conclusion|diagnos\w*|verdict|what do you think)\b", re.I)
_NEGATIVE_WORDS_RE = re.compile(r"\b(no|nope|nah|none|nothing|not really|that'?s (all|it|everything)|only that|just that)\b", re.I)
_NOTHING_MORE_RE = re.compile(r"^\s*(no|nope|nah|nothing else|nothing more|that'?s (all|it)|only that|just that|not really)\b[\s.!]*$", re.I)

_HEURISTIC_SLOTS = {
    "location": re.compile(
        r"\b((?:lower |upper |left |right )?(?:back|spine|shoulder|chest|arm|neck|hand|finger|wrist|knee|leg|foot|ankle|"
        r"head|forehead|abdomen|stomach|belly|throat|ear|eye|hip|elbow|jaw|tooth|skin))\b", re.I),
    "duration": re.compile(
        r"\b((?:for|since|past|last) (?:the )?(?:\w+ ){0,2}(?:minute|hour|day|week|month|year|night|morning|yesterday|today)s?"
        r"|\d+ (?:minute|hour|day|week|month|year)s?(?: ago)?|since yesterday|since (?:this|last) \w+|started \w+(?: \w+)?)\b", re.I),
    "severity": re.compile(r"\b(mild|moderate|severe|unbearable|slight|intense|terrible|\d{1,2}\s*(?:/|out of)\s*10)\b", re.I),
    "character": re.compile(r"\b(sharp|dull|throbbing|aching|burning|stabbing|tingling|numb|cramping|tight|pressure|constant|intermittent|comes and goes)\b", re.I),
    "triggers": re.compile(r"\b((?:worse|better|worsens|improves|eases|flares) (?:when|after|with|on|during) [\w ]{2,30})", re.I),
}


def clean_value(value) -> Optional[str]:
    """Normalises one slot value from a model reply. None means 'not known'."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (list, tuple)):
        value = ", ".join(str(v) for v in value if v)
    text = re.sub(r"\s+", " ", str(value)).strip().strip(".")
    if text.lower() in _EMPTY_VALUES:
        return None
    return text[:200]


def merge_intake(old: dict, new: dict) -> dict:
    """New values replace old ones; a slot that is already known is never cleared."""
    merged = dict(old or {})
    for slot in SLOTS:
        value = clean_value((new or {}).get(slot))
        if value and not (value.lower() in _NOT_APPLICABLE and merged.get(slot)):
            merged[slot] = value
    return merged


def missing_slots(intake: dict) -> list[str]:
    return [slot for slot in SLOTS if not intake.get(slot)]


def intake_summary(intake: dict) -> str:
    lines = [
        f"- {slot.replace('_', ' ')}: {intake[slot]}"
        for slot in SLOTS
        if intake.get(slot) and intake[slot].lower() not in _NOT_APPLICABLE
    ]
    return "\n".join(lines) if lines else "- nothing collected yet"


def is_ready(intake: dict, turn_count: int, wants_assessment: bool, nothing_more: bool, force: bool) -> bool:
    """Whether to stop asking questions and write the assessment."""
    if force:
        return True
    if turn_count >= config.MAX_INTAKE_TURNS:
        return True
    if not intake.get("chief_complaint"):
        return False
    if wants_assessment or nothing_more:
        return True
    details = sum(1 for slot in ("location", "severity", "character", "triggers", "associated_symptoms") if intake.get(slot))
    return bool(intake.get("duration")) and details >= 3


def max_urgency(*levels: str) -> str:
    return max((lvl for lvl in levels if lvl in URGENCY_RANK), key=lambda lvl: URGENCY_RANK[lvl], default="routine")


def heuristic_analysis(user_message: str, user_texts: list[str], specialization: str) -> dict:
    """Rule-based stand-in for the LLM analysis step."""
    message = user_message or ""
    everything = " ".join(user_texts + [message]).strip()
    triage = classify_query(everything or message, specialization)

    slots = {}
    if _GREETING_RE.match(message):
        intent = "smalltalk"
    elif _QUESTION_RE.match(message) and not _FIRST_PERSON_RE.search(message) and not user_texts:
        intent = "health_question"
    else:
        intent = "symptom_report"
        for slot, pattern in _HEURISTIC_SLOTS.items():
            match = pattern.search(everything)
            if match:
                slots[slot] = match.group(1).strip()
        first = next((t.strip() for t in user_texts + [message] if t.strip() and not _GREETING_RE.match(t)), "")
        if first:
            slots["chief_complaint"] = first[:120]

    return {
        "intent": intent,
        "category": triage["category"],
        "urgency": "urgent" if triage["urgency"] == "emergency" else triage["urgency"],
        "slots": slots,
        "wants_assessment": bool(_WANTS_ASSESSMENT_RE.search(message)),
        "nothing_more": bool(_NOTHING_MORE_RE.match(message)),
        "search_query": "",
        "search_queries": [],
        "question": "",
        "source": "rules",
    }


def _plausible_flags(raw: dict, user_message: str) -> tuple[bool, bool]:
    """
    Small models set these two flags far too eagerly, and each one ends the
    interview. A flag is only believed when the user's words support it.
    """
    message = user_message or ""
    wants = raw.get("wants_assessment") is True and bool(_ASSESSMENT_WORDS_RE.search(message))
    nothing_more = raw.get("nothing_more_to_add") is True and len(message) <= 80 and bool(_NEGATIVE_WORDS_RE.search(message))
    return wants, nothing_more


def supported_slots(slots: dict, evidence: str) -> dict:
    """
    Drops slot values the user never said. A value is kept when it shares at
    least one meaningful word with the user's own messages, so a model cannot
    fill in "moderate" or "two weeks" on its own. "None"-type answers need a
    negative word from the user instead.
    """
    from retrieval.sparse import tokenize   # same light stemming as retrieval

    said = set(tokenize(evidence))
    said_prefixes = {word[:4] for word in said if len(word) >= 4}

    def is_supported(value: str) -> bool:
        words = set(tokenize(value))
        # exact word, or the same word in another form ("hurting" / "hurts")
        return bool(words & said) or any(len(w) >= 4 and w[:4] in said_prefixes for w in words)

    has_negative = bool(_NEGATIVE_WORDS_RE.search(evidence or ""))
    kept = {}
    for slot, value in slots.items():
        if not value:
            continue
        lowered = value.lower()
        if lowered in _NOT_APPLICABLE:
            kept[slot] = value
        elif lowered.startswith(("none", "no ", "nothing", "denies")):
            if has_negative:
                kept[slot] = value
        elif is_supported(value):
            kept[slot] = value
    return kept


def normalize_analysis(raw: Optional[dict], fallback: dict, user_message: str = "", evidence: Optional[str] = None) -> dict:
    """
    Validates the LLM's JSON. Anything malformed falls back to the rules.
    `evidence` is everything the user has written (plus photo findings); when
    given, slot values that are not supported by it are discarded.
    """
    if not isinstance(raw, dict):
        return fallback
    wants_assessment, nothing_more = _plausible_flags(raw, user_message)
    slots = {slot: clean_value(raw.get(slot)) for slot in SLOTS}
    # "Does not apply" only makes sense for location (e.g. a fever). Anywhere
    # else it is a model's way of skipping the question, so it counts as unknown.
    for slot, value in slots.items():
        if value and value.lower() in _NOT_APPLICABLE and slot != "location":
            slots[slot] = None
    if evidence is not None:
        slots = supported_slots(slots, evidence)
    intent = str(raw.get("intent", "")).strip().lower()
    category = str(raw.get("category", "")).strip().lower().replace(" ", "_")
    urgency = str(raw.get("urgency", "")).strip().lower()
    query = clean_value(raw.get("search_query")) or ""
    return {
        "intent": intent if intent in INTENTS else fallback["intent"],
        "category": category if category in CATEGORIES else fallback["category"],
        "urgency": urgency if urgency in URGENCY_RANK else fallback["urgency"],
        "slots": slots,
        "wants_assessment": wants_assessment or fallback["wants_assessment"],
        "nothing_more": nothing_more or fallback["nothing_more"],
        "search_query": query,
        "search_queries": _clean_queries(raw.get("search_queries")),
        "question": clean_value(raw.get("question")) or "",
        "source": "llm",
    }


def _clean_queries(value) -> list[str]:
    """The model's research plan: a short list of distinct search phrases."""
    if not isinstance(value, (list, tuple)):
        return []
    seen, out = set(), []
    for item in value:
        text = clean_value(item)
        if text and text.lower() not in seen:
            seen.add(text.lower())
            out.append(text[:120])
    return out[: config.MAX_SEARCH_QUERIES]


def build_search_plan(planned: list[str], primary: str) -> list[str]:
    """
    The planned queries, always including the primary one. A query that says
    nearly the same thing as an earlier one ("low back pain" / "lower back
    pain") is dropped, so each search covers a different topic.
    """
    from retrieval.sparse import tokenize

    plan: list[str] = []
    seen: list[set] = []
    for query in [primary] + list(planned or []):
        text = (query or "").strip()
        words = {w[:4] for w in tokenize(text)} or {text.lower()}
        if not text or any(len(words & other) / len(words | other) >= 0.5 for other in seen):
            continue
        seen.append(words)
        plan.append(text)
    return plan[: config.MAX_SEARCH_QUERIES]


def build_memory_entry(intake: dict, specialist: str, urgency: str, today: str) -> Optional[dict]:
    """
    What is remembered about a finished consultation. Built from the intake
    slots only (things the user said), never from model-written text.
    """
    complaint = intake.get("chief_complaint")
    if not complaint:
        return None
    entry = {"date": today, "specialist": specialist, "complaint": complaint, "urgency": urgency}
    for slot in ("duration", "severity", "relevant_history"):
        value = intake.get(slot)
        if value and value.lower() not in _NOT_APPLICABLE:
            entry[slot] = value
    return entry


def build_search_query(analysis_query: str, intake: dict, user_message: str) -> str:
    """A clean, standalone query for the retriever."""
    if analysis_query:
        return analysis_query
    if not intake.get("chief_complaint"):
        return user_message or ""
    parts = [intake.get(s) for s in ("chief_complaint", "location", "character", "associated_symptoms")]
    return ", ".join(p for p in parts if p and p.lower() not in _NOT_APPLICABLE)
