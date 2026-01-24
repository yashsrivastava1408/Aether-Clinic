
import { generateResponse } from "./services/llmService.js";

async function testLLM() {
    console.log("Testing LLM Connection...");
    try {
        const response = await generateResponse("Hello, are you working?", null, { provider: "ollama" });
        console.log("✅ LLM Response:", response);
    } catch (error) {
        console.error("❌ LLM Failed:", error);
    }
}

testLLM();
