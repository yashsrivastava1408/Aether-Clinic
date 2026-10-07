"""
Specialist profiles and hand-off.

Each medical category has a profile: who is "speaking", what that specialist
pays attention to, and which red flags they ask about first. The consult graph
starts with the specialist the user picked and hands the conversation over
when the complaint clearly belongs to another one.

Profiles only shape prompts and the order of questions. They never relax the
emergency screen, the guardrail or the safety checks.
"""

from __future__ import annotations

PROFILES: dict[str, dict] = {
    "cardiology": {
        "name": "Heart Specialist",
        "focus": "chest discomfort, palpitations, breathlessness, blood pressure, swelling of the legs",
        "red_flags": "pain at rest or spreading to arm or jaw, fainting, breathlessness lying flat",
    },
    "neurology": {
        "name": "Brain Specialist",
        "focus": "headache pattern, dizziness, numbness or weakness, vision or speech changes",
        "red_flags": "sudden worst-ever headache, one-sided weakness, confusion, fever with stiff neck",
    },
    "pulmonology": {
        "name": "Lung Specialist",
        "focus": "cough, wheeze, breathlessness, triggers such as dust, cold air or exercise",
        "red_flags": "breathlessness at rest, blue lips, coughing blood, reliever inhaler not helping",
    },
    "general_medicine": {
        "name": "General Physician",
        "focus": "fever, infections, stomach and digestion problems, general unwellness",
        "red_flags": "high fever for more than three days, blood in stool or vomit, signs of dehydration",
    },
    "orthopedics": {
        "name": "Bone Specialist",
        "focus": "joint, muscle and back pain, injuries, movement and weight-bearing",
        "red_flags": "numbness in the groin, loss of bladder or bowel control, deformity, cannot bear weight",
    },
    "endocrinology": {
        "name": "Diabetes & Hormone Specialist",
        "focus": "blood sugar, thirst, urination, weight change, thyroid symptoms",
        "red_flags": "vomiting with very high sugar, confusion, fruity-smelling breath",
    },
    "allergy": {
        "name": "Allergy Specialist",
        "focus": "triggers, timing after exposure, hives, swelling, breathing",
        "red_flags": "swelling of lips, tongue or throat, trouble breathing, faintness",
    },
    "dermatology": {
        "name": "Skin Specialist",
        "focus": "where the rash or lesion is, colour, itch, spread, new products or medicines",
        "red_flags": "rapid spread, blistering, fever, a mole that changes shape or colour",
    },
    "mental_health": {
        "name": "Mental Health Specialist",
        "focus": "mood, sleep, worry, energy, how daily life is affected",
        "red_flags": "thoughts of self-harm, not eating or sleeping for days, losing touch with reality",
    },
}

# Names the apps use for the specialist picker → category.
_ALIASES: dict[str, str] = {
    "heart": "cardiology", "cardio": "cardiology",
    "brain": "neurology", "neuro": "neurology",
    "lung": "pulmonology", "pulmo": "pulmonology", "respiratory": "pulmonology",
    "stomach": "general_medicine", "gastro": "general_medicine", "general": "general_medicine",
    "bone": "orthopedics", "ortho": "orthopedics",
    "diabet": "endocrinology", "endocrin": "endocrinology", "hormone": "endocrinology", "thyroid": "endocrinology",
    "allerg": "allergy",
    "skin": "dermatology", "derma": "dermatology",
    "mental": "mental_health", "psych": "mental_health",
}

MAX_HANDOFFS = 2


def category_for(specialization: str) -> str:
    """Maps a free-text specialist name ("Heart Specialist", "Cardiology") to a category."""
    lowered = (specialization or "").lower()
    for alias, category in _ALIASES.items():
        if alias in lowered:
            return category
    return "general_medicine"


def profile(category: str) -> dict:
    return PROFILES.get(category, PROFILES["general_medicine"])


def decide_handoff(active: str, detected: str, intent: str, source: str, handoffs: list) -> bool:
    """
    Hand over when a real symptom report clearly belongs to another specialist.
    Only an LLM classification can trigger it (keyword guesses are too noisy),
    and a consultation changes hands at most MAX_HANDOFFS times.
    """
    return (
        intent == "symptom_report"
        and source == "llm"
        and detected in PROFILES
        and detected != active
        and len(handoffs or []) < MAX_HANDOFFS
    )


def handoff_note(category: str) -> str:
    return f"This sounds like one for our {profile(category)['name']}, so I've brought them into the conversation."


def prompt_block(category: str) -> str:
    p = profile(category)
    return (
        f"You are answering as the clinic's {p['name']}. "
        f"Pay particular attention to: {p['focus']}. "
        f"Red flags to ask about early if they are still unknown: {p['red_flags']}."
    )
