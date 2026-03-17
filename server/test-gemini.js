import dotenv from "dotenv";
dotenv.config();
import { generateResponse } from "./services/llmService.js";

async function testGemini() {
    try {
        console.log("Testing Gemini with model rotation...");
        const reply = await generateResponse("Respond with ONLY the word 'CONNECTED' if you are working.", null, { provider: "gemini" });
        console.log("Gemini Response:", reply);
    } catch (err) {
        console.error("Gemini Test Failed:", err.message);
    }
}

testGemini();
