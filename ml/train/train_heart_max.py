import pandas as pd
import sys
from pathlib import Path

from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, VotingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    RepeatedStratifiedKFold,
    TunedThresholdClassifierCV,
    cross_validate,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
ML_DIR = ROOT / "ml"

from ml.modeling.preprocessors import ArrayToDataFrameTransformer, HeartFrontendEncodingTransformer
from ml.modeling.training_utils import build_feature_schema, save_model_bundle


FEATURE_COLUMNS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]
NUMERIC_FEATURES = ["age", "trestbps", "chol", "thalach", "oldpeak"]
CATEGORICAL_FEATURES = ["sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def build_candidates():
    return {
        "logistic_regression": Pipeline(
            steps=[
                ("to_frame", ArrayToDataFrameTransformer(FEATURE_COLUMNS)),
                ("frontend_encoding", HeartFrontendEncodingTransformer()),
                ("preprocessor", build_preprocessor()),
                (
                    "model",
                    LogisticRegression(
                        C=0.8,
                        class_weight="balanced",
                        max_iter=4000,
                        random_state=42,
                    ),
                ),
            ]
        ),
        "rbf_svc": Pipeline(
            steps=[
                ("to_frame", ArrayToDataFrameTransformer(FEATURE_COLUMNS)),
                ("frontend_encoding", HeartFrontendEncodingTransformer()),
                ("preprocessor", build_preprocessor()),
                (
                    "model",
                    SVC(
                        C=2.0,
                        gamma="scale",
                        probability=True,
                        class_weight="balanced",
                        random_state=42,
                    ),
                ),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("to_frame", ArrayToDataFrameTransformer(FEATURE_COLUMNS)),
                ("frontend_encoding", HeartFrontendEncodingTransformer()),
                ("preprocessor", build_preprocessor()),
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=700,
                        max_depth=10,
                        min_samples_leaf=2,
                        min_samples_split=4,
                        class_weight="balanced_subsample",
                        random_state=42,
                    ),
                ),
            ]
        ),
        "extra_trees": Pipeline(
            steps=[
                ("to_frame", ArrayToDataFrameTransformer(FEATURE_COLUMNS)),
                ("frontend_encoding", HeartFrontendEncodingTransformer()),
                ("preprocessor", build_preprocessor()),
                (
                    "model",
                    ExtraTreesClassifier(
                        n_estimators=900,
                        max_depth=None,
                        min_samples_leaf=1,
                        min_samples_split=4,
                        class_weight="balanced",
                        random_state=42,
                    ),
                ),
            ]
        ),
        "soft_voting_ensemble": Pipeline(
            steps=[
                ("to_frame", ArrayToDataFrameTransformer(FEATURE_COLUMNS)),
                ("frontend_encoding", HeartFrontendEncodingTransformer()),
                ("preprocessor", build_preprocessor()),
                (
                    "model",
                    VotingClassifier(
                        estimators=[
                            (
                                "lr",
                                LogisticRegression(
                                    C=0.8,
                                    class_weight="balanced",
                                    max_iter=4000,
                                    random_state=42,
                                ),
                            ),
                            (
                                "svc",
                                SVC(
                                    C=2.0,
                                    gamma="scale",
                                    probability=True,
                                    class_weight="balanced",
                                    random_state=42,
                                ),
                            ),
                            (
                                "et",
                                ExtraTreesClassifier(
                                    n_estimators=900,
                                    max_depth=None,
                                    min_samples_leaf=1,
                                    min_samples_split=4,
                                    class_weight="balanced",
                                    random_state=42,
                                ),
                            ),
                        ],
                        voting="soft",
                        weights=[1, 2, 2],
                        n_jobs=1,
                    ),
                ),
            ]
        ),
    }


def evaluate_candidates(X, y, candidates):
    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=8, random_state=42)
    scoring = {
        "accuracy": "accuracy",
        "balanced_accuracy": "balanced_accuracy",
        "roc_auc": "roc_auc",
        "average_precision": "average_precision",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
    }

    results = {}
    print("\nCandidate cross-validation:")
    print("-" * 108)
    for name, model in candidates.items():
        scores = cross_validate(model, X, y, cv=cv, scoring=scoring, n_jobs=1)
        summary = {metric.replace("test_", ""): float(values.mean()) for metric, values in scores.items() if metric.startswith("test_")}
        results[name] = summary
        print(
            f"{name:20s} "
            f"acc={summary['accuracy']:.4f} "
            f"bal_acc={summary['balanced_accuracy']:.4f} "
            f"roc_auc={summary['roc_auc']:.4f} "
            f"pr_auc={summary['average_precision']:.4f} "
            f"recall={summary['recall']:.4f} "
            f"f1={summary['f1']:.4f}"
        )
    return results


