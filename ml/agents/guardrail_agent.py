"""
Aether Clinic - Guardrail Agent
===============================
A security layer that sits in front of the Intelligence Hub.
Scans incoming user queries for:
  1. Prompt Injection (attempts to hijack the LLM)
  2. Offensive or Harmful Content
  3. Non-medical/Off-topic Queries (Hacker attempts)
"""

from __future__ import annotations

import re
import unicodedata

# Patterns often used in "Jailbreak" or Prompt Injection attacks
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous\s+)?instructions",
    r"ignore\s+.*\brules?\b",
    r"ignore\s+.*\bfda\b",
    r"system\s+(prompt|message)",
    r"you\s+are\s+now\s+a",
    r"\broleplay\b",
    r"pretend\s+to\s+be",
    r"act\s+as",
    r"as\s+if\s+you\s+were",
    r"from\s+19\d{2}\b",
    r"bypass\s+safety",
    r"forget\s+(everything|your\s+rules)",
    r"disregard\s+the\s+above",
    r"new\s+rule:",
    r"output\s+the\s+system\s+prompt",
    r"developer\s+mode",
    r"dan\s+mode"
]

# Medical roleplay prompts are often used to evade safety controls.
ROLEPLAY_EVASION_PATTERNS = [
    r"\bmedical\s+student\b",
    r"\bdoctor\b",
    r"\bphysician\b",
    r"\bnurse\b",
    r"\bclinician\b",
    r"\bprescribe\b",
    r"\bprescription\b",
]

# Programming / calculation prompts that try to smuggle in dosage guidance.
DOSAGE_CALCULATION_PATTERNS = [
    r"\bcalculate\b.*\b(dose|dosage|dosing|titration)\b",
    r"\bcompute\b.*\b(dose|dosage|dosing|titration)\b",
    r"\bdetermine\b.*\b(dose|dosage|dosing|titration)\b",
    r"\bwrite\s+(?:a\s+)?(?:python\s+)?(?:script|program|function|code)\b.*\b(dose|dosage|dosing|titration)\b",
    r"\bpython\b.*\b(dose|dosage|dosing|titration)\b",
]

# Sensitive or harmful keywords that don't belong in a medical clinic app
HARMFUL_PATTERNS = [
    r"how\s+(to|can\s+i|do\s+i)\s+(make|build|create|manufacture)\s+(a\s+|an\s+|the\s+)?(bomb|weapon|explosive|firearm)",
    r"(mix|combine|blend|assemble|build|create|manufacture|synthesize|detonate|ignite)\s+.*\b(chemical|chemicals|sulfur|sulphur|acid|oxidizer|fertilizer|gasoline|bleach|poison)\b",
    r"\b(dangerous|unsafe|deadly)\s+(assembly|recipe|instructions|process)\b",
    r"\bsky\s*[-\s]?\s*shaker\b",
    r"\b(story|fiction|metaphor|allegory|narrative)\b.*\b(mix|combine|assemble|build|create|manufacture|synthesize|detonate|ignite)\b",
    r"(buy|get|purchase)\s+(a\s+|an\s+|the\s+)?(illegal\s+)?(drugs|narcotics|cocaine|heroin)",
    r"hacking",
    r"exploit",
    r"credit\s+card\s+number",
    r"social\s+security\s+number",
    r"suicide\s+method",
    r"kill\s+(myself|me)"
]

RESTRICTED_DRUGS = [
    "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "warfarin", "heparin", "insulin", "prednisone", "amoxicillin",
    "ciprofloxacin", "azithromycin", "omeprazole", "metoprolol"
]

MEDICAL_INTENT_TERMS = [
    "symptom", "symptoms", "pain", "fever", "cough", "rash", "nausea", "vomiting",
    "headache", "dizziness", "dehydration", "diabetes", "blood pressure", "heart",
    "chest pain", "breathing", "shortness of breath", "asthma", "allergy",
    "infection", "injury", "wound", "medication", "medicine", "treatment",
    "dosage", "dose", "diagnosis", "triage", "clinic", "medical", "health"
]

OFFTOPIC_TASK_TERMS = [
    "write a python", "python script", "program", "code", "story", "fiction",
    "roleplay", "pretend to be", "act as", "database", "search the database",
    "hack", "exploit", "password", "system prompt", "developer mode", "api"
]

PII_TERMS = [
    "social security number", "ssn", "credit card number", "dob",
    "date of birth", "mrn", "medical record number", "phone number",
    "address", "patient id", "passport", "driver license"
]

ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\uFEFF]")
LEET_TRANSLATION = str.maketrans({
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s",
})

