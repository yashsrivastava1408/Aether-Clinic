"""
Emergency screening.

A deterministic first layer that runs before any model call. When it fires,
the consult graph replies with a fixed, reviewed message and never asks an
LLM what to say. The keyword list is deliberately broad: a false alarm costs
the user a moment, a miss can cost much more.
"""

from __future__ import annotations

import re

# kind → phrases (matched on lower-cased, punctuation-stripped text)
EMERGENCY_PATTERNS: dict[str, list[str]] = {
    "self_harm": [
        r"suicid\w*", r"kill(ing)? myself", r"end(ing)? my (own )?life", r"want to die", r"wanna die",
        r"better off dead", r"self[\s-]?harm\w*", r"hurt(ing)? myself", r"take my own life",
        r"don ?t want to (live|be alive)", r"no reason to live", r"overdose on purpose",
    ],
    "cardiac": [
        r"heart attack", r"cardiac arrest", r"chest pain", r"chest (is )?(tight\w*|pressure|crushing|squeezing)",
        r"(crushing|squeezing|pressure) (in|on) (my |the )?chest", r"pain (in|on) (my |the )?chest",
    ],
    "stroke": [
        r"(?<!heat )(?<!sun )stroke", r"fac(e|ial) (is )?droop\w*", r"droop\w* face", r"arm weakness", r"slurred speech",
        r"speech difficult\w*", r"can ?t speak", r"sudden (numbness|weakness) (on|in) one side",
        r"one side of (my|the|his|her) (body|face) (is |went |feels )?(numb|weak)",
    ],
    "breathing": [
        r"can ?t breathe", r"cannot breathe", r"can ?not breathe", r"not breathing", r"stopped breathing",
        r"difficulty breathing", r"struggling to breathe", r"gasping for (air|breath)", r"chok(ing|ed)",
        r"lips (are |turning |turned )?blue", r"severe shortness of breath",
    ],
    "anaphylaxis": [
        r"anaphyla\w*", r"throat (is )?(swelling|closing|swollen)", r"tongue (is )?(swelling|swollen)",
        r"swelling (of|in) (my |the )?(throat|tongue|lips)", r"lips and throat swelling",
    ],
    "bleeding": [
        r"severe bleeding", r"heavy bleeding", r"bleeding (heavily|a lot|profusely)", r"won ?t stop bleeding",
        r"bleeding won ?t stop", r"can ?t stop the bleeding", r"vomiting blood", r"coughing (up )?blood",
    ],
    "neuro": [
        r"unconscious", r"unresponsive", r"passed out", r"seizure", r"convuls\w*",
        r"thunderclap headache", r"worst headache of my life", r"worst headache",
    ],
    "poisoning": [
        r"overdos\w*", r"(?<!food )poison\w*", r"swallowed (bleach|pills|tablets|detergent|battery)", r"took too many (pills|tablets)",
    ],
    "dka": [r"ketoacidosis", r"\bdka\b", r"fruity[\s-]?(smelling )?breath", r"breath (smells?|smelling) (fruity|of fruit|like fruit)"],
}

# A match is ignored when one of these appears shortly before it,
# e.g. "no chest pain", "I don't have any difficulty breathing".
_NEGATION_RE = re.compile(
    r"\b(no|not|never|without|denies|deny|negative for|free of|ruled out|"
    r"don ?t have|do not have|doesn ?t have|does not have|didn ?t have|did not have|haven ?t had|"
    r"isn ?t|is not|wasn ?t|was not|no history of|no sign of|no signs of)\b"
)
_NEGATION_WINDOW = 28  # characters looked at before the match
# Self-harm statements are never discounted by a nearby negation.
_NEVER_NEGATE = {"self_harm"}

_COMPILED = {
    kind: [re.compile(rf"(?<![a-z]){p}(?![a-z])") for p in patterns]
    for kind, patterns in EMERGENCY_PATTERNS.items()
}

_NUMBERS = (
    "• India: 112 (all emergencies) or 108 (ambulance)\n"
    "• US / Canada: 911\n"
    "• UK: 999 · EU: 112\n"
    "• Elsewhere: your local emergency number"
)

