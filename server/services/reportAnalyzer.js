import { generateResponse } from "./llmService.js";

export async function analyzeReport(text, imageBase64 = null) {
  if ((!text || text.trim().length < 5) && !imageBase64) {
    return {
      summary: "Insufficient data to analyze.",
      findings: [],
      alerts: [],
      suggestions: ["Please upload a clearer image containing medical text."]
    };
  }

  const prompt = `
  You are an advanced Medical AI Agent specializing in analyzing clinical reports.
  
  TASK:
  Analyze the following ${imageBase64 ? "image and " : ""}OCR text from a medical report.
  Extract key findings, abnormal values, and potential health alerts.
  Provide actionable suggestions.

  ${text ? `OCR TEXT:
  """
  ${text}
  """` : "Note: Rely on the provided image for analysis."}

  OUTPUT FORMAT:
  Return ONLY valid JSON. No markdown, no code blocks, no intro text.
  Structure:
  {
    "summary": "One concise sentence summarizing the report type and overall status.",
    "findings": ["List of key observed values or statements (e.g., 'Hemoglobin: 13.5 g/dL (Normal)')"],
    "alerts": ["List of abnormal or concerning values (e.g., 'High Glucose detected')"],
    "suggestions": ["3-4 actionable steps for the patient"]
  }
  `;

  try {
    const rawResponse = await generateResponse(prompt, imageBase64);

    // Attempt to clean and parse JSON
    let cleanJson = rawResponse.trim();
    // Remove markdown code blocks if present
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?/, "").replace(/```$/, "");
    }

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("LLM Analysis Failed:", error);
    // Fallback if LLM fails or returns bad JSON
    return {
      summary: " Automated analysis encountered an error.",
      findings: ["Could not structure data from AI."],
      alerts: ["System Error"],
      suggestions: ["Please review the report manually with a doctor."]
    };
  }
}