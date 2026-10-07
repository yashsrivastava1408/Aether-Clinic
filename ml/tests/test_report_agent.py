"""Lab-report agent: extraction guards, the range-check tool and the output shape."""

import pytest
from langchain_core.messages import AIMessage

from consult.llm import LLMUnavailable
from report import ReportUnavailable, analyze_report
from report.agent import check_ranges, clean_tests, describe
from report.reference import canonical_name, category_for_test, typical_range

OCR = """CITY DIAGNOSTICS            Patient: A. Sharma   Age: 45
LIPID PROFILE & GLUCOSE
Fasting Blood Sugar     148 mg/dL     70 - 99
HbA1c                   7.9 %         4.0 - 5.6
Total Cholesterol       182 mg/dL     < 200
Hemoglobin              13.8 g/dL
Vitamin D               22 ng/mL
"""

EXTRACTED = {"report_type": "Lipid profile and glucose", "tests": [
    {"name": "Fasting Blood Sugar", "value": 148, "unit": "mg/dL", "ref_low": 70, "ref_high": 99},
    {"name": "HbA1c", "value": 7.9, "unit": "%", "ref_low": 4.0, "ref_high": 5.6},
    {"name": "Total Cholesterol", "value": 182, "unit": "mg/dL", "ref_low": None, "ref_high": 200},
    {"name": "Hemoglobin", "value": 13.8, "unit": "g/dL", "ref_low": None, "ref_high": None},
    {"name": "Vitamin D", "value": 22, "unit": "ng/mL", "ref_low": None, "ref_high": None},
]}


class ReportLLM:
    def __init__(self):
        self.extracted = EXTRACTED
        self.explained = {"summary": "This is a glucose and lipid report. Two sugar values are above range.",
                          "suggestions": ["Discuss the glucose values with your doctor.", "Ask about repeating the test.", "Review diet and activity."]}
        self.calls = []
        self.vision_fails = False
        self.down = False

    def json(self, messages, **kwargs):
        if self.down:
            raise LLMUnavailable("down")
        if messages[0]["content"].startswith("You read a medical laboratory report"):
            self.calls.append("extract")
            return self.extracted, "fake"
        self.calls.append("explain")
        self.last_explain = messages[-1]["content"]
        return self.explained, "fake"

    def invoke(self, messages, **kwargs):
        if self.down or self.vision_fails:
            raise LLMUnavailable("no vision")
        self.calls.append("vision")
        import json
        return AIMessage(content=json.dumps(self.extracted)), "fake-vision"


# ── the range-check tool ─────────────────────────────────────────────────

def test_printed_range_wins_and_decides_the_status():
    checked = {t["name"]: t for t in check_ranges(clean_tests(EXTRACTED["tests"], OCR)[0])}
    assert checked["Fasting Blood Sugar"]["status"] == "high" and checked["Fasting Blood Sugar"]["range_source"] == "report"
    assert checked["HbA1c"]["status"] == "high"
    assert checked["Total Cholesterol"]["status"] == "normal"           # one-sided printed range
    assert checked["Hemoglobin"]["status"] == "normal" and checked["Hemoglobin"]["range_source"] == "typical adult range"
    assert checked["Vitamin D"]["status"] == "unknown"                   # no printed range, not in the fallback table


def test_fallback_range_needs_a_matching_unit():
    assert typical_range("Fasting Blood Sugar", "mg/dL") == (70, 99)
    assert typical_range("Fasting Blood Sugar", "mmol/L") is None        # never compare across units
    assert typical_range("Serum Ferritin", "ng/mL") is None
    assert canonical_name("Glycosylated Haemoglobin (HbA1c)") == "hba1c"  # not mistaken for hemoglobin
    assert canonical_name("Hb") == "hemoglobin"
    for other in ("VLDL Cholesterol", "Total Cholesterol / HDL Ratio", "Random Blood Sugar", "Urine Creatinine", "MCHC (Hb)"):
        assert canonical_name(other) is None, other                      # never borrow another test's range
    assert category_for_test("LDL Cholesterol") == "cardiology" and category_for_test("Ferritin") == "general_medicine"


