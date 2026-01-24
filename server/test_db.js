import mongoose from "mongoose";
import dotenv from "dotenv";
import { encrypt, decrypt } from "./utils/encryption.js";
import Chat from "./models/Chat.js";

dotenv.config();

const runTest = async () => {
    console.log("--- Testing MongoDB & Encryption ---");

    // 1. Test Encryption
    const text = "Secret Medical Data";
    const encrypted = encrypt(text);
    console.log(`Original: ${text}`);
    console.log(`Encrypted: ${encrypted}`);
    const decrypted = decrypt(encrypted);
    console.log(`Decrypted: ${decrypted}`);

    if (text !== decrypted) {
        console.error("❌ Encryption/Decryption Failed!");
    } else {
        console.log("✅ Encryption/Decryption Working");
    }

    // 2. Test MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-doctor";
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Create test chat
        const testChat = new Chat({
            userId: "test-user-123",
            specialist: "TestSpecialist",
            messages: [{
                sender: "user",
                text: encrypted
            }]
        });

        await testChat.save();
        console.log("✅ Test Chat Saved");

        // Retrieve
        const foundChat = await Chat.findOne({ userId: "test-user-123", specialist: "TestSpecialist" });
        if (foundChat) {
            console.log("✅ Retrieved Chat");
            console.log("Stored Message:", foundChat.messages[0].text);
            console.log("Decrypted Message:", decrypt(foundChat.messages[0].text));

            // Cleanup
            await Chat.deleteOne({ userId: "test-user-123", specialist: "TestSpecialist" });
            console.log("✅ Cleanup Complete");
        } else {
            console.error("❌ Failed to retrieve chat");
        }

    } catch (error) {
        console.error("❌ MongoDB Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
