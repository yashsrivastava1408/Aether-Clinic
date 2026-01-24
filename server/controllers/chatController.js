import { generateResponse } from "../services/llmService.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import fs from "fs";
import path from "path";
import { getVisionPrompt } from "../services/prompts/visionPrompt.js";
import { getTextPrompt } from "../services/prompts/textPrompt.js";
import { retrieveContext } from "../services/ragService.js";

const CHAT_LOGS_PATH = path.resolve("chat_logs.json");

/**
 * FILE HELPER: READ LOCKS
 */
const readLogs = () => {
  try {
    if (!fs.existsSync(CHAT_LOGS_PATH)) return [];
    const data = fs.readFileSync(CHAT_LOGS_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("❌ Error reading chat logs:", err);
    return [];
  }
};

/**
 * FILE HELPER: WRITE LOCKS
 */
const writeLogs = (logs) => {
  try {
    fs.writeFileSync(CHAT_LOGS_PATH, JSON.stringify(logs, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Error writing chat logs:", err);
  }
};

/**
 * FACT EXTRACTION - MEDICAL SIGNALS ONLY
 * Conversational words removed to prevent false positives
 */
function extractFacts(messages) {
  const text = messages.join(" ").toLowerCase();

  return {
    // Location: anatomical terms or general pain indicators
    location: /(back|left|right|side|upper|lower|spine|shoulder|chest|arm|neck|hand|finger|wrist|knee|leg|foot|ankle|head|abdomen|stomach|pain|hurt|ache|sore|muscle|bone|nerve)/i.test(text),

    // Duration: time indicators
    duration: /(since|yesterday|today|day|hour|week|month|ago|for|past|started|began|now|currently)/i.test(text),

    // Pattern: quality descriptors
    pattern: /(constant|intermittent|comes?|goes?|occasional|sharp|dull|throbbing|ache|aching|burning|stabbing|tingling|numb|worse|better|improving|heavy|tight)/i.test(text),

    // Trigger: activities/contexts
    trigger: /(when|after|during|exercise|movement|lifting|rest|sleep|breathing|sitting|standing|walking|eating|bending|twisting|accident|injury|fall|hit)/i.test(text),
  };
}

/**
 * CONCLUSION REQUEST DETECTION
 * User explicitly asking for assessment
 */
function isAskingForConclusion(message) {
  if (!message) return false;

  const patterns = [
    /what (is|could|might|can) (it|this|the problem)/i,
    /(summary|conclusion|report|diagnosis|assessment)/i,
    /what('s| is) (wrong|the issue|my problem)/i,
    /(should i|do i need to|can i|must i) (see|visit|go to|consult)/i,
    /is (it|this) (serious|bad|dangerous|normal|okay)/i,
  ];
  return patterns.some(p => p.test(message));
}

/**
 * NEGATIVE CONFIRMATION DETECTION
 * User signaling they have nothing more to add
 */
function isNegativeConfirmation(message) {
  if (!message) return false;

  // Must start with these or be very short
  return /^(no|nothing else|only that|just that|not really|doesn't|nope|nah)\b/i.test(message.trim()) ||
    (/\b(only|just)\b/i.test(message) && message.length < 30);
}

/**
 * MAIN CHAT HANDLER
 */
export const handleChat = async (req, res) => {
  try {
    const { message, specialization = "General Medicine", userId } = req.body;
    if (!userId) return res.status(400).json({ error: "USER_ID_MISSING" });

    /* ================== IMAGE HANDLING ================== */
    let imageBase64 = null;
    if (req.file) {
      const buffer = await fs.promises.readFile(req.file.path);
      imageBase64 = buffer.toString("base64");
    }

    /* ================== CHAT SESSION ================== */
    const logs = readLogs();
    let chat = logs.find(c => c.userId === userId && c.specialist === specialization);

    if (!chat) {
      chat = { userId, specialist: specialization, messages: [], sessionClosed: false, lastActive: new Date() };
      logs.push(chat);
      writeLogs(logs);
    }

    // 🚨 SESSION LOCK - Prevent chat after final report
    if (chat.sessionClosed) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: "SESSION_COMPLETE",
        message: "This consultation is complete. Please start a new session for a fresh assessment."
      });
    }

    // Image limit enforcement
    if (req.file && chat.messages.some(m => m.image)) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: "IMAGE_LIMIT_REACHED",
        message: "Only one image per session is allowed."
      });
    }

    /* ================== HISTORY CONTEXT ================== */
    const recentMessages = chat.messages.slice(-10);
    const historyContext = recentMessages.length
      ? "\n\nRecent conversation:\n" +
      recentMessages.map(m =>
        `${m.sender === "user" ? "User" : "Assistant"}: ${decrypt(m.text)}`
      ).join("\n")
      : "";

    /* ================== FACT EXTRACTION ================== */
    const userTexts = recentMessages
      .filter(m => m.sender === "user")
      .map(m => decrypt(m.text));
    if (message) userTexts.push(message);

    const facts = extractFacts(userTexts);
    const knownFacts = Object.values(facts).filter(Boolean).length;
    const userTurns = chat.messages.filter(m => m.sender === "user").length + 1;

    /* ================== GATE TRIGGERS (CLEAN SEPARATION) ================== */
    const userAsksForConclusion = isAskingForConclusion(message);
    const userSignalsComplete = isNegativeConfirmation(message);

    // BALANCED THRESHOLDS (production-safe)
    const hasEnoughFacts = knownFacts >= 3;
    const conversationTooLong = userTurns >= 3; // ✅ UX completion gate

    // Force final if ANY condition met
    const forceFinal =
      userAsksForConclusion ||    // User explicitly asks
      userSignalsComplete ||       // User signals done ("no", "only that")
      hasEnoughFacts ||            // Medical facts collected
      conversationTooLong;         // Safety net (UX)

    /* ================== DEBUG LOGGING ================== */
    console.log("🔍 GATE DECISION:", {
      message: message?.substring(0, 60),
      facts,
      knownFacts,
      userTurns,
      triggers: {
        asksForConclusion: userAsksForConclusion,
        signalsComplete: userSignalsComplete,
        hasEnoughFacts,
        conversationTooLong
      },
      DECISION: forceFinal ? '🎯 FINAL REPORT' : '❓ INVESTIGATION'
    });

    /* ================== RAG RETRIEVAL ================== */
    const ragQuery = [
      message || "",
      ...userTexts.slice(-3)
    ].join(" ").toLowerCase();

    console.log("🔍 RAG QUERY:", ragQuery.substring(0, 100));

    const retrievedContext = retrieveContext(ragQuery);
    const hasRAG = retrievedContext && retrievedContext.trim().length > 0;

    console.log("📚 RAG STATUS:", {
      found: hasRAG,
      length: retrievedContext?.length || 0,
      preview: retrievedContext?.substring(0, 120)
    });

    /* ================== SYSTEM PROMPT CONSTRUCTION ================== */
    let systemPrompt;

    if (forceFinal) {
      systemPrompt = `You are a Medical Triage Assistant specializing in ${specialization}.

${hasRAG ? `
╔═══════════════════════════════════════════════════════════════╗
║  🏥 AUTHORITATIVE MEDICAL PROTOCOL (PRIORITY KNOWLEDGE)       ║
╚═══════════════════════════════════════════════════════════════╝

${retrievedContext}

⚠️  CRITICAL INSTRUCTIONS:
    • This protocol OVERRIDES general medical knowledge
    • Apply these recommendations FIRST before general advice
    • Include protocol-specific warnings verbatim
    • ALWAYS cite as: "(Source: Internal Medical Protocol)"

╔═══════════════════════════════════════════════════════════════╗
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MODE: FINAL MEDICAL ASSESSMENT (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST provide a complete, structured assessment NOW.
DO NOT ask additional questions.
DO NOT defer without providing analysis.

REQUIRED FORMAT (use EXACTLY these emojis):

📝 Summary:
One clear sentence describing what the user reported and key context.

💡 General Possibilities:
- List 2-3 COMMON, NON-ALARMING potential explanations
- Start with most benign/common causes
- Use accessible, non-technical language
${hasRAG ? '- PRIORITIZE protocol-specific conditions if relevant' : ''}

🧠 Suggestions:
- Practical self-care: rest, ice/heat, posture, hydration
- Over-the-counter options if appropriate
- Lifestyle modifications
${hasRAG ? '- Protocol-recommended interventions (MUST CITE SOURCE)' : ''}

🚨 When to Seek Urgent Care:
- 1-2 RED FLAG symptoms requiring immediate medical attention
${hasRAG ? '- Include any protocol-mandated warnings (MUST CITE SOURCE)' : ''}

🤔 Optional Follow-up:
- ONE gentle question about managing or monitoring the condition

TONE: Warm, professional, evidence-based, non-diagnostic
REMEMBER: You are providing triage guidance, not a diagnosis.`;

    } else {
      systemPrompt = `You are a Medical Triage Assistant specializing in ${specialization}.

${hasRAG ? `
╔═══════════════════════════════════════════════════════════════╗
║  📋 RELEVANT MEDICAL CONTEXT                                  ║
╚═══════════════════════════════════════════════════════════════╝

${retrievedContext}

Keep this protocol in mind while gathering information.

╔═══════════════════════════════════════════════════════════════╗
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MODE: INFORMATION GATHERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRICT RULES:
- Ask ONLY ONE clear, specific question
- NO diagnoses, possibilities, or medical conclusions
- NO advice or treatment recommendations yet
- Keep warm, conversational, and empathetic

CURRENT PRIORITY: ${!facts.location ? 'WHERE exactly is the issue located?' :
          !facts.duration ? 'HOW LONG has this been happening?' :
            !facts.pattern ? 'WHAT does it feel like? (describe the quality/pattern)' :
              'WHAT makes it better or worse? (triggers/relieving factors)'
        }`;
    }

    /* ================== BUILD FINAL PROMPT ================== */
    const prompt = getTextPrompt(
      specialization,
      systemPrompt,
      historyContext
    ) + (message ? `\n\nUser: ${message}` : "");

    /* ================== LLM CALL ================== */
    const aiReply = await generateResponse(
      prompt,
      req.file ? imageBase64 : null,
      { provider: req.file ? "gemini" : "ollama" }
    );

    if (req.file) fs.unlinkSync(req.file.path);

    /* ================== SESSION LOCK ON FINAL REPORT ================== */
    if (forceFinal) {
      chat.sessionClosed = true;
      console.log("🔒 SESSION CLOSED - Final report delivered");
    }

    /* ================== SAVE TO DATABASE ================== */
    chat.messages.push({
      sender: "user",
      text: encrypt(message || "Image uploaded"),
      image: imageBase64 ? `data:${req.file?.mimetype};base64,${imageBase64}` : null,
      timestamp: new Date()
    });

    chat.messages.push({
      sender: "ai",
      text: encrypt(aiReply),
      timestamp: new Date()
    });

    chat.lastActive = new Date();
    const finalLogs = readLogs().map(c =>
      (c.userId === userId && c.specialist === specialization) ? chat : c
    );
    writeLogs(finalLogs);

    /* ================== RESPONSE WITH DEBUG INFO ================== */
    return res.json({
      reply: aiReply,
      sessionComplete: forceFinal, // Frontend can show "Start New Session" button
      _debug: {
        mode: forceFinal ? 'FINAL_REPORT' : 'INVESTIGATION',
        userTurns,
        factsCollected: knownFacts,
        ragUsed: hasRAG,
        sessionLocked: chat.sessionClosed,
        triggers: {
          asksForConclusion: userAsksForConclusion,
          signalsComplete: userSignalsComplete,
          hasEnoughFacts,
          conversationTooLong
        }
      }
    });

  } catch (err) {
    console.error("❌ CHAT ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== CHAT HISTORY ================== */
export const getChatHistory = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    const logs = readLogs();
    const chat = logs.find(c => c.userId === userId && c.specialist === specialization);

    if (!chat) return res.json({ messages: [], sessionClosed: false });

    res.json({
      messages: chat.messages.map(m => ({
        ...m,
        text: decrypt(m.text)
      })),
      sessionClosed: chat.sessionClosed || false
    });
  } catch (err) {
    console.error("❌ GET HISTORY ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== DELETE CHAT ================== */
export const deleteChat = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    const logs = readLogs();
    const filteredLogs = logs.filter(c => !(c.userId === userId && c.specialist === specialization));
    writeLogs(filteredLogs);
    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

/* ================== FORCE FINAL REPORT (EMERGENCY) ================== */
export const forceFinalReport = async (req, res) => {
  try {
    const { userId, specialization } = req.body;

    const logs = readLogs();
    const chat = logs.find(c => c.userId === userId && c.specialist === specialization);

    if (!chat) {
      // Return a friendly message instead of a 404 error
      return res.json({
        reply: "Unable to generate report: The consultation history is missing or has been cleared. Please start a new session.",
        sessionComplete: true,
        message: "Session not found, prompt to start new."
      });
    }

    // Extract all user messages for context
    const userTexts = chat.messages
      .filter(m => m.sender === "user")
      .map(m => decrypt(m.text));

    // Build comprehensive summary context
    const summaryContext = userTexts.join(". ");

    // Force final report prompt - EXACT USER FORMAT
    const forcedPrompt = `You are a Medical Triage Assistant - ${specialization}.
Based on the following conversation, provide the final report EXACTLY in this format:

📝 Summary:
[One clear sentence describing what the user reported and context]

💡 General Possibilities:
[List 2-3 COMMON, NON-ALARMING potential explanations]
[Start with most benign/common causes]
[Use accessible, non-technical language]

🧠 Suggestions:
[Practical self-care: rest, ice/heat, posture, hydration]
[Elevate/Movement advice]
[Monitor symptoms advice]

🚨 When to Seek Urgent Care:
[Increasing pain, swelling, redness, or warmth]
[Inability to bear weight/function]
[Numbness, tingling, or visible deformity]
[Pain that does not improve]

🤔 Optional Follow-up:
[ONE gentle question about support or exercises]

⸻

If you want to start a new assessment, just let me know.

CONTEXT:
${summaryContext}
`;

    // Generate forced final report
    const aiReply = await generateResponse(forcedPrompt, null, {
      provider: "ollama"
    });

    // Mark session as closed
    chat.sessionClosed = true;

    chat.messages.push({
      sender: "ai",
      text: encrypt(aiReply),
      timestamp: new Date()
    });

    chat.lastActive = new Date();
    const emergencyLogs = readLogs().map(c =>
      (c.userId === userId && c.specialist === specialization) ? chat : c
    );
    writeLogs(emergencyLogs);

    return res.json({
      reply: aiReply,
      sessionComplete: true,
      message: "Final report generated and session closed"
    });

  } catch (err) {
    console.error("❌ FORCE FINAL ERROR:", err.message, err.stack);
    return res.status(500).json({
      error: "SERVER_ERROR",
      details: err.message,
      hint: "Check server logs for LLM connection issues."
    });
  }
};