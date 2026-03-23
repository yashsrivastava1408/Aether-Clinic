import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import CacheManager from "../utils/cacheManager.js";
import Groq from "groq-sdk";

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

  // Check cache first
  const cacheKey = { prompt, imageBase64, provider, ...options };
  const cachedResponse = await CacheManager.get(cacheKey, 'llm');
  if (cachedResponse) return cachedResponse;

    try {
      let responseText;
      // 1. Vision Tasks ALWAYS go to Gemini
      if (imageBase64) {
        const genAI = getGenAI();
        if (!genAI) {
          throw new Error("GEMINI_API_KEY is not set. Gemini features (Vision/Report Analysis) are disabled.");
        }
        responseText = await generateGeminiResponse(prompt, imageBase64, genAI);
      } 
      // 2. Premium Tier (Groq Llama-3.3-70b)
      else if (options.tier === 'premium') {
        responseText = await generateGroqResponse(prompt, options);
      } 
      // 3. Basic Tier (Local Ollama) or explicitly requested provider
      else if (provider === "gemini") {
         const genAI = getGenAI();
         responseText = await generateGeminiResponse(prompt, null, genAI);
      } else {
        responseText = await generateOllamaResponse(prompt, options);
      }

    // Store in cache
    await CacheManager.set(cacheKey, responseText, provider, 'llm');
    return responseText;
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
  console.log(`🐢 Standard Engine Active: Routing to Local Ollama`);
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

  // Default heavily tuned parameters for medical accuracy & safety
  const finalOptions = {
    temperature: options.temperature || 0.4,      // Even lower for tighter medical focus
    top_p: options.top_p || 0.8,
    repeat_penalty: options.repeat_penalty || 1.3, // Stronger penalty for symbol loops
    num_predict: options.num_predict || 300,       // Keep responses concise to prevent runaway
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

/**
 * Internal helper for Groq (Premium Tier).
 * Uses llama-3.3-70b-versatile for exceptional reasoning and speed.
 */
const generateGroqResponse = async (prompt, options = {}) => {
  console.log(`🚀 Premium Engine Active: Routing to Groq (llama-3.3-70b-versatile)`);
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.warn("⚠️ GROQ_API_KEY missing. Falling back to Ollama.");
    return generateOllamaResponse(prompt, options);
  }

  const groq = new Groq({ apiKey: groqApiKey });
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: options.temperature || 0.4,
      max_tokens: options.num_predict || 1024,
      top_p: options.top_p || 0.8,
    });
    
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("❌ Groq API Error:", error.message);
    // Graceful fallback to local if Groq fails
    return generateOllamaResponse(prompt, options);
  }
};

