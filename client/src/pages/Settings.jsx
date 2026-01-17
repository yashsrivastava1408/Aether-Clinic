import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LegalModal from "../components/LegalModal";

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [showLegal, setShowLegal] = useState(false);

    return (
        <div className={`min-h-screen pt-24 px-6 pb-12 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-emerald-500 font-mono text-xs tracking-widest uppercase opacity-80">
                        SYSTEM_PREFERENCES.CONFIG // v2.0.4
                    </p>
                </div>

                <div className="grid gap-6">

                    {/* 👤 Account Section */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-emerald-500/30' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-emerald-500">
                            <span>👤</span> Account Profile
                        </h2>

                        <div className="flex items-center gap-5 mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/30 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{user?.name}</p>
                                <p className="text-sm opacity-60 font-mono">{user?.email}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
                                        {user?.isGuest ? 'GUEST ACCESS' : 'VERIFIED USER'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                        </button>
                    </div>

                    {/* 🎨 Appearance & Experience */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-blue-500">
                            <span>🎨</span> Appearance
                        </h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Dark Mode</p>
                                <p className="text-xs opacity-60">Toggle system-wide dark theme</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* 🛡️ Security & Privacy */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-purple-500">
                            <span>🛡️</span> Security & Privacy
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-500/10">
                                <div>
                                    <p className="font-medium">Encryption Status</p>
                                    <p className="text-xs opacity-60">Data transmission security</p>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-bold">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    AES-256 ACTIVE
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">2FA & Recovery</p>
                                    <p className="text-xs opacity-60">Managed via Google Account</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] border ${theme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                    EXTERNAL
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ⚖️ Legal & Compliance */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-yellow-500">
                            <span>⚖️</span> Legal & Compliance
                        </h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Legal Protocols</p>
                                <p className="text-xs opacity-60">Terms, Privacy, and Disclaimers</p>
                            </div>
                            <button
                                onClick={() => setShowLegal(true)}
                                className="px-4 py-2 text-xs font-medium bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors"
                            >
                                View Documents
                            </button>
                        </div>
                    </div>

                    {/* 💻 System Info */}
                    <div className="text-center pt-4 opacity-40">
                        <p className="text-xs font-mono">Aether Clinic v2.1.0 (Stable)</p>
                        <p className="text-[10px]">Build: 2026.01.16.RC4</p>
                    </div>

                </div>
            </div>

            {/* Legal Modal */}
            <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />
        </div>
    );
}
