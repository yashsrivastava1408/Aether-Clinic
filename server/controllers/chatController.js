import { generateResponse } from "../services/llmService.js";
import fs from "fs";
import Chat from "../models/Chat.js";
import { encrypt, decrypt } from "../utils/encryption.js";

export const handleChat = async (req, res) => {
  try {
    const { message, specialization = "General Medicine", userId } = req.body;
    const file = req.file;

    // Validation
    if ((!message && !file) || !userId) {
      return res.status(400).json({ error: "Message/Image and UserID are required" });
    }

    let imageBase64 = null;
    if (file) {
      const bitmap = fs.readFileSync(file.path);
      imageBase64 = Buffer.from(bitmap).toString("base64");
    }

    const visionContext = file
      ? "The user has provided an image for analysis. Focus on describing what you see in the context of their symptoms and the specialization."
      : "";

    // 1. Retrieve & Prepare Context
    // We fetch the chat history FIRST to provide context to the AI.
    let chat = await Chat.findOne({ userId, specialist: specialization });

    if (!chat) {
      chat = new Chat({ userId, specialist: specialization, messages: [] });
    }

    // Get last 10 messages to track conversation depth
    const recentMessages = chat.messages.slice(-10);
    const historyContext = recentMessages
      .map((msg) => {
        const role = msg.sender === "user" ? "User" : "Dr. AI";
        const content = decrypt(msg.text);
        return `${role}: ${content}`;
      })
      .join("\n");

    // Check if the previous message was a final report (contains "Summary:")
    // If so, we reset the count because the user is likely starting a NEW topic.
    const lastAiMessage = recentMessages.filter(m => m.sender === "ai").pop();
    const lastWasReport = lastAiMessage && decrypt(lastAiMessage.text).includes("Summary:");

    // Calculate how many questions Dr. AI has already asked since the last report
    let aiQuestionCount = 0;

    // We only count questions that happened AFTER the last report (if any)
    let searchMessages = recentMessages;
    if (lastWasReport) {
      // Find index of last report and slice messages after it
      // This effectively "resets" the counter for the new topic
      const lastReportIndex = recentMessages.findIndex(m => m === lastAiMessage);
      searchMessages = recentMessages.slice(lastReportIndex + 1);
    }

    aiQuestionCount = searchMessages.filter(
      (m) => m.sender === "ai" && decrypt(m.text).includes("?")
    ).length;

    const forceConclusion = aiQuestionCount >= 3; // Limit to ~3 turns of active investigation

    // Logic Control: Determine which instruction set to show
    let logicInstruction = "";
    if (forceConclusion) {
      logicInstruction = `
[MODE: FINAL REPORT]
You have gathered enough information. You MUST now provide the full structured report.
FOLLOW THIS EXACT STRUCTURE:

📝 Summary: One friendly sentence summarizing their concern or the image provided.  

💡 General Possibilities:  
- 2–3 likely, general factors related to ${specialization} or the visual findings in the image.  

🧠 Suggestions:  
- Safe lifestyle or monitoring advice (hydration, tracking symptoms, breathing, rest, etc).  
- Clear, practical steps to manage or observe symptoms.  

🚨 When to Seek Urgent Care:  
- 1–2 critical warning signs (e.g., infection signs for wounds, spreading pain, etc).  

🤔 Follow-up:  
- End with one warm, natural question that invites the user to share more details.
      `;
    } else {
      logicInstruction = `
[MODE: INVESTIGATION]
The user has shared a symptom. You need more details.
1. Check Previous Conversation below.
2. Ask 1-2 SHORT, warm questions (e.g., "Sharp or dull?", "How long?").
3. DO NOT give the full report yet. Just ask kindly.
      `;
    }

    const prompt = `
You are Dr. AI, an intelligent, empathetic medical assistant for "Aether Clinic". 
You sound like a warm, knowledgeable doctor who explains things clearly and safely — never cold or robotic.

${visionContext}

Your job is to guide users based on their messages (and images if provided), focusing on general medical advice, awareness, and when to seek real care — never diagnosis or prescriptions.

🧠 Persona:
- Friendly, calm, professional — like a reassuring doctor who listens first.
- Always structured and easy to read.
- You use relevant emojis to make responses more engaging and human.
- You naturally bring the conversation back to the user’s symptoms or health if they go off-topic.
- You adapt to the user’s selected specialization: ${specialization}.

⚠️ Golden Rules:
1. Never give a real diagnosis or medication name/dosage.  
2. Give general possibilities, lifestyle tips, and clear “when to see a doctor” guidance.  
3. Keep responses clear and organized.
4. Always end with a friendly, open-ended follow-up question.

---

CONTEXT CHECK:
If the user's message is just a greeting (e.g., "Hi", "Hello", "Hey") and NO image is provided, reply warmly:
"👋 Hello! I am Dr. AI, your ${specialization} assistant. I'm here to listen. How are you feeling today?"

---

⚠️ CURRENT INSTRUCTION:
${logicInstruction}

---

📜 Previous Conversation (For Context Only):
${historyContext}

---

Current Input:
Specialization: ${specialization}  
User Message: ${message || "Image provided for analysis"}
Dr. AI:
`;

    const aiReply = await generateResponse(prompt, imageBase64, { provider: "ollama" });

    // Cleanup the uploaded file if needed
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) { } // best effort cleanup
    }

    // 2. Save new messages to Database
    // Add User Message
    chat.messages.push({
      sender: "user",
      text: encrypt(message || "Image uploaded"),
      image: imageBase64 ? `data:${file.mimetype};base64,${imageBase64}` : null,
      timestamp: new Date(),
    });

    // Add AI Message
    chat.messages.push({
      sender: "ai",
      text: encrypt(aiReply),
      timestamp: new Date(),
    });

    chat.lastActive = new Date();
    await chat.save();

    // --- JSON FILE LOGGING (For easy viewing) ---
    try {
      const logPath = "./chat_logs.json";
      let logs = [];
      if (fs.existsSync(logPath)) {
        const data = fs.readFileSync(logPath);
        logs = JSON.parse(data);
      }

      // Find or create simple log entry
      let logEntry = logs.find(
        (l) => l.userId === userId && l.specialist === specialization
      );
      if (!logEntry) {
        logEntry = { userId, specialist: specialization, messages: [] };
        logs.push(logEntry);
      }

      logEntry.messages.push({
        sender: "user",
        text: encrypt(message || "Image"),
        timestamp: new Date(),
      });
      logEntry.messages.push({
        sender: "ai",
        text: encrypt(aiReply),
        timestamp: new Date(),
      });

      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.error("JSON Log Error:", err);
    }
    // ---------------------------------------------

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("❌ Chat error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    const chat = await Chat.findOne({ userId, specialist: specialization });

    if (!chat) return res.json({ messages: [] });

    const decryptedMessages = chat.messages.map(msg => ({
      ...msg.toObject(),
      text: decrypt(msg.text)
    }));

    res.json({ messages: decryptedMessages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { userId, specialization } = req.params;
    await Chat.deleteOne({ userId, specialist: specialization });
    res.json({ message: "Chat deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete chat" });
  }
};