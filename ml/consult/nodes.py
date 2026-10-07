"""
Consult graph nodes.

Every node takes the state and returns only the keys it changes. Nodes get
their collaborators (LLM router, retriever, ...) through `Deps`, so tests can
swap in fakes without patching modules.
"""

from __future__ import annotations

import copy
import json
import time
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt

import config
import config as config_module   # routing functions take a `config` argument of their own
from agents.guardrail_agent import scan_query
from agents.safety_oversight import EMERGENCY_ALERT, check_response
from . import prompts, specialists
from .emergency import detect_emergency, emergency_reply
from .intake import (
    build_memory_entry,
    build_search_plan,
    build_search_query,
    heuristic_analysis,
    is_ready,
    max_urgency,
    merge_intake,
    missing_slots,
    normalize_analysis,
)
from .llm import LLMUnavailable, ToolMessage, to_messages
from .state import FALLBACK_QUESTIONS, PER_TURN_DEFAULTS, ConsultState
from .tools import build_tools, tools_relevant

BLOCKED_REPLY = (
    "I can only help with health questions and symptom guidance, and I can't help with that request. "
    "If you have a health concern, tell me what's bothering you."
)
CLOSED_REPLY = "This consultation is complete. Please start a new session for a fresh assessment."
UNAVAILABLE_REPLY = (
    "I'm not able to put together a reliable answer right now. Please try again in a moment. "
    "If you feel very unwell or your symptoms are getting worse, contact a doctor or your local emergency number."
)
UNSAFE_FALLBACK_REPLY = (
    "I couldn't produce a summary that passes my safety checks, so I won't guess. "
    "Please speak to a doctor about this. If your symptoms are severe or getting worse, "
    "contact your local emergency number."
)
REVIEW_PENDING_REPLY = (
    "Your assessment is ready and is being checked by a clinician before it is released. "
    "It will appear here once it is approved. If your symptoms get worse in the meantime, "
    "contact a doctor or your local emergency number."
)
REVIEW_REJECTED_REPLY = (
    "A clinician has reviewed your case and recommends that you are seen in person rather than "
    "advised over chat. Please book an appointment with a doctor. If your symptoms are severe "
    "or getting worse, contact your local emergency number."
)
GROUNDING_CAUTION = (
    "Note: parts of this answer are general guidance that I could not confirm against my clinical references. "
    "Please check them with a clinician."
)

# Shown in the UI while a node runs.
STEP_LABELS = {
    "screen": "Checking for urgent symptoms",
    "vision": "Looking at your photo",
    "analyze": "Understanding your message",
    "research": "Searching clinical protocols",
    "refine": "Refining the search",
    "review": "Sending for clinician review",
    "risk_tools": "Checking risk calculators",
    "ask": "Preparing a question",
    "assess": "Writing your assessment",
    "verify": "Running safety checks",
}


@dataclass
class Deps:
    llm: Any
    retrieve: Callable[[str], list]
    grade: Callable[[list], str]
    format_context: Callable[[list], str]
    extract_citations: Callable[[list], list]
    feedback_examples: Callable[[], list] = field(default=lambda: [])


def _emit(event: dict) -> None:
    """Sends a progress event to the stream, if this run is being streamed."""
    try:
        from langgraph.config import get_stream_writer
        get_stream_writer()(event)
    except Exception:  # noqa: BLE001 - not running inside a streamed graph
        pass


def turn_inputs(config: Optional[RunnableConfig]) -> dict:
    """Per-turn inputs that must not be saved: photo, report summary, recovery transcript."""
    return ((config or {}).get("configurable") or {}).get("turn") or {}


def traced(name: str):
    """Announces the step, times the node and appends to the trace."""
    def decorator(fn):
        def wrapper(state: ConsultState, config: RunnableConfig) -> dict:
            if name in STEP_LABELS:
                _emit({"step": name, "label": STEP_LABELS[name]})
            started = time.perf_counter()
            update = fn(state, turn_inputs(config)) or {}
            entry = {"node": name, "ms": int((time.perf_counter() - started) * 1000)}
            update["trace"] = list(update.get("trace", state.get("trace", []))) + [entry]
            return update
        wrapper.__name__ = name
        return wrapper
    return decorator


