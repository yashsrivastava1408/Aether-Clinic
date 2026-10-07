"""Research loop, specialist hand-off, clinician review and patient memory."""

import pytest

import config
from conftest import ASSESSMENT, FakeRetriever, make_service
from consult import nodes, specialists
from consult.intake import build_memory_entry, build_search_plan

FULL = "my lower back pain started 2 days ago, it is moderate and dull, no other symptoms"
READY = {"intent": "symptom_report", "category": "orthopedics", "urgency": "routine",
         "chief_complaint": "lower back pain", "duration": "2 days", "severity": "moderate", "character": "dull",
         "associated_symptoms": "none reported", "search_query": "lower back pain"}


def doc(doc_id, title, score=0.6):
    return {"id": doc_id, "title": title, "source": "S", "category": "X", "content": f"{title} text",
            "chunk_index": 0, "relevance_score": score}


def steps(result):
    return [s["node"] for s in result["trace"]]


# ── research agent ───────────────────────────────────────────────────────

def test_plan_always_contains_the_primary_query_and_is_capped():
    assert build_search_plan(["Back pain", "low mood", "sleep", "extra"], "back pain") == ["back pain", "low mood", "sleep"]
    assert build_search_plan([], "cough") == ["cough"]
    # near-duplicates of an earlier query are dropped, different topics are kept
    assert build_search_plan(["low back pain", "low mood and hopelessness"], "lower back pain") == ["lower back pain", "low mood and hopelessness"]
    assert build_search_plan(None, "") == []


def test_every_planned_topic_is_searched_and_merged(llm):
    retriever = FakeRetriever()
    retriever.by_query = {
        "lower back pain": [doc("a1", "Low Back Pain", 0.7), doc("a2", "Low Back Pain", 0.6)],
        "low mood": [doc("b1", "Depression", 0.4)],
    }
    service = make_service(llm, retriever)
    llm.analysis = {**READY, "search_queries": ["lower back pain", "low mood"]}
    result = service.run("t", {"message": FULL})
    assert retriever.queries == ["lower back pain", "low mood"]
    assert [(r["query"], r["grade"]) for r in result["research"]] == [("lower back pain", "strong"), ("low mood", "strong")]
    assert "[1] Low Back Pain" in llm.last_assess_prompt and "[2] Depression" in llm.last_assess_prompt
    assert "refine" not in llm.calls                    # nothing was missing


def test_a_weaker_second_topic_is_not_crowded_out(llm, monkeypatch):
    monkeypatch.setattr(config, "RESEARCH_MAX_CHUNKS", 3)
    retriever = FakeRetriever()
    retriever.by_query = {
        "lower back pain": [doc(f"a{i}", "Low Back Pain", 0.9 - i / 100) for i in range(4)],
        "low mood": [doc("b1", "Depression", 0.3)],
    }
    service = make_service(llm, retriever)
    llm.analysis = {**READY, "search_queries": ["lower back pain", "low mood"]}
    service.run("t", {"message": FULL})
    assert "Depression" in llm.last_assess_prompt       # kept although four chunks scored higher


def test_a_search_that_finds_nothing_is_reworded_once(llm):
    retriever = FakeRetriever()
    retriever.by_query = {"lower back pain": [doc("a1", "Low Back Pain")], "depression screening": [doc("b1", "Depression")]}
    service = make_service(llm, retriever)
    llm.analysis = {**READY, "search_queries": ["lower back pain", "feeling blah"]}
    llm.refined = {"queries": ["depression screening"]}
    result = service.run("t", {"message": FULL})
    assert steps(result)[3:7] == ["research", "refine", "research", "assess"]
    assert retriever.queries == ["lower back pain", "feeling blah", "depression screening"]
    assert "feeling blah" in llm.last_refine_prompt and "Low Back Pain" in llm.last_refine_prompt
    assert [r["round"] for r in result["research"]] == [1, 1, 2]
    assert "Depression" in llm.last_assess_prompt and "Low Back Pain" in llm.last_assess_prompt


def test_research_stops_after_two_rounds(llm):
    retriever = FakeRetriever()
    retriever.by_query = {}
    service = make_service(llm, retriever)
    llm.analysis = READY
    llm.refined = {"queries": ["another wording"]}
    result = service.run("t", {"message": FULL})
    assert llm.calls.count("refine") == 1 and len(retriever.queries) == 2
    assert result["context_grade"] == "none" and result["mode"] == "assessment"


def test_refinement_that_offers_nothing_new_ends_the_loop(llm):
    retriever = FakeRetriever()
    retriever.by_query = {}
    service = make_service(llm, retriever)
    llm.analysis = READY
    llm.refined = {"queries": ["lower back pain"]}       # same search again
    result = service.run("t", {"message": FULL})
    assert steps(result).count("research") == 1


