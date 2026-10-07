"""
Tools the assessment model may call.

Each tool wraps one of the clinic's risk models. Two guards stop a model
from inventing inputs:
  1. every measurement must literally appear in what the user has told us;
  2. every value must be inside the range the risk model was trained on.
A tool never guesses a missing value — it reports what is missing instead.
"""

from __future__ import annotations

import re
from typing import Optional

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

import risk_models

# Measurements a user would state as a number. Coded fields (sex, chest-pain
# type, ...) are translated by the model from words, so they are not checked.
_MEASURED = {
    "heart": ["age", "trestbps", "chol", "thalach", "oldpeak"],
    "diabetes": ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"],
}
_NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")


class HeartRiskInput(BaseModel):
    age: Optional[float] = Field(None, description="Age in years")
    sex: Optional[float] = Field(None, description="1 = male, 0 = female")
    cp: Optional[float] = Field(None, description="Chest pain type: 1 typical angina, 2 atypical angina, 3 non-anginal, 4 asymptomatic")
    trestbps: Optional[float] = Field(None, description="Resting blood pressure, mm Hg")
    chol: Optional[float] = Field(None, description="Serum cholesterol, mg/dl")
    fbs: Optional[float] = Field(None, description="Fasting blood sugar > 120 mg/dl: 1 yes, 0 no")
    restecg: Optional[float] = Field(None, description="Resting ECG: 0 normal, 1 ST-T abnormality, 2 LV hypertrophy")
    thalach: Optional[float] = Field(None, description="Maximum heart rate achieved, bpm")
    exang: Optional[float] = Field(None, description="Exercise-induced angina: 1 yes, 0 no")
    oldpeak: Optional[float] = Field(None, description="ST depression induced by exercise")
    slope: Optional[float] = Field(None, description="Slope of peak exercise ST segment: 1 up, 2 flat, 3 down")
    ca: Optional[float] = Field(None, description="Number of major vessels coloured by fluoroscopy, 0-3")
    thal: Optional[float] = Field(None, description="Thalassemia: 3 normal, 6 fixed defect, 7 reversible defect")


class DiabetesRiskInput(BaseModel):
    Pregnancies: Optional[float] = Field(None, description="Number of pregnancies (0 if not applicable)")
    Glucose: Optional[float] = Field(None, description="Plasma glucose, mg/dl")
    BloodPressure: Optional[float] = Field(None, description="Diastolic blood pressure, mm Hg")
    SkinThickness: Optional[float] = Field(None, description="Triceps skin fold thickness, mm")
    Insulin: Optional[float] = Field(None, description="2-hour serum insulin, mu U/ml")
    BMI: Optional[float] = Field(None, description="Body mass index")
    DiabetesPedigreeFunction: Optional[float] = Field(None, description="Diabetes pedigree function score")
    Age: Optional[float] = Field(None, description="Age in years")


def _stated_numbers(text: str) -> set[float]:
    return {float(n) for n in _NUMBER_RE.findall(text or "")}


def run_risk_tool(problem: str, args: dict, user_text: str) -> dict:
    """Validates tool arguments and scores them. Always returns a dict."""
    names = risk_models.FEATURES[problem]
    page = "Cardiac Risk Analyzer" if problem == "heart" else "Diabetes Risk Analyzer"

    missing = [n for n in names if args.get(n) is None]
    if missing:
        return {
            "status": "missing_inputs",
            "missing": missing,
            "note": f"Do not estimate these. Tell the user the {page} page can calculate the score once they have these values.",
        }

    stated = _stated_numbers(user_text)
    invented = [n for n in _MEASURED[problem] if float(args[n]) not in stated]
    if invented:
        return {
            "status": "rejected",
            "reason": "These values were not stated by the user: " + ", ".join(invented),
            "note": "Do not report a risk score. Ask the user for the missing measurements instead.",
        }

    values = [float(args[n]) for n in names]
    off = risk_models.out_of_range(problem, values)
    if off:
        return {"status": "rejected", "reason": "; ".join(off), "note": "Do not report a risk score."}

    try:
        result = risk_models.predict(problem, values)
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "reason": str(exc), "note": "Do not report a risk score."}

    return {
        "status": "ok",
        "model": f"{problem}_risk",
        "risk_percentage": result["risk_percentage"],
        "risk_level": result["risk_level"],
        "note": "This is a statistical screening estimate from a small public dataset, not a diagnosis. Say so when you mention it.",
    }


def build_tools(user_text: str) -> dict[str, StructuredTool]:
    """Tools bound to this conversation's user-provided text."""

    def heart_risk_estimate(**kwargs) -> dict:
        return run_risk_tool("heart", kwargs, user_text)

    def diabetes_risk_estimate(**kwargs) -> dict:
        return run_risk_tool("diabetes", kwargs, user_text)

    return {
        "heart_risk_estimate": StructuredTool.from_function(
            func=heart_risk_estimate,
            name="heart_risk_estimate",
            description=(
                "Estimate heart-disease risk from clinical measurements. Call ONLY when the user has given "
                "these values themselves. Leave any value the user did not state as null; never guess."
            ),
            args_schema=HeartRiskInput,
        ),
        "diabetes_risk_estimate": StructuredTool.from_function(
            func=diabetes_risk_estimate,
            name="diabetes_risk_estimate",
            description=(
                "Estimate diabetes risk from clinical measurements. Call ONLY when the user has given "
                "these values themselves. Leave any value the user did not state as null; never guess."
            ),
            args_schema=DiabetesRiskInput,
        ),
    }


def tools_relevant(category: str, user_text: str) -> bool:
    """Only offer tools when the topic fits and the user has shared several numbers."""
    return category in ("cardiology", "endocrinology") and len(_NUMBER_RE.findall(user_text or "")) >= 4
