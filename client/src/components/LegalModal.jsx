import React from 'react';
import Modal from './ui/Modal';

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

const LegalModal = ({ isOpen, onClose }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Terms, privacy and safety"
        size="max-w-lg"
        footer={<button onClick={onClose} className="btn btn-primary">Close</button>}
    >
        <div className="space-y-5">
            {sections.map((section) => (
                <div key={section.title}>
                    <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{section.text}</p>
                </div>
            ))}
        </div>
    </Modal>
);

export default LegalModal;
