const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

/**
 * Sends one chat turn and reads the server-sent event stream.
 *
 * The server sends `step` events while it works ({ step, label }), then one
 * `final` event with the reply, or one `error` event. The reply text only
 * arrives after it has passed the server's safety checks.
 *
 * @param {FormData} formData - same fields as POST /api/chat
 * @param {(step: {step: string, label: string}) => void} onStep
 * @returns {Promise<object>} the final body: { reply, sessionComplete, citations, mode }
 * @throws {Error} with `.code` (for example "SESSION_COMPLETE") and `.status`
 */
export async function sendChatStream(formData, onStep) {
  const response = await fetch(`${API_URL}/api/chat/stream`, { method: "POST", body: formData });

  // Validation errors and the session lock come back as plain JSON.
  if (!(response.headers.get("content-type") || "").includes("text/event-stream")) {
    const body = await response.json().catch(() => ({}));
    throw chatError(body, response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseEvent(block);
      if (!parsed) continue;
      if (parsed.event === "step") onStep?.(parsed.data);
      else if (parsed.event === "final") final = parsed.data;
      else if (parsed.event === "error") throw chatError(parsed.data, 503);
    }
  }

  if (!final) throw chatError({ error: "STREAM_ENDED_EARLY" }, 502);
  return final;
}

function parseEvent(block) {
  let event = "message";
  const data = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

function chatError(body, status) {
  const error = new Error(body?.message || body?.error || "Chat request failed");
  error.code = body?.error || "CHAT_FAILED";
  error.status = status;
  return error;
}
