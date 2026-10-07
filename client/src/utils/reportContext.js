/**
 * Keeps a short digest of the user's most recent analysed lab report in this
 * browser only, so a consultation can take it into account. Nothing is stored
 * on the server; the digest is sent along with a chat message when present.
 */

const KEY = "last_report_digest";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CHARS = 1500;

const asText = (item) => (typeof item === "string" ? item : Object.values(item || {}).filter(Boolean).join(" "));

export function saveReportDigest(analysis) {
  try {
    if (!analysis?.summary) return;
    const parts = [analysis.summary];
    if (analysis.alerts?.length) parts.push(`Alerts: ${analysis.alerts.map(asText).join("; ")}`);
    if (analysis.findings?.length) parts.push(`Findings: ${analysis.findings.map(asText).join("; ")}`);
    localStorage.setItem(KEY, JSON.stringify({ text: parts.join("\n").slice(0, MAX_CHARS), savedAt: Date.now() }));
  } catch {
    // storage unavailable: the chat simply works without report context
  }
}

export function loadReportDigest() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!stored?.text || Date.now() - stored.savedAt > MAX_AGE_MS) return "";
    return stored.text;
  } catch {
    return "";
  }
}

export function clearReportDigest() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
