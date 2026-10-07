/**
 * Long-term health memory preference and API calls.
 *
 * When memory is on (the default), a short summary of each finished
 * consultation is kept on the server (encrypted) and used as background in
 * later consultations. The preference itself lives in this browser.
 */

import { getUserId } from "./user";
import { API_URL } from "./api";

const KEY = "health_memory";

export function isMemoryEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setMemoryEnabled(enabled) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // storage unavailable: the default (on) applies
  }
}

export async function fetchMemory() {
  const response = await fetch(`${API_URL}/api/chat/memory/${encodeURIComponent(getUserId())}`);
  if (!response.ok) throw new Error("Could not load health memory");
  return (await response.json()).entries || [];
}

export async function clearMemory() {
  const response = await fetch(`${API_URL}/api/chat/memory/${encodeURIComponent(getUserId())}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not clear health memory");
}
