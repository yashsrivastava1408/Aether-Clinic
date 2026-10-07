/**
 * Follow-up agent tests. These need a MongoDB you can throw away:
 *
 *   TEST_MONGO_URI=mongodb://localhost:27017 npm test
 *
 * Without TEST_MONGO_URI they are skipped. No email is ever sent: the
 * scheduler is driven by hand with a fake sender.
 */

import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MONGO = process.env.TEST_MONGO_URI;
const skip = !MONGO && "set TEST_MONGO_URI to run";
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "aether-followup-test-"));
const originalCwd = process.cwd();

let mongoose, FollowUp, Chat, service, memory, root, gateway;

before(async () => {
  if (skip) return;
  process.env.ENCRYPTION_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
  process.env.APP_URL = "https://clinic.example/";
  process.chdir(workDir);
  mongoose = (await import("mongoose")).default;
  await mongoose.connect(`${MONGO.replace(/\/$/, "")}/aether_followup_test`);
  await mongoose.connection.dropDatabase();
  FollowUp = (await import("../models/FollowUp.js")).default;
  Chat = (await import("../models/Chat.js")).default;
  service = await import("../services/followUpService.js");
  memory = await import("../utils/memoryStore.js");

  const express = (await import("express")).default;
  const app = express();
  app.use(express.json());
  app.use("/api/followup", (await import("../routes/followup.js")).default);
  gateway = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  root = `http://127.0.0.1:${gateway.address().port}/api/followup`;
});

after(async () => {
  process.chdir(originalCwd);
  fs.rmSync(workDir, { recursive: true, force: true });
  if (skip) return;
  await new Promise((r) => gateway.close(r));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (skip) return;
  await FollowUp.deleteMany({});
  await Chat.deleteMany({});
});

const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const closedChat = (userId, specialist = "Bone Specialist") =>
  Chat.create({ userId, specialist, sessionId: `s-${userId}`, messages: [], sessionClosed: true });
const DAY = 24 * 60 * 60 * 1000;

test("a check-in can only be set up after the assessment, with a real email", { skip }, async () => {
  await Chat.create({ userId: "u1", specialist: "Bone Specialist", sessionId: "s1", messages: [], sessionClosed: false });
  const open = await post(root, { userId: "u1", specialization: "Bone Specialist", email: "a@example.com" });
  assert.equal(open.status, 409);
  assert.equal((await post(root, { userId: "u1", specialization: "Nope", email: "a@example.com" })).status, 409);
  await closedChat("u2");
  assert.equal((await post(root, { userId: "u2", specialization: "Bone Specialist", email: "not-an-email" })).status, 400);
  assert.equal((await post(root, { specialization: "Bone Specialist", email: "a@example.com" })).status, 400);
  assert.equal(await FollowUp.countDocuments({}), 0);
});

