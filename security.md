# Security Hardening Notes

This document records the security controls we had before the hardening pass, what changed during the pass, and how to test the protections now.

## Consultation Graph Pass (October 2026)

The chat flow moved into a LangGraph state machine in `ml/consult/`. What that changed for safety:

### Order of checks
- **Emergency screening runs before the guardrail** (`ml/consult/emergency.py`). Before, "I want to kill myself" matched a harmful-content pattern and was answered with a security block. It now gets the crisis reply. Physical emergencies get a fixed message with emergency numbers and no model call.
- Negation is handled for physical symptoms ("no chest pain"). Self-harm wording is never discounted by a negation.
- A blocked message is not kept in the conversation state, so injected text cannot reach a later prompt.

### Fail closed
- The rule checks in `ml/agents/safety_oversight.py` (`check_response`) run on every drafted reply. If the checker itself raises, the user gets a fixed fallback message. Before, a failed check passed the draft through as safe, in both the Python endpoint and the Node client.
- A rejected draft is regenerated once. A second failure returns a scripted question or a fixed "please see a doctor" message, never the draft.
- Drafts are never streamed. The browser only receives text after verification.
- If the Python service is unreachable, the gateway returns `503`; it has no code path that writes a medical reply.

### Mandatory warnings now reach the user
- The gateway used to strip everything after the first divider line, which removed the appended safety warnings together with the footer. Warnings are now part of the reply text.
- A warning is triggered by the user's own words, not by the retrieved context or the model's wording, so an unrelated protocol cannot attach one.

### Model output is not trusted for control flow
- Intake values the user never said are dropped, and the "user wants the assessment" flag is only believed when the user's words support it. A model cannot end the interview on its own.
- Risk-model tools reject any measurement the user did not state and any value outside the training range.
- User text, photo findings and report digests are passed inside `<user_data>` tags and the system prompt says to treat them as data.

### Guardrail false positives fixed
- "hacking cough" is no longer blocked as hacking.
- "from 19xx" is no longer treated as prompt injection (it blocked "asthma from 1998").

### Data at rest
- Consultation state in MongoDB is AES-encrypted with the gateway's `ENCRYPTION_KEY`, including the checkpoint metadata, which the stock saver stores in plain text. Without a valid key the service keeps state in memory and writes nothing.
- One record per conversation is kept, with a 30-day expiry. Photos, report digests and the recovery transcript are never checkpointed.

### Agentic features
- **Report agent**: whether a lab value is high or low is decided by a rule-based range check, never by a model. Every extracted number must be on the page (checked against the OCR text). The earlier fallback that returned "simulated" findings when the model failed is no longer used; a failure is now an error.
- **Research agent**: it only searches the clinic's own protocol library. It has no web access and cannot call anything except the retriever.
- **Patient memory**: entries are built from the user's own words, stored AES-encrypted, capped at ten per user, and can be switched off or deleted by the user. Memory reaches prompts inside `<user_data>` tags and is never checkpointed.
- **Follow-up emails**: opt-in per consultation, contain a link and no health details, and use an unguessable 192-bit token. Email addresses are validated (no header injection through newlines).
- **Clinician review**: the queue needs `REVIEWER_KEY` (compared in constant time) and is disabled when the key is unset. Drafts in the queue are AES-encrypted. This is one shared key, not per-clinician accounts, and a clinician's edited text is released without the model rule checks.
- **Specialist hand-off**: profiles change prompt wording only. Emergency screening, the guardrail and verification run the same for every specialist.

### Still open
- No real authentication: the gateway trusts the client-supplied `userId`, so chat history can be read or deleted by anyone who knows or guesses an id.
- CORS accepts every origin, and a `k6` user-agent bypasses the rate limiter.
- The Python service has no authentication of its own; it must only be reachable from the gateway.

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

Run these from the `ml/` directory:

```bash
python -m pytest tests -q
python tests/wargame.py
```

The first command also covers the consultation graph (emergency screen, guardrail routing, fail-closed verification). To include the encrypted-state tests, point it at a MongoDB you can throw away:

```bash
TEST_MONGO_URI=mongodb://localhost:27017 python -m pytest tests/test_checkpoint_mongo.py -q
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
