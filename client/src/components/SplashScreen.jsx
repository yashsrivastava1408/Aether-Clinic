import React, { useEffect, useState, useRef } from "react";

// 🔥 Letter-by-Letter Animation Component
const AnimatedLetters = ({ text, className = "", delay = 0, staggerMs = 60 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span className={`inline-flex flex-wrap justify-center ${className}`}>
            {text.split("").map((letter, i) => (
                <span
                    key={i}
                    className="inline-block"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? 'translateY(0) rotateX(0) scale(1)'
                            : 'translateY(100px) rotateX(-90deg) scale(0.3)',
                        filter: isVisible ? 'blur(0px)' : 'blur(10px)',
                        transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1)`,
                        transitionDelay: `${i * staggerMs}ms`,
                    }}
                >
                    {letter === " " ? "\u00A0" : letter}
                </span>
            ))}
        </span>
    );
};

// Scramble Text Effect
const ScrambleText = ({ text, className = "", delay = 0 }) => {
    const [displayText, setDisplayText] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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

    return <span className={className}>{displayText || text.replace(/./g, " ")}</span>;
};

// 🧬 Medical Data Stream Effect
const MedicalDataStream = () => {
    const [streams, setStreams] = useState([]);

    useEffect(() => {
        // Generate fewer, higher quality streams
        const newStreams = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            width: Math.random() * 200 + 100,
            opacity: Math.random() * 0.15 + 0.05,
            speed: Math.random() * 10 + 15,
            delay: Math.random() * 5,
            content: Array.from({ length: 10 }, () => Math.random().toString(16).substring(2, 6).toUpperCase()).join(" "),
        }));
        setStreams(newStreams);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {streams.map((s) => (
                <div
                    key={s.id}
                    className="absolute top-0 text-[10px] font-mono whitespace-nowrap text-emerald-500/30"
                    style={{
                        left: `${s.left}%`,
                        writingMode: 'vertical-rl',
                        animation: `dataFall ${s.speed}s linear infinite`,
                        animationDelay: `-${s.delay}s`,
                        opacity: s.opacity,
                    }}
                >
                    {s.content}
                </div>
            ))}
        </div>
    );
};

// 🕸️ Holographic Grid & Circuit
const CircuitEffects = () => {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Spinning Dashed Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg width="600" height="600" viewBox="0 0 600 600" className="animate-spin-slower opacity-20">
                    <circle cx="300" cy="300" r="280" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="100 150" strokeOpacity="0.3" />
                    <circle cx="300" cy="300" r="250" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="50 100" strokeOpacity="0.5" />
                </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg width="400" height="400" viewBox="0 0 400 400" className="animate-spin-reverse-slower opacity-30">
                    <circle cx="200" cy="200" r="180" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="20 40" />
                </svg>
            </div>

            {/* Scanning Line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-[10%] w-full animate-scanline pointer-events-none" />
        </div>
    );
};


// Helper component for DNA
const DNAHelix = () => {
    return (
        <div className="dna-container">
            <div className="strand">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="node-pair" style={{ top: `${i * 12}%`, transform: `rotateY(${i * 25}deg)` }}>
                        <div className="node" style={{ left: '0%' }} />
                        <div className="node" style={{ left: '100%' }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center overflow-hidden animate-splash-exit">
            {/* Background Data Streams */}
            <MedicalDataStream />

            {/* Subtle ambient glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] bg-emerald-900/10" />
            </div>

            {/* Holographic Loops and Grids */}
            <CircuitEffects />

            {/* Logo Container */}
            <div className="relative z-10 text-center">
                {/* Logo with Glitch Effect on Hover/Interval */}
                <div className="animate-logo-bounce relative group">
                    <div className="relative w-28 h-28 mx-auto mb-10">
                        {/* Holographic Glow */}
                        <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-xl animate-pulse-slow" />

                        {/* Main Icon Container */}
                        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-900/30 animate-logo-reveal overflow-hidden">
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shine" />

                            {/* 🧬 DNA Helix (Shows first) */}
                            <DNAHelix />

                            {/* 🧠 Brain Icon (Reveals after DNA fades) */}
                            <span className="text-6xl brain-icon-reveal relative z-10">🧠</span>
                        </div>

                        {/* Glitch Duplicates (Hidden by default, can be toggled via CSS animation if desired) */}
                        <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 flex items-center justify-center animate-glitch-1 opacity-0">
                            <span className="text-6xl">🧠</span>
                        </div>
                    </div>
                </div>

                {/* 🔥 CRAZY Brand Name with Letter Animation */}
                <div className="overflow-hidden mb-2 relative">
                    {/* Subtle text back-glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-xl block" />

                    <h1 className="text-5xl md:text-6xl font-bold relative z-10">
                        <AnimatedLetters
                            text="Aether"
                            className="text-emerald-500"
                            delay={600}
                            staggerMs={80}
                        />
                    </h1>
                </div>

                <div className="overflow-hidden relative">
                    <h1 className="text-5xl md:text-6xl font-bold relative z-10">
                        <AnimatedLetters
                            text="Clinic"
                            className="text-white"
                            delay={1200}
                            staggerMs={80}
                        />
                    </h1>
                </div>

                {/* Scramble Tagline */}
                <p className="text-gray-500 mt-6 text-sm tracking-widest uppercase font-mono relative">
                    <span className="absolute -left-4 top-0 text-emerald-500/50 animate-pulse">&gt;</span>
                    <ScrambleText
                        text="AI-POWERED HEALTHCARE"
                        delay={1800}
                    />
                    <span className="animate-blink text-emerald-500 ml-1">_</span>
                </p>

                {/* Loading Bar with Data Label */}
                <div className="mt-12 relative w-48 mx-auto">
                    <div className="flex justify-between text-[10px] text-emerald-500/60 font-mono mb-1 w-full">
                        <span>LOADING_MODULES...</span>
                        <span>100%</span>
                    </div>
                    <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{
                                animation: 'loadingBar 2.5s ease-out forwards',
                            }}
                        />
                    </div>
                </div>
            </div>


            <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes dataFall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
        }
        @keyframes shine {
            0% { transform: translateX(-150%) skewX(-15deg); }
            50%, 100% { transform: translateX(150%) skewX(-15deg); }
        }
        .animate-spin-slower {
            animation: spin 20s linear infinite;
        }
        .animate-spin-reverse-slower {
            animation: spin 25s linear infinite reverse;
        }
        .animate-scanline {
            animation: scanline 4s linear infinite;
        }
        .animate-shine {
            animation: shine 3s ease-in-out infinite;
            animation-delay: 1s;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-blink {
            animation: pulse 1s steps(2) infinite;
        }
        @keyframes glitch-anim-1 {
            0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 2px); opacity: 0.8; }
            20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -2px); opacity: 0.8; }
            40% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 2px); opacity: 0.8; }
            60% { opacity: 0; }
            100% { opacity: 0; }
        }
        .animate-glitch-1 {
            animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        
        /* 🧬 DNA Helix Animation */
        .dna-container {
          position: absolute;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          perspective: 1000px;
          transform-style: preserve-3d;
          animation: fadeOutDNA 0.5s ease-out 2.5s forwards;
        }
        .strand {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: rotateDNA 3s linear infinite;
        }
        .node {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          left: 50%;
          box-shadow: 0 0 10px #10b981;
        }
        .node-pair {
            position: absolute;
            width: 100%;
            height: 2px;
            background: rgba(16, 185, 129, 0.3);
            left: 0;
            top: 50%;
            transform-style: preserve-3d;
        }
        @keyframes rotateDNA {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes fadeOutDNA {
           0% { opacity: 1; transform: scale(1); }
           100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes brainReveal {
           0% { opacity: 0; transform: scale(0.5); filter: blur(10px); }
           100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        .brain-icon-reveal {
            animation: brainReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 2.2s forwards;
            opacity: 0; 
        }
      `}</style>
        </div >
    );
}