test("scheduling stores the complaint encrypted and replaces an earlier pending check-in", { skip }, async () => {
  await closedChat("u3");
  await memory.addMemoryEntry("u3", { date: "2026-10-07", specialist: "Bone Specialist", complaint: "lower back pain", urgency: "routine" });
  const first = await post(root, { userId: "u3", specialization: "Bone Specialist", email: "a@example.com", days: 3 });
  assert.equal(first.status, 201);
  const dueIn = new Date((await first.json()).dueAt) - Date.now();
  assert.ok(dueIn > 2.9 * DAY && dueIn < 3.1 * DAY);
  await post(root, { userId: "u3", specialization: "Bone Specialist", email: "a@example.com", days: 99 });

  const all = await FollowUp.find({ userId: "u3" }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(all.map((f) => f.status), ["cancelled", "pending"]);
  assert.ok(new Date(all[1].dueAt) - Date.now() < 14.1 * DAY, "wait is capped at 14 days");
  assert.ok(!all[1].complaint.includes("back pain"), "complaint is encrypted at rest");
  assert.match(all[1].token, /^[0-9a-f]{48}$/);
});

test("the scheduler sends only what is due, once, with a link and no health details", { skip }, async () => {
  const now = new Date();
  await service.scheduleFollowUp({ userId: "a", specialist: "S", email: "due@example.com", complaint: "lower back pain", days: 2, now: new Date(now - 3 * DAY) });
  await service.scheduleFollowUp({ userId: "b", specialist: "S", email: "later@example.com", complaint: "cough", days: 2, now });
  const sentMail = [];
  const send = async (mail) => { sentMail.push(mail); };

  assert.deepEqual(await service.processDueFollowUps(send, now), { sent: 1, failed: 0 });
  assert.equal(sentMail.length, 1);
  assert.equal(sentMail[0].to, "due@example.com");
  assert.match(sentMail[0].link, /^https:\/\/clinic\.example\/followup\/[0-9a-f]{48}$/);
  assert.ok(!JSON.stringify(sentMail[0]).includes("back pain"));

  assert.deepEqual(await service.processDueFollowUps(send, now), { sent: 0, failed: 0 }, "nothing is sent twice");
  assert.equal((await FollowUp.findOne({ userId: "a" })).status, "sent");
  assert.equal((await FollowUp.findOne({ userId: "b" })).status, "pending");
});

test("two schedulers running at once never send the same check-in twice", { skip }, async () => {
  const now = new Date();
  for (let i = 0; i < 8; i += 1) {
    await service.scheduleFollowUp({ userId: `p${i}`, specialist: "S", email: `p${i}@example.com`, complaint: "x", days: 1, now: new Date(now - 2 * DAY) });
  }
  const sentTo = [];
  const send = async ({ to }) => { await new Promise((r) => setTimeout(r, 5)); sentTo.push(to); };
  const results = await Promise.all([service.processDueFollowUps(send, now), service.processDueFollowUps(send, now), service.processDueFollowUps(send, now)]);
  assert.equal(results.reduce((sum, r) => sum + r.sent, 0), 8);
  assert.equal(new Set(sentTo).size, 8);
  assert.equal(sentTo.length, 8);
});

test("a failed email is retried later and given up after three attempts", { skip }, async () => {
  let now = new Date();
  await service.scheduleFollowUp({ userId: "f", specialist: "S", email: "f@example.com", complaint: "x", days: 1, now: new Date(now - 2 * DAY) });
  const failing = async () => { throw new Error("smtp down"); };

  assert.deepEqual(await service.processDueFollowUps(failing, now), { sent: 0, failed: 1 });
  let doc = await FollowUp.findOne({ userId: "f" });
  assert.equal(doc.status, "pending");
  assert.ok(doc.dueAt > now, "pushed back, not retried in a tight loop");
  assert.deepEqual(await service.processDueFollowUps(failing, now), { sent: 0, failed: 0 });

  for (let i = 0; i < 2; i += 1) {
    now = new Date(now.getTime() + 60 * 60 * 1000);
    await service.processDueFollowUps(failing, now);
  }
  doc = await FollowUp.findOne({ userId: "f" });
  assert.equal(doc.status, "failed");
  assert.equal(doc.attempts, 3);
});

test("a claim left behind by a crashed sender is picked up again", { skip }, async () => {
  const now = new Date();
  const followUp = await service.scheduleFollowUp({ userId: "c", specialist: "S", email: "c@example.com", complaint: "x", days: 1, now: new Date(now - 2 * DAY) });
  await FollowUp.updateOne({ _id: followUp._id }, { status: "sending", claimedAt: new Date(now - 60 * 60 * 1000) });
  const sent = [];
  await service.processDueFollowUps(async (mail) => { sent.push(mail.to); }, now);
  assert.deepEqual(sent, ["c@example.com"]);
});

test("the emailed link shows the check-in and the answer decides what happens next", { skip }, async () => {
  const worse = await service.scheduleFollowUp({ userId: "w", specialist: "Bone Specialist", email: "w@example.com", complaint: "lower back pain", days: 1 });
  const shown = await (await fetch(`${root}/${worse.token}`)).json();
  assert.equal(shown.specialist, "Bone Specialist");
  assert.equal(shown.complaint, "lower back pain");

  assert.equal((await post(`${root}/${worse.token}/respond`, { status: "maybe" })).status, 400);
  const answer = await (await post(`${root}/${worse.token}/respond`, { status: "worse", note: "now my leg is numb" })).json();
  assert.equal(answer.next.specialist, "Bone Specialist");
  assert.equal(answer.next.openingMessage, "Follow-up on my earlier consultation about lower back pain: it has got worse. now my leg is numb");
  assert.match(answer.message, /emergency/);
  assert.equal((await post(`${root}/${worse.token}/respond`, { status: "better" })).status, 409, "one answer per check-in");

  const better = await service.scheduleFollowUp({ userId: "b", specialist: "S", email: "b@example.com", complaint: "cough", days: 1 });
  const fine = await (await post(`${root}/${better.token}/respond`, { status: "better" })).json();
  assert.equal(fine.next, null);
  assert.equal((await FollowUp.findOne({ userId: "b" })).answer, "better");
});

test("unknown and cancelled links show nothing", { skip }, async () => {
  assert.equal((await fetch(`${root}/${"0".repeat(48)}`)).status, 404);
  const followUp = await service.scheduleFollowUp({ userId: "x", specialist: "S", email: "x@example.com", complaint: "secret", days: 1 });
  assert.equal((await fetch(`${root}/${followUp.token}`, { method: "DELETE" })).status, 200);
  assert.equal((await fetch(`${root}/${followUp.token}`)).status, 404);
  assert.deepEqual(await service.processDueFollowUps(async () => { throw new Error("must not send"); }, new Date(Date.now() + 5 * DAY)), { sent: 0, failed: 0 });
});

test("email validation", { skip }, () => {
  for (const good of ["a@example.com", "first.last+tag@sub.example.co.in"]) assert.ok(service.isValidEmail(good), good);
  for (const bad of ["", "a@b", "no-at.example.com", "a b@example.com", "a@example.com\nBcc: x@y.com", null]) assert.ok(!service.isValidEmail(bad), String(bad));
});
