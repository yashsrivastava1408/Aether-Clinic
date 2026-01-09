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
