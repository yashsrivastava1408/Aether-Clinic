/**
 * Chat gateway tests.
 *
 * Runs the real Express routes against a stub of the Python consult service.
 * Everything is written to a temporary folder, so the real chat_logs.json
 * and uploads/ are never touched. Run with: npm test
 */

import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "aether-chat-test-"));
const originalCwd = process.cwd();

// ── stub of the Python consult service ───────────────────────────────────
const stub = { calls: [], deleted: [], next: null, down: false, reviews: [], reviewResult: null, report: null };

const defaultResult = (overrides = {}) => ({
  reply: "How long has this been going on?",
  mode: "ask",
  session_complete: false,
  citations: [],
  classification: { category: "orthopedics", urgency: "routine" },
  safety: { is_safe: true, score: 1, warnings: [], violations: 0, grounded: null },
  intake: { chief_complaint: "back pain" },
  turn_count: 1,
  context_grade: "none",
  tool_results: [],
  providers: ["analyze:fake"],
  trace: [],
  ...overrides,
});

const stubServer = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    if (stub.down) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Consultation failed" }));
    }
    if (req.method === "DELETE") {
      stub.deleted.push(decodeURIComponent(req.url.split("/").pop()));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ deleted: true }));
    }
    const body = JSON.parse(raw || "{}");
    const json = (status, data) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (req.url === "/api/consult/reviews") return json(200, { review_mode: "all", pending: stub.reviews });
    if (req.url.startsWith("/api/consult/review/")) {
      stub.calls.push({ url: req.url, body });
      if (!["approve", "edit", "reject"].includes(body.action)) return json(400, { error: "action must be approve, edit or reject" });
      return json(200, stub.reviewResult);
    }
    if (req.url === "/api/report/analyze") {
      stub.calls.push({ url: req.url, body });
      return stub.report ? json(200, stub.report) : json(503, { error: "REPORT_ANALYSIS_UNAVAILABLE" });
    }
    stub.calls.push({ url: req.url, body });
    const result = stub.next || defaultResult();
    if (req.url === "/api/consult/stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      // split one event across two writes to exercise the parser
      res.write('event: step\ndata: {"step":"screen","label":"Checking for urgent symptoms"}\n\nevent: st');
      res.write('ep\ndata: {"step":"analyze","label":"Understanding your message"}\n\n');
      if (result.__streamError) res.write('event: error\ndata: {"error":"Consultation failed"}\n\n');
      else res.write(`event: final\ndata: ${JSON.stringify(result)}\n\n`);
      return res.end();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  });
});

let api;       // base URL of the chat routes under test
let root;      // base URL of all API routes
let gateway;   // http.Server
let userSeq = 0;
const newUser = () => `u-test-${++userSeq}`;

before(async () => {
  await new Promise((r) => stubServer.listen(0, "127.0.0.1", r));
  process.env.INTELLIGENCE_BASE_URL = `http://127.0.0.1:${stubServer.address().port}`;
  process.env.ENCRYPTION_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
  process.chdir(workDir);   // chat_logs.json, feedback_logs.json and uploads/ resolve here

  const express = (await import("express")).default;
  const chatRoutes = (await import("../routes/chat.js")).default;
  const reviewRoutes = (await import("../routes/review.js")).default;
  const reportRoutes = (await import("../routes/report.js")).default;
  const followUpRoutes = (await import("../routes/followup.js")).default;
  const app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoutes);
  app.use("/api/review", reviewRoutes);
  app.use("/api/report", reportRoutes);
  app.use("/api/followup", followUpRoutes);
  gateway = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  root = `http://127.0.0.1:${gateway.address().port}/api`;
  api = `${root}/chat`;
});

after(async () => {
  process.chdir(originalCwd);
  await new Promise((r) => gateway.close(r));
  await new Promise((r) => stubServer.close(r));
  fs.rmSync(workDir, { recursive: true, force: true });
});

