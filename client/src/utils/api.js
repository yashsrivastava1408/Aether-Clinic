import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const api = axios.create({ baseURL: API_URL });

/** A short, readable reason for a failed request. */
export function errorMessage(err, fallback) {
  const data = err?.response?.data;
  return data?.message || (typeof data?.error === "string" && /\s/.test(data.error) ? data.error : "") || fallback;
}

export default api;
