"""
Aether Clinic — ML & Intelligence Service
==========================================
Combined Flask service providing:
  1. ML Predictions (Heart Disease, Diabetes) — existing functionality
  2. Multi-Agent RAG Intelligence Hub — NEW
     - Triage Classification
     - Semantic Knowledge Retrieval (ChromaDB)
     - Citation Extraction
     - Safety Oversight Verification

Port: 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import traceback

app = Flask(__name__)
CORS(app)

# =========================
# Load ML models once at startup
# =========================
heart_model = joblib.load("models/heart_model.pkl")
diabetes_model = joblib.load("models/diabetes_model.pkl")


# =========================
# Helper: Risk Interpretation
# =========================
def risk_level(probability):
    if probability < 0.3:
        return "Low"
    elif probability < 0.6:
        return "Medium"
    else:
        return "High"


# ═══════════════════════════════════════════════════
# SECTION 1: EXISTING ML PREDICTION ENDPOINTS
# ═══════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint for both ML and Intelligence services."""
    # Check if ChromaDB is available
    chroma_status = "unavailable"
    chroma_chunks = 0
    try:
        from agents.knowledge_retriever import _get_collection
        collection = _get_collection()
        if collection:
            chroma_status = "connected"
            chroma_chunks = collection.count()
    except Exception:
        pass

    return jsonify({
        "status": "ML & Intelligence service running",
        "ml_models": ["heart_disease", "diabetes"],
        "intelligence": {
            "vector_db": chroma_status,
            "indexed_chunks": chroma_chunks,
            "agents": ["triage_classifier", "knowledge_retriever", "safety_oversight"]
        }
    }), 200


@app.route("/predict/heart", methods=["POST"])
def predict_heart():
    """Heart disease risk prediction."""
    data = request.json.get("features")
    arr = np.array(data).reshape(1, -1)
    prediction = int(heart_model.predict(arr)[0])
    probability = float(heart_model.predict_proba(arr)[0][1])
    return jsonify({
        "prediction": prediction,
        "risk_percentage": round(probability * 100, 2),
        "risk_level": risk_level(probability)
    })


@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():
    """Diabetes risk prediction."""
    data = request.json.get("features")
    arr = np.array(data).reshape(1, -1)
    prediction = int(diabetes_model.predict(arr)[0])
    probability = float(diabetes_model.predict_proba(arr)[0][1])
    return jsonify({
        "prediction": prediction,
        "risk_percentage": round(probability * 100, 2),
        "risk_level": risk_level(probability)
    })


# ═══════════════════════════════════════════════════
# SECTION 2: MULTI-AGENT RAG INTELLIGENCE HUB
# ═══════════════════════════════════════════════════

@app.route("/api/intelligence/query", methods=["POST"])
def intelligence_query():
    """
    Main RAG intelligence endpoint.
    Called by the Node.js backend during chat to retrieve relevant medical context.

    Expected JSON Body:
    {
        "query": "I have chest pain and sweating",
        "specialization": "Cardiology",        // optional
        "conversation_context": "...",          // optional: recent messages
        "n_results": 5                          // optional: max results
    }

    Returns:
    {
        "context": "Formatted medical protocol text for LLM consumption",
        "citations": [...],
        "classification": {...},
        "chunk_count": 5,
        "has_context": true
    }
    """
    try:
        data = request.json
        query = data.get("query", "")
        specialization = data.get("specialization", "General Medicine")
        conversation_context = data.get("conversation_context", "")
        n_results = data.get("n_results", 5)

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Import agents
        from agents.triage_classifier import classify_query
        from agents.knowledge_retriever import (
            retrieve_knowledge,
            format_context_for_llm,
            extract_citations
        )

        # === AGENT 1: Triage Classification ===
        classification = classify_query(query, specialization)

        print(f"\n{'═' * 50}")
        print(f"🧠 INTELLIGENCE QUERY")
        print(f"   Query: {query[:80]}...")
        print(f"   Classification: {classification['category']} | Urgency: {classification['urgency']}")
        print(f"   Routing: {classification['routing_hint']}")

        # === AGENT 2: Knowledge Retrieval ===
        # Build an enriched query combining user message + conversation context
        enriched_query = query
        if conversation_context:
            # Add relevant conversation context for better semantic matching
            enriched_query = f"{query}. Context: {conversation_context[-500:]}"

        results = retrieve_knowledge(
            query=enriched_query,
            categories=classification["categories"],
            n_results=n_results
        )

        print(f"   Retrieved: {len(results)} relevant chunks")
        for r in results:
            print(f"      📋 {r['title']} (relevance: {r['relevance_score']:.2%})")

        # Format for LLM consumption
        formatted_context = format_context_for_llm(results)
        citations = extract_citations(results)

        print(f"   Citations: {len(citations)}")
        print(f"{'═' * 50}\n")

        return jsonify({
            "context": formatted_context,
            "citations": citations,
            "classification": classification,
            "chunk_count": len(results),
            "has_context": len(results) > 0
        })

    except Exception as e:
        print(f"❌ Intelligence Query Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "context": "",
            "citations": [],
            "classification": {"category": "general_medicine", "urgency": "routine"},
            "chunk_count": 0,
            "has_context": False,
            "error": str(e)
        })


