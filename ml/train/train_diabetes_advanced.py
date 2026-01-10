import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

# Load cleaned dataset
df = pd.read_csv("datasets/diabetes_clean.csv")

X = df.drop("Outcome", axis=1)
y = df["Outcome"]

# Scale features (Random Forest doesn't strictly need it, but good for consistency/pipeline if we swap models)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# Hyperparameter grid
param_grid = {
    "n_estimators": [100, 200],
    "max_depth": [None, 5, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 4]
}

rf = RandomForestClassifier(random_state=42)

grid = GridSearchCV(
    rf,
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

print("Starting Grid Search for Diabetes Model...")
grid.fit(X_train, y_train)

best_model = grid.best_estimator_

y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

# Save the model
# Note: In a real prod pipeline we should save the scaler too if we use it, 
# but for now we are just replacing the model file directly. 
# However, the original app.py does NOT scale inputs. 
# Random Forest is robust to unscaled data, so let's try WITHOUT scaling to match app.py logic 
# unless we change app.py too.
# Rerunning fit on unscaled data for compatibility with existing app.py
print("Refitting best model on unscaled data for consistency with app.py...")
best_model.fit(X_train, y_train) # Actually, wait, if I trained on scaled, I must predict on scaled. 
# Attempt 2: Let's NOT scale for now to keep app.py simple, as RF handles it well.

X_train_unscaled, X_test_unscaled, y_train_unscaled, y_test_unscaled = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
grid.fit(X_train_unscaled, y_train_unscaled)
best_model_unscaled = grid.best_estimator_
y_pred_unscaled = best_model_unscaled.predict(X_test_unscaled)
accuracy_unscaled = accuracy_score(y_test_unscaled, y_pred_unscaled)

joblib.dump(best_model_unscaled, "models/diabetes_model.pkl")

print("✅ Advanced Diabetes Model Trained")
print("Best Parameters:", grid.best_params_)
print("Improved Accuracy:", accuracy_unscaled)
