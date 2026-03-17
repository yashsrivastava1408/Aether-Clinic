"""
Aether Clinic — Triage Classifier Agent
========================================
Classifies incoming user queries into medical categories and urgency levels.
Acts as the "Router" that decides which specialist knowledge to retrieve.
"""

# Medical specialization categories mapped to corpus categories
SPECIALIZATION_MAP = {
    "cardiology": ["cardiology", "cardiac", "heart", "cardiovascular"],
    "endocrinology": ["endocrinology", "diabetes", "thyroid", "hormonal", "metabolic"],
    "general_medicine": ["general medicine", "infectious disease", "gastroenterology", "fever", "cold", "flu"],
    "orthopedics": ["orthopedics", "musculoskeletal", "bone", "joint", "spine", "sports medicine"],
    "neurology": ["neurology", "headache", "migraine", "brain", "nerve"],
    "pulmonology": ["pulmonology", "respiratory", "asthma", "lung", "breathing"],
    "allergy": ["allergy", "immunology", "allergic", "anaphylaxis"],
    "dermatology": ["dermatology", "skin", "rash", "eczema", "psoriasis"],
    "mental_health": ["mental health", "anxiety", "depression", "panic", "stress", "psychiatric"]
}

# Emergency keywords that should trigger highest urgency regardless of category
EMERGENCY_KEYWORDS = [
    "can't breathe", "cannot breathe", "difficulty breathing",
    "chest pain", "heart attack",
    "stroke", "face drooping", "arm weakness", "speech difficulty",
    "unconscious", "unresponsive", "not breathing",
    "severe bleeding", "won't stop bleeding",
    "suicidal", "self-harm", "kill myself", "want to die",
    "anaphylaxis", "allergic reaction swelling throat",
    "seizure", "convulsion",
    "overdose", "poisoning",
    "thunderclap headache", "worst headache"
]


def classify_query(query: str, specialization: str = "General Medicine") -> dict:
    """
    Classifies a medical query into category and urgency.

    Returns:
        dict: {
            "category": str,           # Primary medical category
            "categories": list[str],    # All relevant categories (for multi-domain queries)
            "urgency": str,             # "emergency" | "urgent" | "routine"
            "is_emergency": bool,
            "routing_hint": str         # Explanation for debug/logging
        }
    """
    query_lower = query.lower().strip()

    # === STEP 1: Emergency Detection ===
    is_emergency = False
    emergency_match = None
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in query_lower:
            is_emergency = True
            emergency_match = keyword
            break

    # === STEP 2: Category Classification ===
    matched_categories = []
    category_scores = {}

    for category, keywords in SPECIALIZATION_MAP.items():
        score = 0
        for keyword in keywords:
            if keyword in query_lower:
                # Multi-word keywords get higher weight
                weight = 2 if " " in keyword else 1
                score += weight

        if score > 0:
            category_scores[category] = score

    # Sort by score descending
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    matched_categories = [cat for cat, _ in sorted_categories]

    # === STEP 3: Fallback to specialization hint ===
    if not matched_categories:
        # Use the specialization provided by the frontend consultation selector
        spec_lower = specialization.lower()
        for category, keywords in SPECIALIZATION_MAP.items():
            if any(kw in spec_lower for kw in keywords) or spec_lower in category:
                matched_categories = [category]
                break

    # Default to general medicine
    if not matched_categories:
        matched_categories = ["general_medicine"]

    primary_category = matched_categories[0]

    # === STEP 4: Urgency Assessment ===
    if is_emergency:
        urgency = "emergency"
        routing_hint = f"🚨 EMERGENCY detected: '{emergency_match}'. Prioritizing safety protocols."
    elif any(word in query_lower for word in ["severe", "sudden", "worst", "unbearable", "rapidly", "worsening"]):
        urgency = "urgent"
        routing_hint = f"⚡ URGENT: Severity keywords detected. Category: {primary_category}"
    else:
        urgency = "routine"
        routing_hint = f"📋 ROUTINE: Classified as {primary_category}"

    return {
        "category": primary_category,
        "categories": matched_categories[:3],  # Top 3 relevant categories
        "urgency": urgency,
        "is_emergency": is_emergency,
        "routing_hint": routing_hint
    }
