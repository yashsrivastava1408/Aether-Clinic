import express from "express";
import { handleChat } from "../controllers/chatController.js";
import multer from "multer";

import rateLimit from "express-rate-limit";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Strict limit for Chat generation (Prevent LLM abuse)
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 chat requests per windowMs
    message: { error: "Too many chat requests. Please try again later." }
});

// POST /api/chat
router.post("/", chatLimiter, upload.single("image"), handleChat);

// GET /api/chat/history/:userId/:specialization
router.get("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.getChatHistory(req, res, next));
});

// DELETE /api/chat/history/:userId/:specialization
router.delete("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.deleteChat(req, res, next));
});

export default router;
