"""
Heart-disease and diabetes risk models.

Shared by the /predict endpoints and by the consult graph's tools, so both
paths validate inputs the same way and report the same numbers.
"""

from __future__ import annotations

import json
import math
import sys
import threading
import warnings
from pathlib import Path

import joblib
import numpy as np

MODELS_DIR = Path(__file__).resolve().parent / "models"

# The pickled pipelines reference `ml.modeling.preprocessors`, so the folder
# that contains `ml/` has to be importable.
_ROOT = str(Path(__file__).resolve().parents[1])
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

FEATURES: dict[str, list[str]] = {
    "heart": ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"],
    "diabetes": ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"],
}

_lock = threading.Lock()
_models: dict[str, object] = {}
_schemas: dict[str, dict] = {}


class RiskInputError(ValueError):
    """The supplied features cannot be scored."""


def risk_level(probability: float) -> str:
    if probability < 0.3:
        return "Low"
    if probability < 0.6:
        return "Medium"
    return "High"


def get_model(problem: str):
    """Loads a model once. Returns None when the file is missing or unreadable."""
    if problem not in _models:
        with _lock:
            if problem not in _models:
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        _models[problem] = joblib.load(MODELS_DIR / f"{problem}_model.pkl")
                except Exception as exc:  # noqa: BLE001
                    print(f"Warning loading {problem}_model: {exc}")
                    _models[problem] = None
    return _models[problem]


def feature_schema(problem: str) -> dict:
    """{feature: {"min", "max", "mean"}} from the training metadata, if present."""
    if problem not in _schemas:
        path = MODELS_DIR / "metadata" / f"{problem}_model_latest.json"
        try:
            _schemas[problem] = json.loads(path.read_text()).get("feature_schema", {})
        except Exception:  # noqa: BLE001
            _schemas[problem] = {}
    return _schemas[problem]


def out_of_range(problem: str, values: list[float]) -> list[str]:
    """Human-readable notes for values outside what the model was trained on."""
    notes = []
    schema = feature_schema(problem)
    for name, value in zip(FEATURES[problem], values):
        bounds = schema.get(name)
        if bounds and not (bounds["min"] <= value <= bounds["max"]):
            notes.append(f"{name}={value:g} is outside the training range {bounds['min']:g}–{bounds['max']:g}")
    return notes


def predict(problem: str, features) -> dict:
    """
    Scores one row of features (in FEATURES[problem] order).
    Raises RiskInputError for bad input and RuntimeError if the model is missing.
    """
    if problem not in FEATURES:
        raise RiskInputError(f"Unknown model '{problem}'")
    expected = FEATURES[problem]
    if not isinstance(features, (list, tuple)) or len(features) != len(expected):
        raise RiskInputError(f"Expected {len(expected)} features in this order: {', '.join(expected)}")
    try:
        values = [float(v) for v in features]
    except (TypeError, ValueError):
        raise RiskInputError("All features must be numbers")
    if any(math.isnan(v) or math.isinf(v) for v in values):
        raise RiskInputError("All features must be finite numbers")

    model = get_model(problem)
    if model is None:
        raise RuntimeError(f"{problem} model not loaded")

    arr = np.array(values, dtype=float).reshape(1, -1)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        prediction = int(model.predict(arr)[0])
        probability = float(model.predict_proba(arr)[0][1])

    result = {
        "prediction": prediction,
        "risk_percentage": round(probability * 100, 2),
        "risk_level": risk_level(probability),
    }
    notes = out_of_range(problem, values)
    if notes:
        result["warnings"] = notes
    return result
