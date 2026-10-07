"""
Reference ranges for the range-check tool.

The range printed on the report itself always wins: laboratories differ, and
their own range is the one the result was meant to be read against. The small
table below is only a fallback for a handful of very common tests, using
widely published adult cut-offs. It is deliberately short, it ignores age and
sex, and it should be reviewed by a clinician before any real-world use.
"""

from __future__ import annotations

import re
from typing import Optional

# name → (low, high, unit spellings it applies to, specialist category)
# low / high may be None for one-sided ranges.
TYPICAL_ADULT: dict[str, tuple] = {
    "fasting glucose": (70, 99, {"mg/dl"}, "endocrinology"),
    "hba1c": (None, 5.6, {"%"}, "endocrinology"),
    "total cholesterol": (None, 199, {"mg/dl"}, "cardiology"),
    "ldl cholesterol": (None, 129, {"mg/dl"}, "cardiology"),
    "hdl cholesterol": (40, None, {"mg/dl"}, "cardiology"),
    "triglycerides": (None, 149, {"mg/dl"}, "cardiology"),
    "tsh": (0.4, 4.0, {"miu/l", "uiu/ml", "µiu/ml", "μiu/ml", "mu/l"}, "endocrinology"),
    "creatinine": (0.6, 1.3, {"mg/dl"}, "general_medicine"),
    "hemoglobin": (12.0, 17.5, {"g/dl", "gm/dl"}, "general_medicine"),
}

_ALIASES: list[tuple[str, str]] = [
    (r"\b(fasting (blood |plasma )?(glucose|sugar)|fbs|fpg|glucose[ ,-]*fasting)\b", "fasting glucose"),
    (r"\b(hba1c|hb a1c|glycated h(a)?emoglobin|glycosylated h(a)?emoglobin|a1c)\b", "hba1c"),
    (r"\b(ldl)\b", "ldl cholesterol"),
    (r"\b(hdl)\b", "hdl cholesterol"),
    (r"\b(triglycerides?|tg)\b", "triglycerides"),
    (r"\b(total cholesterol|cholesterol[ ,-]*total|serum cholesterol|cholesterol)\b", "total cholesterol"),
    (r"\b(tsh|thyroid stimulating hormone)\b", "tsh"),
    (r"\b(serum creatinine|creatinine)\b", "creatinine"),
    (r"\b(h(a)?emoglobin|hb|hgb)\b", "hemoglobin"),
]

# Which specialist to suggest for a test that is out of range, when the
# test is not in the table above.
_CATEGORY_HINTS: list[tuple[str, str]] = [
    (r"glucose|sugar|hba1c|a1c|insulin|tsh|t3|t4|thyroid", "endocrinology"),
    (r"cholesterol|ldl|hdl|triglycerid|lipid|troponin|ck-mb", "cardiology"),
]


def normalize_unit(unit: Optional[str]) -> str:
    return re.sub(r"\s+", "", (unit or "").lower())


def canonical_name(name: str) -> Optional[str]:
    lowered = (name or "").lower()
    # Derived or related measures have their own ranges; never borrow another test's.
    if re.search(r"vldl|non[\s-]?hdl|ratio|random|post[\s-]?prandial|\bpp\b|urine|urinary|free t|mch|mcv", lowered):
        return None
    # HbA1c must be recognised before the bare "hb" / "hemoglobin" alias.
    for pattern, canonical in _ALIASES:
        if re.search(pattern, lowered):
            return canonical
    return None


def typical_range(name: str, unit: Optional[str]) -> Optional[tuple]:
    """(low, high) from the fallback table, only when the unit matches."""
    canonical = canonical_name(name)
    if canonical is None:
        return None
    low, high, units, _ = TYPICAL_ADULT[canonical]
    return (low, high) if normalize_unit(unit) in units else None


def category_for_test(name: str) -> str:
    canonical = canonical_name(name)
    if canonical:
        return TYPICAL_ADULT[canonical][3]
    lowered = (name or "").lower()
    for pattern, category in _CATEGORY_HINTS:
        if re.search(pattern, lowered):
            return category
    return "general_medicine"