def test_low_values_and_boundaries():
    low = check_ranges([{"name": "Hemoglobin", "value": 9.5, "unit": "g/dL", "ref_low": 13.0, "ref_high": 17.0}])[0]
    assert low["status"] == "low" and "Low (range 13–17, from the report)" in describe(low)
    edge = check_ranges([{"name": "X", "value": 99, "unit": None, "ref_low": 70, "ref_high": 99}])[0]
    assert edge["status"] == "normal"


# ── extraction guards ────────────────────────────────────────────────────

def test_values_not_printed_on_the_report_are_dropped():
    invented = EXTRACTED["tests"] + [{"name": "Creatinine", "value": 1.1, "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.3}]
    tests, dropped = clean_tests(invented, OCR)
    assert dropped == 1 and "Creatinine" not in [t["name"] for t in tests]


def test_reference_limits_not_printed_are_removed():
    wrong = [{"name": "Vitamin D", "value": 22, "unit": "ng/mL", "ref_low": 30, "ref_high": 100}]
    tests, _ = clean_tests(wrong, OCR)
    assert tests[0]["ref_low"] is None and tests[0]["ref_high"] is None


def test_malformed_rows_are_ignored():
    rows = [None, "x", {"name": "", "value": 5}, {"name": "A", "value": "n/a"}, {"name": "B", "value": True},
            {"name": "Glucose", "value": "148 mg/dL"}, {"name": "Glucose", "value": 148}]
    tests, _ = clean_tests(rows, OCR)
    assert [(t["name"], t["value"]) for t in tests] == [("Glucose", 148.0)]
    assert clean_tests("not a list", OCR) == ([], 0)


def test_inverted_range_is_discarded():
    tests, _ = clean_tests([{"name": "Fasting Blood Sugar", "value": 148, "ref_low": 99, "ref_high": 70}], OCR)
    assert tests[0]["ref_low"] is None and tests[0]["ref_high"] is None


# ── the whole agent ──────────────────────────────────────────────────────

def test_report_is_analysed_into_the_shape_the_page_renders():
    llm = ReportLLM()
    result = analyze_report(llm, OCR)
    assert result["status"] == "ok" and set(result) >= {"summary", "findings", "alerts", "suggestions", "tests", "consult"}
    assert len(result["findings"]) == 5
    assert result["findings"][0] == "Fasting Blood Sugar: 148 mg/dL — High (range 70–99, from the report)"
    assert result["alerts"] == [
        "Fasting Blood Sugar is above the reference range (148 mg/dL; range 70–99)",
        "HbA1c is above the reference range (7.9 %; range 4–5.6)",
    ]
    assert result["summary"] == llm.explained["summary"] and result["explained_by"] == "model"
    assert result["consult"]["category"] == "endocrinology"
    assert "Fasting Blood Sugar 148 mg/dL (high)" in result["consult"]["opening_message"]
    # the model that explains is given statuses that were already decided
    assert "High (range 70–99" in llm.last_explain


def test_status_is_never_taken_from_the_model():
    llm = ReportLLM()
    llm.extracted = {"tests": [{"name": "Fasting Blood Sugar", "value": 148, "unit": "mg/dL", "ref_low": 70, "ref_high": 99, "status": "normal"}]}
    assert analyze_report(llm, OCR)["tests"][0]["status"] == "high"


def test_all_normal_report_has_no_alerts_and_no_consult_offer():
    llm = ReportLLM()
    llm.extracted = {"tests": [EXTRACTED["tests"][2], EXTRACTED["tests"][3]]}
    result = analyze_report(llm, OCR)
    assert result["alerts"] == [] and result["consult"] is None


def test_unsafe_explanation_is_replaced_by_a_rule_written_one():
    llm = ReportLLM()
    llm.explained = {"summary": "You definitely have diabetes. I prescribe metformin 500 mg.", "suggestions": ["Take metformin 500 mg", "x"]}
    result = analyze_report(llm, OCR)
    assert "metformin" not in (result["summary"] + " ".join(result["suggestions"]))
    assert result["explained_by"] == "rules" and "2 are outside their reference range" in result["summary"]
    assert len(result["alerts"]) == 2                    # the checked facts are unaffected


def test_explanation_failure_still_returns_checked_results():
    llm = ReportLLM()
    llm.explained = "garbage"
    result = analyze_report(llm, OCR)
    assert result["status"] == "ok" and result["explained_by"] == "rules" and len(result["findings"]) == 5


def test_image_is_read_by_the_vision_model_and_checked_against_ocr():
    llm = ReportLLM()
    result = analyze_report(llm, OCR, image_b64="AAAA", image_mime="image/png")
    assert llm.calls[0] == "vision" and "extract" not in llm.calls
    assert result["providers"][0] == "extract:fake-vision" and result["read_from"] == "vision"
    assert result["alerts"][0].startswith("Fasting Blood Sugar")     # no OCR caution needed


def test_vision_values_are_checked_against_ocr_ignoring_lost_decimal_points():
    # OCR dropped every decimal point; the vision model read the image correctly.
    broken_ocr = "Fasting Blood Sugar 148 mg/dL 70 99\nHbA1c 79 % 40 56\nSerum Creatinine 19 mg/dL 06 13\n"
    llm = ReportLLM()
    llm.extracted = {"tests": [
        {"name": "HbA1c", "value": 7.9, "unit": "%", "ref_low": 4.0, "ref_high": 5.6},
        {"name": "Serum Creatinine", "value": 1.9, "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.3},
        {"name": "Invented Test", "value": 42.5, "unit": "x", "ref_low": None, "ref_high": None},
    ]}
    result = analyze_report(llm, broken_ocr, image_b64="AAAA")
    by_name = {t["name"]: t for t in result["tests"]}
    assert by_name["HbA1c"]["status"] == "high" and by_name["HbA1c"]["range_high"] == 5.6
    assert by_name["HbA1c"]["range_low"] == 4.0          # "4.0" printed, "40" recognised: still accepted
    assert by_name["Serum Creatinine"]["status"] == "high" and by_name["Serum Creatinine"]["value"] == 1.9
    assert "Invented Test" not in by_name and result["unverified_values_dropped"] == 1


def test_values_read_by_ocr_alone_carry_a_clear_caution():
    llm = ReportLLM()
    llm.vision_fails = True
    result = analyze_report(llm, OCR, image_b64="AAAA")
    assert result["read_from"] == "ocr"
    assert "decimal points" in result["alerts"][0] and "Check each number" in result["alerts"][0]
    typed = analyze_report(ReportLLM(), OCR)
    assert typed["read_from"] == "text" and "decimal points" not in " ".join(typed["alerts"])


def test_vision_failure_falls_back_to_ocr_text():
    llm = ReportLLM()
    llm.vision_fails = True
    assert analyze_report(llm, OCR, image_b64="AAAA")["status"] == "ok" and llm.calls[0] == "extract"


def test_no_model_means_an_honest_error_not_made_up_results():
    llm = ReportLLM()
    llm.down = True
    with pytest.raises(ReportUnavailable):
        analyze_report(llm, OCR)
    with pytest.raises(ReportUnavailable):
        analyze_report(llm, "", image_b64="AAAA")


def test_unreadable_inputs():
    llm = ReportLLM()
    assert analyze_report(llm, "   ")["status"] == "unreadable" and llm.calls == []
    llm.extracted = {"tests": []}
    result = analyze_report(llm, "A page with words but no results at all")
    assert result["status"] == "unreadable" and result["findings"] == [] and "could not read" in result["summary"]
