/**
 * Follow-up agent.
 *
 * After a finished consultation the user can ask for a check-in. When it is
 * due, the scheduler emails a link (no health details in the email). The
 * answer decides what happens next: "better" closes it; "same" or "worse"
 * opens a new consultation that starts from the earlier complaint, so it goes
 * through the same emergency screen and safety checks as any other chat.
 *
 * Needs MongoDB: due follow-ups are claimed atomically, so several backend
 * replicas never send the same email twice.
 */

import crypto from "crypto";
import mongoose from "mongoose";
import FollowUp from "../models/FollowUp.js";
import { encrypt, decrypt } from "../utils/encryption.js";

const MAX_ATTEMPTS = 3;
const MAX_PER_RUN = 50;
// A claim that was never finished (the process died mid-send) is retried after this long.
const STALE_CLAIM_MS = 15 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const followUpsAvailable = () => mongoose.connection.readyState === 1;

export const isValidEmail = (email) => EMAIL_RE.test(String(email || "")) && String(email).length <= 254;

export const followUpLink = (token) => `${(process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "")}/followup/${token}`;

/**
 * Creates (or replaces) the pending check-in for one consultation.
 */
export const scheduleFollowUp = async ({ userId, specialist, email, complaint, days = 2, now = new Date() }) => {
    const wait = Math.min(14, Math.max(1, Math.round(Number(days) || 2)));
    await FollowUp.updateMany({ userId, specialist, status: "pending" }, { status: "cancelled" });
    return FollowUp.create({
        userId,
        specialist,
        email,
        token: crypto.randomBytes(24).toString("hex"),
        complaint: encrypt(String(complaint || "your recent consultation").slice(0, 200)),
        dueAt: new Date(now.getTime() + wait * 24 * 60 * 60 * 1000),
    });
};

/**
 * Sends every check-in that is due. `send` is async ({ to, link }) => void and throws on failure.
 * Returns { sent, failed }.
 */
export const processDueFollowUps = async (send, now = new Date()) => {
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < MAX_PER_RUN; i += 1) {
        // Atomic claim: only one replica gets each document.
        const due = await FollowUp.findOneAndUpdate(
            {
                $or: [
                    { status: "pending", dueAt: { $lte: now } },
                    { status: "sending", sentAt: null, claimedAt: { $lte: new Date(now.getTime() - STALE_CLAIM_MS) } },
                ],
            },
            { status: "sending", claimedAt: now, $inc: { attempts: 1 } },
            { new: true },
        );
        if (!due) break;
        try {
            await send({ to: due.email, link: followUpLink(due.token) });
            due.status = "sent";
            due.sentAt = new Date();
            sent += 1;
        } catch (err) {
            console.warn(`⚠️ Follow-up email failed (attempt ${due.attempts}): ${err.message}`);
            // Try again on a later run, a limited number of times.
            due.status = due.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
            if (due.status === "pending") due.dueAt = new Date(now.getTime() + 30 * 60 * 1000);
            failed += 1;
        }
        await due.save();
    }
    return { sent, failed };
};

export const findFollowUp = (token) => FollowUp.findOne({ token: String(token || "") });

export const describeFollowUp = (followUp) => ({
    specialist: followUp.specialist,
    complaint: decrypt(followUp.complaint),
    status: followUp.status,
    createdAt: followUp.createdAt,
});

/**
 * Records the user's answer and says what should happen next.
 */
export const answerFollowUp = async (followUp, { status, note = "" }) => {
    const complaint = decrypt(followUp.complaint);
    const cleanNote = String(note || "").trim().slice(0, 500);
    followUp.status = "answered";
    followUp.answer = status;
    followUp.answeredAt = new Date();
    await followUp.save();

    if (status === "better") {
        return {
            message: "Glad to hear you are feeling better. If the problem comes back or anything new worries you, start a new consultation any time.",
            next: null,
        };
    }
    const change = status === "worse" ? "it has got worse" : "it is about the same";
    return {
        message: status === "worse"
            ? "Sorry to hear that. Let's look at it again now. If it is severe or getting worse quickly, contact a doctor or your local emergency number."
            : "Thanks for letting me know. Let's take another look at it.",
        next: {
            specialist: followUp.specialist,
            openingMessage: `Follow-up on my earlier consultation about ${complaint}: ${change}.${cleanNote ? " " + cleanNote : ""}`,
        },
    };
};

/**
 * Starts the periodic check. Does nothing until MongoDB is connected.
 */
export const startFollowUpScheduler = ({ intervalMs = Number(process.env.FOLLOWUP_POLL_MS || 10 * 60 * 1000), send } = {}) => {
    const tick = async () => {
        if (!followUpsAvailable()) return;
        try {
            const sender = send || (await import("./emailService.js")).sendFollowUpEmail;
            const result = await processDueFollowUps(sender);
            if (result.sent || result.failed) console.log(`📬 Follow-ups: ${result.sent} sent, ${result.failed} failed`);
        } catch (err) {
            console.error("❌ Follow-up scheduler error:", err.message);
        }
    };
    const timer = setInterval(tick, intervalMs);
    timer.unref?.();
    return timer;
};
