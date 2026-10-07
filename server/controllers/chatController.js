import { encrypt, decrypt } from "../utils/encryption.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { runConsult, streamConsult, deleteConsultThread } from "../services/consultService.js";
import Chat from "../models/Chat.js";
import { chatDB } from "../utils/jsonDB.js";
import { getMemory, addMemoryEntry, clearMemory, memoryDigest } from "../utils/memoryStore.js";
import mongoose from "mongoose";

/**
 * DATABASE SELECTOR: Uses MongoDB if connected, falls back to JSON for WiFi-restricted environments.
 */
export const getDB = () => {
  return mongoose.connection.readyState === 1 ? Chat : chatDB;
};

/**
 * HISTORY SANITIZATION: Strips redundant symbols and disclaimer footers from context
 * to prevent the LLM from hallucinating/repeating them.
 */
const sanitizeContext = (text) => {
  if (!text) return "";
  
  // Strip anything after any variation of the disclaimer
  const markers = [
    "⚖️ MEDICAL LEGAL DISCLAIMER",
    "MEDICAL LEGAL DISCLAIMER",
    "🛡️ SAFETY OVERSIGHT",
    "---"
  ];
  
  let cleaned = text;
  for (const marker of markers) {
    cleaned = cleaned.split(marker)[0];
  }
  
  return cleaned
    .replace(/[━─-]{5,}/g, "") // Strip any long divider lines (various symbols)
    .trim();
};

const HISTORY_MESSAGES_SENT = 10;
const MAX_REPORT_SUMMARY_CHARS = 3000;

const UNAVAILABLE_BODY = {
  error: "ASSISTANT_UNAVAILABLE",
  message: "The medical assistant is temporarily unavailable. Please try again in a moment. " +
    "If this is an emergency, call your local emergency number.",
};

const removeUpload = (file) => {
  if (!file) return;
  fs.promises.unlink(file.path).catch(() => { });
};

/**
 * Everything that happens before the consultation runs: validation, loading
 * the chat, the session lock, and building the request for the Python service.
 * Returns { error: { status, body } } when the request cannot proceed.
 */
const prepareTurn = async (req) => {
  const { message = "", specialization = "General Medicine", userId, tier = "basic", userRam = 8, reportSummary = "", memory = "on" } = req.body || {};
  const text = String(message || "").trim();
  const memoryEnabled = memory !== "off";

  if (!userId) return { error: { status: 400, body: { error: "USER_ID_MISSING" } } };
  if (!text && !req.file) return { error: { status: 400, body: { error: "MESSAGE_MISSING" } } };

  /* ================== CHAT SESSION ================== */
  const db = getDB();
  let chat = await db.findOne({ userId, specialist: specialization });

  if (!chat) {
    chat = await db.create({
      userId,
      specialist: specialization,
      sessionId: crypto.randomUUID(),
      messages: [],
      sessionClosed: false,
      lastActive: new Date()
    });
  }
  // Chats created before consultations had their own state get an id now.
  if (!chat.sessionId) chat.sessionId = crypto.randomUUID();
  chat.memoryOff = !memoryEnabled;

  // 🚨 SESSION LOCK - Prevent chat after final report
  if (chat.sessionClosed) {
    return {
      error: {
        status: 403,
        body: {
          error: "SESSION_COMPLETE",
          message: "This consultation is complete. Please start a new session for a fresh assessment."
        }
      }
    };
  }

  // A drafted assessment is with a clinician; nothing new runs until they decide.
  if (chat.pendingReview) {
    return {
      error: {
        status: 409,
        body: {
          error: "REVIEW_PENDING",
          message: "Your assessment is being checked by a clinician. It will appear here once it is approved."
        }
      }
    };
  }

  // Image limit enforcement
  if (req.file && chat.messages.some(m => m.image)) {
    return {
      error: {
        status: 403,
        body: { error: "IMAGE_LIMIT_REACHED", message: "Only one image per session is allowed." }
      }
    };
  }

  /* ================== IMAGE HANDLING ================== */
  let imageBase64 = null;
  if (req.file) {
    imageBase64 = (await fs.promises.readFile(req.file.path)).toString("base64");
  }

  // The Python service keeps its own conversation state. This transcript is
  // only used to rebuild that state if it has been lost (restart, expiry).
  const history = chat.messages.slice(-HISTORY_MESSAGES_SENT).map(m => ({
    role: m.sender === "user" ? "user" : "assistant",
    content: sanitizeContext(decrypt(m.text)),
  })).filter(m => m.content);

  // Summaries of this user's earlier consultations (never the transcripts).
  const patientMemory = memoryEnabled ? memoryDigest(await getMemory(userId)) : "";

  return {
    chat,
    text,
    userId,
    memoryEnabled,
    imageBase64,
    imageMime: req.file?.mimetype || null,
    payload: {
      thread_id: chat.sessionId,
      message: text,
      specialization,
      tier,
      user_ram: Number(userRam) || 8,
      image_b64: imageBase64,
      image_mime: req.file?.mimetype || null,
      history,
      report_summary: String(reportSummary || "").slice(0, MAX_REPORT_SUMMARY_CHARS) || null,
      patient_memory: patientMemory || null,
    },
  };
};