def _normalize_query(query: str) -> str:
    """
    Normalizes punctuation, invisible characters, and basic leetspeak so
    simple obfuscation tricks do not bypass detection.
    """
    normalized = unicodedata.normalize("NFKC", query)
    normalized = ZERO_WIDTH_RE.sub("", normalized)
    normalized = normalized.lower().strip()
    normalized = normalized.translate(LEET_TRANSLATION)
    normalized = re.sub(r"[-_/|]", " ", normalized)
    normalized = re.sub(r"[^\w\s]", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def _has_pattern(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def _has_any_term(text: str, terms: list[str]) -> bool:
    return any(term in text for term in terms)


def _count_terms(text: str, terms: list[str]) -> int:
    return sum(1 for term in terms if term in text)


def _block(reason: str, safety_score: float = 0.0, category: str | None = None) -> dict:
    result = {
        "is_blocked": True,
        "reason": reason,
        "safety_score": safety_score,
    }
    if category:
        result["category"] = category
    return result


def scan_query(query: str) -> dict:
    """
    Scans a user query for security violations and returns specific reasons.
    """
    query_lower = query.lower().strip()
    normalized_query = _normalize_query(query)

    medical_signal_count = _count_terms(normalized_query, MEDICAL_INTENT_TERMS)

    # 1. Check for Roleplay-based medical policy evasion
    roleplay_terms = [r"\broleplay\b", r"pretend\s+to\s+be", r"act\s+as", r"as\s+if\s+you\s+were"]
    if _has_pattern(query_lower, roleplay_terms) and _has_pattern(query_lower, ROLEPLAY_EVASION_PATTERNS):
        return _block(
            "Security violation: Medical roleplay-based policy evasion detected.",
            category="roleplay_evasion"
        )

    # 2. Check for Prompt Injection
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, query_lower) or re.search(pattern, normalized_query):
            return _block(
                "Security violation: Potential prompt injection or system bypass attempt detected.",
                category="prompt_injection"
            )

    # 3. Check for Dosage-calculation prompts disguised as code or scripts
    if _has_pattern(normalized_query, DOSAGE_CALCULATION_PATTERNS) and _has_any_term(normalized_query, RESTRICTED_DRUGS):
        return _block(
            "Safety violation: Unauthorized prescription dosage calculation request detected.",
            category="dosage_smuggling"
        )

    # 4. Catch creative-writing or metaphor cloaking around dangerous instructions
    creative_cloak = _has_any_term(
        normalized_query,
        ["story", "fiction", "metaphor", "allegory", "narrative", "write a story", "tell a story"]
    )
    dangerous_instruction = _has_any_term(
        normalized_query,
        ["mix", "combine", "blend", "assemble", "build", "create", "manufacture", "synthesize", "detonate", "ignite"]
    )
    dangerous_material = _has_any_term(
        normalized_query,
        ["bomb", "weapon", "explosive", "firearm", "chemical", "chemicals", "sulfur", "sulphur", "acid", "oxidizer", "fertilizer", "gasoline", "bleach", "poison"]
    )
    if creative_cloak and dangerous_instruction and dangerous_material:
        return _block(
            "Safety violation: Dangerous instructions cloaked as creative content or metaphor detected.",
            category="metaphorized_harm"
        )

    # 5. Check for explicit PII requests before broader harmful terms.
    if _has_any_term(normalized_query, PII_TERMS) and _has_any_term(
        normalized_query,
        ["search", "lookup", "retrieve", "give me", "provide", "find", "export", "database", "record", "patient"]
    ):
        return _block(
            "Privacy violation: Attempted access to sensitive personal information (PII).",
            category="pii_request"
        )

    # 6. Check for Harmful content (Weapons, Drugs, etc.)
    for pattern in HARMFUL_PATTERNS:
        if re.search(pattern, query_lower) or re.search(pattern, normalized_query):
            return _block(
                "Safety violation: Potentially harmful or off-topic content (e.g., weapons, explosives).",
                category="harmful_content"
            )

    # 7. Strong allowlist-style gate for clearly non-medical requests.
    if medical_signal_count == 0 and _has_any_term(normalized_query, OFFTOPIC_TASK_TERMS):
        return _block(
            "Off-topic request: this clinic assistant only handles medical guidance.",
            category="off_topic"
        )

    # 8. Simple length guardrail
    if len(query) > 1000:
        return _block(
            "System constraint: Query exceeds maximum allowed length.",
            safety_score=0.5,
            category="length_limit"
        )

    return {
        "is_blocked": False,
        "reason": None,
        "category": "allowed",
        "safety_score": 1.0
    }
