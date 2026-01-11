import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import time
from tqdm import tqdm
from colorama import Fore, Style, init

# Initialize Colorama
init(autoreset=True)

def print_hud(message, color=Fore.CYAN):
    print(f"{color}[SYSTEM] {Style.RESET_ALL}{message}")

print_hud("INITIATING DIABETIC NEURAL TRAINING SEQUENCE...", Fore.MAGENTA)
time.sleep(1)

# Load cleaned dataset
print_hud("Accessing Glucose Biometric Database...")
df = pd.read_csv("datasets/diabetes_clean.csv")

X = df.drop("Outcome", axis=1)
y = df["Outcome"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Hyperparameter grid
param_grid = {
    "n_estimators": [100, 200],
    "max_depth": [None, 5, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 4]
}

rf = RandomForestClassifier(random_state=42)

print_hud("Optimizing Neural Weights via GridSearch...")
grid = GridSearchCV(
    rf,
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

# Simulate progress for effect
for _ in tqdm(range(20), desc="[NEURAL LINKING]"):
    time.sleep(0.05)

grid.fit(X_train, y_train)

best_model = grid.best_estimator_

print_hud("Validating Model Accuracy against Control Group...")
y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

joblib.dump(best_model, "models/diabetes_model.pkl")

print("\n" + "="*50)
print(f"{Fore.GREEN}✅ TRAINING COMPLETE: DIABETES MODEL")
print("-" * 50)
print(f"{Fore.CYAN}Best Params: {Style.RESET_ALL}{grid.best_params_}")
print(f"{Fore.YELLOW}Accuracy:    {Style.BRIGHT}{accuracy*100:.2f}%")
print("="*50 + "\n")
