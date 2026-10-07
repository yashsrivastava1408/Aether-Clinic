# Consultation architecture

How a chat message becomes a reply, and how the agentic features around the
chat work. This covers the Python service in `ml/` and the Node gateway in
`server/`. Deployment is in the main README.

## The short version

- One chat turn = one run of a LangGraph state machine in the Python service.
- The Node backend is a gateway. It validates, forwards, stores the encrypted
  transcript and relays progress. It never writes a medical reply itself.
- Emergencies get a fixed message before any model is called.
- Nothing a model writes reaches the user before it has passed the safety checks.
- The model does research and writes; fixed rules decide the flow and the safety.

| Feature | Where | One line |
|:--|:--|:--|
| Research agent | `ml/consult/nodes.py` (`research`, `refine`) | Plans one search per topic, searches, rewords what found nothing, merges |
| Specialist hand-off | `ml/consult/specialists.py` | The conversation moves to the specialist the complaint belongs to |
| Report agent | `ml/report/` | Extracts lab values, checks ranges with a rule-based tool, explains |
| Patient memory | `server/utils/memoryStore.js` | Encrypted summaries of finished consultations, used as background next time |
| Follow-up agent | `server/services/followUpService.js` | Opt-in check-in email; the answer can open a new consultation |
| Clinician review | `ml/consult/nodes.py` (`review`) | The graph pauses until a clinician approves, edits or rejects the draft |

## The graph

```
prepare ─► screen ─┬─► emergency ─────────────────────────────────────────────┐
                   ├─► (blocked) ─────────────────────────────────────────────┤
                   └─► [vision] ─► analyze ─┬─► emergency ────────────────────┤
                                            ├─► ask ──────────────────────────┼─► verify ─► [review] ─► finalize
                                            └─► research ⇄ refine             │
                                                   └─► [risk_tools] ─► assess ┘
verify can send a draft back once; review pauses the run for a clinician.
```

| Node | What it does | Model calls |
|:--|:--|:--|
| `prepare` | Resets per-turn values. Rebuilds state from the gateway's transcript if none is saved. Refuses a closed session. | 0 |
| `screen` | Emergency keywords (with negation handling), then the prompt-injection / off-topic guardrail. | 0 |
| `emergency` | Fixed reply per emergency type with emergency numbers. | 0 |
| `vision` | Describes an uploaded photo as plain observations. | 1 (Gemini) |
| `analyze` | One JSON call: intent, category, urgency, intake slots, the research plan, a draft question. Decides hand-off. | 1 |
| `ask` | One question about the first missing slot. Reuses the draft from `analyze` for hosted models. | 0–1 |
| `research` | Runs every planned search, merges the results, grades the context, notes searches that found nothing. | 0 |
| `refine` | Rewords the searches that found nothing; `research` then runs again (two rounds at most). | 0–1 |
| `risk_tools` | Lets the model call the heart / diabetes risk models. Only offered when the topic fits and the user gave numbers. | 1 |
| `assess` | Final assessment (five sections) or a direct answer to a health question. | 1 |
| `verify` | Rule checks, format check, groundedness check. | 0–1 |
| `review` | Only with `REVIEW_MODE` on: pauses the run until a clinician decides. | 0 |
| `finalize` | Builds the reply, keeps only cited sources, closes the session, writes the memory entry. | 0 |

### When does it stop asking questions?

The decision is made from the intake slots, in `consult/intake.py::is_ready`:

- the main complaint and its duration are known, plus three of: location,
  severity, character, triggers, associated symptoms; **or**
- the user asks what it could be / whether it is serious / for a summary; **or**
- the user says there is nothing more to add; **or**
- 6 user turns have passed (`MAX_INTAKE_TURNS`), so it never asks forever.

Two guards keep a model from ending the interview on its own:

