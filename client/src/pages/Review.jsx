import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
const KEY_STORAGE = "reviewer_key";

/**
 * Clinician review queue. A drafted assessment waits here until a clinician
 * approves it, edits it, or rejects it. Needs the server's REVIEWER_KEY.
 */
export default function Review() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [reviewer, setReviewer] = useState("");
  const [pending, setPending] = useState(null);
  const [mode, setMode] = useState("");
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (reviewerKey) => {
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/review`, { headers: { "x-reviewer-key": reviewerKey } });
      sessionStorage.setItem(KEY_STORAGE, reviewerKey);
      setPending(res.data.pending || []);
      setMode(res.data.review_mode || "");
    } catch (err) {
      setPending(null);
      const code = err.response?.data?.error;
      setError(code === "REVIEW_DISABLED" ? "The review queue is not enabled on this server."
        : code === "INVALID_REVIEWER_KEY" ? "That reviewer key is not correct."
          : "Could not load the review queue.");
    }
  }, []);

  useEffect(() => {
    if (key) load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (threadId, action) => {
    setBusy(threadId);
    setError("");
    try {
      await axios.post(`${API_URL}/api/review/${threadId}`,
        { action, text: action === "edit" ? drafts[threadId] : "", reviewer },
        { headers: { "x-reviewer-key": key } });
      await load(key);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the decision.");
    } finally {
      setBusy("");
    }
  };

  const card = `p-6 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`;
  const input = `p-3 rounded-xl border text-sm outline-none ${isDark ? "bg-black/40 border-white/10" : "bg-slate-50 border-slate-300"}`;
  const button = "px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className={`min-h-screen pt-24 px-6 pb-12 ${isDark ? "text-white" : "text-slate-900"}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinician Review</h1>
          <p className="text-emerald-500 font-mono text-xs tracking-widest uppercase opacity-80">
            Assessments waiting for release{mode ? ` // mode: ${mode}` : ""}
          </p>
        </div>

        <div className={`${card} flex flex-col sm:flex-row gap-3`}>
          <input type="password" aria-label="Reviewer key" placeholder="Reviewer key" value={key} onChange={(e) => setKey(e.target.value)} className={`${input} flex-1`} />
          <input aria-label="Your name" placeholder="Your name (recorded with the decision)" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={`${input} flex-1`} />
          <button onClick={() => load(key)} className={`${button} bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20`}>Load queue</button>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-red-500 text-sm">{error}</div>}
        {pending && pending.length === 0 && <div className={card}>Nothing is waiting for review.</div>}

        {(pending || []).map((item) => (
          <div key={item.thread_id} className={`${card} space-y-4`}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase">
              <span className={`px-2 py-1 rounded border ${item.urgency === "routine" ? "border-emerald-500/30 text-emerald-500" : "border-red-500/40 text-red-500"}`}>{item.urgency}</span>
              <span className="opacity-70">{item.specialist}</span>
              <span className="opacity-50">{item.created_at}</span>
              {item.safety?.grounded === false && <span className="px-2 py-1 rounded border border-amber-500/40 text-amber-500">not fully grounded</span>}
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2">What the patient reported</h3>
              <ul className="text-sm space-y-1">
                {Object.entries(item.intake || {}).map(([slot, value]) => (
                  <li key={slot}><span className="opacity-60">{slot.replace(/_/g, " ")}:</span> {value}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2">Draft assessment (edit if needed)</h3>
              <textarea
                aria-label="Draft assessment"
                value={drafts[item.thread_id] ?? item.draft}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [item.thread_id]: e.target.value }))}
                rows={12}
                className={`${input} w-full font-mono leading-relaxed`}
              />
              {item.citations?.length > 0 && (
                <p className="text-xs opacity-60 mt-2">Sources: {item.citations.map((c) => `[${c.index}] ${c.title}`).join(" · ")}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button disabled={busy === item.thread_id} onClick={() => decide(item.thread_id, "approve")}
                className={`${button} bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20`}>Approve as drafted</button>
              <button disabled={busy === item.thread_id || !(drafts[item.thread_id] || "").trim() || drafts[item.thread_id] === item.draft}
                onClick={() => decide(item.thread_id, "edit")}
                className={`${button} bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20`}>Send edited version</button>
              <button disabled={busy === item.thread_id} onClick={() => decide(item.thread_id, "reject")}
                className={`${button} bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20`}>Reject (see a doctor in person)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
