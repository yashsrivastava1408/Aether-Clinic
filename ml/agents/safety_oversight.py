"""
Aether Clinic — Safety Oversight Agent
========================================
Cross-checks the AI's final response against retrieved medical protocols
to detect potential hallucinations, dangerous advice, or missing safety warnings.

Acts as the final "gate" before the response reaches the user.
"""

import re

# =============================
# Safety Rule Sets
# =============================

# Red flag patterns that MUST be in the response if the context mentions them
MANDATORY_WARNINGS = {
    "dengue": {
        "check_for": ["aspirin", "ibuprofen", "nsaid", "bleeding risk"],
        "warning": "⚠️ SAFETY: Dengue patients must NOT take Aspirin or Ibuprofen. Only Paracetamol is safe."
    },
    "anaphylaxis": {
        "check_for": ["epinephrine", "epipen", "emergency", "911"],
        "warning": "⚠️ SAFETY: Anaphylaxis requires IMMEDIATE epinephrine and emergency services."
    },
    "suicidal": {
        "check_for": ["crisis", "helpline", "988", "emergency"],
        "warning": "⚠️ SAFETY: If you or someone you know is in crisis, please call 988 (US) or your local emergency services immediately."
    },
    "chest pain": {
        "check_for": ["emergency", "911", "cardiac", "aspirin"],
        "warning": "⚠️ SAFETY: Unexplained chest pain should be treated as a potential cardiac event. Seek immediate emergency care."
    },
    "dka": {
        "check_for": ["emergency", "hospital", "immediate"],
        "warning": "⚠️ SAFETY: Diabetic Ketoacidosis (DKA) is life-threatening and requires IMMEDIATE emergency medical care."
    },
    "thunderclap headache": {
        "check_for": ["emergency", "hemorrhage", "immediate"],
        "warning": "⚠️ SAFETY: A sudden severe 'thunderclap' headache requires IMMEDIATE emergency evaluation."
    }
}

# Things the AI should NEVER say
FORBIDDEN_PATTERNS = [
    r"i\s+diagnose\s+you\s+with",
    r"you\s+have\s+(been\s+diagnosed|a\s+confirmed)",
    r"take\s+\d+\s*mg\s+of",
    r"prescription\s+for",
    r"i\s+prescribe",
    r"you\s+definitely\s+have",
    r"this\s+is\s+(certainly|definitely)\s+",
    r"you\s+must\s+take\s+(this\s+)?medic",
]

# Drug names that should not be recommended with specific dosages
RESTRICTED_RECOMMENDATIONS = [
    "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "warfarin", "heparin", "insulin", "prednisone", "amoxicillin",
    "ciprofloxacin", "azithromycin", "omeprazole", "metoprolol"
]


def verify_response(
    ai_response: str,
    retrieved_context: str,
    user_query: str,
    urgency: str = "routine"
) -> dict:
    """
    Verifies an AI response against safety rules and retrieved medical protocols.

    Args:
        ai_response: The AI-generated response text
        retrieved_context: The medical protocol context that was fed to the AI
        user_query: The original user query
        urgency: Urgency level from Triage Classifier

    Returns:
        dict: {
            "is_safe": bool,
            "modified_response": str,     # Response with safety amendments if needed
            "warnings_added": list[str],  # Safety warnings that were appended
            "violations_found": list[str], # Safety rule violations detected
            "safety_score": float          # 0-1 safety confidence score
        }
    """
    response_lower = ai_response.lower()
    query_lower = user_query.lower()
    context_lower = (retrieved_context or "").lower()

    warnings_added = []
    violations_found = []
    modified_response = ai_response

    # === CHECK 1: Forbidden Patterns ===
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, response_lower):
            violations_found.append(f"Forbidden pattern detected: '{pattern}'")

    # === CHECK 2: Prescription Drug Dosage Check ===
    for drug in RESTRICTED_RECOMMENDATIONS:
        # Check if the AI is recommending a specific dosage of a prescription drug
        dosage_pattern = rf"{drug}\s*\d+\s*(mg|ml|mcg|units)"
        if re.search(dosage_pattern, response_lower):
            violations_found.append(f"Specific dosage recommendation for prescription drug: {drug}")

    # === CHECK 3: Mandatory Warnings ===
    for trigger, rule in MANDATORY_WARNINGS.items():
        # Check if the trigger topic is relevant (in query or context)
        if trigger in query_lower or trigger in context_lower:
            # Check if the AI included the mandatory safety info
            has_safety_content = any(
                check_word in response_lower
                for check_word in rule["check_for"]
            )

            if not has_safety_content:
                warnings_added.append(rule["warning"])

    # === CHECK 4: Emergency Response Verification ===
    if urgency == "emergency":
        emergency_phrases = ["emergency", "911", "call", "hospital", "immediate"]
        has_emergency_direction = any(phrase in response_lower for phrase in emergency_phrases)

        if not has_emergency_direction:
            warnings_added.append(
                "🚨 EMERGENCY ALERT: Based on your symptoms, please seek IMMEDIATE emergency medical care. "
                "Call emergency services (911) or go to the nearest emergency room."
            )

    # === APPLY MODIFICATIONS ===
    if warnings_added:
        safety_block = "\n\n" + "━" * 40 + "\n"
        safety_block += "🛡️ SAFETY OVERSIGHT SYSTEM\n"
        safety_block += "━" * 40 + "\n"
        safety_block += "\n".join(warnings_added)
        modified_response = ai_response + safety_block

    # === CALCULATE SAFETY SCORE ===
    # Start at 1.0, deduct for violations
    safety_score = 1.0
    safety_score -= len(violations_found) * 0.15
    safety_score -= len(warnings_added) * 0.05  # Warnings are less severe (we fix them)
    safety_score = max(0.0, min(1.0, safety_score))

    return {
        "is_safe": len(violations_found) == 0,
        "modified_response": modified_response,
        "warnings_added": warnings_added,
        "violations_found": violations_found,
        "safety_score": round(safety_score, 2)
    }