_ECHO_BLOCK_RE = re.compile(r"<user_data>.*?</user_data>", re.S | re.I)
_ECHO_TAG_RE = re.compile(r"</?user_data>", re.I)
_SPEAKER_RE = re.compile(r"^\s*(dr\.? ?ai|assistant)\s*:\s*", re.I)


def _strip_prompt_echo(text: str) -> str:
    """Small models sometimes copy prompt scaffolding into the reply; remove it."""
    text = _ECHO_TAG_RE.sub("", _ECHO_BLOCK_RE.sub("", text or ""))
    return re.sub(r"\n{3,}", "\n\n", _SPEAKER_RE.sub("", text)).strip()


ASSESSMENT_SECTIONS = ("summary", "general possibilities", "suggestions", "when to seek urgent care", "next step")


def _looks_like_assessment(text: str) -> bool:
    """A final assessment must have its sections; a stray question does not count."""
    lowered = (text or "").lower()
    return sum(1 for title in ASSESSMENT_SECTIONS if title in lowered) >= 3


def _should_check_grounding(state: ConsultState) -> bool:
    """
    The groundedness judge is a second model call. A small local model is not
    a reliable judge and is slow, so in "auto" mode the check only runs when
    the answer came from a hosted model.
    """
    setting = config.GROUNDING_CHECK
    if setting == "never" or not state.get("context"):
        return False
    if setting == "always":
        return True
    return not any(p == "assess:ollama" for p in state.get("providers", []))


def _user_texts(messages: list) -> list[str]:
    return [m["content"] for m in messages if m["role"] == "user"]


def _llm_kwargs(state: ConsultState) -> dict:
    return {"tier": state.get("tier", "basic"), "user_ram": float(state.get("user_ram", 8) or 8)}


