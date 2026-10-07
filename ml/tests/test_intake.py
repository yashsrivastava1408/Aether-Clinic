from consult.intake import supported_slots
from consult.intake import (
    build_search_query, clean_value, heuristic_analysis, is_ready, max_urgency,
    merge_intake, missing_slots, normalize_analysis,
)


def test_clean_value_treats_placeholders_as_unknown():
    for raw in (None, "", "null", "Unknown", "not mentioned", True):
        assert clean_value(raw) is None
    assert clean_value("  two   days. ") == "two days"
    assert clean_value(["nausea", "sweating"]) == "nausea, sweating"


def test_merge_never_clears_a_known_slot():
    merged = merge_intake({"duration": "2 days", "location": "lower back"}, {"duration": None, "location": "n/a", "severity": "mild"})
    assert merged == {"duration": "2 days", "location": "lower back", "severity": "mild"}


def test_not_ready_without_a_complaint_even_if_user_asks():
    assert not is_ready({}, 1, wants_assessment=True, nothing_more=False, force=False)


def test_ready_when_core_details_are_known():
    intake = {"chief_complaint": "back pain", "duration": "2 days", "severity": "moderate", "character": "dull", "associated_symptoms": "none"}
    assert is_ready(intake, 3, False, False, False)
    del intake["associated_symptoms"]
    assert not is_ready(intake, 3, False, False, False)          # two details are not enough
    assert not is_ready({"chief_complaint": "back pain", "severity": "bad", "character": "dull", "triggers": "bending"}, 3, False, False, False)  # no duration


def test_ready_when_user_asks_or_has_nothing_to_add_or_cap_reached():
    base = {"chief_complaint": "headache"}
    assert is_ready(base, 1, True, False, False)
    assert is_ready(base, 2, False, True, False)
    assert is_ready({}, 6, False, False, False)      # safety net: never ask forever
    assert is_ready({}, 1, False, False, True)       # explicit "finish now"


def test_max_urgency_and_missing_slots():
    assert max_urgency("routine", "urgent", "bogus") == "urgent"
    assert missing_slots({"chief_complaint": "x"})[0] == "location"


def test_invalid_llm_json_falls_back_to_rules():
    fallback = heuristic_analysis("my knee hurts since monday", [], "Orthopedics")
    assert normalize_analysis(None, fallback) is fallback
    assert normalize_analysis("oops", fallback) is fallback
    partial = normalize_analysis({"intent": "nonsense", "category": "Cardiology", "urgency": "??", "duration": "3 days"}, fallback)
    assert partial["intent"] == fallback["intent"]
    assert partial["category"] == "cardiology"
    assert partial["urgency"] == fallback["urgency"]
    assert partial["slots"]["duration"] == "3 days"


def test_rules_extract_basic_slots_and_intents():
    result = heuristic_analysis("my lower back hurts since yesterday, a dull ache, moderate", [], "Orthopedics")
    assert result["intent"] == "symptom_report"
    assert result["slots"]["location"] == "lower back"
    assert "yesterday" in result["slots"]["duration"]
    assert result["slots"]["severity"] == "moderate"
    assert heuristic_analysis("hello", [], "General")["intent"] == "smalltalk"
    question = heuristic_analysis("what is a normal blood pressure?", [], "General")
    assert question["intent"] == "health_question" and question["slots"] == {}
    assert heuristic_analysis("no", ["I have a cough"], "General")["nothing_more"]
    assert heuristic_analysis("is it serious?", ["I have a cough"], "General")["wants_assessment"]


def test_search_query_prefers_model_query_then_intake_then_message():
    assert build_search_query("tension headache", {}, "x") == "tension headache"
    assert build_search_query("", {"chief_complaint": "cough", "location": "n/a", "character": "dry"}, "x") == "cough, dry"
    assert build_search_query("", {}, "what is hba1c") == "what is hba1c"


def test_end_of_interview_flags_need_support_in_the_users_words():
    fallback = heuristic_analysis("my lower back has been hurting", [], "Orthopedics")
    eager = {"intent": "symptom_report", "wants_assessment": True, "nothing_more_to_add": True}
    result = normalize_analysis(eager, fallback, "my lower back has been hurting")
    assert not result["wants_assessment"] and not result["nothing_more"]
    assert normalize_analysis(eager, fallback, "what could it be?")["wants_assessment"]
    assert normalize_analysis(eager, fallback, "please give me your assessment")["wants_assessment"]
    assert normalize_analysis(eager, fallback, "no, nothing else")["nothing_more"]
    # the rules alone are enough when the model says nothing
    quiet = {"intent": "symptom_report"}
    assert normalize_analysis(quiet, heuristic_analysis("is it serious?", ["cough"], "General"), "is it serious?")["wants_assessment"]


def test_slot_values_the_user_never_said_are_dropped():
    said = "my lower back has been hurting since yesterday after lifting a box"
    slots = {"chief_complaint": "lower back pain", "duration": "since yesterday", "severity": "moderate",
             "character": "dull ache", "triggers": "lifting a heavy box", "location": "n/a",
             "associated_symptoms": "none reported", "relevant_history": None}
    kept = supported_slots(slots, said)
    assert set(kept) == {"chief_complaint", "duration", "triggers", "location"}
    # "none reported" is believed once the user has actually said no
    assert "associated_symptoms" in supported_slots(slots, said + ". no other symptoms")
    # the same word in another form still counts
    assert supported_slots({"chief_complaint": "hurting knee"}, "my knee hurts") == {"chief_complaint": "hurting knee"}
    assert supported_slots({"character": "painful"}, "there is pain") == {"character": "painful"}
    assert supported_slots({"severity": "severe"}, "the pain is severe") == {"severity": "severe"}


def test_not_applicable_is_only_accepted_for_location():
    fallback = heuristic_analysis("I have a fever", [], "General")
    raw = {"intent": "symptom_report", "chief_complaint": "fever", "location": "n/a", "severity": "n/a", "character": "N/A", "triggers": "not applicable"}
    slots = normalize_analysis(raw, fallback, "I have a fever", "I have a fever")["slots"]
    assert slots == {"chief_complaint": "fever", "location": "n/a"}