/**
 * The text shown to the user: when the conversation was just handed to
 * another specialist, the hand-off note comes first.
 */
const replyText = (result) => (result.handoff_note ? `${result.handoff_note}\n\n${result.reply}` : result.reply);

/**
 * Saves the outcome of a finished consultation step to the chat document:
 * the assistant message, the session lock, the review flag and long-term memory.
 */
export const recordAssistantReply = async (chat, result, { userId, memoryEnabled = true } = {}) => {
  const reply = replyText(result);
  chat.messages.push({ sender: "ai", text: encrypt(reply), timestamp: new Date() });
  chat.pendingReview = !!result.pending_review;
  if (result.session_complete) {
    chat.sessionClosed = true;
    console.log("🔒 SESSION CLOSED - Final report delivered");
  }
  chat.lastActive = new Date();
  await chat.save();

  if (result.memory_entry && memoryEnabled) {
    await addMemoryEntry(userId || chat.userId, result.memory_entry).catch((err) =>
      console.warn("⚠️ Could not save consultation memory:", err.message));
  }
  return reply;
};

/**
 * Everything that happens after the consultation ran: saving the transcript,
 * locking the session after a final assessment, and shaping the response.
 */
const completeTurn = async (turn, result) => {
  const { chat, text, imageBase64, imageMime } = turn;

  if (result.mode === "closed") {
    chat.sessionClosed = true;
    await chat.save();
    return {
      status: 403,
      body: { error: "SESSION_COMPLETE", message: result.reply }
    };
  }

  /* ================== SAVE TO DATABASE ================== */
  chat.messages.push({
    sender: "user",
    text: encrypt(text || "Image uploaded"),
    image: imageBase64 ? `data:${imageMime};base64,${imageBase64}` : null,
    timestamp: new Date()
  });

  const reply = await recordAssistantReply(chat, result, turn);

  /* ================== RESPONSE WITH INTELLIGENCE METADATA ================== */
  return {
    status: 200,
    body: {
      reply,
      sessionComplete: !!result.session_complete, // Frontend can show "Start New Session" button
      citations: result.citations || [],
      mode: result.mode,
      specialist: result.specialist?.name || null,
      pendingReview: !!result.pending_review,
      _debug: {
        mode: result.mode,
        userTurns: result.turn_count,
        factsCollected: Object.keys(result.intake || {}).length,
        intake: result.intake || {},
        intelligence: {
          classification: result.classification,
          contextGrade: result.context_grade,
          research: result.research || [],
          handoff: !!result.handoff_note,
          citationCount: (result.citations || []).length,
          toolResults: (result.tool_results || []).map(t => ({ tool: t.tool, status: t.status })),
          providers: result.providers,
          trace: result.trace,
          safety: result.safety,
        },
        sessionLocked: !!chat.sessionClosed,
      }
    }
  };
};

