from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# =========================
# Load models once at startup
# =========================
heart_model = joblib.load("models/heart_model.pkl")
diabetes_model = joblib.load("models/diabetes_model.pkl")


# =========================
# Helper: Risk Interpretation
# =========================
def risk_level(probability):
    if probability < 0.3:
        return "Low"
    elif probability < 0.6:
        return "Medium"
    else:
        return "High"


# =========================
# Health Check
# =========================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ML service running"}), 200


# =========================
# Heart Disease Prediction
# =========================
@app.route("/predict/heart", methods=["POST"])
def predict_heart():
    data = request.json.get("features")

    arr = np.array(data).reshape(1, -1)

    prediction = int(heart_model.predict(arr)[0])
    probability = float(heart_model.predict_proba(arr)[0][1])

    return jsonify({
        "prediction": prediction,
        "risk_percentage": round(probability * 100, 2),
        "risk_level": risk_level(probability)
    })


# =========================
# Diabetes Prediction
# =========================
@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():
    data = request.json.get("features")

    arr = np.array(data).reshape(1, -1)

    prediction = int(diabetes_model.predict(arr)[0])
    probability = float(diabetes_model.predict_proba(arr)[0][1])

    return jsonify({
        "prediction": prediction,
        "risk_percentage": round(probability * 100, 2),
        "risk_level": risk_level(probability)
    })


# =========================
# Run Server
# =========================
if __name__ == "__main__":
    app.run(port=5001, debug=True)