beforeEach(() => {
  stub.calls = [];
  stub.deleted = [];
  stub.next = null;
  stub.down = false;
  stub.reviews = [];
  stub.reviewResult = null;
  stub.report = null;
  delete process.env.REVIEWER_KEY;
});

const form = (fields, file) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, String(value));
  if (file) data.append("image", new Blob([file.bytes], { type: file.type }), file.name);
  return data;
};
const send = (fields, file, route = "") => fetch(`${api}${route}`, { method: "POST", body: form(fields, file) });
const savedChats = () => JSON.parse(fs.readFileSync(path.join(workDir, "chat_logs.json"), "utf8"));
const readSse = async (response) =>
  (await response.text()).trim().split("\n\n").map((block) => {
    const [eventLine, dataLine] = block.split("\n");
    return { event: eventLine.replace("event: ", ""), data: JSON.parse(dataLine.replace("data: ", "")) };
  });

// ── validation ───────────────────────────────────────────────────────────

test("rejects a request without a user id or without content", async () => {
  assert.equal((await send({ message: "hi" })).status, 400);
  const empty = await send({ userId: newUser(), message: "   " });
  assert.equal(empty.status, 400);
  assert.equal((await empty.json()).error, "MESSAGE_MISSING");
  assert.equal(stub.calls.length, 0);
});

// ── a normal turn ────────────────────────────────────────────────────────

test("forwards the turn, returns the reply and stores the transcript encrypted", async () => {
  const userId = newUser();
  const response = await send({ userId, message: "my lower back hurts", specialization: "Orthopedics", tier: "premium", userRam: 16 });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.reply, "How long has this been going on?");
  assert.equal(body.sessionComplete, false);
  assert.deepEqual(body.citations, []);
  assert.equal(body.mode, "ask");

  const sent = stub.calls[0].body;
  assert.match(sent.thread_id, /^[0-9a-f-]{36}$/);
  assert.equal(sent.message, "my lower back hurts");
  assert.equal(sent.specialization, "Orthopedics");
  assert.equal(sent.tier, "premium");
  assert.equal(sent.user_ram, 16);
  assert.deepEqual(sent.history, []);

  const raw = fs.readFileSync(path.join(workDir, "chat_logs.json"), "utf8");
  assert.ok(!raw.includes("lower back"), "user text must not be stored in plain text");
  assert.ok(!raw.includes("How long has this"), "reply must not be stored in plain text");
  const chat = savedChats().find((c) => c.userId === userId);
  assert.equal(chat.messages.length, 2);
  assert.equal(chat.sessionId, sent.thread_id);
  assert.ok(!("save" in chat) && !("filePath" in chat), "helper fields must not be written to disk");
});

test("the next turn reuses the thread id and sends the transcript for recovery", async () => {
  const userId = newUser();
  await send({ userId, message: "my lower back hurts" });
  await send({ userId, message: "since yesterday" });
  const [first, second] = stub.calls.map((c) => c.body);
  assert.equal(second.thread_id, first.thread_id);
  assert.deepEqual(second.history, [
    { role: "user", content: "my lower back hurts" },
    { role: "assistant", content: "How long has this been going on?" },
  ]);
});

test("different specialists for the same user are separate consultations", async () => {
  const userId = newUser();
  await send({ userId, message: "a", specialization: "Cardiology" });
  await send({ userId, message: "b", specialization: "Neurology" });
  assert.notEqual(stub.calls[0].body.thread_id, stub.calls[1].body.thread_id);
});

test("report summary is passed on and capped in length", async () => {
  await send({ userId: newUser(), message: "about my report", reportSummary: "x".repeat(5000) });
  assert.equal(stub.calls[0].body.report_summary.length, 3000);
  await send({ userId: newUser(), message: "no report" });
  assert.equal(stub.calls[1].body.report_summary, null);
});

// ── session lock ─────────────────────────────────────────────────────────

