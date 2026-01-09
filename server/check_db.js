import mongoose from "mongoose";
import Chat from "./models/Chat.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-doctor";

const checkDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const chats = await Chat.find({});
        console.log(`\nFound ${chats.length} chat sessions:\n`);

        chats.forEach(chat => {
            console.log(`------------------------------------------------`);
            console.log(`User ID: ${chat.userId}`);
            console.log(`Specialist: ${chat.specialist}`);
            console.log(`Last Active: ${chat.lastActive}`);
            console.log(`Message Count: ${chat.messages.length}`);
            console.log(`First Message: ${chat.messages[0]?.text?.substring(0, 50)}...`);
            console.log(`------------------------------------------------\n`);
        });

        if (chats.length === 0) {
            console.log("No chats found yet. Try using the app to create one!");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkDB();
