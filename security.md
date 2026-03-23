# Security Hardening Notes

This document records the security controls we had before the hardening pass, what changed during the pass, and how to test the protections now.

## Before This Hardening Pass

### Input guardrail
- The query filter in `ml/agents/guardrail_agent.py` was mostly regex-based.
- It detected obvious prompt injection, harmful content, and a few PII strings.
- It was vulnerable to:
  - code-prompt smuggling for medical dosage calculations
  - roleplay-based jailbreaks
  - metaphor or story framing around dangerous instructions
  - simple obfuscation such as punctuation, hyphens, or invisible characters

### Output safety
- `ml/agents/safety_oversight.py` checked some forbidden patterns and dosage advice.
- The chat pipeline only ran response verification in a limited path.
- Unsafe output could still be returned with a disclaimer appended.

### Test coverage
- There was a small red-team script in `ml/tests/wargame.py`.
- Coverage was limited and did not include semantic bypasses or output-side regressions.

## After This Hardening Pass

### Input guardrail improvements
Implemented in `ml/agents/guardrail_agent.py`:

- Normalization of text before scanning:
  - Unicode normalization
  - zero-width character stripping
  - punctuation flattening
  - basic leetspeak translation
- Structured categories for blocks:
  - `prompt_injection`
  - `roleplay_evasion`
  - `dosage_smuggling`
  - `metaphorized_harm`
  - `pii_request`
  - `harmful_content`
  - `off_topic`
  - `length_limit`
- Allowlist-style medical intent gate:
  - clearly off-topic requests are blocked when they do not contain medical intent
- Stronger PII handling:
  - explicit PII term detection
  - patient/record/search style request combinations
- Stronger harmful-content checks:
  - dangerous assembly/instruction phrasing
  - creative-writing cloaks such as story/metaphor framing

### Output safety improvements
Implemented in `ml/agents/safety_oversight.py` and enforced from `server/controllers/chatController.js`:

- Response verification now runs for every generated chat response.
- Unsafe output is replaced with a safe refusal instead of being returned verbatim.
- The verifier now checks:
  - forbidden diagnosis/prescription language
  - dosage recommendations for restricted drugs
  - dangerous instruction patterns
  - PII leakage patterns
  - mandatory emergency warnings
- Safety warnings still append the legal footer, but only after the response has been sanitized.

### Test coverage improvements
Added and expanded:

- `ml/tests/test_guardrail_agent.py`
  - blocks code-dosage smuggling
  - blocks roleplay jailbreaks
  - blocks metaphor/story cloaking
  - blocks PII extraction
  - blocks off-topic security abuse
  - blocks Unicode-obfuscated prompt injection
- `ml/tests/test_safety_oversight.py`
  - blocks unsafe dosage advice
  - blocks PII leaks in model output
  - verifies mandatory emergency warnings
- `ml/tests/wargame.py`
  - expanded adversarial scenarios
  - prints classification quality as well as block status

## Security Test Commands

Run these from the repository root:

```bash
python -m unittest discover -s ml/tests -p 'test_*.py'
python ml/tests/wargame.py
```

If the environment has OpenMP shared-memory issues, rerun with a single worker environment if needed:

```bash
OMP_NUM_THREADS=1 python -m unittest discover -s ml/tests -p 'test_*.py'
OMP_NUM_THREADS=1 python ml/tests/wargame.py
```

## What We Now Test

### Prompt injection
- `ignore instructions`
- `ignore FDA rules`
- `roleplay as a doctor`
- `pretend to be`
- `act as`

### Dosage smuggling
- code or script requests that hide medication dosage calculation
- drug names combined with dosage language

### Metaphor cloaking
- story/fiction/metaphor framing
- dangerous assembly or mixing instructions
- disguised bomb/weapon instructions

### PII extraction
- SSN requests
- credit card requests
- patient database lookups
- record retrieval phrasing

### Obfuscation
- invisible characters
- punctuation padding
- simple leetspeak or text-flattening tricks

### Output safety
- unsafe dosage recommendations
- forbidden diagnosis language
- missing emergency escalation
- PII leakage in generated responses

## Residual Risk

No rule-based system is perfect. The remaining risk is paraphrased or novel abuse that does not resemble our current patterns. The next recommended step is a small semantic classifier or a policy scoring layer that can catch intent, not just wording.

## Suggested Follow-Up Checks

1. Add paraphrase-based adversarial fixtures.
2. Add a lightweight semantic risk scorer for off-topic and harmful intent.
3. Log near-miss cases where the score is high but the query is still allowed.
4. Review false positives on legitimate medical questions every time the rules change.
