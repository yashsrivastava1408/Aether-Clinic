# 🧠 Aether ML: Predictive Analytics Service

**A dedicated Python microservice for high-precision numerical health forecasting.**

---

## 🤖 Model Architecture

This service does not use LLMs. Instead, it uses traditional, explainable Machine Learning models (Random Forest, Logistic Regression) trained on validated medical datasets (Cleveland Heart, PIMA Diabetes).

### Processing Pipeline

```mermaid
graph TD
    Input[JSON Vector] --> Preprocess[Scaler/Normalizer]
    Preprocess --> Model[Joblib Loaded Model]
    Model --> Prob[Probability Score (0.0 - 1.0)]
    Model --> Class[Binary Class (0/1)]
    Prob --> Logic[Risk Level Logic]
    Logic --> Output[JSON Response]
```

---

## 📚 Available Models

| Model | Type | Accuracy | Features Used |
| :--- | :--- | :--- | :--- |
| **Heart Disease** | Random Forest Classifier | ~88% | Age, Sex, CP, Trestbps, Chol, FPS, RestECG, Thalach, Exang, Oldpeak, Slope, CA, Thal |
| **Diabetes** | Logistic Regression | ~82% | Pregnancies, Glucose, BP, SkinThickness, Insulin, BMI, Pedigree, Age |

---

## 🛠️ Tech Stack

*   **Framework**: Flask (Python)
*   **ML Libraries**: Scikit-Learn, NumPy, Pandas
*   **Serialization**: Joblib (for `.pkl` model persistence)

---
*Precision Medicine Powered by Math.*