EMERGENCY_REPLIES: dict[str, str] = {
    "self_harm": (
        "I'm really glad you told me, and I'm concerned about your safety. You don't have to face this alone, "
        "and help is available right now.\n\n"
        "Please reach out to someone who can help immediately:\n"
        "• India: Tele-MANAS 14416 or 1-800-891-4416 (24x7, free), or 112\n"
        "• US / Canada: call or text 988 (Suicide & Crisis Lifeline)\n"
        "• UK & Ireland: Samaritans 116 123\n"
        "• Elsewhere: your local emergency number or nearest emergency department\n\n"
        "If you are in immediate danger or have already hurt yourself, call emergency services now. "
        "If you can, stay with someone you trust and move away from anything you could use to harm yourself.\n\n"
        "I'm an AI assistant and can't provide crisis care, but I can stay here while you contact one of these services."
    ),
    "cardiac": (
        "🚨 Chest pain can be a sign of a heart attack and needs to be checked urgently.\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "While you wait:\n"
        "• Stop what you are doing and sit down, leaning slightly back\n"
        "• Loosen tight clothing and try to stay calm\n"
        "• Do not drive yourself to hospital\n"
        "• If you become unresponsive, someone nearby should start CPR\n\n"
        "Please do this even if the pain is easing. I'm an AI assistant and cannot assess this safely over chat."
    ),
    "stroke": (
        "🚨 These can be signs of a stroke. Every minute matters.\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "• Note the time the symptoms started and tell the ambulance crew\n"
        "• Do not eat, drink or take any medicine\n"
        "• Stay with the person and keep them still and comfortable\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "breathing": (
        "🚨 Trouble breathing is a medical emergency.\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "• Sit upright and loosen tight clothing\n"
        "• If you have a prescribed reliever inhaler, use it as your action plan says\n"
        "• If someone is choking and cannot cough or speak, give back blows and abdominal thrusts\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "anaphylaxis": (
        "🚨 Swelling of the throat, tongue or lips can be a severe allergic reaction (anaphylaxis).\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "• If an adrenaline (epinephrine) auto-injector is available, use it straight away\n"
        "• Lie down with legs raised, or sit up if breathing is difficult\n"
        "• Do not wait to see if it gets better\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "bleeding": (
        "🚨 Heavy bleeding needs urgent care.\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "• Press firmly on the wound with a clean cloth and keep pressing\n"
        "• If possible, raise the injured area above the level of the heart\n"
        "• Do not remove anything stuck in the wound\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "neuro": (
        "🚨 These symptoms need emergency assessment.\n\n"
        "Call emergency services now:\n" + _NUMBERS + "\n\n"
        "• If someone is unconscious but breathing, lay them on their side\n"
        "• During a seizure, clear the space around them and do not put anything in their mouth\n"
        "• Note when it started\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "poisoning": (
        "🚨 A possible overdose or poisoning needs urgent help.\n\n"
        "Call emergency services or your poison helpline now:\n" + _NUMBERS + "\n"
        "• US Poison Control: 1-800-222-1222\n\n"
        "• Do not try to make yourself or the person vomit\n"
        "• Keep the container or packaging to show the medical team\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "dka": (
        "🚨 These can be signs of diabetic ketoacidosis (DKA), which is life-threatening.\n\n"
        "Go to the nearest emergency department or call emergency services now:\n" + _NUMBERS + "\n\n"
        "• Do not wait for symptoms to settle\n"
        "• Take your glucose readings and medicine list with you\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
    "general": (
        "🚨 What you describe may be a medical emergency.\n\n"
        "Call emergency services now or go to the nearest emergency department:\n" + _NUMBERS + "\n\n"
        "I'm an AI assistant and cannot assess this safely over chat."
    ),
}


def _normalize(text: str) -> str:
    text = (text or "").lower().replace("’", "'")
    text = text.replace("'", " ")
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def detect_emergency(text: str, skip_kinds: frozenset | set = frozenset()) -> dict:
    """
    Returns {"is_emergency": bool, "kind": str | None, "match": str | None}.
    Self-harm is checked first so it always gets the crisis reply.
    `skip_kinds` lists kinds the user has already been warned about in this
    consultation, so the same notice is not repeated on every message.
    """
    normalized = _normalize(text)
    if not normalized:
        return {"is_emergency": False, "kind": None, "match": None}

    for kind, patterns in _COMPILED.items():
        if kind in skip_kinds:
            continue
        for pattern in patterns:
            for match in pattern.finditer(normalized):
                if kind not in _NEVER_NEGATE:
                    window = normalized[max(0, match.start() - _NEGATION_WINDOW):match.start()]
                    if _NEGATION_RE.search(window):
                        continue
                return {"is_emergency": True, "kind": kind, "match": match.group(0)}
    return {"is_emergency": False, "kind": None, "match": None}


_CONTINUE_NOTE = (
    "\n\nIf this is not happening right now, or a doctor has already checked it, "
    "tell me more and we can continue."
)


def emergency_reply(kind: str | None) -> str:
    kind = kind if kind in EMERGENCY_REPLIES else "general"
    reply = EMERGENCY_REPLIES[kind]
    return reply if kind == "self_harm" else reply + _CONTINUE_NOTE
