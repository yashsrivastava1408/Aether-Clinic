import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    specialist: {
        type: String,
        required: true,
    },
    // Thread id of this consultation in the Python service (one per session)
    sessionId: {
        type: String,
    },
    // True while a drafted assessment is waiting for a clinician
    pendingReview: {
        type: Boolean,
        default: false,
    },
    // The user turned long-term memory off for this consultation
    memoryOff: {
        type: Boolean,
        default: false,
    },
    // Set once the final assessment has been delivered
    sessionClosed: {
        type: Boolean,
        default: false,
    },
    messages: [
        {
            sender: {
                type: String,
                enum: ["user", "ai"],
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            image: {
                type: String, // Store base64 or URL if needed, optional
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    lastActive: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to quickly find chat for a specific user and specialist
ChatSchema.index({ userId: 1, specialist: 1 });

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
