import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const runTest = async () => {
    console.log("\n--- Testing gemini-2.0-flash on v1 ---");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Using option in getGenerativeModel to enforce v1
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: "v1" });

    try {
        const result = await model.generateContent("Hello, are you functional?");
        console.log("✅ Success! Response:", result.response.text());
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
    }
};

runTest();
