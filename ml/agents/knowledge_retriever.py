"""
Aether Clinic — Knowledge Retriever Agent
==========================================
Queries ChromaDB using semantic search (embeddings) combined with keyword filtering
to retrieve the most relevant medical protocol chunks.

This is the "Hybrid Search" agent — combining vector similarity with metadata filtering
for maximum accuracy on medical terminology.
"""

import os
import chromadb
from sentence_transformers import SentenceTransformer

# =============================
# Configuration
# =============================
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "medical_knowledge"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Singleton instances (loaded once, reused)
_model = None
_collection = None


def _get_model():
    global _model
    if _model is None:
        print("📦 Knowledge Retriever: Loading embedding model...")
        _model = SentenceTransformer(EMBEDDING_MODEL)
        print("✅ Embedding model ready.")
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        if not os.path.exists(CHROMA_DIR):
            print(f"❌ ChromaDB not found at {CHROMA_DIR}. Run ingestion_service.py first!")
            return None
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        try:
            _collection = client.get_collection(COLLECTION_NAME)
            print(f"✅ Knowledge Retriever: Connected to collection '{COLLECTION_NAME}' ({_collection.count()} chunks)")
        except Exception as e:
            print(f"❌ Collection '{COLLECTION_NAME}' not found: {e}")
            return None
    return _collection


def retrieve_knowledge(
    query: str,
    categories: list[str] = None,
    n_results: int = 5,
    min_relevance: float = 0.35
) -> list[dict]:
    """
    Performs hybrid semantic + metadata search against the medical knowledge base.

    Args:
        query: The user's medical query or symptom description
        categories: Optional list of categories to filter by (from Triage Classifier)
        n_results: Number of results to return
        min_relevance: Minimum cosine similarity threshold (0-1, lower = more similar for distances)

    Returns:
        list[dict]: Each dict contains:
            - content: The matched text chunk
            - title: Protocol title
            - source: Original medical source
            - category: Medical category
            - relevance_score: Cosine similarity score (0-1, higher = more relevant)
    """
    collection = _get_collection()
    if collection is None:
        return []

    model = _get_model()

    # Generate embedding for the query
    query_embedding = model.encode([query]).tolist()

    # Build where filter for category-based filtering (if categories provided)
    # We now filter on 'primary_category' which is exactly matched during ingestion
    where_filter = None
    if categories and len(categories) > 0:
        # Standardize categories for matching primary_category
        # e.g., 'general_medicine' -> 'General Medicine'
        formatted_cats = [cat.replace("_", " ").title() for cat in categories]
        
        if len(formatted_cats) == 1:
            where_filter = {"primary_category": {"$eq": formatted_cats[0]}}
        else:
            where_filter = {
                "$or": [{"primary_category": {"$eq": cat}} for cat in formatted_cats]
            }

    # Query ChromaDB
    try:
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            where=where_filter if where_filter else None
        )
    except Exception as e:
        # If the filter causes issues, fall back to unfiltered search
        print(f"⚠️ Filtered search failed ({e}), falling back to unfiltered...")
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )

    # Process and format results
    retrieved = []
    if results and results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i]

            # ChromaDB returns cosine distance (0 = identical, 2 = opposite)
            # Convert to similarity score (1 = identical, 0 = unrelated)
            relevance_score = 1 - (distance / 2)

            if relevance_score < min_relevance:
                continue

            retrieved.append({
                "content": doc,
                "title": metadata.get("title", "Unknown"),
                "source": metadata.get("source", "Internal Protocol"),
                "category": metadata.get("category", "General"),
                "relevance_score": round(relevance_score, 4),
                "chunk_index": metadata.get("chunk_index", 0),
                "total_chunks": metadata.get("total_chunks", 1)
            })

    # Sort by relevance (highest first)
    retrieved.sort(key=lambda x: x["relevance_score"], reverse=True)

    return retrieved


def format_context_for_llm(results: list[dict]) -> str:
    """
    Formats retrieved results into a structured context block suitable for LLM consumption.
    Includes citations and source attribution.
    """
    if not results:
        return ""

    context_parts = []
    seen_titles = set()

    for r in results:
        # Deduplicate by title (don't repeat protocol names)
        title_key = r["title"]
        if title_key in seen_titles:
            continue
        seen_titles.add(title_key)

        context_parts.append(
            f"📋 PROTOCOL: {r['title']}\n"
            f"📖 SOURCE: {r['source']}\n"
            f"🏷️ CATEGORY: {r['category']}\n"
            f"📊 RELEVANCE: {r['relevance_score']:.0%}\n"
            f"───────────────────────────\n"
            f"{r['content']}\n"
        )

    return "\n\n".join(context_parts)


def extract_citations(results: list[dict]) -> list[dict]:
    """
    Extracts unique citations from retrieved results for the frontend to display.
    """
    citations = []
    seen = set()

    for r in results:
        citation_key = f"{r['title']}|{r['source']}"
        if citation_key not in seen:
            seen.add(citation_key)
            citations.append({
                "title": r["title"],
                "source": r["source"],
                "category": r["category"],
                "relevance": r["relevance_score"]
            })

    return citations
