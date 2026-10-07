import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";
import { useFeedback } from "../context/FeedbackContext";

const KEY_STORAGE = "reviewer_key";

/**
 * Clinician review queue. A drafted assessment waits here until a clinician
 * approves it, edits it, or rejects it. Needs the server's REVIEWER_KEY.
 */
export default function Review() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [reviewer, setReviewer] = useState("");
  const [pending, setPending] = useState(null);
  const [mode, setMode] = useState("");
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useFeedback();

  const load = useCallback(async (reviewerKey) => {
    setError("");
    try {
      const res = await api.get("/api/review", { headers: { "x-reviewer-key": reviewerKey } });
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
      await api.post(`/api/review/${threadId}`,
        { action, text: action === "edit" ? drafts[threadId] : "", reviewer },
        { headers: { "x-reviewer-key": key } });
      await load(key);
      toast(action === "reject" ? "Assessment rejected. The patient is told to see a doctor in person." : "Assessment released to the patient.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the decision.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="page-narrow">
      <h1 className="page-title">Clinician review</h1>
      <p className="page-lead">
        Assessments waiting to be released to patients.{mode ? ` Review mode: ${mode}.` : ""}
      </p>

      <div className="mt-8 space-y-4">
        <form
          className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => { e.preventDefault(); load(key); }}
        >
          <div>
            <label htmlFor="reviewer-key" className="field-label">Reviewer key</label>
            <input id="reviewer-key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="reviewer-name" className="field-label">Your name</label>
            <input id="reviewer-name" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="input" placeholder="Recorded with the decision" />
          </div>
          <button type="submit" disabled={!key} className="btn btn-primary">Load queue</button>
        </form>

        {error && <p className="notice notice-danger" role="alert">{error}</p>}
        {pending && pending.length === 0 && <p className="card p-5 text-sm text-muted">Nothing is waiting for review.</p>}

        {(pending || []).map((item) => {
          const draft = drafts[item.thread_id] ?? item.draft ?? "";
          const edited = draft.trim() !== "" && draft !== item.draft;
          const working = busy === item.thread_id;
          return (
            <article key={item.thread_id} className="card fade-in space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full border px-2.5 py-1 font-medium capitalize ${item.urgency === "routine" ? "border-ok/30 bg-ok-soft text-ok" : "border-danger/30 bg-danger-soft text-danger"}`}>
                  {item.urgency}
                </span>
                {item.safety?.grounded === false && (
                  <span className="rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 font-medium text-warn">Not fully grounded in sources</span>
                )}
                <span className="font-medium text-ink">{item.specialist}</span>
                <span className="text-muted">{item.created_at}</span>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-ink">What the patient reported</h2>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  {Object.entries(item.intake || {}).map(([slot, value]) => (
                    <div key={slot} className="contents">
                      <dt className="capitalize text-muted">{slot.replace(/_/g, " ")}</dt>
                      <dd className="text-ink">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <label htmlFor={`draft-${item.thread_id}`} className="field-label">Draft assessment (edit if needed)</label>
                <textarea
                  id={`draft-${item.thread_id}`}
                  value={draft}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.thread_id]: e.target.value }))}
                  rows={12}
                  className="input leading-relaxed"
                />
                {item.citations?.length > 0 && (
                  <p className="field-hint">Sources: {item.citations.map((c) => `[${c.index}] ${c.title}`).join(" · ")}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button disabled={working} onClick={() => decide(item.thread_id, "approve")} className="btn btn-primary">Approve as drafted</button>
                <button disabled={working || !edited} onClick={() => decide(item.thread_id, "edit")} className="btn btn-secondary">Send edited version</button>
                <button disabled={working} onClick={() => decide(item.thread_id, "reject")} className="btn btn-danger">Reject (see a doctor in person)</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
