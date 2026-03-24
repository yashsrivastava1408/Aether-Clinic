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
from qdrant_client import QdrantClient
from qdrant_client.http import models

# =============================
# Configuration
# =============================
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "medical_knowledge"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))

# Singleton instances (loaded once, reused)
_model = None
_collection = None
_qdrant_client = None


def _get_model():
    global _model
    if _model is None:
        print("📦 Knowledge Retriever: Loading embedding model...")
        _model = SentenceTransformer(EMBEDDING_MODEL)
        print("✅ Embedding model ready.")
    return _model


def _get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        try:
            client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=5)
            # Check connection
            client.get_collections()
            _qdrant_client = client
            print(f"✅ Knowledge Retriever: Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
        except Exception as e:
            print(f"⚠️ Qdrant unavailable: {e}")
            _qdrant_client = None
    return _qdrant_client


def _get_collection():
    global _collection
    if _collection is None:
        if not os.path.exists(CHROMA_DIR):
            print(f"❌ ChromaDB not found at {CHROMA_DIR}. Run ingestion_service.py first!")
            return None
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        try:
            _collection = client.get_collection(COLLECTION_NAME)
            print(f"✅ Knowledge Retriever: Connected to ChromaDB collection '{COLLECTION_NAME}' ({_collection.count()} chunks)")
        except Exception as e:
            print(f"❌ ChromaDB Collection '{COLLECTION_NAME}' not found: {e}")
            return None
    return _collection


def _sync_to_qdrant(q_client, collection):
    """Bootstraps Qdrant by copying data from local ChromaDB."""
    try:
        # Check if collection exists
        collections = q_client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        
        if not exists:
            print(f"🔄 Knowledge Retriever: Creating Qdrant collection '{COLLECTION_NAME}'...")
            q_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )
            
        # Count points
        count = q_client.count(collection_name=COLLECTION_NAME).count
        if count == 0:
            print(f"📥 Knowledge Retriever: Syncing data from ChromaDB to Qdrant...")
            all_data = collection.get(include=["metadatas", "documents", "embeddings"])
            
            if not all_data["ids"]:
                return

            points = []
            for i, idx in enumerate(all_data["ids"]):
                points.append(models.PointStruct(
                    id=i,
                    vector=all_data["embeddings"][i],
                    payload={
                        "content": all_data["documents"][i],
                        **all_data["metadatas"][i]
                    }
                ))
            
            # Batch upload
            q_client.upsert(collection_name=COLLECTION_NAME, points=points)
            print(f"✅ Knowledge Retriever: Successfully synced {len(points)} points to Qdrant.")
            
    except Exception as e:
        print(f"⚠️ Sync to Qdrant failed: {e}")


def retrieve_knowledge(
    query: str,
    categories: list[str] = None,
    n_results: int = 5,
    min_relevance: float = 0.35
) -> list[dict]:
    """
    Hybrid semantic search prioritizing Qdrant with ChromaDB fallback.
    """
    model = _get_model()
    query_embedding = model.encode([query]).tolist()[0]
    
    q_client = _get_qdrant_client()
    chroma_coll = _get_collection()
    
    # 1. Try Qdrant (Distributed)
    if q_client:
        try:
            # Bootstrap if empty
            if chroma_coll:
                _sync_to_qdrant(q_client, chroma_coll)

            print(f"🔍 Knowledge Retriever: Querying Qdrant ({QDRANT_HOST})")
            results = q_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                limit=n_results,
                with_payload=True
            )
            
            retrieved = []
            for hit in results:
                if hit.score < min_relevance:
                    continue
                
                retrieved.append({
                    "content": hit.payload.get("content", ""),
                    "title": hit.payload.get("title", "Unknown"),
                    "source": hit.payload.get("source", "Internal Protocol"),
                    "category": hit.payload.get("category", "General"),
                    "relevance_score": round(hit.score, 4),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "total_chunks": hit.payload.get("total_chunks", 1)
                })
            
            if retrieved:
                return retrieved
        except Exception as e:
            print(f"⚠️ Qdrant search failed, falling back to ChromaDB: {e}")

    # 2. Fallback to ChromaDB (Local)
    if chroma_coll:
        print(f"🔍 Knowledge Retriever: Querying local ChromaDB fallback")
        try:
            # Build filter
            where_filter = None
            if categories:
                formatted_cats = [cat.replace("_", " ").title() for cat in categories]
                if len(formatted_cats) == 1:
                    where_filter = {"primary_category": {"$eq": formatted_cats[0]}}
                else:
                    where_filter = {"$or": [{"primary_category": {"$eq": cat}} for cat in formatted_cats]}

            results = chroma_coll.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter
            )
            
            retrieved = []
            if results and results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i]
                    distance = results["distances"][0][i]
                    relevance_score = 1 - (distance / 2)
                    
                    if relevance_score < min_relevance:
                        continue
                        
                    retrieved.append({
                        "content": doc,
                        "title": metadata.get("title", "Unknown"),
                        "source": metadata.get("source", "Internal Protocol"),
                        "category": metadata.get("category", "General"),
                        "relevance_score": round(relevance_score, 4)
                    })
            return retrieved
        except Exception as e:
            print(f"❌ ChromaDB search failed: {e}")

    return []


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
