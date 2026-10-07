import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { getUserId } from "../utils/user";
import { specialists } from "../data/specialists";
import { ArrowRight, Close, Spinner } from "../components/Icons";

const TIERS = [
  { id: "basic", label: "Private", hint: "Tries the clinic's own local model first, then a cloud model if it is not available." },
  { id: "premium", label: "Fast", hint: "Uses a cloud model first for quicker replies." },
];

export default function Consultation() {
  const navigate = useNavigate();
  const [tier, setTier] = useState("basic");
  const [checking, setChecking] = useState("");       // name of the specialist being opened
  const [pendingDoctor, setPendingDoctor] = useState(null); // specialist with an earlier consultation

  const historyUrl = (doctor) => `/api/chat/history/${getUserId()}/${encodeURIComponent(doctor.name)}`;

  const navigateToChat = (doctor) => {
    navigate(`/chatbot/${encodeURIComponent(doctor.name)}`, {
      state: { specializationName: doctor.name, specializationRole: doctor.role, tier },
    });
  };

  // An earlier consultation with this specialist can be continued or replaced
  const handleDoctorSelect = async (doctor) => {
    if (checking) return;
    setChecking(doctor.name);
    try {
      const res = await api.get(historyUrl(doctor));
      const earlier = res.data.messages || [];
      if (earlier.length > 0) {
        setPendingDoctor({ ...doctor, lastActive: earlier[earlier.length - 1].timestamp, closed: !!res.data.sessionClosed });
      } else {
        navigateToChat(doctor);
      }
    } catch (error) {
      console.error("Could not check for an earlier consultation:", error);
      navigateToChat(doctor);
    } finally {
      setChecking("");
    }
  };

  const closeModal = () => setPendingDoctor(null);

  const handleContinue = () => {
    navigateToChat(pendingDoctor);
    closeModal();
  };

  const handleNewChat = async () => {
    try {
      await api.delete(historyUrl(pendingDoctor));
    } catch (e) {
      console.error("Could not clear the earlier consultation", e);
    }
    navigateToChat(pendingDoctor);
    closeModal();
  };

  const activeTier = TIERS.find((t) => t.id === tier);

  return (
    <div className="page">
      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Choose a specialist</h1>
          <p className="page-lead">
            Pick the area closest to your problem. If it turns out to belong elsewhere, the conversation is handed to the right specialist.
          </p>
        </div>

        <div className="md:max-w-xs">
          <p className="field-label" id="tier-label">Reply mode</p>
          <div role="radiogroup" aria-labelledby="tier-label" className="inline-flex rounded-xl border border-line bg-surface p-1">
            {TIERS.map((option) => (
              <button
                key={option.id}
                role="radio"
                aria-checked={tier === option.id}
                onClick={() => setTier(option.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tier === option.id ? "bg-brand text-brand-ink" : "text-muted hover:text-ink"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="field-hint">{activeTier.hint}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specialists.map((doctor) => {
          const Icon = doctor.icon;
          return (
            <button
              key={doctor.name}
              onClick={() => handleDoctorSelect(doctor)}
              disabled={!!checking}
              className="card group flex items-start gap-4 p-5 text-left transition-colors hover:border-brand disabled:cursor-wait"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">{doctor.name}</span>
                <span className="block text-xs font-medium uppercase tracking-wide text-muted">{doctor.role}</span>
                <span className="mt-2 block text-sm leading-relaxed text-muted">{doctor.description}</span>
              </span>
              <span className="mt-1 text-muted group-hover:text-brand">
                {checking === doctor.name ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>

      {pendingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="card fade-in relative w-full max-w-md p-6 shadow-xl">
            <button onClick={closeModal} className="btn btn-ghost absolute right-3 top-3 px-2" aria-label="Close">
              <Close />
            </button>
            <h2 id="history-title" className="pr-8 text-lg font-semibold text-ink">You have an earlier consultation</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pendingDoctor.closed
                ? `Your consultation with the ${pendingDoctor.name} is finished. You can read it again or start a new one.`
                : `You were talking to the ${pendingDoctor.name}. You can carry on or start again.`}
              {pendingDoctor.lastActive && ` Last message: ${new Date(pendingDoctor.lastActive).toLocaleString()}.`}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleNewChat} className="btn btn-secondary flex-1">Start new</button>
              <button onClick={handleContinue} className="btn btn-primary flex-1">{pendingDoctor.closed ? "Open it" : "Continue"}</button>
            </div>
            <p className="mt-3 text-xs text-muted">Starting new deletes the earlier messages.</p>
          </div>
        </div>
      )}
    </div>
  );
}