def test_research_works_without_a_model_for_refinement(llm):
    retriever = FakeRetriever()
    retriever.by_query = {}
    service = make_service(llm, retriever)
    llm.analysis = READY
    original = llm.json
    llm.json = lambda messages, **kw: original(messages, **kw) if messages[0]["content"].startswith("You read") else (_ for _ in ()).throw(RuntimeError("down"))
    assert service.run("t", {"message": FULL})["mode"] == "assessment"


# ── specialist hand-off ──────────────────────────────────────────────────

def test_specialist_names_map_to_categories():
    assert specialists.category_for("Heart Specialist") == "cardiology"
    assert specialists.category_for("Brain Specialist") == "neurology"
    assert specialists.category_for("Stomach Specialist") == "general_medicine"
    assert specialists.category_for("") == "general_medicine"
    from consult.intake import CATEGORIES
    assert set(specialists.PROFILES) == set(CATEGORIES)     # every triage category has a specialist


def test_conversation_is_handed_to_the_right_specialist(service, llm):
    result = service.run("t", {"message": "my lower back hurts", "specialization": "Heart Specialist"})
    assert result["specialist"] == {"category": "orthopedics", "name": "Bone Specialist"}
    assert "Bone Specialist" in result["handoff_note"]
    assert result["reply"] == llm.question              # the note is separate from the reply text
    assert "Bone Specialist" in llm.last_ask_prompt
    # the next turn stays with that specialist and does not announce it again
    again = service.run("t", {"message": "since yesterday", "specialization": "Heart Specialist"})
    assert again["specialist"]["category"] == "orthopedics" and again["handoff_note"] == ""


def test_no_handoff_when_the_complaint_fits_the_chosen_specialist(service, llm):
    result = service.run("t", {"message": "my lower back hurts", "specialization": "Bone Specialist"})
    assert result["handoff_note"] == "" and result["specialist"]["name"] == "Bone Specialist"


def test_no_handoff_for_questions_or_rule_based_guesses(service, llm):
    llm.analysis = {"intent": "health_question", "category": "cardiology", "urgency": "routine", "search_query": "bp"}
    assert service.run("a", {"message": "what is a normal blood pressure?", "specialization": "Bone Specialist"})["handoff_note"] == ""
    llm.down = True
    result = service.run("b", {"message": "my heart is racing", "specialization": "Bone Specialist"})
    assert result["handoff_note"] == "" and result["specialist"]["category"] == "orthopedics"


def test_handoffs_are_limited(service, llm):
    categories = ["cardiology", "neurology", "dermatology"]
    notes = []
    for i, category in enumerate(categories):
        llm.analysis = {"intent": "symptom_report", "category": category, "urgency": "routine", "chief_complaint": "pain"}
        notes.append(service.run("t", {"message": f"pain {i}", "specialization": "Bone Specialist"})["handoff_note"])
    assert [bool(n) for n in notes] == [True, True, False]


def test_assessment_prompt_uses_the_active_specialist(service, llm):
    llm.analysis = READY
    service.run("t", {"message": FULL, "specialization": "Heart Specialist"})
    assert "Bone Specialist" in llm.last_assess_prompt and "Heart Specialist" not in llm.last_assess_prompt


# ── patient memory ───────────────────────────────────────────────────────

def test_memory_entry_is_built_only_from_what_the_user_said():
    entry = build_memory_entry({"chief_complaint": "back pain", "duration": "2 days", "location": "n/a",
                                "relevant_history": "diabetes"}, "Bone Specialist", "routine", "2026-10-07")
    assert entry == {"date": "2026-10-07", "specialist": "Bone Specialist", "complaint": "back pain",
                     "urgency": "routine", "duration": "2 days", "relevant_history": "diabetes"}
    assert build_memory_entry({}, "X", "routine", "2026-10-07") is None


def test_memory_entry_is_returned_once_when_the_consultation_finishes(service, llm):
    assert service.run("t", {"message": "my lower back hurts"})["memory_entry"] is None
    llm.analysis = READY
    done = service.run("t", {"message": FULL})
    assert done["memory_entry"]["complaint"] == "lower back pain" and done["memory_entry"]["specialist"] == "Bone Specialist"
    assert service.run("t", {"message": "hello"})["memory_entry"] is None        # closed session


