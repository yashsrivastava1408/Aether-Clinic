import axios from "axios";

export const generateResponse = async (prompt, imageBase64 = null) => {
  const payload = {
    model: imageBase64 ? "llama3.2-vision" : "llama3.2",
    prompt: prompt,
    stream: false,
  };

  if (imageBase64) {
    payload.images = [imageBase64];
  }

  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
  const response = await axios.post(`${ollamaHost}/api/generate`, payload);
  return response.data.response;
};
