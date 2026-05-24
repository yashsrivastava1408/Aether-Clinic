import React from 'react';
import { createPortal } from 'react-dom';

const LegalModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 transform transition-all animate-fade-in-up">

                {/* Header */}
                <div className="px-6 py-4 border-b border-emerald-900/30 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-emerald-500 font-mono text-sm tracking-widest font-bold">LEGAL & SAFETY PROTOCOLS</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-emerald-500/50 hover:text-emerald-400 transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Medical Disclaimer */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-emerald-500 pl-3">
                            MEDICAL DISCLAIMER
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                MedNexus provides AI-assisted health information and educational insights only.
                                It does not provide medical advice, diagnosis, prescriptions, or treatment.
                                Always consult a qualified healthcare professional for medical concerns.
                            </p>
                        </div>
                    </div>

                    {/* Emergency Notice */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-red-500 pl-3">
                            EMERGENCY NOTICE
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                MedNexus is not designed for medical emergencies.
                                If you experience severe or urgent symptoms, contact local emergency services or visit the nearest hospital immediately.
                            </p>
                        </div>
                    </div>

                    {/* Data & Privacy */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-blue-500 pl-3">
                            DATA & PRIVACY NOTICE
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Your data is encrypted and handled securely.
                                MedNexus does not share personal health information without user consent.
                            </p>
                        </div>
                    </div>

                    {/* Terms of Service */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-yellow-500 pl-3">
                            TERMS OF SERVICE
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                By using this app, you agree to our Terms of Service.
                                Unauthorized use of the Neural Core API is prohibited.
                            </p>
                        </div>
                    </div>

                    {/* Third Party Licenses */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-purple-500 pl-3">
                            THIRD PARTY LICENSES
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                This software uses open source components including React, Vite, and others.
                                Full license text available in Settings.
                            </p>
                        </div>
                    </div>

                    {/* AI Limitations */}
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm tracking-wide border-l-2 border-orange-500 pl-3">
                            AI LIMITATIONS (HALLUCINATIONS)
                        </h4>
                        <div className="pl-3.5">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Generative AI models may produce inaccurate or hallucinated information.
                                Always verify critical health data with a medical professional.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-emerald-900/5 border-t border-emerald-900/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-mono border border-emerald-500/20 rounded-lg transition-colors"
                    >
                        ACKNOWLEDGE
                    </button>
                </div>

                {/* Decorative Scanline */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
            </div>
        </div>,
        document.body
    );
};

export default LegalModal;
