import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Logo, Spinner } from './Icons';

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function WelcomeScreen() {
    const { login, continueAsGuest, signedOutForInactivity } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Signing in keeps the current address, so emailed links still open the right page.
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isEmail(email)) {
            setError('Enter a valid email address.');
            return;
        }
        setError('');
        setLoading(true);
        await login(email.trim());
        setLoading(false);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );
                await login(userInfo.data.email, userInfo.data);
            } catch (err) {
                console.error('Google sign-in error:', err);
                setError('Google sign-in did not complete. Please try again.');
            }
        },
        onError: () => setError('Google sign-in did not complete. Please try again.'),
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
            <div className="fade-in w-full max-w-sm">
                <div className="mb-8 text-center">
                    <Logo className="mx-auto h-12 w-12" />
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">MedNexus</h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        Describe your symptoms, read a lab report, or check your heart and diabetes risk.
                    </p>
                </div>

                {signedOutForInactivity && (
                    <p className="notice notice-info mb-4">You were signed out after 15 minutes without activity.</p>
                )}

                <div className="card space-y-4 p-6">
                    <button type="button" onClick={() => googleLogin()} className="btn btn-secondary w-full">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="h-px flex-1 bg-line" />
                        or
                        <span className="h-px flex-1 bg-line" />
                    </div>

                    <form onSubmit={handleLogin} noValidate>
                        <label htmlFor="welcome-email" className="field-label">Email</label>
                        <input
                            id="welcome-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="input"
                        />
                        {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
                        <button type="submit" disabled={loading} className="btn btn-primary mt-3 w-full">
                            {loading ? <><Spinner /> Signing in</> : 'Continue with email'}
                        </button>
                    </form>
                </div>

                <button type="button" onClick={continueAsGuest} className="btn btn-ghost mt-3 w-full">
                    Continue as a guest
                </button>

                <p className="mt-6 text-center text-xs leading-relaxed text-muted">
                    Guests can use everything except emailed check-ins, with a lower daily limit.
                    MedNexus is not a doctor and is not for emergencies.
                </p>
            </div>
        </div>
    );
}
