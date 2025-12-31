import api from "./api";

export const analyzeReport = (file) => {
  const formData = new FormData();
  formData.append("report", file);

  // ✅ DO NOT set Content-Type manually
  return api.post("/api/report/analyze", formData);
};