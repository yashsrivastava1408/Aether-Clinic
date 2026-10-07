"""
Builds (or rebuilds) the medical knowledge index in Qdrant.

Usage, from the ml/ directory:
    python -m retrieval.ingest            # upsert the corpus
    python -m retrieval.ingest --recreate # drop the collection first
"""

from __future__ import annotations

import argparse

from . import store


def main() -> None:
    parser = argparse.ArgumentParser(description="Index the medical corpus into Qdrant.")
    parser.add_argument("--recreate", action="store_true", help="drop and rebuild the collection")
    args = parser.parse_args()

    if store.is_embedded():
        print("ℹ️ No QDRANT_URL / QDRANT_HOST set: the embedded index is built in memory "
              "at service startup, so there is nothing to persist here. Running a dry build.")
    count = store.ingest(recreate=args.recreate)
    print(f"Done. {count} chunks in collection '{store.collection_name()}'.")


if __name__ == "__main__":
    main()