test("a final assessment locks the session, and the lock survives a reload", async () => {
  const userId = newUser();
  stub.next = defaultResult({
    reply: "Summary\n- ...", mode: "assessment", session_complete: true,
    citations: [{ index: 1, title: "Low Back Pain", source: "ACP", relevance: 0.66 }],
  });
  const final = await (await send({ userId, message: "everything", specialization: "Orthopedics" })).json();
  assert.equal(final.sessionComplete, true);
  assert.equal(final.citations[0].title, "Low Back Pain");

  stub.calls = [];
  const blocked = await send({ userId, message: "one more thing", specialization: "Orthopedics" });
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error, "SESSION_COMPLETE");
  assert.equal(stub.calls.length, 0, "a closed session must not reach the model");

  const history = await (await fetch(`${api}/history/${userId}/Orthopedics`)).json();
  assert.equal(history.sessionClosed, true);
  assert.equal(history.messages.length, 2);
  assert.equal(history.messages[0].text, "everything");      // decrypted for the owner
});

test("if the consult service reports the session closed, the gateway locks too", async () => {
  const userId = newUser();
  stub.next = defaultResult({ mode: "closed", reply: "This consultation is complete.", session_complete: true });
  const response = await send({ userId, message: "hello" });
  assert.equal(response.status, 403);
  assert.equal(savedChats().find((c) => c.userId === userId).sessionClosed, true);
});

test("deleting a chat deletes its consultation state and the next chat starts a new thread", async () => {
  const userId = newUser();
  await send({ userId, message: "first", specialization: "Cardiology" });
  const oldThread = stub.calls[0].body.thread_id;

  const deleted = await (await fetch(`${api}/history/${userId}/Cardiology`, { method: "DELETE" })).json();
  assert.equal(deleted.stateDeleted, true);
  assert.deepEqual(stub.deleted, [oldThread]);

  await send({ userId, message: "fresh start", specialization: "Cardiology" });
  assert.notEqual(stub.calls[1].body.thread_id, oldThread);
  assert.deepEqual(stub.calls[1].body.history, []);
});

// ── failure handling ─────────────────────────────────────────────────────

test("when the consult service is down the user gets a safe 503 and nothing is saved", async () => {
  const userId = newUser();
  stub.down = true;
  const response = await send({ userId, message: "my chest feels odd" });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, "ASSISTANT_UNAVAILABLE");
  assert.match(body.message, /emergency/);
  assert.equal(body.reply, undefined, "no medical reply may be made up by the gateway");
  assert.equal(savedChats().find((c) => c.userId === userId).messages.length, 0);
});

// ── photos ───────────────────────────────────────────────────────────────

const PNG = { bytes: Buffer.from("89504e470d0a1a0a0000", "hex"), type: "image/png", name: "rash.png" };

test("a photo is forwarded as base64, kept in the transcript, and the temp file is removed", async () => {
  const userId = newUser();
  const response = await send({ userId, message: "what is this", specialization: "Dermatology" }, PNG);
  assert.equal(response.status, 200);
  const sent = stub.calls[0].body;
  assert.equal(sent.image_b64, PNG.bytes.toString("base64"));
  assert.equal(sent.image_mime, "image/png");
  assert.match(savedChats().find((c) => c.userId === userId).messages[0].image, /^data:image\/png;base64,/);
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(fs.readdirSync(path.join(workDir, "uploads")), []);
});

test("only one photo per session, and the rejected upload is cleaned up", async () => {
  const userId = newUser();
  await send({ userId, message: "one" }, PNG);
  const second = await send({ userId, message: "two" }, PNG);
  assert.equal(second.status, 403);
  assert.equal((await second.json()).error, "IMAGE_LIMIT_REACHED");
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(fs.readdirSync(path.join(workDir, "uploads")), []);
});

test("a non-image upload is ignored", async () => {
  await send({ userId: newUser(), message: "see file" }, { bytes: Buffer.from("MZ"), type: "application/x-msdownload", name: "a.exe" });
  assert.equal(stub.calls[0].body.image_b64, null);
});