def pick_finalists(results, top_k=2):
    ranked = sorted(
        results.items(),
        key=lambda item: (
            item[1]["roc_auc"],
            item[1]["average_precision"],
            item[1]["balanced_accuracy"],
            item[1]["f1"],
        ),
        reverse=True,
    )
    return [name for name, _ in ranked[:top_k]]


def build_calibrated_threshold_model(base_model):
    calibrated = CalibratedClassifierCV(
        estimator=clone(base_model),
        method="sigmoid",
        cv=5,
    )
    return TunedThresholdClassifierCV(
        estimator=calibrated,
        scoring="balanced_accuracy",
        response_method="predict_proba",
        thresholds=101,
        cv=5,
        refit=True,
        n_jobs=1,
    )


def evaluate_holdout(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "average_precision": float(average_precision_score(y_test, y_prob)),
        "brier_score": float(brier_score_loss(y_test, y_prob)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1": float(f1_score(y_test, y_pred)),
        "classification_report": classification_report(
            y_test,
            y_pred,
            target_names=["No Disease", "Disease"],
        ),
    }


def main():
    print("\n" + "=" * 72)
    print("Heart disease training with calibration, threshold tuning, and versioning")
    print("=" * 72)

    df = pd.read_csv(ML_DIR / "datasets" / "heart_clean.csv")
    X = df[FEATURE_COLUMNS].copy()
    y = df["target"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    candidates = build_candidates()
    candidate_results = evaluate_candidates(X_train, y_train, candidates)
    finalists = pick_finalists(candidate_results, top_k=2)

    tuned_models = {}
    tuned_results = {}
    print("\nCalibrated finalists with threshold tuning:")
    print("-" * 108)
    for name in finalists:
        tuned_model = build_calibrated_threshold_model(candidates[name])
        tuned_model.fit(X_train, y_train)
        metrics = evaluate_holdout(tuned_model, X_test, y_test)
        tuned_models[name] = tuned_model
        tuned_results[name] = metrics
        print(
            f"{name:20s} "
            f"threshold={float(getattr(tuned_model, 'best_threshold_', 0.5)):.4f} "
            f"acc={metrics['accuracy']:.4f} "
            f"bal_acc={metrics['balanced_accuracy']:.4f} "
            f"roc_auc={metrics['roc_auc']:.4f} "
            f"pr_auc={metrics['average_precision']:.4f} "
            f"brier={metrics['brier_score']:.4f}"
        )

    best_name = max(
        tuned_results,
        key=lambda name: (
            tuned_results[name]["roc_auc"],
            tuned_results[name]["average_precision"],
            tuned_results[name]["balanced_accuracy"],
            tuned_results[name]["f1"],
        ),
    )
    best_model = tuned_models[best_name]
    best_metrics = tuned_results[best_name]

    print("\nSelected model:", best_name)
    print(f"Threshold:       {float(getattr(best_model, 'best_threshold_', 0.5)):.4f}")
    print(f"Holdout accuracy:{best_metrics['accuracy']:.4f}")
    print(f"Holdout ROC-AUC: {best_metrics['roc_auc']:.4f}")
    print(f"Holdout PR-AUC:  {best_metrics['average_precision']:.4f}")
    print(f"Holdout Brier:   {best_metrics['brier_score']:.4f}")
    print("\n" + best_metrics["classification_report"])

    artifact_info = save_model_bundle(
        model=best_model,
        model_name="heart_model",
        model_dir=ML_DIR / "models",
        summary={
            "problem": "heart_disease",
            "feature_columns": FEATURE_COLUMNS,
            "feature_schema": build_feature_schema(X),
            "candidate_cv_metrics": candidate_results,
            "finalists": finalists,
            "selected_model": best_name,
            "selected_threshold": float(getattr(best_model, "best_threshold_", 0.5)),
            "holdout_metrics": {k: v for k, v in best_metrics.items() if k != "classification_report"},
            "training_strategy": {
                "candidate_cv": "RepeatedStratifiedKFold(n_splits=5, n_repeats=8, random_state=42)",
                "calibration": "CalibratedClassifierCV(method='sigmoid', cv=5)",
                "threshold_tuning": "TunedThresholdClassifierCV(scoring='balanced_accuracy', thresholds=101, cv=5)",
            },
        },
    )
    print(f"Saved live model to {artifact_info['live_model_path']}")
    print(f"Saved versioned model to {artifact_info['versioned_model_path']}")
    print(f"Saved metadata to {artifact_info['metadata_path']}")


if __name__ == "__main__":
    main()
