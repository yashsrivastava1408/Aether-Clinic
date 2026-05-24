import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

import joblib


def utc_timestamp():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_feature_schema(df):
    schema = {}
    for col in df.columns:
        schema[col] = {
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "mean": float(df[col].mean()),
        }
    return schema


def save_model_bundle(model, model_name, model_dir, summary):
    model_dir = Path(model_dir)
    versions_dir = model_dir / "versions"
    metadata_dir = model_dir / "metadata"
    versions_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    timestamp = utc_timestamp()
    live_model_path = model_dir / f"{model_name}.pkl"
    versioned_model_path = versions_dir / f"{model_name}_{timestamp}.pkl"
    metadata_path = metadata_dir / f"{model_name}_{timestamp}.json"
    latest_metadata_path = metadata_dir / f"{model_name}_latest.json"

    payload = deepcopy(summary)
    payload["artifact"] = {
        "current_model_path": str(live_model_path),
        "versioned_model_path": str(versioned_model_path),
        "metadata_path": str(metadata_path),
        "created_at_utc": timestamp,
    }

    joblib.dump(model, live_model_path)
    joblib.dump(model, versioned_model_path)
    metadata_path.write_text(json.dumps(payload, indent=2))
    latest_metadata_path.write_text(json.dumps(payload, indent=2))

    return {
        "live_model_path": live_model_path,
        "versioned_model_path": versioned_model_path,
        "metadata_path": metadata_path,
        "latest_metadata_path": latest_metadata_path,
        "timestamp": timestamp,
    }
