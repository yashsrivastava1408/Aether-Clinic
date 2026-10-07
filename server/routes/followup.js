import express from "express";
import { getDB } from "../controllers/chatController.js";
import { getMemory } from "../utils/memoryStore.js";
import {
    answerFollowUp, describeFollowUp, findFollowUp, followUpsAvailable, isValidEmail, scheduleFollowUp,
} from "../services/followUpService.js";

const router = express.Router();

const unavailable = (res) => res.status(501).json({
    error: "FOLLOWUPS_UNAVAILABLE",
    message: "Check-ins need the database to be connected.",
});

// POST /api/followup — ask for a check-in after a finished consultation
router.post("/", async (req, res) => {
    try {
        if (!followUpsAvailable()) return unavailable(res);
        const { userId, specialization, email, days = 2 } = req.body || {};
        if (!userId || !specialization) return res.status(400).json({ error: "MISSING_FIELDS" });
        if (!isValidEmail(email)) return res.status(400).json({ error: "INVALID_EMAIL" });

        const chat = await getDB().findOne({ userId, specialist: specialization });
        if (!chat || !chat.sessionClosed) {
            return res.status(409).json({ error: "CONSULTATION_NOT_FINISHED", message: "A check-in can be set up once the assessment has been given." });
        }

        const memory = await getMemory(userId);
        const followUp = await scheduleFollowUp({
            userId, specialist: specialization, email, days,
            complaint: memory.length ? memory[memory.length - 1].complaint : "",
        });
        res.status(201).json({ message: "Check-in scheduled", dueAt: followUp.dueAt });
    } catch (err) {
        console.error("FOLLOW-UP CREATE ERROR:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/followup/:token — what the emailed link shows
router.get("/:token", async (req, res) => {
    try {
        if (!followUpsAvailable()) return unavailable(res);
        const followUp = await findFollowUp(req.params.token);
        if (!followUp || followUp.status === "cancelled") return res.status(404).json({ error: "FOLLOW_UP_NOT_FOUND" });
        res.json(describeFollowUp(followUp));
    } catch (err) {
        console.error("FOLLOW-UP READ ERROR:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// POST /api/followup/:token/respond — { status: "better" | "same" | "worse", note? }
router.post("/:token/respond", async (req, res) => {
    try {
        if (!followUpsAvailable()) return unavailable(res);
        const { status, note } = req.body || {};
        if (!["better", "same", "worse"].includes(status)) return res.status(400).json({ error: "INVALID_STATUS" });
        const followUp = await findFollowUp(req.params.token);
        if (!followUp || followUp.status === "cancelled") return res.status(404).json({ error: "FOLLOW_UP_NOT_FOUND" });
        if (followUp.status === "answered") return res.status(409).json({ error: "ALREADY_ANSWERED" });
        res.json(await answerFollowUp(followUp, { status, note }));
    } catch (err) {
        console.error("FOLLOW-UP ANSWER ERROR:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// DELETE /api/followup/:token — cancel
router.delete("/:token", async (req, res) => {
    try {
        if (!followUpsAvailable()) return unavailable(res);
        const followUp = await findFollowUp(req.params.token);
        if (!followUp) return res.status(404).json({ error: "FOLLOW_UP_NOT_FOUND" });
        if (followUp.status === "pending") {
            followUp.status = "cancelled";
            await followUp.save();
        }
        res.json({ message: "Check-in cancelled" });
    } catch (err) {
        console.error("FOLLOW-UP CANCEL ERROR:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
