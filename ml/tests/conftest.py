"""Shared test helpers: import path, a scripted fake LLM and a fake retriever."""

import os
import sys

ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

import pytest
from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import MemorySaver

from consult import nodes
from consult.llm import LLMUnavailable
from consult.service import ConsultService

PROTOCOL = {
    "id": "c1", "title": "Low Back Pain - Assessment and Self-Care", "source": "NICE Guidelines",
    "category": "Orthopedics", "content": "Most low back pain improves within 6 weeks. Stay active.",
    "chunk_index": 0, "relevance_score": 0.62,
}


ASSESSMENT = (
    "Summary\n- You reported lower back pain.\n"
    "General Possibilities\n- A muscle strain is common.\n"
    "Suggestions\n- Stay gently active.\n"
    "When to Seek Urgent Care\n- Numbness or loss of bladder control.\n"
    "Next Step\n- See a GP if it persists. (Source: [1])"
)


def assessment(summary_line: str) -> str:
    """A well-formed assessment with a custom first bullet."""
    return ASSESSMENT.replace("- You reported lower back pain.", summary_line)


class FakeLLM:
    """
    Answers by prompt type. Override any attribute in a test:
      analysis        dict returned for the analyze step (or a list, one per turn)
      question        text for the ask step
      assessments     list of drafts for the assess step, used in order
      grounding       list of verdict dicts, used in order
      tool_calls      list of {"name", "args"} for the tools step
      refined         {"queries": [...]} returned when a search found nothing
      down            True → every call raises LLMUnavailable
    """

    def __init__(self):
        self.analysis = {"intent": "symptom_report", "category": "orthopedics", "urgency": "routine",
                         "chief_complaint": "lower back pain", "search_query": "lower back pain"}
        self.question = "How long has this been going on?"
        self.assessments = [ASSESSMENT]
        self.grounding = [{"grounded": True, "unsupported": []}]
        self.tool_calls = []
        self.refined = {"queries": []}      # reply of the search-refinement step
        self.vision_text = "- Red, slightly raised patch on the forearm"
        self.down = False
        self.calls = []

    def _next(self, items):
        return items.pop(0) if len(items) > 1 else items[0]

    def json(self, messages, **kwargs):
        if self.down:
            raise LLMUnavailable("down")
        system = messages[0]["content"]
        if system.startswith("You read a chat"):
            self.calls.append("analyze")
            value = self._next(self.analysis) if isinstance(self.analysis, list) else self.analysis
            return (dict(value) if isinstance(value, dict) else value), "fake"
        if system.startswith("You help search"):
            self.calls.append("refine")
            self.last_refine_prompt = messages[-1]["content"]
            return dict(self.refined), "fake"
        self.calls.append("grounding")
        return self._next(self.grounding), "fake"

    def text(self, messages, **kwargs):
        if self.down:
            raise LLMUnavailable("down")
        system = messages[0]["content"]
        task = messages[-1]["content"]
        if "MODE: FINAL ASSESSMENT" in task or "MODE: HEALTH INFORMATION" in task:
            self.calls.append("assess")
            self.last_assess_prompt = system + "\n" + task
            return self._next(self.assessments), "fake"
        self.calls.append("ask")
        self.last_ask_prompt = system
        return self._next(self.question) if isinstance(self.question, list) else self.question, "fake"

    def invoke(self, messages, tools=None, **kwargs):
        if self.down:
            raise LLMUnavailable("down")
        self.calls.append("tools")
        calls = [{"name": c["name"], "args": c["args"], "id": f"call_{i}", "type": "tool_call"} for i, c in enumerate(self.tool_calls)]
        return AIMessage(content="", tool_calls=calls), "fake"

    def describe_image(self, image_b64, mime, prompt):
        if self.down:
            raise LLMUnavailable("down")
        self.calls.append("vision")
        return self.vision_text, "fake"

    def status(self):
        return {"fake": True}


class FakeRetriever:
    def __init__(self):
        self.documents = [dict(PROTOCOL)]
        self.grade = "strong"
        self.queries = []
        self.by_query = None        # optional {query: [documents]}; other queries find nothing

    def retrieve(self, query):
        self.queries.append(query)
        if self.by_query is not None:
            return [dict(d) for d in self.by_query.get(query, [])]
        return [dict(d) for d in self.documents]


def make_service(llm=None, retriever=None, feedback=None):
    import config
    config.GROUNDING_CHECK = "always"   # the fake LLM is not "ollama", but be explicit
    from retrieval.retriever import extract_citations, format_context

    llm = llm or FakeLLM()
    retriever = retriever or FakeRetriever()
    deps = nodes.Deps(
        llm=llm,
        retrieve=retriever.retrieve,
        grade=lambda docs: retriever.grade if docs else "none",
        format_context=format_context,
        extract_citations=extract_citations,
        feedback_examples=lambda: feedback or [],
    )
    return ConsultService(deps=deps, checkpointer=MemorySaver(), checkpointer_info="memory (test)")


@pytest.fixture
def llm():
    return FakeLLM()


@pytest.fixture
def retriever():
    return FakeRetriever()


@pytest.fixture
def service(llm, retriever):
    return make_service(llm, retriever)
