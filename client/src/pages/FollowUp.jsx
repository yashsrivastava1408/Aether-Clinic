import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { getUserId } from "../utils/user";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const CHOICES = [
  { status: "better", label: "Better", tone: "emerald" },
  { status: "same", label: "About the same", tone: "amber" },
  { status: "worse", label: "Worse", tone: "red" },
];

/**
 * The page behind the emailed check-in link. "Better" ends it. "Same" or
 * "worse" starts a new consultation that opens with what the user said.
 */
export default function FollowUp() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [info, setInfo] = useState(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/followup/${token}`)
      .then((res) => setInfo(res.data))
      .catch(() => setError("This check-in link is no longer valid."));
  }, [token]);

  const respond = async (status) => {
    setBusy(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/api/followup/${token}/respond`, { status, note });
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
      await axios.delete(`${API_URL}/api/chat/history/${getUserId()}/${encodeURIComponent(specialist)}`);
    } catch {
      // the chat page still works if there was nothing to clear
    }
    navigate(`/chatbot/${encodeURIComponent(specialist)}`, {
      state: { specializationName: specialist, specializationRole: "Specialist", initialMessage: openingMessage, userRam: navigator.deviceMemory || 8 },
    });
  };

  const card = `p-6 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`;
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20",
  };

  return (
    <div className={`min-h-screen pt-24 px-6 pb-12 ${isDark ? "text-white" : "text-slate-900"}`}>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="text-emerald-500 font-mono text-xs tracking-widest uppercase opacity-80">How are you feeling?</p>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-red-500 text-sm">{error}</div>}

        {info && !result && info.status !== "answered" && (
          <div className={card}>
            <p className="text-sm opacity-70 mb-1">You spoke to our {info.specialist} about</p>
            <p className="text-lg font-semibold mb-5">{info.complaint}</p>
            <label htmlFor="followup-note" className="text-xs uppercase tracking-widest opacity-60">Anything to add? (optional)</label>
            <textarea
              id="followup-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              className={`w-full mt-2 mb-5 p-3 rounded-xl border text-sm outline-none ${isDark ? "bg-black/40 border-white/10" : "bg-slate-50 border-slate-300"}`}
              placeholder="For example: the pain now goes down my leg"
            />
            <div className="grid grid-cols-3 gap-3">
              {CHOICES.map((choice) => (
                <button key={choice.status} disabled={busy} onClick={() => respond(choice.status)}
                  className={`px-3 py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${tones[choice.tone]}`}>
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {info && !result && info.status === "answered" && (
          <div className={card}>You have already answered this check-in. Thank you.</div>
        )}

        {result && (
          <div className={card}>
            <p className="leading-relaxed mb-5">{result.message}</p>
            {result.next ? (
              <button onClick={startConsultation}
                className="px-5 py-3 rounded-xl border text-sm font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20">
                Continue with the {result.next.specialist}
              </button>
            ) : (
              <button onClick={() => navigate("/dashboard")}
                className={`px-5 py-3 rounded-xl border text-sm font-medium ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-300 hover:bg-slate-50"}`}>
                Back to dashboard
              </button>
            )}
            {result.next && <p className="text-xs opacity-60 mt-3">This starts a new consultation. Your earlier one is replaced.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