def make_nodes(deps: Deps) -> dict[str, Callable]:

    @traced("prepare")
    def prepare(state: ConsultState, turn: dict) -> dict:
        update: dict = copy.deepcopy(PER_TURN_DEFAULTS)
        messages = list(state.get("messages") or [])
        turn_count = int(state.get("turn_count") or 0)

        # No saved state for this thread (first turn, or state was lost):
        # rebuild the conversation from the transcript the gateway sent.
        if not messages and turn.get("seed_history"):
            messages = [
                {"role": "assistant" if m.get("role") in ("assistant", "ai") else "user", "content": str(m.get("content", ""))[:2000]}
                for m in turn["seed_history"] if isinstance(m, dict) and m.get("content")
            ][-config.HISTORY_WINDOW:]
            turn_count = len(_user_texts(messages))

        update.update({
            "messages": messages,
            "turn_count": turn_count,
            "intake": dict(state.get("intake") or {}),
            "emergency_notified": list(state.get("emergency_notified") or []),
            "urgency": state.get("urgency") or "routine",
            "session_complete": bool(state.get("session_complete")),
            "has_image": bool(turn.get("image_b64")),
            "active_specialist": state.get("active_specialist")
                                 or specialists.category_for(state.get("specialization") or ""),
            "handoffs": list(state.get("handoffs") or []),
        })
        if update["session_complete"]:
            update.update({"mode": "closed", "reply": CLOSED_REPLY})
        return update

    @traced("screen")
    def screen(state: ConsultState, turn: dict) -> dict:
        text = state.get("user_message") or ""
        if not text:
            return {}

        # Self-harm always gets the crisis reply; other kinds are announced once.
        already = {k for k in state.get("emergency_notified", []) if k != "self_harm"}
        found = detect_emergency(text, skip_kinds=already)
        if found["is_emergency"]:
            return {
                "mode": "emergency",
                "triage": {"category": "emergency", "urgency": "emergency", "is_emergency": True,
                           "emergency_kind": found["kind"], "routing_hint": f"keyword: {found['match']}"},
            }

        guard = scan_query(text)
        if guard["is_blocked"]:
            return {"mode": "blocked", "guardrail": guard, "reply": BLOCKED_REPLY,
                    "triage": {"category": "security_violation", "urgency": "blocked"}}
        return {"guardrail": guard}

    @traced("vision")
    def vision(state: ConsultState, turn: dict) -> dict:
        try:
            findings, provider = deps.llm.describe_image(
                turn["image_b64"], turn.get("image_mime") or "image/jpeg", prompts.VISION_PROMPT
            )
            return {"image_findings": findings[:1500], "providers": state.get("providers", []) + [f"vision:{provider}"]}
        except Exception as exc:  # noqa: BLE001
            print(f"Vision step failed: {type(exc).__name__}")
            return {"image_findings": "(The photo could not be analysed. Ask the user to describe what it shows.)"}

    @traced("analyze")
    def analyze(state: ConsultState, turn: dict) -> dict:
        message = state.get("user_message") or ""
        has_image = bool(state.get("has_image"))
        history = list(state.get("messages", []))
        intake = dict(state.get("intake", {}))
        turn_count = state.get("turn_count", 0)
        specialization = state.get("specialization") or "General Medicine"
        providers = list(state.get("providers", []))
        has_input = bool(message or has_image)

        fallback = heuristic_analysis(message, _user_texts(history), specialization)
        analysis = fallback
        analyze_provider = "rules"
        if has_input:
            try:
                raw, provider = deps.llm.json(
                    prompts.analyze_messages(specialization, intake, history, message, state.get("image_findings")),
                    max_tokens=400, **_llm_kwargs(state),
                )
                evidence = " ".join(_user_texts(history) + [message, state.get("image_findings") or ""])
                analysis = normalize_analysis(raw, fallback, message, evidence)
                analyze_provider = provider
                providers.append(f"analyze:{provider if analysis['source'] == 'llm' else 'rules'}")
            except LLMUnavailable:
                providers.append("analyze:rules")
            history.append({"role": "user", "content": message or "[uploaded a photo]"})
            turn_count += 1

        intake = merge_intake(intake, analysis["slots"])
        urgency = max_urgency(state.get("urgency", "routine"), analysis["urgency"])
        triage = {
            "category": analysis["category"],
            "urgency": urgency,
            "is_emergency": analysis["urgency"] == "emergency",
            "routing_hint": f"{analysis['source']}: {analysis['intent']}",
        }
        update = {
            "messages": history, "turn_count": turn_count, "intake": intake, "urgency": urgency,
            "triage": triage, "intent": analysis["intent"], "wants_assessment": analysis["wants_assessment"],
            "providers": providers,
        }
        primary = build_search_query(analysis["search_query"], intake, message)
        update["search_query"] = primary
        update["search_queries"] = build_search_plan(analysis["search_queries"], primary)

        # The model may flag an emergency the keyword list missed. It gets the
        # generic notice once, and only if no notice has been given yet.
        if analysis["source"] == "llm" and analysis["urgency"] == "emergency" and not state.get("emergency_notified"):
            triage["emergency_kind"] = "general"
            update["mode"] = "emergency"
            return update

        # Hand the conversation to another specialist when the complaint is theirs.
        active = state.get("active_specialist") or specialists.category_for(specialization)
        handoffs = list(state.get("handoffs") or [])
        if specialists.decide_handoff(active, analysis["category"], analysis["intent"], analysis["source"], handoffs):
            handoffs.append({"from": active, "to": analysis["category"], "turn": turn_count})
            active = analysis["category"]
            update["handoff_note"] = specialists.handoff_note(active)
        update["active_specialist"] = active
        update["handoffs"] = handoffs

        force = bool(state.get("force_final"))
        if analysis["intent"] == "health_question" and not intake.get("chief_complaint") and not force:
            update["mode"] = "answer"
        elif is_ready(intake, turn_count, analysis["wants_assessment"], analysis["nothing_more"], force):
            update["mode"] = "assessment"
        else:
            update["mode"] = "ask"
            missing = missing_slots(intake)
            update["next_slot"] = missing[0] if missing else None
            # A small local model writes poor questions inside JSON, so its
            # draft is not used; the ask step makes a dedicated call instead.
            update["suggested_question"] = "" if analyze_provider == "ollama" else analysis["question"]
        return update

    @traced("emergency")
    def emergency(state: ConsultState, turn: dict) -> dict:
        kind = state.get("triage", {}).get("emergency_kind") or "general"
        history = list(state.get("messages", []))
        update: dict = {"reply": emergency_reply(kind), "urgency": "emergency",
                        "emergency_notified": sorted(set(state.get("emergency_notified", [])) | {kind})}
        # When the keyword screen fired, the user's message has not been recorded yet.
        message = state.get("user_message") or ""
        if message and not (history and history[-1] == {"role": "user", "content": message}):
            history.append({"role": "user", "content": message})
            update["turn_count"] = state.get("turn_count", 0) + 1
        update["messages"] = history
        update["mode"] = "emergency"
        return update

    @traced("research")
    def research(state: ConsultState, turn: dict) -> dict:
        """
        Runs every planned search, keeps what is relevant and notes what found
        nothing. Results from an earlier round are kept and merged.
        """
        round_no = state.get("research_round", 0) + 1
        queries = [q for q in (state.get("search_queries") or [state.get("search_query") or ""]) if q]
        log = list(state.get("research_log", []))
        merged: dict[str, dict] = {d["id"]: d for d in state.get("documents", []) if d.get("id")}
        leaders: list[str] = []   # the best chunk of each successful search
        gaps: list[str] = []

        for query in queries:
            try:
                found = deps.retrieve(query)
                grade = deps.grade(found)
            except Exception as exc:  # noqa: BLE001 - answer without references rather than fail the turn
                print(f"Retrieval failed: {type(exc).__name__}: {exc}")
                found, grade = [], "none"
            log.append({"query": query, "grade": grade, "round": round_no,
                        "titles": sorted({d["title"] for d in found}) if grade != "none" else []})
            if grade == "none":
                gaps.append(query)
                continue
            leaders.append(found[0].get("id") or found[0]["title"])
            for doc in found:
                key = doc.get("id") or f"{doc['title']}|{doc.get('chunk_index', 0)}"
                if key not in merged or doc.get("relevance_score", 0) > merged[key].get("relevance_score", 0):
                    merged[key] = {**doc, "id": key}

        # Every topic keeps its best chunk; the rest of the space goes to the highest scores.
        ranked = sorted(merged.values(), key=lambda d: d.get("relevance_score", 0), reverse=True)
        first = [d for d in ranked if d["id"] in leaders]
        documents = (first + [d for d in ranked if d["id"] not in leaders])[: config.RESEARCH_MAX_CHUNKS]
        documents.sort(key=lambda d: d.get("relevance_score", 0), reverse=True)

        base = {"research_round": round_no, "research_log": log, "research_gaps": gaps}
        if not documents:
            return {**base, "documents": [], "context": "", "citations": [], "context_grade": "none"}
        return {
            **base,
            "documents": documents,
            "context": deps.format_context(documents),
            "citations": deps.extract_citations(documents),
            "context_grade": deps.grade(documents),
        }

    @traced("refine")
    def refine(state: ConsultState, turn: dict) -> dict:
        """Rewrites the searches that found nothing, knowing what was found."""
        found_titles = sorted({d["title"] for d in state.get("documents", [])})
        try:
            raw, provider = deps.llm.json(
                prompts.refine_messages(state.get("research_gaps", []), found_titles),
                max_tokens=200, **_llm_kwargs(state),
            )
        except Exception as exc:  # noqa: BLE001 - refinement is optional
            print(f"Search refinement skipped: {type(exc).__name__}")
            return {"search_queries": [], "research_gaps": []}
        tried = {entry["query"].lower() for entry in state.get("research_log", [])}
        queries = []
        for item in (raw or {}).get("queries", []) if isinstance(raw, dict) else []:
            text = str(item).strip()[:120]
            if text and text.lower() not in tried:
                tried.add(text.lower())
                queries.append(text)
        return {"search_queries": queries[: config.MAX_SEARCH_QUERIES], "research_gaps": [],
                "providers": state.get("providers", []) + [f"refine:{provider}"]}

    @traced("risk_tools")
    def risk_tools(state: ConsultState, turn: dict) -> dict:
        user_text = "\n".join(_user_texts(state.get("messages", [])))
        if turn.get("report_summary"):
            user_text += "\n" + turn["report_summary"]
        tools = build_tools(user_text)
        try:
            reply, provider = deps.llm.invoke(
                prompts.tool_messages(state.get("intake", {}), user_text),
                tools=list(tools.values()), temperature=0.0, max_tokens=400, **_llm_kwargs(state),
            )
        except Exception as exc:  # noqa: BLE001 - tools are optional
            print(f"Risk tool step skipped: {type(exc).__name__}")
            return {}
        results = []
        for call in (getattr(reply, "tool_calls", None) or [])[:2]:
            tool = tools.get(call.get("name"))
            if tool is None:
                continue
            try:
                result = tool.invoke(call.get("args") or {})
            except Exception as exc:  # noqa: BLE001 - malformed arguments
                result = {"status": "error", "reason": f"invalid arguments ({type(exc).__name__})"}
            results.append({"tool": call["name"], **result})
        return {"tool_results": results, "providers": state.get("providers", []) + [f"tools:{provider}"]}

    @traced("ask")
    def ask(state: ConsultState, turn: dict) -> dict:
        intake = state.get("intake", {})
        missing = missing_slots(intake)
        slot = state.get("next_slot") or (missing[0] if missing else "associated_symptoms")
        providers = list(state.get("providers", []))

        # The analyze step usually drafts the question already, which saves a
        # model call. A separate call is made for photos and for rejected drafts.
        suggested = state.get("suggested_question") or ""
        if suggested and not state.get("retry_feedback") and not state.get("has_image"):
            return {"draft": suggested, "providers": providers + ["ask:analyze"]}

        try:
            draft, provider = deps.llm.text(
                prompts.ask_messages(
                    state.get("specialization") or "General Medicine", intake, missing, state.get("messages", []),
                    state.get("intent", "symptom_report"), state.get("image_findings"),
                    bool(state.get("has_image")), state.get("retry_feedback", ""),
                    state.get("active_specialist") or "general_medicine", turn.get("patient_memory"),
                ),
                temperature=0.4, max_tokens=220, **_llm_kwargs(state),
            )
            providers.append(f"ask:{provider}")
        except LLMUnavailable:
            draft = FALLBACK_QUESTIONS[slot]
            providers.append("ask:fallback")
        return {"draft": draft or FALLBACK_QUESTIONS[slot], "providers": providers}

    @traced("assess")
    def assess(state: ConsultState, turn: dict) -> dict:
        providers = list(state.get("providers", []))
        try:
            draft, provider = deps.llm.text(
                prompts.assess_messages(
                    state.get("specialization") or "General Medicine", state.get("mode", "assessment"),
                    state.get("intake", {}), state.get("messages", []), state.get("context", ""),
                    state.get("context_grade", "none"), state.get("urgency", "routine"),
                    state.get("image_findings"), turn.get("report_summary"),
                    state.get("tool_results", []), state.get("retry_feedback", ""),
                    state.get("active_specialist") or "general_medicine", turn.get("patient_memory"),
                ),
                temperature=0.3, max_tokens=650, **_llm_kwargs(state),
            )
            providers.append(f"assess:{provider}")
        except LLMUnavailable:
            return {"mode": "unavailable", "reply": UNAVAILABLE_REPLY, "providers": providers + ["assess:unavailable"]}
        if not draft:
            return {"mode": "unavailable", "reply": UNAVAILABLE_REPLY, "providers": providers}
        return {"draft": draft, "providers": providers}

    @traced("verify")
    def verify(state: ConsultState, turn: dict) -> dict:
        mode = state.get("mode", "ask")
        draft = _strip_prompt_echo(state.get("draft", ""))
        attempts = state.get("attempts", 0)
        user_text = " ".join(_user_texts(state.get("messages", []))[-6:])
        providers = list(state.get("providers", []))

        # 1. Rule checks. If these cannot run, nothing is shown (fail closed).
        try:
            checked = check_response(
                ai_response=draft, user_query=user_text, urgency=state.get("urgency", "routine"),
                feedback_examples=deps.feedback_examples(),
            )
        except Exception as exc:  # noqa: BLE001
            print(f"Safety check failed to run: {type(exc).__name__}: {exc}")
            return {"mode": "unavailable", "reply": UNAVAILABLE_REPLY,
                    "safety": {"is_safe": False, "score": 0.0, "violations": ["safety check unavailable"], "warnings": [], "grounded": None}}

        violations = checked["violations"]
        if violations:
            if attempts < 1:
                return {"attempts": attempts + 1,
                        "retry_feedback": "it broke a safety rule (no diagnoses, no prescription doses, no personal data).",
                        "safety": {"retry": True}}
            safety = {"is_safe": False, "score": 0.0, "violations": violations, "warnings": [], "grounded": None}
            if mode == "ask":
                # A plain scripted question is always safe to send.
                slot = state.get("next_slot") or "associated_symptoms"
                return {"draft": FALLBACK_QUESTIONS[slot], "safety": {**safety, "replaced_with": "scripted_question"}, "retry_feedback": ""}
            return {"mode": "unavailable", "reply": UNSAFE_FALLBACK_REPLY, "safety": safety}

        text = checked["cleaned"]

        # 1b. A final assessment closes the consultation, so it has to be one.
        # If the model wrote something else twice, the text is still safe to
        # show, but the turn is treated as a normal reply and the session stays open.
        if mode == "assessment" and not _looks_like_assessment(text):
            if attempts < 1:
                return {"attempts": attempts + 1, "safety": {"retry": True},
                        "retry_feedback": "it was not a final assessment. Use the five section titles exactly "
                                          "(Summary, General Possibilities, Suggestions, When to Seek Urgent Care, Next Step) "
                                          "and do not ask a question."}
            mode = "ask"

        warnings = list(checked["warnings"]) if mode in ("assessment", "answer") else []

        # 2. Groundedness: are the specific clinical claims backed by the protocols?
        grounded: Optional[bool] = None
        if mode in ("assessment", "answer") and _should_check_grounding(state):
            try:
                verdict, provider = deps.llm.json(
                    prompts.grounding_messages(state["context"], text, state.get("tool_results")), max_tokens=300, **_llm_kwargs(state)
                )
                providers.append(f"grounding:{provider}")
                if isinstance(verdict, dict) and isinstance(verdict.get("grounded"), bool):
                    unsupported = [str(u)[:160] for u in (verdict.get("unsupported") or []) if u][:5]
                    grounded = verdict["grounded"] or not unsupported
                    if not grounded and attempts < 1:
                        return {"attempts": attempts + 1, "providers": providers, "safety": {"retry": True},
                                "retry_feedback": "these statements are not supported by the clinical reference: "
                                                  + "; ".join(unsupported) + ". Remove them or stay general."}
            except Exception as exc:  # noqa: BLE001 - the judge is advisory; rule checks already passed
                print(f"Grounding check skipped: {type(exc).__name__}")
        if grounded is False:
            warnings.append(GROUNDING_CAUTION)

        score = max(0.0, 1.0 - 0.05 * len(warnings) - (0.2 if grounded is False else 0.0))
        return {
            "mode": mode, "draft": text, "providers": providers, "retry_feedback": "",
            "safety": {"is_safe": True, "score": round(score, 2), "violations": [], "warnings": warnings, "grounded": grounded},
        }

    @traced("review")
    def review(state: ConsultState, turn: dict) -> dict:
        """
        Pauses the run until a clinician approves, edits or rejects the draft.
        The graph state is checkpointed here; `ConsultService.resume` continues it.
        """
        decision = interrupt({
            "draft": state.get("draft", ""),
            "intake": state.get("intake", {}),
            "urgency": state.get("urgency", "routine"),
            "specialist": specialists.profile(state.get("active_specialist") or "")["name"],
            "citations": [{"index": c.get("index"), "title": c["title"]} for c in state.get("citations", [])],
            "safety": {k: state.get("safety", {}).get(k) for k in ("warnings", "grounded", "score")},
            "tool_results": state.get("tool_results", []),
        })
        decision = decision if isinstance(decision, dict) else {}
        action = decision.get("action")
        record = {"action": action, "reviewer": str(decision.get("reviewer") or "clinician")[:80]}
        if action == "approve":
            return {"review_decision": record}
        if action == "edit" and str(decision.get("text") or "").strip():
            # The clinician's wording replaces the draft and is not re-checked by the model rules.
            safety = {**state.get("safety", {}), "warnings": [], "grounded": None}
            return {"draft": str(decision["text"]).strip(), "review_decision": record, "safety": safety}
        return {"mode": "unavailable", "reply": REVIEW_REJECTED_REPLY, "review_decision": {**record, "action": "reject"}}

    @traced("finalize")
    def finalize(state: ConsultState, turn: dict) -> dict:
        mode = state.get("mode", "ask")
        history = list(state.get("messages", []))
        safety = dict(state.get("safety") or {})

        if mode in ("ask", "assessment", "answer"):
            warnings = safety.get("warnings", [])
            # An emergency alert leads; other safety notes follow the answer.
            lead = [w for w in warnings if w == EMERGENCY_ALERT]
            rest = [w for w in warnings if w != EMERGENCY_ALERT]
            reply = "\n\n".join(lead + [state.get("draft", "")] + rest).strip()
        else:
            reply = state.get("reply", "") or UNAVAILABLE_REPLY

        if mode not in ("blocked", "closed"):
            history.append({"role": "assistant", "content": reply})
        safety.setdefault("is_safe", mode not in ("unavailable",))
        safety.setdefault("score", 1.0 if safety["is_safe"] else 0.0)
        safety.setdefault("violations", [])
        safety.setdefault("warnings", [])

        # List only the protocols the answer actually cites. If it cites none
        # explicitly, keep them only when they were a strong match (they were
        # then the basis for the answer); loosely related ones are not shown.
        citations = state.get("citations", []) if mode in ("assessment", "answer") else []
        cited = {int(num) for num in re.findall(r"\[(\d{1,2})\]", reply)}
        if cited & {c.get("index") for c in citations}:
            citations = [c for c in citations if c.get("index") in cited]
        elif state.get("context_grade") != "strong":
            citations = []

        complete = bool(state.get("session_complete")) or mode == "assessment"
        memory_entry = None
        if mode == "assessment":
            memory_entry = build_memory_entry(
                state.get("intake", {}), specialists.profile(state.get("active_specialist") or "")["name"],
                state.get("urgency", "routine"), time.strftime("%Y-%m-%d"),
            )

        return {
            "reply": reply,
            "messages": history[-config.HISTORY_WINDOW:],
            "session_complete": complete,
            "memory_entry": memory_entry,
            "citations": citations,
            "safety": safety,
            # Per-turn working text is not needed once the reply is final.
            "documents": [], "context": "", "draft": "", "user_message": "", "force_final": False,
        }

    return {
        "prepare": prepare, "screen": screen, "vision": vision, "analyze": analyze, "emergency": emergency,
        "research": research, "refine": refine, "risk_tools": risk_tools, "ask": ask, "assess": assess,
        "verify": verify, "review": review, "finalize": finalize,
    }


