import express from "express";
import { handleChat } from "../controllers/chatController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/chat
router.post("/", upload.single("image"), handleChat);

export default router;
