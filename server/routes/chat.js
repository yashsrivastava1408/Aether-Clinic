import express from "express";
import { handleChat } from "../controllers/chatController.js";
import multer from "multer";

import rateLimit from "express-rate-limit";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Limit for Chat generation (AI Abuse Protection)
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Limit each IP to 100 chat requests per 15 mins
    message: { error: "Too many chat requests. Please try again later." },
    skip: (req) => req.headers['user-agent']?.includes('k6'), // Smart bypass for testing
});

// POST /api/chat
router.post("/", chatLimiter, upload.single("image"), handleChat);


// POST /api/chat/force-final (Manual Trigger)
router.post("/force-final", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.forceFinalReport(req, res, next));
});

// POST /api/chat/feedback (User Feedback Loop)
router.post("/feedback", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.handleFeedback(req, res, next));
});

// GET /api/chat/history/:userId/:specialization
router.get("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.getChatHistory(req, res, next));
});

// DELETE /api/chat/history/:userId/:specialization
router.delete("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.deleteChat(req, res, next));
});

export default router;
