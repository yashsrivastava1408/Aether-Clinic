"""
Entry points used by the HTTP layer: run one consult turn, stream one, or
delete a conversation's saved state.
"""

from __future__ import annotations

import json
import threading
import time
from typing import Iterator, Optional

import config
from . import nodes as n
from . import specialists
from langgraph.types import Command

from .checkpoint import ReviewQueue, build_checkpointer
from .graph import build_graph
from .llm import LLMRouter

_lock = threading.Lock()
_service: Optional["ConsultService"] = None


def _load_feedback_examples() -> list:
    """The five most recent thumbs-down replies (shared volume with the backend)."""
    for path in config.FEEDBACK_PATHS:
        try:
            if path.exists():
                logs = json.loads(path.read_text() or "[]")
                return [log for log in logs if log.get("feedback") == "down"][-5:]
        except Exception:  # noqa: BLE001
            continue
    return []


def default_deps(llm=None) -> n.Deps:
    from retrieval import extract_citations, format_context, grade_context, retrieve
    return n.Deps(
        llm=llm or LLMRouter(),
        retrieve=retrieve,
        grade=grade_context,
        format_context=format_context,
        extract_citations=extract_citations,
        feedback_examples=_load_feedback_examples,
    )


class ConsultService:
    def __init__(self, deps: Optional[n.Deps] = None, checkpointer=None, checkpointer_info: str = "custom"):
        self.deps = deps or default_deps()
        if checkpointer is None:
            checkpointer, checkpointer_info = build_checkpointer()
        self.checkpointer = checkpointer
        self.checkpointer_info = checkpointer_info
        self.graph = build_graph(self.deps, checkpointer)
        self._recent: dict[str, bool] = {}   # insertion-ordered: least recently used first
        self.reviews = ReviewQueue(checkpointer)

    @staticmethod
    def _inputs(payload: dict) -> dict:
        return {
            "user_message": (payload.get("message") or "").strip(),
            "specialization": payload.get("specialization") or "General Medicine",
            "tier": "premium" if payload.get("tier") == "premium" else "basic",
            "user_ram": float(payload.get("user_ram") or 8),
            "force_final": bool(payload.get("force_final")),
        }

    @staticmethod
    def _config(thread_id: str, payload: dict) -> dict:
        # "turn" holds inputs that are used for this run only and never saved.
        history = payload.get("history")
        turn = {
            "image_b64": payload.get("image_b64") or None,
            "image_mime": payload.get("image_mime") or None,
            "seed_history": history if isinstance(history, list) else [],
            "report_summary": (payload.get("report_summary") or "")[:3000] or None,
            "patient_memory": (payload.get("patient_memory") or "")[:2000] or None,
        }
        return {"configurable": {"thread_id": thread_id, "turn": turn}, "recursion_limit": 30}

    @staticmethod
    def _response(state: dict) -> dict:
        mode = state.get("mode", "")
        safety = state.get("safety", {})
        return {
            "reply": state.get("reply", ""),
            "mode": mode,
            "session_complete": bool(state.get("session_complete")),
            "citations": state.get("citations", []),
            "classification": state.get("triage", {}),
            "safety": {
                "is_safe": safety.get("is_safe", True),
                "score": safety.get("score", 1.0),
                "warnings": safety.get("warnings", []),
                "violations": len(safety.get("violations", [])),
                "grounded": safety.get("grounded"),
            },
            "intake": state.get("intake", {}),
            "turn_count": state.get("turn_count", 0),
            "context_grade": state.get("context_grade", "none"),
            "tool_results": state.get("tool_results", []),
            "providers": state.get("providers", []),
            "trace": state.get("trace", []),
            "specialist": {
                "category": state.get("active_specialist") or "general_medicine",
                "name": specialists.profile(state.get("active_specialist") or "")["name"],
            },
            # Set only on the turn the conversation changed hands.
            "handoff_note": state.get("handoff_note", ""),
            "research": state.get("research_log", []),
            # Set only when a consultation has just finished.
            "memory_entry": state.get("memory_entry"),
            "review": state.get("review_decision", {}),
            "pending_review": False,
        }

    def _pending_response(self, state: dict) -> dict:
        """What the user sees while a clinician has the draft."""
        response = self._response(state)
        response.update({
            "reply": n.REVIEW_PENDING_REPLY, "mode": "pending_review", "pending_review": True,
            "session_complete": False, "citations": [], "memory_entry": None,
        })
        return response

    def _finish(self, thread_id: str, state: dict) -> dict:
        """After a run: is the graph paused at the review step, or done?"""
        if config.REVIEW_MODE in ("urgent", "all"):
            snapshot = self.graph.get_state({"configurable": {"thread_id": thread_id}})
            if snapshot.next:
                payload = next((i.value for task in snapshot.tasks for i in task.interrupts), {})
                self.reviews.add(thread_id, dict(payload), time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
                self._after_turn(thread_id)
                return self._pending_response(snapshot.values)
        self._after_turn(thread_id)
        return self._response(state)

    def _after_turn(self, thread_id: str) -> None:
        """Keeps stored state small: one checkpoint per conversation."""
        try:
            if hasattr(self.checkpointer, "prune"):
                self.checkpointer.prune(thread_id)
            else:
                # In-memory mode: cap the number of conversations held.
                with _lock:
                    self._recent.pop(thread_id, None)
                    self._recent[thread_id] = True
                    while len(self._recent) > config.MEMORY_MAX_THREADS:
                        oldest = next(iter(self._recent))
                        del self._recent[oldest]
                        self.checkpointer.delete_thread(oldest)
        except Exception as exc:  # noqa: BLE001 - housekeeping must not fail a turn
            print(f"⚠️ Checkpoint housekeeping failed: {type(exc).__name__}")

    def run(self, thread_id: str, payload: dict) -> dict:
        if self.reviews.has(thread_id):
            # A draft is with a clinician; nothing new runs until they decide.
            return self._pending_response(self.graph.get_state({"configurable": {"thread_id": thread_id}}).values)
        state = self.graph.invoke(self._inputs(payload), self._config(thread_id, payload))
        return self._finish(thread_id, state)

    def resume(self, thread_id: str, action: str, text: str = "", reviewer: str = "") -> dict:
        """Continues a paused consultation with the clinician's decision."""
        if action not in ("approve", "edit", "reject"):
            raise ValueError("action must be approve, edit or reject")
        if action == "edit" and not (text or "").strip():
            raise ValueError("text is required for edit")
        if not self.reviews.has(thread_id):
            raise KeyError(thread_id)
        decision = {"action": action, "text": text, "reviewer": reviewer}
        state = self.graph.invoke(Command(resume=decision), self._config(thread_id, {}))
        self.reviews.remove(thread_id)
        self._after_turn(thread_id)
        return self._response(state)

    def stream(self, thread_id: str, payload: dict) -> Iterator[dict]:
        """Yields {"event": "step", ...} while nodes run, then {"event": "final", ...}."""
        if self.reviews.has(thread_id):
            yield {"event": "final", "data": self.run(thread_id, payload)}
            return
        cfg = self._config(thread_id, payload)
        last: dict = {}
        for mode, chunk in self.graph.stream(self._inputs(payload), cfg, stream_mode=["custom", "values"]):
            if mode == "custom" and isinstance(chunk, dict) and "step" in chunk:
                yield {"event": "step", "data": chunk}
            elif mode == "values":
                last = chunk
        yield {"event": "final", "data": self._finish(thread_id, last)}

    def delete_thread(self, thread_id: str) -> None:
        self.checkpointer.delete_thread(thread_id)
        self.reviews.remove(thread_id)
        with _lock:
            self._recent.pop(thread_id, None)

    def status(self) -> dict:
        return {"checkpointer": self.checkpointer_info, "review_mode": config.REVIEW_MODE,
                "pending_reviews": len(self.reviews.list()), "llm": self.deps.llm.status() if hasattr(self.deps.llm, "status") else {}}


def get_service() -> ConsultService:
    global _service
    if _service is None:
        with _lock:
            if _service is None:
                _service = ConsultService()
    return _service
