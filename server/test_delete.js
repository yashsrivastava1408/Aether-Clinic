import axios from "axios";
import mongoose from "mongoose";
import Chat from "./models/Chat.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:5050/api/chat";
const USER_ID = "test-delete-user-" + Date.now();
const SPEC = "TestSpecialistDelete";

const runTest = async () => {
    console.log("--- Testing History Deletion (Start New Chat) ---");

    try {
        // 0. Ensure clean start (Direct DB)
        const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-doctor";
        await mongoose.connect(MONGO_URI);
        await Chat.deleteOne({ userId: USER_ID, specialist: SPEC });
        console.log("✅ Cleaned DB for test user");

        // 1. Create a Chat (via API)
        console.log(`\n1. Creating Chat...`);
        const formData = new FormData();
        formData.append("message", "Hello, do I exist?");
        formData.append("userId", USER_ID);
        formData.append("specialization", SPEC);

        await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        console.log("✅ Chat Created");

        // 2. Verify History Exists
        console.log(`\n2. Verifying History...`);
        let res = await axios.get(`${API_URL}/history/${USER_ID}/${SPEC}`);
        if (res.data.messages && res.data.messages.length > 0) {
            console.log(`✅ History Found (${res.data.messages.length} msgs)`);
        } else {
            console.error("❌ Failed to create history!");
            return;
        }

        // 3. Delete History (The 'New Chat' action)
        console.log(`\n3. Deleting History (Simulating 'New Chat')...`);
        await axios.delete(`${API_URL}/history/${USER_ID}/${SPEC}`);
        console.log("✅ Delete Request Sent");

        // 4. Verify History is GONE
        console.log(`\n4. Verifying History is GONE...`);
        res = await axios.get(`${API_URL}/history/${USER_ID}/${SPEC}`);
        if (!res.data.messages || res.data.messages.length === 0) {
            console.log("✅ Logic Verified: History is empty. 'New Chat' will start fresh.");
        } else {
            console.error("❌ History was NOT deleted! Found:", res.data.messages.length);
        }

    } catch (e) {
        console.error("❌ Test Failed:", e.message, e.response?.data);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