@app.route("/api/intelligence/verify", methods=["POST"])
def intelligence_verify():
    """
    Safety verification endpoint.
    Called AFTER the LLM generates a response to check for safety violations.

    Expected JSON Body:
    {
        "ai_response": "The full AI response text",
        "retrieved_context": "The medical context that was used",
        "user_query": "The original user question",
        "urgency": "routine"
    }

    Returns:
    {
        "is_safe": true,
        "modified_response": "...",
        "warnings_added": [...],
        "violations_found": [...],
        "safety_score": 0.95
    }
    """
    try:
        data = request.json
        ai_response = data.get("ai_response", "")
        retrieved_context = data.get("retrieved_context", "")
        user_query = data.get("user_query", "")
        urgency = data.get("urgency", "routine")

        if not ai_response:
            return jsonify({"error": "ai_response is required"}), 400

        from agents.safety_oversight import verify_response

        result = verify_response(
            ai_response=ai_response,
            retrieved_context=retrieved_context,
            user_query=user_query,
            urgency=urgency
        )

        print(f"🛡️ Safety Check: score={result['safety_score']}, safe={result['is_safe']}, "
              f"warnings={len(result['warnings_added'])}, violations={len(result['violations_found'])}")

        return jsonify(result)

    except Exception as e:
        print(f"❌ Safety Verification Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "is_safe": True,
            "modified_response": data.get("ai_response", ""),
            "warnings_added": [],
            "violations_found": [],
            "safety_score": 0.5,
            "error": str(e)
        })


@app.route("/api/intelligence/status", methods=["GET"])
def intelligence_status():
    """
    Returns the status of the Intelligence Hub — useful for the frontend dashboard.
    """
    status = {
        "service": "running",
        "agents": {
            "triage_classifier": "active",
            "knowledge_retriever": "unknown",
            "safety_oversight": "active"
        },
        "vector_db": {
            "status": "unknown",
            "total_chunks": 0,
            "collection": COLLECTION_NAME if 'COLLECTION_NAME' in dir() else "medical_knowledge"
        }
    }

    try:
        from agents.knowledge_retriever import _get_collection
        collection = _get_collection()
        if collection:
            status["agents"]["knowledge_retriever"] = "active"
            status["vector_db"]["status"] = "connected"
            status["vector_db"]["total_chunks"] = collection.count()
        else:
            status["agents"]["knowledge_retriever"] = "no_database"
            status["vector_db"]["status"] = "not_initialized"
    except Exception as e:
        status["agents"]["knowledge_retriever"] = f"error: {str(e)}"
        status["vector_db"]["status"] = "error"

    return jsonify(status)


# ═══════════════════════════════════════════════════
# Run Server
# ═══════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "═" * 60)
    print("🏥 Aether Clinic — ML & Intelligence Service")
    print("═" * 60)
    print("  📊 ML Models: Heart Disease, Diabetes")
    print("  🧠 Intelligence: Multi-Agent RAG with ChromaDB")
    print("  🛡️ Safety: Oversight Agent Active")
    print("═" * 60 + "\n")

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False
    )