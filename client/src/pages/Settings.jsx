import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clearMemory, fetchMemory, isMemoryEnabled, setMemoryEnabled } from "../utils/healthMemory";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LegalModal from "../components/LegalModal";

function Toggle({ checked, onChange, label }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line'}`}
        >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
    );
}

function Row({ title, text, children }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                {text && <p className="mt-0.5 text-sm leading-relaxed text-muted">{text}</p>}
            </div>
            {children}
        </div>
    );
}

export default function Settings() {
    const { user, logout, showSignIn } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [showLegal, setShowLegal] = useState(false);
    const [memoryOn, setMemoryOn] = useState(isMemoryEnabled());
    const [memoryEntries, setMemoryEntries] = useState(null);
    const [memoryError, setMemoryError] = useState("");

    useEffect(() => {
        fetchMemory().then(setMemoryEntries).catch(() => setMemoryEntries(null));
    }, []);

    const toggleMemory = () => {
        setMemoryEnabled(!memoryOn);
        setMemoryOn(!memoryOn);
    };

    const handleClearMemory = async () => {
        if (!window.confirm("Delete the saved summaries of your past consultations?")) return;
        setMemoryError("");
        try {
            await clearMemory();
            setMemoryEntries([]);
        } catch (err) {
            console.error("Could not clear health memory", err);
            setMemoryError("The saved summaries could not be deleted. Please try again.");
        }
    };

    return (
        <div className="page-narrow">
            <h1 className="page-title">Settings</h1>

            <div className="mt-8 space-y-6">

                {/* Account */}
                <section className="card p-6">
                    <h2 className="text-base font-semibold text-ink">Account</h2>
                    <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-lg font-semibold text-brand">
                                {user?.avatar
                                    ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                    : user?.name?.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate font-medium text-ink">{user?.name}</p>
                                <p className="truncate text-sm text-muted">{user?.isGuest ? 'Using MedNexus as a guest' : user?.email}</p>
                            </div>
                        </div>
                        {user?.isGuest
                            ? <button onClick={showSignIn} className="btn btn-primary shrink-0">Sign in</button>
                            : <button onClick={logout} className="btn btn-secondary shrink-0">Sign out</button>}
                    </div>
                </section>

                {/* Appearance */}
                <section className="card p-6">
                    <h2 className="mb-4 text-base font-semibold text-ink">Appearance</h2>
                    <Row title="Dark mode" text="Use a dark background across the app.">
                        <Toggle checked={theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
                    </Row>
                </section>

                {/* Health memory */}
                <section className="card p-6">
                    <h2 className="mb-4 text-base font-semibold text-ink">Health memory</h2>
                    <Row
                        title="Remember past consultations"
                        text="A short encrypted summary of each finished consultation is used as background next time."
                    >
                        <Toggle checked={memoryOn} onChange={toggleMemory} label="Remember past consultations" />
                    </Row>

                    {memoryEntries && memoryEntries.length > 0 && (
                        <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
                            {memoryEntries.map((entry, i) => (
                                <li key={i} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
                                    <span className="shrink-0 tabular-nums text-muted">{entry.date}</span>
                                    <span className="text-ink"><span className="font-medium">{entry.specialist}:</span> {entry.complaint}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-muted">
                            {memoryEntries === null ? "Saved summaries could not be loaded." : `${memoryEntries.length} saved ${memoryEntries.length === 1 ? "summary" : "summaries"}`}
                        </p>
                        <button onClick={handleClearMemory} disabled={!memoryEntries || memoryEntries.length === 0} className="btn btn-danger shrink-0">
                            Delete all
                        </button>
                    </div>
                    {memoryError && <p className="notice notice-danger mt-3" role="alert">{memoryError}</p>}
                </section>

                {/* Clinician tools and legal */}
                <section className="card space-y-5 p-6">
                    <Row title="Clinician review queue" text="Approve or edit assessments before they are released. Needs a reviewer key.">
                        <Link to="/review" className="btn btn-secondary shrink-0">Open queue</Link>
                    </Row>
                    <div className="border-t border-line" />
                    <Row title="Terms and privacy" text="The medical disclaimer, how your data is handled and the terms of use.">
                        <button onClick={() => setShowLegal(true)} className="btn btn-secondary shrink-0">View</button>
                    </Row>
                </section>
            </div>

            <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />
        </div>
    );
}
