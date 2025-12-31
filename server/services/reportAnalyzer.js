export function analyzeReport(text) {
  const lower = text.toLowerCase();

  const findings = [];
  const alerts = [];

  if (lower.includes("glucose") || lower.includes("sugar")) {
    alerts.push("Possible blood sugar irregularity");
  }

  if (lower.includes("hemoglobin")) {
    findings.push("Hemoglobin values detected");
  }

  if (lower.includes("blood pressure") || lower.includes("bp")) {
    alerts.push("Blood pressure mentioned");
  }

  return {
    summary: "Report analyzed successfully",
    findings,
    alerts,
    suggestions: [
      "Consult a licensed doctor",
      "Maintain healthy lifestyle",
      "Follow up with lab tests if required"
    ]
  };
}