// ── streaming ────────────────────────────────────────────────────────────

test("stream endpoint relays steps, then the final result, and saves the transcript", async () => {
  const userId = newUser();
  const response = await send({ userId, message: "my lower back hurts" }, null, "/stream");
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const events = await readSse(response);
  assert.deepEqual(events.map((e) => e.event), ["step", "step", "final"]);
  assert.equal(events[1].data.label, "Understanding your message");   // event split across chunks
  assert.equal(events[2].data.reply, "How long has this been going on?");
  assert.equal(events[2].data.sessionComplete, false);
  assert.equal(stub.calls[0].url, "/api/consult/stream");
  assert.equal(savedChats().find((c) => c.userId === userId).messages.length, 2);
});

test("stream endpoint reports failure as an error event and saves nothing", async () => {
  const userId = newUser();
  stub.next = { __streamError: true };
  const events = await readSse(await send({ userId, message: "hello" }, null, "/stream"));
  assert.equal(events.at(-1).event, "error");
  assert.equal(events.at(-1).data.error, "ASSISTANT_UNAVAILABLE");
  assert.equal(savedChats().find((c) => c.userId === userId).messages.length, 0);
});

test("stream endpoint still answers validation errors as plain JSON", async () => {
  const response = await send({ message: "no user" }, null, "/stream");
  assert.equal(response.status, 400);
  assert.match(response.headers.get("content-type"), /application\/json/);
});

// ── force-final ──────────────────────────────────────────────────────────

const forceFinal = (userId, specialization) =>
  fetch(`${api}/force-final`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, specialization }),
  });

test("force-final asks for an assessment now and closes the session", async () => {
  const userId = newUser();
  await send({ userId, message: "my lower back hurts", specialization: "Orthopedics" });
  stub.next = defaultResult({ reply: "Summary\n- ...", mode: "assessment", session_complete: true });
  const body = await (await forceFinal(userId, "Orthopedics")).json();
  assert.equal(body.sessionComplete, true);
  const sent = stub.calls.at(-1).body;
  assert.equal(sent.force_final, true);
  assert.equal(sent.message, "");
  assert.equal(sent.thread_id, stub.calls[0].body.thread_id);
  const chat = savedChats().find((c) => c.userId === userId);
  assert.equal(chat.sessionClosed, true);
  assert.equal(chat.messages.length, 3);
});

test("force-final does not close the session when no assessment could be written", async () => {
  const userId = newUser();
  await send({ userId, message: "my lower back hurts", specialization: "Orthopedics" });
  stub.next = defaultResult({ reply: "I'm not able to put together a reliable answer right now.", mode: "unavailable", session_complete: false });
  const body = await (await forceFinal(userId, "Orthopedics")).json();
  assert.equal(body.sessionComplete, false);
  assert.ok(!savedChats().find((c) => c.userId === userId).sessionClosed);
});

test("force-final without a chat returns the friendly message", async () => {
  const body = await (await forceFinal(newUser(), "Orthopedics")).json();
  assert.equal(body.sessionComplete, true);
  assert.match(body.reply, /start a new session/);
  assert.equal(stub.calls.length, 0);
});

// ── specialist hand-off ──────────────────────────────────────────────────

test("a hand-off note is shown once, in front of the reply, and stored with it", async () => {
  const userId = newUser();
  stub.next = defaultResult({
    handoff_note: "This sounds like one for our Bone Specialist, so I've brought them into the conversation.",
    specialist: { category: "orthopedics", name: "Bone Specialist" },
  });
  const body = await (await send({ userId, message: "my back hurts", specialization: "Heart Specialist" })).json();
  assert.equal(body.specialist, "Bone Specialist");
  assert.ok(body.reply.startsWith("This sounds like one for our Bone Specialist"));
  assert.ok(body.reply.endsWith("How long has this been going on?"));
  const history = await (await fetch(`${api}/history/${userId}/Heart%20Specialist`)).json();
  assert.equal(history.messages[1].text, body.reply);
});

