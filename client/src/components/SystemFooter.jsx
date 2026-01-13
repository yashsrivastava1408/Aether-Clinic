import React, { useState } from 'react';
import LegalModal from './LegalModal';

export default function SystemFooter() {
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const currentYear = new Date().getFullYear();

    // Random hex strings for the "data stream"
    const hexCodes = Array(20).fill(0).map(() =>
        '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0')
    ).join(' • ');

    return (
        <footer className="relative bg-[#050505] border-t border-emerald-900/30 font-mono text-xs overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Moving Data Stream */}
            <div className="absolute top-0 left-0 w-full overflow-hidden opacity-20 border-b border-emerald-900/20 bg-black/50">
                <div className="animate-text-gradient-flow whitespace-nowrap text-emerald-500/40 py-1">
                    {hexCodes} • {hexCodes} • {hexCodes} • {hexCodes}
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                    {/* Left: System Info */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-500/80">
                            <span className="w-2 h-2 bg-emerald-500 rounded-sm animate-pulse" />
                            <span className="tracking-widest font-bold">AETHER CLINIC v2.4.0</span>
                        </div>
                        <div className="text-gray-500 space-y-1">
                            <p>BUILD: {currentYear}.01.09.RC1</p>
                            <p>CORE: NEURAL_ENGINE_X_86</p>
                        </div>
                    </div>

                    {/* Center: Copyright/Legal */}
                    <div className="text-center text-gray-600">
                        <p>&copy; {currentYear} Aether Medical Systems.</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-900/60">
                            Unauthorized access to patient data is a federal offense.
                        </p>
                        <p className="mt-2 text-[10px] text-gray-500 max-w-xs mx-auto">
                            Aether Clinic does not provide medical advice. Consult a doctor.
                        </p>
                        <button
                            onClick={() => setIsLegalModalOpen(true)}
                            className="mt-2 text-[10px] text-emerald-600/60 hover:text-emerald-500 font-mono tracking-widest border-b border-transparent hover:border-emerald-500/50 transition-all"
                        >
                            [ VIEW_LEGAL_PROTOCOLS ]
                        </button>
                    </div>

                    {/* Right: Uplinks */}
                    <div className="flex justify-end gap-6 text-emerald-400/70">
                        <a href="#" className="hover:text-emerald-400 hover:glow-sm transition-all group flex items-center gap-1">
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">[</span>
                            GITHUB
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">]</span>
                        </a>
                        <a href="#" className="hover:text-emerald-400 hover:glow-sm transition-all group flex items-center gap-1">
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">[</span>
                            LINKEDIN
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">]</span>
                        </a>
                        <a href="#" className="hover:text-emerald-400 hover:glow-sm transition-all group flex items-center gap-1">
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">[</span>
                            TWITTER
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">]</span>
                        </a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-4 border-t border-white/5 flex justify-between text-[10px] text-gray-700">
                    <span>LATENCY: 12ms</span>
                    <span>MEMORY: 14%</span>
                    <span>UPTIME: 142:21:09</span>
                </div>
            </div>
            {/* Legal Modal */}
            <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
        </footer>
    );
}
