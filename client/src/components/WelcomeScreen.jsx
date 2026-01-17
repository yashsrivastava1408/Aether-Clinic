import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function WelcomeScreen() {
    const { login, continueAsGuest: authContinueGuest } = useAuth();
    const navigate = useNavigate();
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            if (email.includes('@')) {
                await login(email);
            } else {
                await login('user@example.com');
            }
            setLoading(false);
            navigate('/dashboard');
        }, 1500);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Fetch user info using the access token
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );

                console.log("Google Login Success:", userInfo.data);
                await login(userInfo.data.email, userInfo.data);
                navigate('/dashboard');
            } catch (error) {
                console.error("Google Login Error:", error);
            }
        },
        onError: () => console.log('Google Login Failed'),
    });

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />

            {/* Glowing Center Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />

            <div className="w-full max-w-md relative z-10 space-y-8 animate-fade-in-up">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6">
                        <span className="text-4xl">🧠</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            WELCOME <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">BACK</span>
                        </h1>
                        <p className="text-emerald-500/60 font-mono text-xs tracking-widest mt-2">
                            IDENTITY_CORE // SYSTEM_READY
                        </p>
                    </div>
                </div>

                {isLoginMode ? (
                    /* Login Form */
                    <div className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400 ml-1">NEURAL_ID (EMAIL)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-800 rounded-xl leading-5 bg-white/5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 sm:text-sm transition-all"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-900/20 text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        AUTHENTICATING...
                                    </span>
                                ) : (
                                    "SECURE LOGIN"
                                )}
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#050505] px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex justify-center w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    console.log("🔵 Google Sign-In Clicked");
                                    googleLogin();
                                }}
                                className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-700 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-all shadow-lg"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span>Sign in with Google</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsLoginMode(false)}
                            className="w-full text-center text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-wide mt-4"
                        >
                            {'< RETURN_TO_OPTIONS'}
                        </button>
                    </div>
                ) : (
                    /* Initial Options */
                    <div className="space-y-4">
                        <button
                            onClick={() => setIsLoginMode(true)}
                            className="group relative w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">Sign In</div>
                                    <div className="text-xs text-gray-500">Access your medical history</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => {
                                authContinueGuest();
                                navigate('/dashboard');
                            }}
                            className="group relative w-full flex items-center justify-between p-4 bg-transparent border border-dashed border-gray-700 rounded-xl hover:bg-white/5 hover:border-gray-500 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-300 group-hover:text-white transition-colors">Continue as Guest</div>
                                    <div className="text-xs text-gray-500">Limited access mode</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-300 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-8 text-center">
                    <p className="text-[10px] text-gray-600 font-mono">
                        By continuing, you agree to our Terms & Privacy Protocols.
                    </p>
                </div>
            </div>
        </div>
    );
}
