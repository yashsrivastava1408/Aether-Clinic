import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://10.1.171.68:5050",
});

export default api;