/**
 * MAIN CHAT HANDLER
 */
export const handleChat = async (req, res) => {
  try {
    const turn = await prepareTurn(req);
    if (turn.error) return res.status(turn.error.status).json(turn.error.body);

    let result;
    try {
      result = await runConsult(turn.payload);
    } catch (consultErr) {
      console.error("❌ CONSULT SERVICE ERROR:", consultErr.message);
      return res.status(503).json(UNAVAILABLE_BODY);
    }

    const { status, body } = await completeTurn(turn, result);
    return res.status(status).json(body);

  } catch (err) {
    console.error("❌ CHAT ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  } finally {
    removeUpload(req.file);
  }
};

/**
 * STREAMING CHAT HANDLER (Server-Sent Events)
 * Sends `step` events while the consultation runs, then one `final` event
 * with the same body handleChat returns, or one `error` event.
 * The reply text is only sent after it has passed the safety checks.
 */
export const handleChatStream = async (req, res) => {
  let started = false;
  const send = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const turn = await prepareTurn(req);
    if (turn.error) return res.status(turn.error.status).json(turn.error.body);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    started = true;

    let result;
    try {
      result = await streamConsult(turn.payload, (step) => send("step", step));
    } catch (consultErr) {
      console.error("❌ CONSULT SERVICE ERROR:", consultErr.message);
      send("error", UNAVAILABLE_BODY);
      return res.end();
    }

    // Saved even if the browser has gone away, so the transcript matches the consultation state.
    const { status, body } = await completeTurn(turn, result);
    send(status === 200 ? "final" : "error", body);
    return res.end();

  } catch (err) {
    console.error("❌ CHAT STREAM ERROR:", err);
    if (!started) return res.status(500).json({ error: "SERVER_ERROR" });
    send("error", { error: "SERVER_ERROR" });
    return res.end();
  } finally {
    removeUpload(req.file);
  }
};