// ── patient memory ───────────────────────────────────────────────────────

const ENTRY = { date: "2026-10-07", specialist: "Bone Specialist", complaint: "lower back pain", urgency: "routine", duration: "2 days", relevant_history: "diabetes" };
const finished = (overrides = {}) => defaultResult({ reply: "Summary\n- ...", mode: "assessment", session_complete: true, memory_entry: ENTRY, ...overrides });

test("a finished consultation is remembered, encrypted, and sent with later consultations", async () => {
  const userId = newUser();
  stub.next = finished();
  await send({ userId, message: "everything", specialization: "Bone Specialist" });

  const raw = fs.readFileSync(path.join(workDir, "patient_memory.json"), "utf8");
  assert.ok(!raw.includes("lower back pain") && !raw.includes("diabetes"), "memory must be encrypted at rest");
  const memory = await (await fetch(`${api}/memory/${userId}`)).json();
  assert.deepEqual(memory.entries, [ENTRY]);

  stub.next = null;
  await send({ userId, message: "now a headache", specialization: "Brain Specialist" });
  assert.equal(stub.calls.at(-1).body.patient_memory, "2026-10-07 Bone Specialist: lower back pain for 2 days History mentioned: diabetes");
});

test("memory is per user, can be cleared, and keeps only the latest ten", async () => {
  const userId = newUser();
  for (let i = 0; i < 12; i += 1) {
    stub.next = finished({ memory_entry: { ...ENTRY, complaint: `complaint ${i}` } });
    await send({ userId, message: "x", specialization: `Spec ${i}` });
  }
  const memory = await (await fetch(`${api}/memory/${userId}`)).json();
  assert.equal(memory.entries.length, 10);
  assert.equal(memory.entries[0].complaint, "complaint 2");

  stub.next = null;
  await send({ userId: newUser(), message: "hello" });
  assert.equal(stub.calls.at(-1).body.patient_memory, null, "another user sees nothing");

  await fetch(`${api}/memory/${userId}`, { method: "DELETE" });
  assert.deepEqual((await (await fetch(`${api}/memory/${userId}`)).json()).entries, []);
});

test("with memory switched off nothing is sent and nothing is stored", async () => {
  const userId = newUser();
  stub.next = finished();
  await send({ userId, message: "first", specialization: "A", memory: "on" });
  stub.next = finished({ memory_entry: { ...ENTRY, complaint: "private thing" } });
  await send({ userId, message: "second", specialization: "B", memory: "off" });
  assert.equal(stub.calls.at(-1).body.patient_memory, null);
  const memory = await (await fetch(`${api}/memory/${userId}`)).json();
  assert.deepEqual(memory.entries.map((e) => e.complaint), ["lower back pain"]);
});

// ── clinician review ─────────────────────────────────────────────────────

