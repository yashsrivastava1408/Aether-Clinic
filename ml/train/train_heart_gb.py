import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load data
df = pd.read_csv("datasets/heart_clean.csv")

X = df.drop("target", axis=1)
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

param_grid = {
    "n_estimators": [100, 200, 300],
    "learning_rate": [0.01, 0.05, 0.1, 0.2],
    "max_depth": [3, 4, 5],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2]
}

gb = GradientBoostingClassifier(random_state=42)

grid = GridSearchCV(
    gb,
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

print("Starting Grid Search for Heart Model (Gradient Boosting)...")
grid.fit(X_train, y_train)

best_model = grid.best_estimator_

y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

# We won't overwrite the main model yet until we confirm it's better
joblib.dump(best_model, "models/heart_model_gb.pkl")

print("✅ Gradient Boosting Heart Model Trained")
print("Best Parameters:", grid.best_params_)
print("Accuracy:", accuracy)
