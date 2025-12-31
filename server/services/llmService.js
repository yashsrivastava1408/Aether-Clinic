import axios from "axios";

export const generateResponse = async (prompt) => {
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt: prompt,
    stream: false
  });
  return response.data.response;
};
