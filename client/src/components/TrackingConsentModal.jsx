import React from 'react';

export default function TrackingConsentModal({ onAccept, onDecline }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-fade-in-up">

                {/* Header */}
                <div className="px-6 py-6 border-b border-emerald-900/30 bg-emerald-900/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-emerald-500 text-lg">👁️</span>
                        </div>
                        <h3 className="text-white font-bold text-lg tracking-wide">SYSTEM TRACKING</h3>
                    </div>
                    <p className="text-emerald-500/60 font-mono text-xs uppercase tracking-widest">
                        PERMISSION_REQUEST.EXE
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        To improve your neural synchronization experience, Aether Clinic requests permission to collect anonymous usage data and performance metrics.
                    </p>

                    <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                        <ul className="text-xs text-gray-400 space-y-2 font-mono">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> SYSTEM_PERFORMANCE_LOGS
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> FEATURE_USAGE_ANALYTICS
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> ANONYMIZED_DIAGNOSTICS
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onAccept}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    >
                        ALLOW ACCESS
                    </button>
                    <button
                        onClick={onDecline}
                        className="flex-1 py-3 px-4 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm rounded-xl border border-white/10 transition-colors"
                    >
                        DECLINE
                    </button>
                </div>

                {/* Decorative Scanline */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
            </div>
        </div>
    );
}
