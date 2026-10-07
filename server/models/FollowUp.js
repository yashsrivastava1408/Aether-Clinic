import mongoose from "mongoose";

// A check-in the user asked for after a finished consultation.
const FollowUpSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    specialist: { type: String, required: true },
    email: { type: String, required: true },
    // Unguessable id used in the emailed link
    token: { type: String, required: true, unique: true },
    // AES-encrypted short description of what the consultation was about
    complaint: { type: String, required: true },
    dueAt: { type: Date, required: true, index: true },
    // pending → sending → sent → answered; or cancelled / failed
    status: { type: String, enum: ["pending", "sending", "sent", "answered", "cancelled", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    claimedAt: { type: Date },
    answer: { type: String },
    createdAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    answeredAt: { type: Date },
});

const FollowUp = mongoose.model("FollowUp", FollowUpSchema);
export default FollowUp;
