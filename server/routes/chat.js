import express from "express";
import { handleChat } from "../controllers/chatController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/chat
router.post("/", upload.single("image"), handleChat);

// GET /api/chat/history/:userId/:specialization
router.get("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.getChatHistory(req, res, next));
});

// DELETE /api/chat/history/:userId/:specialization
router.delete("/history/:userId/:specialization", (req, res, next) => {
    import("../controllers/chatController.js").then(m => m.deleteChat(req, res, next));
});

export default router;