/* ================== CHAT HISTORY ================== */
export const getChatHistory = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    const db = getDB();
    const chat = await db.findOne({ userId, specialist: specialization });

    if (!chat) return res.json({ messages: [], sessionClosed: false });

    res.json({
      messages: chat.messages.map(m => ({
        ...(m.toObject ? m.toObject() : m),
        text: decrypt(m.text)
      })),
      sessionClosed: chat.sessionClosed || false,
      pendingReview: chat.pendingReview || false
    });
  } catch (err) {
    console.error("❌ GET HISTORY ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== PATIENT MEMORY ================== */
export const getPatientMemory = async (req, res) => {
  try {
    res.json({ entries: await getMemory(req.params.userId) });
  } catch (err) {
    console.error("❌ MEMORY READ ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const deletePatientMemory = async (req, res) => {
  try {
    await clearMemory(req.params.userId);
    res.json({ message: "Health memory cleared" });
  } catch (err) {
    console.error("❌ MEMORY DELETE ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== DELETE CHAT ================== */
export const deleteChat = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    const db = getDB();
    const chat = await db.findOne({ userId, specialist: specialization });
    await db.deleteOne({ userId, specialist: specialization });
    // A new chat always gets a new sessionId, so leftover state can never be
    // picked up again; deleting it here just removes it sooner.
    const stateDeleted = chat?.sessionId ? await deleteConsultThread(chat.sessionId) : true;
    res.json({ message: "Chat deleted successfully", stateDeleted });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== FORCE FINAL REPORT (EMERGENCY) ================== */
export const forceFinalReport = async (req, res) => {
  try {
    const { userId, specialization, tier = "basic", userRam = 8, memory = "on" } = req.body;
    const db = getDB();
    const chat = await db.findOne({ userId, specialist: specialization });

    if (!chat) {
      // Return a friendly message instead of a 404 error
      return res.json({
        reply: "Unable to generate report: The consultation history is missing or has been cleared. Please start a new session.",
        sessionComplete: true,
        citations: [],
        message: "Session not found, prompt to start new."
      });
    }
    if (!chat.sessionId) chat.sessionId = crypto.randomUUID();
    if (chat.pendingReview) {
      return res.status(409).json({
        error: "REVIEW_PENDING",
        message: "Your assessment is being checked by a clinician. It will appear here once it is approved."
      });
    }

    const history = chat.messages.slice(-HISTORY_MESSAGES_SENT).map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: sanitizeContext(decrypt(m.text)),
    })).filter(m => m.content);

    let result;
    try {
      result = await runConsult({
        thread_id: chat.sessionId,
        message: "",
        force_final: true,
        specialization,
        tier,
        user_ram: Number(userRam) || 8,
        history,
        patient_memory: memory !== "off" ? memoryDigest(await getMemory(userId)) || null : null,
      });
    } catch (consultErr) {
      console.error("❌ CONSULT SERVICE ERROR:", consultErr.message);
      return res.status(503).json(UNAVAILABLE_BODY);
    }

    // The session is closed only when an assessment was actually delivered
    let reply = result.reply;
    if (result.mode !== "closed") {
      reply = await recordAssistantReply(chat, result, { userId, memoryEnabled: memory !== "off" });
    }

    return res.json({
      reply,
      sessionComplete: !!result.session_complete,
      citations: result.citations || [],
      mode: result.mode,
      pendingReview: !!result.pending_review,
      message: result.session_complete ? "Final report generated and session closed" : "Report could not be generated"
    });

  } catch (err) {
    console.error("❌ FORCE FINAL ERROR:", err.message, err.stack);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/**
 * HANDLE USER FEEDBACK (FLYHAVEEL)
 * Captures user thumbs up/down and stores it for ML reinforcement loop
 */
const FEEDBACK_LOGS_PATH = fs.existsSync("/app/shared") 
  ? "/app/shared/feedback_logs.json" 
  : path.resolve("feedback_logs.json");

export const handleFeedback = async (req, res) => {
  try {
    const { userId, messageText, type, specialization } = req.body;
    if (!userId || !messageText || !type) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    // 1. Load existing feedback
    let feedbackLogs = [];
    try {
      if (fs.existsSync(FEEDBACK_LOGS_PATH)) {
        const data = fs.readFileSync(FEEDBACK_LOGS_PATH, "utf8");
        feedbackLogs = JSON.parse(data || "[]");
      }
    } catch (e) {
      console.error("Error reading feedback logs:", e);
    }

    // 2. Supplement with source context if possible
    const db = getDB();
    const chat = await db.findOne({ userId, specialist: specialization });
    let originalQuery = "";
    if (chat && chat.messages.length >= 2) {
      // Find the user message immediately preceding this AI message
      const aiMsgIndex = chat.messages.findIndex(m => m.sender === "ai" && decrypt(m.text) === messageText);
      if (aiMsgIndex > 0) {
        originalQuery = decrypt(chat.messages[aiMsgIndex - 1].text);
      }
    }

    // 3. Save new entry
    const newEntry = {
      userId,
      specialization,
      originalQuery,
      aiResponse: messageText,
      feedback: type, // "up" or "down"
      timestamp: new Date()
    };

    feedbackLogs.push(newEntry);
    fs.writeFileSync(FEEDBACK_LOGS_PATH, JSON.stringify(feedbackLogs, null, 2), "utf8");

    console.log(`🛡️  FEEDBACK LOGGED: User ${userId} flagged response as ${type}`);
    res.json({ message: "Feedback recorded. Thank you for helping us improve." });

  } catch (err) {
    console.error("❌ FEEDBACK ERROR:", err);
    res.status(500).json({ error: "FEEDBACK_STORAGE_FAILED" });
  }
};