def test_earlier_consultations_reach_the_prompts_as_background_data(service, llm):
    memory = "2026-09-01 Heart Specialist: palpitations (routine). History: asthma"
    llm.analysis = READY
    service.run("t", {"message": FULL, "patient_memory": memory})
    assert memory in llm.last_assess_prompt and "earlier consultations" in llm.last_assess_prompt
    saved = repr([s.values for s in service.graph.get_state_history({"configurable": {"thread_id": "t"}})])
    assert "palpitations" not in saved                  # memory is never checkpointed with the thread


# ── clinician review ─────────────────────────────────────────────────────

@pytest.fixture
def review_all(monkeypatch):
    monkeypatch.setattr(config, "REVIEW_MODE", "all")


def test_review_off_by_default_never_pauses(service, llm):
    llm.analysis = READY
    result = service.run("t", {"message": FULL})
    assert result["mode"] == "assessment" and not result["pending_review"] and "review" not in steps(result)


def test_assessment_waits_for_a_clinician(service, llm, review_all):
    llm.analysis = READY
    result = service.run("t", {"message": FULL})
    assert result["mode"] == "pending_review" and result["pending_review"]
    assert result["reply"] == nodes.REVIEW_PENDING_REPLY
    assert "Summary" not in result["reply"] and result["citations"] == []      # the draft is not shown
    assert not result["session_complete"] and result["memory_entry"] is None

    queue = service.reviews.list()
    assert [r["thread_id"] for r in queue] == ["t"]
    assert queue[0]["draft"].startswith("Summary") and queue[0]["intake"]["chief_complaint"] == "lower back pain"
    assert queue[0]["specialist"] == "Bone Specialist"


def test_questions_are_not_sent_for_review(service, llm, review_all):
    assert service.run("t", {"message": "my lower back hurts"})["mode"] == "ask"
    assert service.reviews.list() == []


def test_nothing_runs_while_a_review_is_pending(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    llm.calls.clear()
    again = service.run("t", {"message": "hello? any news?"})
    assert again["mode"] == "pending_review" and llm.calls == []
    assert [e["event"] for e in service.stream("t", {"message": "still there?"})] == ["final"]


def test_approve_releases_the_assessment(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    calls_before = list(llm.calls)
    result = service.resume("t", "approve", reviewer="Dr. Rao")
    assert result["mode"] == "assessment" and result["session_complete"]
    assert result["reply"] == ASSESSMENT and result["citations"]
    assert result["review"] == {"action": "approve", "reviewer": "Dr. Rao"}
    assert result["memory_entry"]["complaint"] == "lower back pain"
    assert llm.calls == calls_before                    # resuming does not call the model again
    assert service.reviews.list() == []
    assert service.run("t", {"message": "thanks"})["mode"] == "closed"


def test_edit_replaces_the_draft_with_the_clinicians_text(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    result = service.resume("t", "edit", text="Summary\n- Please come in for an examination this week.")
    assert result["reply"] == "Summary\n- Please come in for an examination this week."
    assert result["session_complete"] and result["review"]["action"] == "edit"


def test_reject_sends_a_fixed_message_and_keeps_the_session_open(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    result = service.resume("t", "reject")
    assert result["reply"] == nodes.REVIEW_REJECTED_REPLY and "Summary" not in result["reply"]
    assert not result["session_complete"] and result["memory_entry"] is None
    assert service.reviews.list() == []


def test_resume_validates_its_input(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    with pytest.raises(ValueError):
        service.resume("t", "delete-everything")
    with pytest.raises(ValueError):
        service.resume("t", "edit", text="   ")
    with pytest.raises(KeyError):
        service.resume("no-such-thread", "approve")
    assert service.reviews.has("t")                      # still waiting


def test_urgent_mode_reviews_only_urgent_or_ungrounded_assessments(llm, monkeypatch):
    monkeypatch.setattr(config, "REVIEW_MODE", "urgent")
    service = make_service(llm)
    llm.analysis = READY
    assert service.run("routine", {"message": FULL})["mode"] == "assessment"

    llm.analysis = {**READY, "urgency": "urgent"}
    assert service.run("urgent", {"message": FULL})["mode"] == "pending_review"

    llm.analysis = READY
    llm.grounding = [{"grounded": False, "unsupported": ["a made-up number"]}]
    assert service.run("ungrounded", {"message": FULL})["mode"] == "pending_review"


def test_deleting_a_thread_clears_its_pending_review(service, llm, review_all):
    llm.analysis = READY
    service.run("t", {"message": FULL})
    service.delete_thread("t")
    assert service.reviews.list() == []
    llm.analysis = {"intent": "symptom_report", "category": "orthopedics", "urgency": "routine", "chief_complaint": "back hurts"}
    assert service.run("t", {"message": "my back hurts"})["mode"] == "ask"