const PENDING_NOTE = "Your assessment is ready and is being checked by a clinician before it is released.";
const pendingResult = () => defaultResult({ reply: PENDING_NOTE, mode: "pending_review", pending_review: true });
const review = (threadId, body, key) =>
  fetch(`${root}/review/${threadId}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(key ? { "x-reviewer-key": key } : {}) },
    body: JSON.stringify(body),
  });

test("review queue is disabled without REVIEWER_KEY and rejects a wrong key", async () => {
  assert.equal((await fetch(`${root}/review`)).status, 403);
  process.env.REVIEWER_KEY = "s3cret-key";
  assert.equal((await fetch(`${root}/review`)).status, 401);
  assert.equal((await fetch(`${root}/review`, { headers: { "x-reviewer-key": "wrong" } })).status, 401);
  stub.reviews = [{ thread_id: "abc", draft: "Summary" }];
  const listed = await (await fetch(`${root}/review`, { headers: { "x-reviewer-key": "s3cret-key" } })).json();
  assert.equal(listed.pending[0].thread_id, "abc");
});

test("while a draft is with a clinician the chat waits, then shows the released assessment", async () => {
  process.env.REVIEWER_KEY = "s3cret-key";
  const userId = newUser();
  stub.next = pendingResult();
  const first = await (await send({ userId, message: "everything", specialization: "Bone Specialist" })).json();
  assert.equal(first.pendingReview, true);
  assert.equal(first.sessionComplete, false);
  const threadId = stub.calls[0].body.thread_id;

  stub.calls = [];
  const blocked = await send({ userId, message: "any news?", specialization: "Bone Specialist" });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).error, "REVIEW_PENDING");
  assert.equal(stub.calls.length, 0);
  assert.equal((await fetch(`${api}/history/${userId}/Bone%20Specialist`).then((r) => r.json())).pendingReview, true);

  assert.equal((await review(threadId, { action: "approve" })).status, 401, "no key, no decision");
  assert.equal((await review("no-such-thread", { action: "approve" }, "s3cret-key")).status, 404);
  assert.equal((await review(threadId, { action: "burn" }, "s3cret-key")).status, 400);

  stub.reviewResult = finished({ reply: "Summary\n- Approved text", review: { action: "approve", reviewer: "Dr. Rao" } });
  const decided = await review(threadId, { action: "approve", reviewer: "Dr. Rao" }, "s3cret-key");
  assert.deepEqual(await decided.json(), { action: "approve", sessionComplete: true, mode: "assessment" });
  assert.deepEqual(stub.calls.at(-1).body, { action: "approve", text: "", reviewer: "Dr. Rao" });

  const history = await (await fetch(`${api}/history/${userId}/Bone%20Specialist`)).json();
  assert.equal(history.pendingReview, false);
  assert.equal(history.sessionClosed, true);
  assert.deepEqual(history.messages.map((m) => m.text), ["everything", PENDING_NOTE, "Summary\n- Approved text"]);
  assert.equal((await (await fetch(`${api}/memory/${userId}`)).json()).entries.length, 1, "memory is written on release");
});

test("a rejected draft unlocks the chat without closing the session", async () => {
  process.env.REVIEWER_KEY = "s3cret-key";
  const userId = newUser();
  stub.next = pendingResult();
  await send({ userId, message: "everything", specialization: "Bone Specialist" });
  const threadId = stub.calls[0].body.thread_id;
  stub.reviewResult = defaultResult({ reply: "A clinician has reviewed your case and recommends that you are seen in person.", mode: "unavailable", review: { action: "reject" } });
  await review(threadId, { action: "reject" }, "s3cret-key");
  stub.next = null;
  assert.equal((await send({ userId, message: "ok, thanks", specialization: "Bone Specialist" })).status, 200);
});

// ── report agent ─────────────────────────────────────────────────────────

const analyzeText = (text) =>
  fetch(`${root}/report/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });

test("report analysis is delegated to the report agent", async () => {
  stub.report = { status: "ok", summary: "Two values are high.", findings: ["A: 1 — High"], alerts: ["A is above range"], suggestions: ["See a doctor"], consult: { specialist: "Diabetes & Hormone Specialist" } };
  const response = await analyzeText("Fasting Blood Sugar 148 mg/dL 70 - 99");
  assert.deepEqual(await response.json(), stub.report);
  assert.equal(stub.calls[0].body.text, "Fasting Blood Sugar 148 mg/dL 70 - 99");
});

test("when the report agent is unavailable the user gets an error, never simulated results", async () => {
  const response = await analyzeText("Hemoglobin 13.5");
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.findings, undefined);
  assert.ok(!JSON.stringify(body).includes("Simulated"));
});

// ── follow-ups need the database ─────────────────────────────────────────

test("check-ins are refused clearly when the database is not connected", async () => {
  const response = await fetch(`${root}/followup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u", specialization: "X", email: "a@example.com" }),
  });
  assert.equal(response.status, 501);
  assert.equal((await response.json()).error, "FOLLOWUPS_UNAVAILABLE");
});
