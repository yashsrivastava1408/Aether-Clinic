import json
from pathlib import Path

import pytest

from consult.emergency import detect_emergency, emergency_reply

GOLD = [json.loads(line) for line in (Path(__file__).resolve().parents[1] / "evals" / "gold_emergency.jsonl").read_text().splitlines() if line.strip()]


@pytest.mark.parametrize("item", [g for g in GOLD if g["emergency"]], ids=lambda g: g["text"][:40])
def test_every_emergency_message_is_caught(item):
    result = detect_emergency(item["text"])
    assert result["is_emergency"], item["text"]
    assert result["kind"] == item["kind"]


@pytest.mark.parametrize("item", [g for g in GOLD if not g["emergency"]], ids=lambda g: g["text"][:40])
def test_ordinary_messages_do_not_trigger(item):
    assert not detect_emergency(item["text"])["is_emergency"], item["text"]


def test_negation_is_respected_for_physical_symptoms():
    assert not detect_emergency("no chest pain at all")["is_emergency"]
    assert not detect_emergency("I do not have difficulty breathing")["is_emergency"]


def test_self_harm_is_never_discounted_by_negation():
    assert detect_emergency("I'm not suicidal, I just feel low")["kind"] == "self_harm"


def test_skip_kinds_suppresses_a_repeat_notice():
    assert not detect_emergency("the chest pain is mild now", skip_kinds={"cardiac"})["is_emergency"]
    # a different emergency still fires
    assert detect_emergency("the chest pain is mild but now I can't breathe", skip_kinds={"cardiac"})["kind"] == "breathing"


def test_replies_are_fixed_text_with_emergency_numbers():
    assert "112" in emergency_reply("cardiac") and "911" in emergency_reply("cardiac")
    assert "988" in emergency_reply("self_harm") and "14416" in emergency_reply("self_harm")
    # self-harm reply must not invite the user to carry on with triage
    assert "tell me more and we can continue" not in emergency_reply("self_harm")
    assert emergency_reply("something-unknown") == emergency_reply("general")
