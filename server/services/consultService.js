/**
 * Aether Clinic — Consultation client
 * ====================================
 * The Python service owns the whole consultation flow (a LangGraph state
 * machine: emergency screen → intake → retrieval → assessment → safety check).
 * This module is the only place the Node gateway talks to it.
 *
 * If the Python service cannot be reached, callers get an error and must not
 * produce a medical reply by other means.
 */

import axios from "axios";

const CONSULT_BASE_URL = process.env.INTELLIGENCE_BASE_URL || process.env.ML_BASE_URL || "http://localhost:5001";
// Three model calls on a local model can take a while.
const CONSULT_TIMEOUT_MS = Number(process.env.CONSULT_TIMEOUT_MS || 120000);

/**
 * Runs one consultation turn and returns the final result.
 * @param {Object} payload - { thread_id, message, specialization, tier, user_ram, image_b64, image_mime, force_final, history, report_summary }
 */
export const runConsult = async (payload) => {
  const response = await axios.post(`${CONSULT_BASE_URL}/api/consult`, payload, {
    timeout: CONSULT_TIMEOUT_MS,
    maxBodyLength: Infinity,
  });
  return response.data;
};

/**
 * Splits a chunked SSE byte stream into { event, data } objects.
 * Exported for tests.
 */
export const createSseParser = (onEvent) => {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.toString("utf8");
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let event = "message";
      const dataLines = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length === 0) continue;
      try {
        onEvent({ event, data: JSON.parse(dataLines.join("\n")) });
      } catch {
        // ignore a malformed event; the stream continues
      }
    }
  };
};

/**
 * Runs one consultation turn, reporting progress as it happens.
 * @param {Object} payload - same as runConsult
 * @param {Function} onStep - called with { step, label } while the graph runs
 * @returns {Object} the final result (same shape as runConsult)
 */
export const streamConsult = async (payload, onStep) => {
  const response = await axios.post(`${CONSULT_BASE_URL}/api/consult/stream`, payload, {
    timeout: CONSULT_TIMEOUT_MS,
    maxBodyLength: Infinity,
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    let final = null;
    let failure = null;
    const parse = createSseParser(({ event, data }) => {
      if (event === "step") onStep?.(data);
      else if (event === "final") final = data;
      else if (event === "error") failure = new Error(data?.error || "Consultation failed");
    });
    response.data.on("data", parse);
    response.data.on("error", reject);
    response.data.on("end", () => {
      if (final) resolve(final);
      else reject(failure || new Error("Consultation stream ended without a result"));
    });
  });
};

/**
 * Lab-report agent (extract → range check → explain → verify).
 * Throws on any failure; callers must not invent an analysis.
 */
export const analyzeReportRemote = async ({ text, imageBase64, imageMime }) => {
  const response = await axios.post(`${CONSULT_BASE_URL}/api/report/analyze`, {
    text: text || "",
    image_b64: imageBase64 || null,
    image_mime: imageMime || null,
  }, { timeout: CONSULT_TIMEOUT_MS, maxBodyLength: Infinity });
  return response.data;
};

/** Assessments waiting for a clinician. */
export const listReviews = async () => {
  const response = await axios.get(`${CONSULT_BASE_URL}/api/consult/reviews`, { timeout: 10000 });
  return response.data;
};

/** Sends a clinician's decision and returns the final consultation result. */
export const submitReview = async (threadId, decision) => {
  const response = await axios.post(
    `${CONSULT_BASE_URL}/api/consult/review/${encodeURIComponent(threadId)}`,
    decision,
    { timeout: CONSULT_TIMEOUT_MS },
  );
  return response.data;
};

/**
 * Deletes the saved state of one consultation. Returns true on success.
 */
export const deleteConsultThread = async (threadId) => {
  if (!threadId) return true;
  try {
    await axios.delete(`${CONSULT_BASE_URL}/api/consult/thread/${encodeURIComponent(threadId)}`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.warn(`Could not delete consultation state (${error.message}). It will expire on its own.`);
    return false;
  }
};
