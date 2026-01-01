import joblib
import numpy as np

# Load trained models
heart_model = joblib.load("models/heart_model.pkl")
diabetes_model = joblib.load("models/diabetes_model.pkl")

def predict_heart(features):
    """
    features: list of 13 values in correct order
    returns: prediction (0/1) and probability
    """
    data = np.array(features).reshape(1, -1)
    prediction = heart_model.predict(data)[0]
    probability = heart_model.predict_proba(data)[0][1]
    return int(prediction), float(probability)

def predict_diabetes(features):
    """
    features: list of 8 values in correct order
    returns: prediction (0/1) and probability
    """
    data = np.array(features).reshape(1, -1)
    prediction = diabetes_model.predict(data)[0]
    probability = diabetes_model.predict_proba(data)[0][1]
    return int(prediction), float(probability)
