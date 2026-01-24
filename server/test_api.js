import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:5050/api/chat";
const USER_ID = "test-api-user-" + Date.now();
const SPEC = "Cardiologist";

const runTest = async () => {
    console.log("--- Testing Chat API ---");

    // 1. Send Message
    console.log(`\n1. Sending Message as ${USER_ID}...`);
    try {
        const formData = new FormData();
        formData.append("message", "My heart hurts");
        formData.append("userId", USER_ID);
        formData.append("specialization", SPEC);

        const res = await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        console.log("✅ Message Sent. Reply:", res.data.reply);
    } catch (e) {
        console.error("❌ Send Failed:", e.message, e.response?.data);
        return;
    }

    // 2. Fetch History
    console.log(`\n2. Fetching History...`);
    try {
        const res = await axios.get(`${API_URL}/history/${USER_ID}/${SPEC}`);
        const msgs = res.data.messages;
        console.log(`Found ${msgs.length} messages.`);

        if (msgs.length === 0) {
            console.error("❌ History is EMPTY! Database storage failed?");
        } else {
            const lastMsg = msgs[msgs.length - 2]; // User message
            console.log("Last User Message:", lastMsg.text);
            if (lastMsg.text === "My heart hurts") {
                console.log("✅ Logic Verified: Data stored & decrypted correctly.");
            } else {
                console.error("❌ Decryption Failed? Got:", lastMsg.text);
            }
        }

    } catch (e) {
        console.error("❌ History Fetch Failed:", e.message);
    }
};

runTest();
