import express from "express";
import { handleChat } from "../controllers/chatController.js";
import multer from "multer";

import rateLimit from "express-rate-limit";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Limit for Chat generation (DISABLED FOR DEVELOPMENT)
// const chatLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 200,
//     message: { error: "Too many chat requests. Please try again later." }
// });

// POST /api/chat (rate limiter disabled)
router.post("/", upload.single("image"), handleChat);

// POST /api/chat/force-final (Manual Trigger)
router.post("/force-final", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.forceFinalReport(req, res, next));
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