- a slot value is only kept if the user actually said it
  (`supported_slots`: shared word with the user's messages);
- the "user wants the assessment" and "nothing more to add" flags are only
  believed when the user's words support them.

A general question ("what is a normal blood pressure?") is answered directly
and does not close the session.

### Emergencies

`consult/emergency.py` runs first, with no model involved. Kinds: self-harm,
cardiac, stroke, breathing, anaphylaxis, bleeding, neuro, poisoning, DKA.

- "no chest pain" does not trigger (negation window). Self-harm wording is
  never discounted by a negation.
- Each kind is announced once per consultation; after that the conversation
  continues with urgency kept at `emergency`, so the final assessment must
  tell the user to seek urgent care. Self-harm always returns the crisis reply.
- If the model flags an emergency the keywords missed, a general emergency
  notice is sent once.

### Safety checks (`verify`)

1. **Rules** (`check_response`): no diagnosis claims, no prescription doses,
   no dangerous instructions, no personal data, not a previously down-voted
   reply. If the checker itself fails, the user gets a safe fallback message
   (fail closed).
2. **Format**: a final assessment must contain its sections. A stray question
   is never accepted as the assessment.
3. **Groundedness**: a second model call lists specific clinical claims that
   are not in the retrieved protocols or the risk-tool results.
   `GROUNDING_CHECK=auto` runs it only for answers from a hosted model
   (a 3B local model is a slow and unreliable judge).

A rejected draft is regenerated once with the reason. If it fails again:

| Failure | What the user gets | Session |
|:--|:--|:--|
| Rules, on a question | a scripted question for that slot | stays open |
| Rules, on an assessment | a fixed "please see a doctor" message | stays open |
| Format | the safe text as a normal reply | stays open |
| Groundedness | the answer plus a caution line | closes |

Mandatory warnings (dengue and NSAIDs, chest pain, DKA, ...) are added when the
user's own words mention the topic and the draft left the warning out.

## Research agent

A single search is not enough when the user mentions two unrelated problems
("back pain, and I've been feeling low for a month"). The assessment step is
therefore a small plan → search → check → refine loop:

1. **Plan.** The `analyze` call returns `search_queries`: one phrase per
   distinct health problem (up to `MAX_SEARCH_QUERIES`, default 3). The primary
   query is always included; near-duplicates are dropped.
2. **Search.** `research` runs each query through hybrid retrieval and grades it.
3. **Check.** A query graded `none` is a gap.
4. **Refine.** `refine` asks the model to reword the gaps, knowing which
   protocols were already found, and `research` runs once more
   (`RESEARCH_MAX_ROUNDS`, default 2). No new wording means no second round.
5. **Merge.** Chunks are de-duplicated. Each topic keeps its best chunk, and
   the remaining space (`RESEARCH_MAX_CHUNKS`, default 6) goes to the highest
   scores, so a weaker second topic is not crowded out.
6. **Write and self-check.** `assess` writes from the merged context; `verify`
   checks the claims against it.

The search log (`query`, `grade`, `titles`, `round`) is returned with every
reply in `_debug.intelligence.research`.

## Specialist hand-off

Each triage category has a profile in `consult/specialists.py`: a name, what
that specialist pays attention to, and the red flags to ask about early. The
consultation starts with the specialist the user picked. When a symptom report
is classified (by the model, not by keywords) into another category, the
conversation changes hands:

- the reply is prefixed once with a note ("This sounds like one for our Bone
  Specialist...");
- prompts for questions and the assessment use the new profile;
- a consultation changes hands at most twice.

Profiles only shape prompts. They do not relax any safety step.

## Retrieval (`ml/retrieval/`)

- **One store: Qdrant.** Each chunk has a dense vector (`all-MiniLM-L6-v2`) and
  a BM25 sparse vector (`sparse.py`; Qdrant applies IDF).
- **Two modes, same code.** With `QDRANT_HOST` / `QDRANT_URL` it talks to a
  server. Without them it builds an in-memory index from the corpus at startup.
- **Chunking** (`corpus.py`): protocols are split on blank lines and packed to
  about 900 characters, so bullet lists stay whole. The title and categories
  are embedded with each chunk. Chunk ids are deterministic, so ingestion can
  be re-run safely: `python -m retrieval.ingest`.
- **Score**: `dense cosine + 0.3 × bm25 / (bm25 + 8)`. Chunks below 70 % of the
  best score are dropped. The best score grades the context: `strong` ≥ 0.35,
  `weak` ≥ 0.22, otherwise `none` (not used, not cited).

### Measured results

`python -m evals.run_evals --compare`, on 48 patient-style questions over the
17 protocols, 8 off-topic questions, 8 two-topic messages, and 40 emergency /
non-emergency messages:

| Setup | hit@1 | hit@3 |
|:--|:--|:--|
| Dense only | 0.958 | 1.000 |
| Sparse only | 0.688 | 0.917 |
| **Hybrid (default)** | **0.958** | **1.000** |
| Hybrid + cross-encoder rerank | 0.938 | 1.000 |

| Check | Result |
|:--|:--|
| Expected protocol is in the context given to the model | 48 / 48 |
| On-topic questions kept (graded strong or weak) | 48 / 48 |
| Off-topic questions rejected (graded none) | 8 / 8 |
| Two-topic messages: both protocols found, one search | 6 / 8 |
| Two-topic messages: both protocols found, one search per topic | 8 / 8 |
| Emergency messages caught | 26 / 26 |
| False alarms on ordinary messages | 0 / 14 |

What these numbers do and do not show:

- The corpus is small (17 protocols) and the gold sets were written for this
  project, some of them while tuning. They catch regressions; they are not an
  independent benchmark.
- The two-topic rows use planned queries from the gold file, so they measure
  searching and merging, not how well a model writes the plan.
- Hybrid does not rank better than dense here. It is the default because it
  separates on-topic from off-topic better: with dense only, an exact-term
  question ("what does a reduced ejection fraction mean") scores 0.10, below
  the off-topic maximum of 0.18.
- A cross-encoder reranker (three were tried) and two medical embedding models
  did not improve ranking on this corpus, so they are off. `RERANK_ENABLED` and
  `EMBEDDING_MODEL` are there for when the corpus grows; re-run the evals first.

## Report agent (`ml/report/`)

```
extract ─► check ─► explain ─► verify
```

- **extract**: a model reads the report into a table of
  `{name, value, unit, ref_low, ref_high}`. With a photo, a vision model reads
  the image on its own; the OCR text is deliberately kept out of that prompt,
  because a model shown both copies OCR mistakes.
- **check** (`check_ranges`): a rule-based tool decides low / normal / high.
  The range printed on the report wins. A small fallback table
  (`reference.py`) covers a handful of common tests, only when the unit
  matches. Whether a value is abnormal is never decided by a model.
- **explain**: a model writes a short summary and next steps from the checked
  table.
- **verify**: the chat's rule checks. If they fail, a rule-written summary is
  used.

Guards:

- Every extracted value and range limit must be on the page. With OCR text, a
  number that is not in it is dropped. For vision, the comparison ignores the
  decimal point, because OCR often loses it ("1.9" recognised as "19").
- If the vision model is unavailable and the values come from OCR alone, the
  result carries a clear caution to check each number.
- If no model can read the report, the endpoint returns an error. It never
  returns placeholder or simulated results.

When values are out of range, the result includes `consult`: a suggested
specialist and an opening message. The report page offers it as a button that
opens a consultation with that message ready to send.

The fallback range table is short, ignores age and sex, and should be reviewed
by a clinician before real use.

## Patient memory

When a consultation finishes, `finalize` returns a `memory_entry` built from
the intake slots only: date, specialist, complaint, duration, severity,
history the user mentioned. No model-written text goes into memory.

The gateway stores the last ten entries per user, AES-encrypted
(`PatientMemory` collection, or `patient_memory.json` without MongoDB), and
sends a short digest with each later turn. The digest reaches the prompts as
background data ("ask before assuming it still applies") and is never
checkpointed with the conversation.

Users can switch memory off and delete what is stored (Settings → Health
Memory, or `GET` / `DELETE /api/chat/memory/:userId`). There is no real login
yet, so memory is keyed by the same client-supplied user id as chat history.

## Follow-up agent

After a final assessment a signed-in user can ask for a check-in in two days.

1. `POST /api/followup` stores the request (the complaint is encrypted) with an
   unguessable token. It needs MongoDB.
2. A scheduler in the gateway looks for due check-ins every ten minutes. Each
   one is claimed atomically, so several replicas never send the same email
   twice; a failed send is retried up to three times.
3. The email contains a link and no health information.
4. The link page asks "better / about the same / worse". "Better" ends it.
   "Same" or "worse" opens a new consultation whose first message describes
   the change, so it goes through the same emergency screen, research and
   safety checks as any chat, with the earlier consultation in memory.

## Clinician review (human in the loop)

With `REVIEW_MODE=urgent` or `all` on the Python service, a verified final
assessment is not released directly:

- `review` calls LangGraph's `interrupt()`. The run stops and its state is
  checkpointed.
- The user sees a waiting note; the chat is locked (`409 REVIEW_PENDING`) and
  the page polls for the result.
- The draft, the intake, the urgency and the sources go to an encrypted review
  queue (`consult_reviews`).
- A clinician opens `/review`, enters the reviewer key, and approves, edits or
  rejects. The gateway resumes the graph with that decision
  (`Command(resume=...)`), adds the released text to the transcript and closes
  the session. Resuming does not call the model again.

`urgent` reviews an assessment when urgency is not routine or the answer was
not fully grounded. Questions are never sent for review. The queue needs
`REVIEWER_KEY` on the gateway; without it the queue is disabled. That key is a
shared secret, not per-clinician login.

## Models (`consult/llm.py`)

Every provider is called through its OpenAI-compatible endpoint with one client
class, using chat messages with roles.

| Tier | Order |
|:--|:--|
| basic | Ollama (local) → Groq → Gemini |
| premium | Groq → Gemini → Ollama |
| photos, report images | Gemini |

A provider that is unreachable, or has a wrong model name or key, is skipped
for 60 seconds. If no provider answers, intake continues with rule-based
extraction and scripted questions; an assessment is declined rather than faked.

## Conversation state (`consult/checkpoint.py`)

- A LangGraph checkpointer saves the state per `thread_id` (the chat's
  `sessionId`): messages (last 20), intake slots, turn count, urgency,
  emergency notices given, photo findings, active specialist.
- **MongoDB** when `MONGO_URI` and `ENCRYPTION_KEY` are set: AES-encrypted
  (same key as the transcript), one record per conversation, 30-day expiry,
  shared by all replicas. Without the key nothing is written to the database.
- **In memory** otherwise, capped at 500 conversations. After a restart the
  state is rebuilt from the transcript the gateway sends with every turn.
- The photo, the lab-report digest, the memory digest and that transcript
  travel in the run config, not in the state, so they are never checkpointed.
- Deleting a chat deletes its state and any pending review. A new chat always
  gets a new `sessionId`.

## Streaming

`POST /api/chat/stream` returns server-sent events:

```
event: step    data: {"step": "research", "label": "Searching clinical protocols"}
event: final   data: {"reply": "...", "sessionComplete": false, "citations": [...]}
```

Steps are streamed as they start. The reply text is sent only in `final`,
after verification. Token-by-token streaming of unverified text is
deliberately not done.

## Tracing

LangGraph and the model client are instrumented for LangSmith. Set
`LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY` to see every node and model
call. Prompts contain what users typed, so only enable this with a project you
are allowed to send health data to. Every response also carries a small trace
(`_debug.intelligence.trace`: node names and milliseconds, no content).

## Tests

```bash
cd ml && python -m pytest tests -q          # graph, agents, retrieval, report agent, API
cd ml && python -m evals.run_evals          # retrieval, research, grading and emergency numbers
cd server && npm test                       # gateway against a stub consult service

# With a MongoDB you can throw away: encrypted state, review pause/resume, follow-ups
TEST_MONGO_URI=mongodb://localhost:27017 python -m pytest tests/test_checkpoint_mongo.py
TEST_MONGO_URI=mongodb://localhost:27017 npm test
```

The graph tests use a scripted model, so they are fast and need no keys.
