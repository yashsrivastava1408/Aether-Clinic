import { generateResponse } from "../services/llmService.js";
import fs from "fs";
import Chat from "../models/Chat.js";

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

    // 1. Retrieve previous context (optional, but good for continuity)
    // For now, we just fetch the last few messages to build context if needed, 
    // but the prompt structure currently is single-turn focused.
    // We will stick to the existing prompt structure for consistency, but save the result.

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

If the user provides a symptom, health concern, OR an image, YOU MUST FOLLOW THIS EXACT STRUCTURE:

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

---

Current Input:
Specialization: ${specialization}  
User Message: ${message || "Image provided for analysis"}
Dr. AI:
`;

    const aiReply = await generateResponse(prompt, imageBase64, { provider: "ollama" });

    // Cleanup the uploaded file if needed
    if (file) {
      try { frame.unlinkSync(file.path); } catch (e) { } // best effort cleanup
      fs.unlinkSync(file.path);
    }

    // 2. Save to Database
    let chat = await Chat.findOne({ userId, specialist: specialization });

    if (!chat) {
      chat = new Chat({ userId, specialist: specialization, messages: [] });
    }

    // Add User Message
    chat.messages.push({
      sender: "user",
      text: message || "Image uploaded",
      image: imageBase64 ? `data:${file.mimetype};base64,${imageBase64}` : null,
      timestamp: new Date()
    });

    // Add AI Message
    chat.messages.push({
      sender: "ai",
      text: aiReply,
      timestamp: new Date()
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
      let logEntry = logs.find(l => l.userId === userId && l.specialist === specialization);
      if (!logEntry) {
        logEntry = { userId, specialist: specialization, messages: [] };
        logs.push(logEntry);
      }

      logEntry.messages.push({ sender: "user", text: message || "Image", timestamp: new Date() });
      logEntry.messages.push({ sender: "ai", text: aiReply, timestamp: new Date() });

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

    res.json({ messages: chat.messages });
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