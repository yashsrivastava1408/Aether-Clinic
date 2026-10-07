import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { getUserId } from "../utils/user";
import { specialists } from "../data/specialists";
import Modal from "../components/ui/Modal";
import { ArrowRight, Search, Spinner } from "../components/Icons";

const TIERS = [
  { id: "basic", label: "Private", hint: "Tries the clinic's own local model first, then a cloud model if it is not available." },
  { id: "premium", label: "Fast", hint: "Uses a cloud model first for quicker replies." },
];

export default function Consultation() {
  const navigate = useNavigate();
  const [tier, setTier] = useState("basic");
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState("");       // name of the specialist being opened
  const [pendingDoctor, setPendingDoctor] = useState(null); // specialist with an earlier consultation

  const historyUrl = (doctor) => `/api/chat/history/${getUserId()}/${encodeURIComponent(doctor.name)}`;

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return specialists;
    return specialists.filter((doctor) => {
      const text = `${doctor.name} ${doctor.role} ${doctor.description}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }, [query]);

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

  const tierIndex = TIERS.findIndex((t) => t.id === tier);

  return (
    <div className="page">
      <header>
        <h1 className="page-title">Choose a specialist</h1>
        <p className="page-lead">
          Pick the area closest to your problem. If it turns out to belong elsewhere, the conversation is handed to the right specialist.
        </p>
      </header>

      {/* Search and reply mode */}
      <div className="card mt-6 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symptom or specialty"
            aria-label="Search specialists"
            className="input pl-9"
          />
        </div>

        <div className="flex flex-col gap-1.5 md:items-end">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink" id="tier-label">Reply mode</span>
            <div role="radiogroup" aria-labelledby="tier-label" className="relative grid grid-cols-2 rounded-xl border border-line bg-surface-2 p-1">
              <span
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-brand shadow-soft transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${tierIndex * 100}%)` }}
                aria-hidden="true"
              />
              {TIERS.map((option) => (
                <button
                  key={option.id}
                  role="radio"
                  aria-checked={tier === option.id}
                  onClick={() => setTier(option.id)}
                  className={`relative z-10 rounded-lg px-5 py-1.5 text-sm font-medium transition-colors duration-300 ${tier === option.id ? "text-brand-ink" : "text-muted hover:text-ink"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p key={tier} className="fade-in text-xs text-muted md:text-right">{TIERS[tierIndex].hint}</p>
        </div>
      </div>

      {/* Specialists */}
      {matches.length > 0 ? (
        <div key={query ? "filtered" : "all"} className="stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((doctor, i) => {
            const Icon = doctor.icon;
            return (
              <button
                key={doctor.name}
                onClick={() => handleDoctorSelect(doctor)}
                disabled={!!checking}
                className="card card-hover group flex items-start gap-4 p-5 text-left disabled:cursor-wait"
                style={{ "--i": i }}
              >
                <span className="icon-tile"><Icon /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">{doctor.name}</span>
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted">{doctor.role}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted">{doctor.description}</span>
                </span>
                <span className="mt-1 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand">
                  {checking === doctor.name ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card fade-in mt-6 px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">No specialist matches "{query}".</p>
          <p className="mt-1 text-sm text-muted">Try a different word, or start with the General Physician.</p>
          <button onClick={() => setQuery("")} className="btn btn-secondary mt-4">Show all specialists</button>
        </div>
      )}

      <Modal
        isOpen={!!pendingDoctor}
        onClose={closeModal}
        title="You have an earlier consultation"
        footer={<>
          <button onClick={handleNewChat} className="btn btn-secondary">Start new</button>
          <button onClick={handleContinue} className="btn btn-primary">{pendingDoctor?.closed ? "Open it" : "Continue"}</button>
        </>}
      >
        <p className="text-sm leading-relaxed text-muted">
          {pendingDoctor?.closed
            ? `Your consultation with the ${pendingDoctor?.name} is finished. You can read it again or start a new one.`
            : `You were talking to the ${pendingDoctor?.name}. You can carry on or start again.`}
          {pendingDoctor?.lastActive && ` Last message: ${new Date(pendingDoctor.lastActive).toLocaleString()}.`}
        </p>
        <p className="mt-3 text-xs text-muted">Starting new deletes the earlier messages.</p>
      </Modal>
    </div>
  );
}
