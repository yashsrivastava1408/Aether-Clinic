import React, { useEffect, useRef, useState } from "react";

// Scramble Text Effect
const ScrambleText = ({ text, className = "", delay = 0 }) => {
    const [displayText, setDisplayText] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

    useEffect(() => {
        const startTimer = setTimeout(() => {
            let iteration = 0;
            const interval = setInterval(() => {
                setDisplayText(
                    text.split("").map((letter, index) => {
                        if (index < iteration) return letter;
                        if (letter === " ") return " ";
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join("")
                );

                if (iteration >= text.length) clearInterval(interval);
                iteration += 1 / 3;
            }, 30);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTimer);
    }, [text, delay]);

    return <span className={className}>{displayText || ""}</span>;
};

// Fake Audio Waveform
const AudioWaveform = () => (
    <div className="flex items-end space-x-1 h-4">
        {[...Array(5)].map((_, i) => (
            <div
                key={i}
                className="w-1 bg-emerald-500/80 rounded-full animate-wave"
                style={{
                    animationDelay: `${i * 0.1}s`,
                    height: '100%'
                }}
            />
        ))}
    </div>
);

// HUD Corner Brackets
const CornerBrackets = () => (
    <div className="absolute inset-4 sm:inset-8 pointer-events-none opacity-40">
        <svg className="absolute top-0 left-0 w-8 h-8 md:w-16 md:h-16 text-emerald-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 30 V 2 H 30" />
        </svg>
        <svg className="absolute top-0 right-0 w-8 h-8 md:w-16 md:h-16 text-emerald-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M98 30 V 2 H 70" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-8 h-8 md:w-16 md:h-16 text-emerald-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 70 V 98 H 30" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-8 h-8 md:w-16 md:h-16 text-emerald-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M98 70 V 98 H 70" />
        </svg>
    </div>
);

export default function SplashScreen({ onComplete }) {
    const videoRef = useRef(null);
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = 0; // 🔇 Hardware level silence
            video.muted = true; // Force mute flag
            video.play().catch(err => console.error("Video autoplay failed:", err));

            const handleTimeUpdate = () => {
                if (video.duration) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
            };

            const handleEnded = () => {
                startExit();
            };

            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('ended', handleEnded);

            // Force exit after 5 seconds max (as requested)
            const safetyTimer = setTimeout(() => {
                startExit();
            }, 5000);

            return () => {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('ended', handleEnded);
                clearTimeout(safetyTimer);
            };
        }
    }, [startExit]);

    const startExit = React.useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 800); // Wait for fade out animation
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>

            {/* 🎥 The Main Video - Scaled to crop "veo" watermark */}
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{
                    filter: `contrast(1.1) saturate(1.1) grayscale(${100 - progress}%)`, // Dynamic Bio-Saturation
                    transform: 'scale(1.2)' // Zoom to crop watermark
                }}
                src="/assets/Icon_Design_Feedback_and_Video.mp4"
                muted={true}
                defaultMuted={true}
                playsInline
                autoPlay
            />

            {/* 🌑 Cinematic Vignette & Overlay (Lighter for clarity) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_140%)] opacity-30 pointer-events-none" />

            {/* 🔍 CT Scan Laser Overlay */}
            <div className="absolute left-0 right-0 h-1 z-20 animate-scan pointer-events-none" />

            {/* 📐 HUD Corners */}
            <CornerBrackets />

            {/* 🖥️ Tech Overlay UI */}
            <div className="absolute bottom-10 left-0 right-0 px-8 md:px-16 flex flex-col items-center">
                <div className="font-mono text-xs tracking-[0.3em] mb-2 relative group cursor-pointer flex flex-col items-center" onClick={startExit}>

                    {/* Audio Waveform Effect */}
                    <div className="mb-2 opacity-60">
                        <AudioWaveform />
                    </div>

                    <div className="relative">
                        <span className="text-emerald-500/80">
                            <ScrambleText text="SYSTEM_INITIALIZING..." delay={200} />
                        </span>
                        {/* Glitch Overlay */}
                        <span className="absolute inset-0 text-emerald-400 opacity-0 group-hover:opacity-100 animate-glitch-1" aria-hidden="true">
                            SYSTEM_INITIALIZING...
                        </span>
                    </div>

                    <div className="text-[10px] text-white/20 mt-1 text-center opacity-50">CLICK TO BYPASS</div>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-200 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes glitch-anim-1 {
                    0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
                    20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
                    40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
                    60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
                    80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
                    100% { clip-path: inset(30% 0 20% 0); transform: translate(1px, -1px); }
                }
                .animate-glitch-1 {
                    animation: glitch-anim-1 2s infinite linear alternate-reverse;
                }
                @keyframes wave {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
                .animate-wave {
                    animation: wave 1s ease-in-out infinite;
                }
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                    background: linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.8), transparent);
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
                }
            `}</style>
        </div>
    );
}
