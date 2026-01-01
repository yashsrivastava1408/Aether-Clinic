# Aether clinic – Machine Learning Module

This folder contains all machine learning–related components of the **AI Doctor** project, including dataset preprocessing, model training, evaluation, and deployment as a Flask-based microservice.


##  Workflow

The Aether Clinic system follows a modular, end-to-end workflow that integrates frontend input, backend orchestration, and machine learning inference.
![alt text](<Screenshot 2026-01-01 at 1.14.48 PM.png>)
## Folder Structure
```
ml/
├── datasets/
│   ├── heart.csv
│   ├── heart_clean.csv
│   └── diabetes_clean.csv
│
│   ├── diabetes.csv
├── train/
│   ├── train_heart.py
│   ├── train_heart_advanced.py
│   └── train_diabetes.py
│
├── models/
│   ├── heart_model.pkl
│   └── diabetes_model.pkl
│
├── app.py
├── predict.py
└── README.md
```


## 📊 Datasets Used

###  Heart Disease
- **Source:** UCI Machine Learning Repository (Cleveland dataset)
- **Records:** 303
- **Features:** 13
- **Target:** Presence of heart disease (binary)

###  Diabetes
- **Source:** PIMA Indians Diabetes Dataset
- **Records:** 768
- **Features:** 8
- **Target:** Diabetes outcome (binary)



##  Data Preprocessing

### Heart Dataset
- Missing values in `ca` and `thal` filled using median
- Target converted to binary:
  - `0` → No disease
  - `1` → Disease

### Diabetes Dataset
- Zero values in medical columns replaced with median
- No missing values after cleaning

Cleaned datasets are saved as:
- `heart_clean.csv`
- `diabetes_clean.csv`



##  Models Used

### Heart Disease Model
- **Algorithm:** Random Forest Classifier
- **Training Method:**
  - Hyperparameter tuning using `GridSearchCV`
  - 5-fold cross-validation
- **Final Accuracy:** ~90%
- **Key Parameters:**
  - `max_depth = 5`
  - `n_estimators = 100`
  - `min_samples_split = 5`

### Diabetes Model
- **Algorithm:** Logistic Regression
- **Accuracy:** ~75–80%
- **Reason:** Simple, interpretable baseline model


##  Training the Models

### Train baseline heart model
```
python3 train/train_heart.py

Train improved heart model (recommended)

python3 train/train_heart_advanced.py

Train diabetes model

python3 train/train_diabetes.py

Trained models are saved in:

ml/models/
```


## ML Inference & API Deployment

The trained models are deployed using a Flask microservice.

Start ML Service
```
python3 app.py
```
The service runs on:
```
http://localhost:5001
```


##  Available API Endpoints
```
Health Check

GET /health

Heart Disease Prediction

POST /predict/heart

Request Body

{
  "features": [63,1,1,145,233,1,2,150,0,2.3,3,0,6]
}

Response

{
  "prediction": 0,
  "risk_percentage": 20,
  "risk_level": "Low"
}

Diabetes Prediction

POST /predict/diabetes
```
# Risk Interpretation Logic

Risk Percentage	Risk Level
< 30%	Low
30–60%	Medium
> 60%	High

This makes predictions more interpretable than a simple binary output.

# Design Decisions
	•	Single-dataset training chosen for reliability and feature consistency
	•	Hyperparameter tuning applied to avoid overfitting
	•	Flask microservice used for clean separation from backend logic
	•	Probability-based risk levels for better medical interpretation


# Future Scope
	•	Multi-dataset training with feature normalization
	•	Advanced models (XGBoost, LightGBM)
	•	Explainable AI (SHAP values)
	•	Federated learning for privacy-preserving training


## Academic Note

This ML module is designed to be:
	•	Explainable
	•	Clinically reasonable
	•	Minor-project appropriate
	•	Production-inspired


Yash Srivastava
AI Doctor – Minor Project
2025–2026