# ── routing ──────────────────────────────────────────────────────────────

def route_after_prepare(state: ConsultState) -> str:
    return "finalize" if state.get("mode") == "closed" else "screen"


def route_after_screen(state: ConsultState) -> str:
    mode = state.get("mode")
    if mode == "emergency":
        return "emergency"
    if mode == "blocked":
        return "finalize"
    return "vision" if state.get("has_image") else "analyze"


def route_after_analyze(state: ConsultState) -> str:
    mode = state.get("mode")
    if mode == "emergency":
        return "emergency"
    return "ask" if mode == "ask" else "research"


def route_after_research(state: ConsultState, config: RunnableConfig) -> str:
    # A search that found nothing gets one more try with different wording.
    if state.get("research_gaps") and state.get("research_round", 0) < config_module.RESEARCH_MAX_ROUNDS:
        return "refine"
    return _after_research(state, config)


def route_after_refine(state: ConsultState, config: RunnableConfig) -> str:
    return "research" if state.get("search_queries") else _after_research(state, config)


def _after_research(state: ConsultState, config: RunnableConfig) -> str:
    user_text = "\n".join(m["content"] for m in state.get("messages", []) if m["role"] == "user")
    category = state.get("triage", {}).get("category", "")
    report = turn_inputs(config).get("report_summary") or ""
    if state.get("mode") == "assessment" and tools_relevant(category, user_text + "\n" + report):
        return "risk_tools"
    return "assess"


def route_after_assess(state: ConsultState) -> str:
    return "finalize" if state.get("mode") == "unavailable" else "verify"


def needs_review(state: ConsultState) -> bool:
    """Whether a clinician has to release this assessment (see REVIEW_MODE)."""
    setting = config_module.REVIEW_MODE
    if setting not in ("urgent", "all") or state.get("mode") != "assessment":
        return False
    if setting == "all":
        return True
    safety = state.get("safety", {})
    return state.get("urgency", "routine") != "routine" or safety.get("grounded") is False


def route_after_verify(state: ConsultState) -> str:
    if state.get("safety", {}).get("retry"):
        return "ask" if state.get("mode") == "ask" else "assess"
    return "review" if needs_review(state) else "finalize"
