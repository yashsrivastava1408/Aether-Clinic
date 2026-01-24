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
    return await generateOllamaResponse(prompt, options);
  } catch (error) {
    console.error(`❌ LLM Service Error [${provider}]:`, error.message);
    throw error;
  }
};

/**
 * Internal helper for local Ollama calls.
 * Uses the llama3.2 model which is optimized for speed/accuracy balance.
 */
const generateOllamaResponse = async (prompt, options = {}) => {
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

  // Default heavily tuned parameters for medical accuracy & safety
  const finalOptions = {
    temperature: options.temperature || 0.6,      // Lower for more focused/deterministic answers
    top_p: options.top_p || 0.9,                 // Standard high quality nucleus sampling
    repeat_penalty: options.repeat_penalty || 1.1, // Prevent loops
    ...options
  };

  try {
    const response = await axios.post(`${ollamaHost}/api/generate`, {
      model: "llama3.2",
      prompt: prompt,
      stream: false,
      options: {
        temperature: finalOptions.temperature,
        top_p: finalOptions.top_p,
        repeat_penalty: finalOptions.repeat_penalty,
      }
    });
    return response.data.response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Ollama connection failed. Please ensure Ollama is running on port 11434 (try 'ollama serve').`);
    }
    throw error;
  }
};

/**
 * Internal helper for cloud Gemini calls.
 */
const generateGeminiResponse = async (prompt, imageBase64 = null, genAI) => {
  // Updated models for API v1 (Verified available models)
  const modelsToTry = [
    "gemini-2.5-flash", // Verified from user dashboard
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting Gemini model: ${modelName}`);
      // Force API v1 in getGenerativeModel options
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });

      if (imageBase64) {
        // Only specific models support vision
        // gemini-1.5-flash and gemini-1.5-pro support vision.
        // gemini-pro-vision supports vision.
        // gemini-1.0-pro does NOT.
        // If an image is provided, and the model doesn't support vision, skip it.
        // Note: gemini-1.0-pro is already removed from modelsToTry, but this check is good practice.
        if (modelName === "gemini-1.0-pro") continue;

        const base64Data = imageBase64.split(",")[1] || imageBase64;

        // Official API v1 format for content with images
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                  },
                },
              ],
            },
          ],
        });

        const text = result.response.text();
        console.log(`✅ Success with model: ${modelName}`);
        return text;
      } else {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`✅ Success with model: ${modelName}`);
        return text;
      }
    } catch (err) {
      console.warn(`⚠️ Failed with model ${modelName}: ${err.message}`);
      lastError = err;
      // Continue to next model
    }
  }

  console.error(`❌ All Gemini model attempts failed.`);
  if (lastError) throw lastError;
  throw new Error("All Gemini models failed to generate response.");
};
