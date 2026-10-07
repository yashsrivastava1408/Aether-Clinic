"""
Aether Clinic — ML & Intelligence Service
==========================================
Flask service providing:
  1. ML predictions (heart disease, diabetes)            → /predict/*
  2. The consultation flow, a LangGraph state machine     → /api/consult*
       screen → analyze → (ask | retrieve → assess) → verify
     with hybrid retrieval over Qdrant and saved per-conversation state.
  3. Status and two compatibility endpoints                → /api/intelligence/*

Port: 5001
"""

import json
import os
import sys
import threading
import traceback
from pathlib import Path

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS

ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent
for path in (str(ML_DIR), str(ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

import config  # noqa: E402
import risk_models  # noqa: E402

app = Flask(__name__)
CORS(app)


def _warm_up() -> None:
    """Loads the embedding model and builds the index so the first chat is not slow."""
    try:
        from retrieval import store
        store.ensure_ready()
    except Exception as exc:  # noqa: BLE001
        print(f"Retrieval warm-up failed: {type(exc).__name__}: {exc}")


if os.getenv("SKIP_WARMUP", "").lower() not in ("1", "true"):
    threading.Thread(target=_warm_up, daemon=True).start()


# ═══════════════════════════════════════════════════
# SECTION 1: ML PREDICTION ENDPOINTS
# ═══════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint for both ML and Intelligence services."""
    return jsonify({
        "status": "ML & Intelligence service running",
        "ml_models": [name for name in ("heart", "diabetes") if risk_models.get_model(name) is not None],
        "intelligence": _vector_db_status(),
    }), 200


def _predict(problem: str):
    try:
        body = request.get_json(silent=True) or {}
        features = body.get("features")
        if not features:
            return jsonify({"error": "No features provided"}), 400
        return jsonify(risk_models.predict(problem, features))
    except risk_models.RiskInputError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"{problem} prediction error:", e)
        traceback.print_exc()
        return jsonify({"error": f"{problem.capitalize()} prediction failed"}), 500


@app.route("/predict/heart", methods=["POST"])
def predict_heart():
    """Heart disease risk prediction."""
    return _predict("heart")


@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():
    """Diabetes risk prediction."""
    return _predict("diabetes")


# ═══════════════════════════════════════════════════
# SECTION 2: CONSULTATION GRAPH
# ═══════════════════════════════════════════════════

def _consult_request():
    """Returns (thread_id, payload) or raises ValueError."""
    payload = request.get_json(silent=True) or {}
    thread_id = str(payload.get("thread_id") or "").strip()
    if not thread_id:
        raise ValueError("thread_id is required")
    if not (payload.get("message") or payload.get("image_b64") or payload.get("force_final")):
        raise ValueError("message, image_b64 or force_final is required")
    return thread_id, payload


@app.route("/api/consult", methods=["POST"])
def consult():
    """
    Runs one consultation turn.

    Body: {
        "thread_id": "...",              // one id per consultation
        "message": "I have a headache",
        "specialization": "Neurology",   // optional
        "tier": "basic" | "premium",     // optional
        "user_ram": 8,                   // optional, picks the local model size
        "image_b64": "...", "image_mime": "image/jpeg",   // optional
        "force_final": false,            // optional: write the assessment now
        "history": [{"role", "content"}],// optional: used only if no saved state exists
        "report_summary": "..."          // optional: the user's latest lab report summary
    }
    """
    try:
        thread_id, payload = _consult_request()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    try:
        from consult import get_service
        return jsonify(get_service().run(thread_id, payload))
    except Exception as e:
        print(f"Consult error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Consultation failed"}), 500


@app.route("/api/consult/stream", methods=["POST"])
def consult_stream():
    """Same as /api/consult, as server-sent events: `step` events, then one `final`."""
    try:
        thread_id, payload = _consult_request()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    def events():
        try:
            from consult import get_service
            for item in get_service().stream(thread_id, payload):
                yield f"event: {item['event']}\ndata: {json.dumps(item['data'], ensure_ascii=False)}\n\n"
        except Exception as e:  # noqa: BLE001
            print(f"Consult stream error: {type(e).__name__}: {e}")
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps({'error': 'Consultation failed'})}\n\n"

    return Response(
        stream_with_context(events()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@app.route("/api/consult/reviews", methods=["GET"])
def consult_reviews():
    """Assessments waiting for a clinician (only used when REVIEW_MODE is on)."""
    try:
        from consult import get_service
        service = get_service()
        return jsonify({"review_mode": config.REVIEW_MODE, "pending": service.reviews.list()})
    except Exception as e:
        print(f"Review list error: {type(e).__name__}: {e}")
        return jsonify({"error": "Could not load the review queue"}), 500


@app.route("/api/consult/review/<thread_id>", methods=["POST"])
def consult_review(thread_id):
    """
    A clinician's decision on a paused assessment.
    Body: {"action": "approve" | "edit" | "reject", "text": "...", "reviewer": "..."}
    Returns the final consultation result, in the same shape as /api/consult.
    """
    body = request.get_json(silent=True) or {}
    try:
        from consult import get_service
        return jsonify(get_service().resume(
            thread_id, str(body.get("action") or ""), str(body.get("text") or ""), str(body.get("reviewer") or "")
        ))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except KeyError:
        return jsonify({"error": "No review is pending for this consultation"}), 404
    except Exception as e:
        print(f"Review error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Review failed"}), 500


@app.route("/api/report/analyze", methods=["POST"])
def report_analyze():
    """
    Lab-report agent: extract values → check ranges → explain → verify.
    Body: {"text": "<OCR text>", "image_b64": "...", "image_mime": "image/jpeg"}
    """
    body = request.get_json(silent=True) or {}
    try:
        from consult import get_service
        from report import ReportUnavailable, analyze_report
        try:
            return jsonify(analyze_report(
                get_service().deps.llm, str(body.get("text") or ""), body.get("image_b64") or None, body.get("image_mime") or None,
            ))
        except ReportUnavailable:
            return jsonify({"error": "REPORT_ANALYSIS_UNAVAILABLE",
                            "message": "The report could not be analysed right now. Please try again shortly."}), 503
    except Exception as e:
        print(f"Report analysis error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Report analysis failed"}), 500


