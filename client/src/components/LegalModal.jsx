import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Close } from './Icons';

const sections = [
    {
        title: "Medical disclaimer",
        text: "MedNexus provides AI-assisted health information for education only. It does not provide medical advice, diagnosis, prescriptions or treatment. Always consult a qualified healthcare professional about medical concerns.",
    },
    {
        title: "Emergencies",
        text: "MedNexus is not designed for medical emergencies. If you have severe or urgent symptoms, contact your local emergency services or go to the nearest hospital immediately.",
    },
    {
        title: "Your data",
        text: "Consultation messages and saved consultation summaries are encrypted before they are stored. Lab reports are analysed and not kept on the server. You can delete saved summaries at any time in Settings.",
    },
    {
        title: "Limits of AI",
        text: "AI models can produce inaccurate or made-up information. Check anything important with a medical professional before acting on it.",
    },
    {
        title: "Terms of use",
        text: "By using this app you agree to use it for personal, lawful purposes and not to rely on it in place of professional care.",
    },
];

const LegalModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="legal-title">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="card fade-in relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden shadow-xl">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h3 id="legal-title" className="text-base font-semibold text-ink">Terms, privacy and safety</h3>
                    <button onClick={onClose} className="btn btn-ghost px-2" aria-label="Close">
                        <Close />
                    </button>
                </div>

                <div className="space-y-5 overflow-y-auto px-6 py-5">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h4 className="text-sm font-semibold text-ink">{section.title}</h4>
                            <p className="mt-1 text-sm leading-relaxed text-muted">{section.text}</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end border-t border-line px-6 py-4">
                    <button onClick={onClose} className="btn btn-primary">Close</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LegalModal;
