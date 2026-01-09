import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// Gemini initialization helper
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Main entry point for AI responses.
 * Uses a hybrid approach:
 * - Local Ollama for standard text conversations (Privacy/Local).
 * - Gemini Cloud for Vision and complex Report Analysis (Performance/Speed).
 * 
 * @param {string} prompt - The text prompt
 * @param {string} imageBase64 - Optional base64 image data
 * @param {Object} options - Options including 'provider' (ollama or gemini)
 */
export const generateResponse = async (prompt, imageBase64 = null, options = {}) => {
  const { provider = "ollama" } = options;

  try {
    // Switch to Gemini if image is provided OR provider is specifically gemini
    if (imageBase64 || provider === "gemini") {
      const genAI = getGenAI();
      if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set. Gemini features (Vision/Report Analysis) are disabled.");
      }
      return await generateGeminiResponse(prompt, imageBase64, genAI);
    }

    // Default to local Ollama for regular text chat to save costs
    return await generateOllamaResponse(prompt);
  } catch (error) {
    console.error(`❌ LLM Service Error [${provider}]:`, error.message);
    throw error;
  }
};

/**
 * Internal helper for local Ollama calls.
 * Uses the llama3.2 model which is optimized for speed/accuracy balance.
 */
const generateOllamaResponse = async (prompt) => {
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
  const response = await axios.post(`${ollamaHost}/api/generate`, {
    model: "llama3.2",
    prompt: prompt,
    stream: false,
  });
  return response.data.response;
};

/**
 * Internal helper for cloud Gemini calls.
 */
const generateGeminiResponse = async (prompt, imageBase64 = null, genAI) => {
  // Verified list from REST check
  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      if (imageBase64) {
        // Only Flash models support vision
        if (modelName.includes("pro") && !modelName.includes("vision")) continue;

        const base64Data = imageBase64.split(",")[1] || imageBase64;
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg",
            },
          },
        ]);
        return result.response.text();
      } else {
        const result = await model.generateContent(prompt);
        return result.response.text();
      }
    } catch (err) {
      lastError = err;
      // SILENT FALLBACK IN PROD - ONLY LOG IF ALL FAIL
    }
  }

  console.error(`❌ All Gemini model attempts failed.`);
  throw lastError;
};
