/**
 * Clinician review queue (human in the loop).
 *
 * When the Python service runs with REVIEW_MODE=urgent|all, a drafted
 * assessment waits here until a clinician approves, edits or rejects it.
 *
 * Access needs the shared REVIEWER_KEY in the `x-reviewer-key` header.
 * Without REVIEWER_KEY set on the server, the queue is disabled.
 */

import express from "express";
import crypto from "crypto";
import { listReviews, submitReview } from "../services/consultService.js";
import { getDB, recordAssistantReply } from "../controllers/chatController.js";

const router = express.Router();

const requireReviewer = (req, res, next) => {
    const expected = process.env.REVIEWER_KEY || "";
    if (!expected) return res.status(403).json({ error: "REVIEW_DISABLED", message: "Set REVIEWER_KEY on the server to use the review queue." });
    const given = String(req.headers["x-reviewer-key"] || "");
    const a = crypto.createHash("sha256").update(given).digest();
    const b = crypto.createHash("sha256").update(expected).digest();
    if (!crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "INVALID_REVIEWER_KEY" });
    next();
};

// GET /api/review — drafts waiting for a decision
router.get("/", requireReviewer, async (req, res) => {
    try {
        res.json(await listReviews());
    } catch (err) {
        console.error("❌ REVIEW LIST ERROR:", err.message);
        res.status(503).json({ error: "ASSISTANT_UNAVAILABLE" });
    }
});

// POST /api/review/:threadId — { action: "approve" | "edit" | "reject", text?, reviewer? }
router.post("/:threadId", requireReviewer, async (req, res) => {
    const { action, text = "", reviewer = "" } = req.body || {};
    try {
        const chat = await getDB().findOne({ sessionId: req.params.threadId });
        if (!chat) return res.status(404).json({ error: "CHAT_NOT_FOUND" });

        let result;
        try {
            result = await submitReview(req.params.threadId, { action, text, reviewer });
        } catch (err) {
            const status = err.response?.status;
            if (status === 400 || status === 404) return res.status(status).json(err.response.data);
            console.error("❌ REVIEW SUBMIT ERROR:", err.message);
            return res.status(503).json({ error: "ASSISTANT_UNAVAILABLE" });
        }

        // The released (or replacement) reply is added to the patient's transcript.
        await recordAssistantReply(chat, result, { userId: chat.userId, memoryEnabled: !chat.memoryOff });
        res.json({ action: result.review?.action, sessionComplete: !!result.session_complete, mode: result.mode });
    } catch (err) {
        console.error("❌ REVIEW ERROR:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