@app.route("/api/consult/thread/<thread_id>", methods=["DELETE"])
def consult_delete(thread_id):
    """Deletes the saved state of one consultation."""
    try:
        from consult import get_service
        get_service().delete_thread(thread_id)
        return jsonify({"deleted": True})
    except Exception as e:
        print(f"Consult delete error: {type(e).__name__}: {e}")
        return jsonify({"deleted": False, "error": "Could not delete consultation state"}), 500


# ═══════════════════════════════════════════════════
# SECTION 3: STATUS + COMPATIBILITY ENDPOINTS
# ═══════════════════════════════════════════════════

def _vector_db_status() -> dict:
    try:
        from retrieval import store
        return {
            "vector_db": "connected",
            "mode": "embedded" if store.is_embedded() else "server",
            "collection": store.collection_name(),
            "indexed_chunks": store.chunk_count(),
        }
    except Exception as e:  # noqa: BLE001
        return {"vector_db": "unavailable", "error": type(e).__name__, "indexed_chunks": 0}


@app.route("/api/intelligence/status", methods=["GET"])
def intelligence_status():
    """Status of the consultation stack, for the frontend dashboard."""
    vector = _vector_db_status()
    status = {
        "service": "running",
        "agents": {
            "emergency_screen": "active",
            "guardrail": "active",
            "triage_classifier": "active",
            "knowledge_retriever": "active" if vector["vector_db"] == "connected" else "unavailable",
            "safety_oversight": "active",
        },
        "vector_db": {
            "status": vector["vector_db"],
            "total_chunks": vector["indexed_chunks"],
            "collection": vector.get("collection", ""),
            "mode": vector.get("mode", ""),
        },
        "retrieval": {
            "embedding_model": config.EMBEDDING_MODEL,
            "hybrid": True,
            "reranker": config.RERANK_MODEL if config.RERANK_ENABLED else None,
        },
    }
    try:
        from consult import get_service
        status["consult"] = get_service().status()
    except Exception as e:  # noqa: BLE001
        status["consult"] = {"error": type(e).__name__}
    return jsonify(status)


@app.route("/api/intelligence/query", methods=["POST"])
def intelligence_query():
    """
    Retrieval only: guardrail → triage → hybrid search. Kept for callers that
    want protocol context without running a consultation.
    """
    try:
        data = request.get_json(silent=True) or {}
        query = data.get("query", "")
        specialization = data.get("specialization", "General Medicine")
        if not query:
            return jsonify({"error": "Query is required"}), 400

        from agents.guardrail_agent import scan_query
        from agents.triage_classifier import classify_query
        from retrieval import extract_citations, format_context, grade_context, retrieve

        guardrail_result = scan_query(query)
        if guardrail_result["is_blocked"]:
            return jsonify({
                "status": "blocked",
                "reason": "SAFETY_GUARDRAIL_TRIGGERED",
                "details": guardrail_result["reason"],
                "context": "",
                "citations": [],
                "classification": {"category": "security_violation", "urgency": "blocked"},
                "chunk_count": 0,
                "has_context": False
            }), 403

        classification = classify_query(query, specialization)
        results = retrieve(query, top_k=int(data.get("n_results", config.RETRIEVE_TOP_K)))
        if grade_context(results) == "none":
            results = []

        return jsonify({
            "context": format_context(results),
            "citations": extract_citations(results),
            "classification": classification,
            "chunk_count": len(results),
            "has_context": len(results) > 0
        })
    except Exception as e:
        print(f"Intelligence Query Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Retrieval failed", "context": "", "citations": [], "chunk_count": 0, "has_context": False}), 500


@app.route("/api/intelligence/verify", methods=["POST"])
def intelligence_verify():
    """
    Rule-based safety check for a piece of generated text.
    If the check itself fails, the text is NOT approved.
    """
    data = request.get_json(silent=True) or {}
    ai_response = data.get("ai_response", "")
    if not ai_response:
        return jsonify({"error": "ai_response is required"}), 400
    try:
        from agents.safety_oversight import verify_response
        from consult.service import _load_feedback_examples

        result = verify_response(
            ai_response=ai_response,
            retrieved_context=data.get("retrieved_context", ""),
            user_query=data.get("user_query", ""),
            urgency=data.get("urgency", "routine"),
            feedback_examples=_load_feedback_examples(),
        )
        return jsonify(result)
    except Exception as e:
        print(f"Safety Verification Error: {str(e)}")
        traceback.print_exc()
        from consult.nodes import UNAVAILABLE_REPLY
        return jsonify({
            "is_safe": False,
            "modified_response": UNAVAILABLE_REPLY,
            "warnings_added": [],
            "violations_found": ["safety check unavailable"],
            "safety_score": 0.0,
        }), 503


# ═══════════════════════════════════════════════════
# Run Server
# ═══════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "═" * 60)
    print("Aether Clinic — ML & Intelligence Service")
    print("═" * 60)
    print("  ML Models: Heart Disease, Diabetes")
    print("  Consultation: LangGraph flow with hybrid Qdrant retrieval")
    print("  Safety: emergency screen, guardrail, fail-closed verification")
    print("═" * 60 + "\n")

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5001")),
        debug=False,
        threaded=True,
    )
