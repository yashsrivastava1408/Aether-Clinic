import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { getUserId } from "../utils/user";
import { Spinner } from "../components/Icons";

const CHOICES = [
  { status: "better", label: "Better", tone: "border-ok/40 bg-ok-soft text-ok" },
  { status: "same", label: "About the same", tone: "border-warn/40 bg-warn-soft text-warn" },
  { status: "worse", label: "Worse", tone: "border-danger/40 bg-danger-soft text-danger" },
];

/**
 * The page behind the emailed check-in link. "Better" ends it. "Same" or
 * "worse" starts a new consultation that opens with what the user said.
 */
export default function FollowUp() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/followup/${token}`)
      .then((res) => setInfo(res.data))
      .catch(() => setError("This check-in link is no longer valid."));
  }, [token]);

  const respond = async (status) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/api/followup/${token}/respond`, { status, note });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error === "ALREADY_ANSWERED" ? "You have already answered this check-in." : "Could not save your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startConsultation = async () => {
    const { specialist, openingMessage } = result.next;
    // The earlier consultation is finished and locked; a new one replaces it.
    try {
      await api.delete(`/api/chat/history/${getUserId()}/${encodeURIComponent(specialist)}`);
    } catch {
      // the chat page still works if there was nothing to clear
    }
    navigate(`/chatbot/${encodeURIComponent(specialist)}`, {
      state: { specializationName: specialist, initialMessage: openingMessage },
    });
  };

  return (
    <div className="page-narrow max-w-xl">
      <h1 className="page-title">Check-in</h1>
      <p className="page-lead">How are you feeling since your consultation?</p>

      <div className="mt-8 space-y-4">
        {error && <p className="notice notice-danger" role="alert">{error}</p>}

        {!info && !error && <div className="flex justify-center py-8 text-muted"><Spinner className="h-5 w-5" /></div>}

        {info && !result && info.status !== "answered" && (
          <div className="card p-6">
            <p className="text-sm text-muted">You spoke to the {info.specialist} about</p>
            <p className="mt-1 text-lg font-semibold text-ink">{info.complaint}</p>

            <label htmlFor="followup-note" className="field-label mt-5">Anything to add? (optional)</label>
            <textarea
              id="followup-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              className="input"
              placeholder="For example: the pain now goes down my leg"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {CHOICES.map((choice) => (
                <button
                  key={choice.status}
                  disabled={busy}
                  onClick={() => respond(choice.status)}
                  className={`btn border ${choice.tone}`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {info && !result && info.status === "answered" && (
          <div className="card p-6 text-sm text-ink">You have already answered this check-in. Thank you.</div>
        )}

        {result && (
          <div className="card p-6">
            <p className="leading-relaxed text-ink">{result.message}</p>
            <div className="mt-5">
              {result.next ? (
                <>
                  <button onClick={startConsultation} className="btn btn-primary">Continue with the {result.next.specialist}</button>
                  <p className="mt-3 text-xs text-muted">This starts a new consultation. Your earlier one is replaced.</p>
                </>
              ) : (
                <Link to="/dashboard" className="btn btn-secondary">Back to home</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
