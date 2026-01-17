import React, { useState, useEffect } from "react";
import TiltCard from "../components/TiltCard";
import { useTheme } from "../context/ThemeContext";

export default function About() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUnlocked(true), 800);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#030303] text-gray-300' : 'bg-slate-50 text-slate-600'}`}>

      {/* Cinematic Splash Screen (Keep Dark for Effect) */}
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
          <div className="relative mb-8">
            {/* Logo Glitch Placeholder - Using a stylized 'A' icon */}
            <div className="w-24 h-24 relative animate-logo-pulse">
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg animate-glitch-logo opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold font-mono text-emerald-500">
                A
              </div>
            </div>

            {/* Scanning Glow */}
            <div className="absolute -inset-10 bg-emerald-500/10 blur-3xl animate-pulse" />
          </div>

          <div className="w-64 space-y-4 text-center">
            <div className="flex justify-between text-[10px] font-mono text-emerald-500/70 mb-1 tracking-widest">
              <span>SCANNING_NEURAL_ARCHIVE</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-gray-600 animate-pulse">
              ACCESS_PROTOCOL: SECURE_DOSSIER_v7.1
            </div>
          </div>
        </div>
      )}

      {/* Cinematic HUD (Top/Bottom Letterboxing - Keep Dark for Cinematic Feel or adapt?) 
          Let's keep them dark black bars for the "Movie" feel even in light mode, or maybe slate-900.
      */}
      <div className="fixed inset-x-0 top-0 h-10 bg-[#050505] z-50 border-b border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-gray-300">LIVE FEED</span>
          </div>
          <span className="opacity-30">|</span>
          <span>CAM_01: ARCHIVE_DOSSIER</span>
        </div>
        <div className="flex items-center gap-6">
          <span>LAT: 12ms</span>
          <span>FPS: 60.0</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 h-10 bg-[#050505] z-50 border-t border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <span>BITRATE: 45.2 Mbps</span>
          <span>CODEC: HEVC_HDR</span>
        </div>
        <div className="flex items-center gap-2">
          <span>STORAGE_ID:</span>
          <span className="text-emerald-500/70">AETH_X1092</span>
        </div>
      </div>

      {/* Video Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.03] animate-noise bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

      {/* Cinematic Pan Container */}
      <div className={`transition-all duration-1000 ${isUnlocked ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'} animate-cinematic-pan`}>
        <div className="pt-32 pb-24 px-6 relative">

          {/* Main Content (Original About Page Content) */}
          <div className="max-w-6xl mx-auto relative z-10 space-y-24">

            {/* Project Mission */}
            <section className="text-center space-y-8">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 font-mono tracking-widest uppercase text-xs ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-white shadow-sm text-emerald-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Dossier Analysis
              </div>
              <h1 className={`text-5xl md:text-7xl font-bold tracking-tight relative ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Architecting the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 animate-text-gradient-flow">Future of Care.</span>
                <div className={`absolute -inset-1 blur-2xl bg-gradient-to-r -z-10 animate-aurora ${isDark ? 'from-emerald-500/20 to-cyan-500/20' : 'from-emerald-400/30 to-cyan-400/30'}`} />
              </h1>
              <p className={`max-w-3xl mx-auto text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Aether Clinic represents the convergence of <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>generative artificial intelligence</span>,
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}> secure cloud architecture</span>, and <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>predictive health analytics</span>.
                Designed as a scalable decision-support framework for the modern healthcare facility.
              </p>
            </section>

            {/* System Operations (Capabilities) - NEW PROFESSIONAL GRID */}
            <section className={`grid md:grid-cols-2 gap-6 pb-12 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              {[
                {
                  title: "NEURAL TRIAGE ENGINE",
                  id: "OPE_01",
                  desc: "Utilizing Large Language Models (Gemini 1.5) to analyze symptom patterns and provide immediate, context-aware medical guidance with >94% relevance accuracy."
                },
                {
                  title: "OPTICAL DIAGNOSTICS",
                  id: "OPE_02",
                  desc: "Computer Vision pipeline capable of parsing OCR from medical reports and identifying visual anomalies in user-uploaded imagery for second-opinion synthesis."
                },
                {
                  title: "BIOMETRIC SURVEILLANCE",
                  id: "OPE_03",
                  desc: "Predictive algorithmic modeling (Heart Risk Analysis) assessing cardiovascular health probability based on multi-variate physiological input data."
                },
                {
                  title: "SECURE TELEMETRY",
                  id: "OPE_04",
                  desc: "End-to-end data sanitization and AES-256 storage encryption ensuring HIPAA-compliant architectural standards for all patient dialogues."
                }
              ].map((cap, i) => (
                <div key={i} className={`p-8 border rounded-2xl transition-colors group ${isDark ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-200 bg-white hover:shadow-lg hover:border-emerald-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-emerald-500 font-bold tracking-tight">{cap.title}</h3>
                    <span className={`text-[10px] font-mono px-2 py-1 rounded ${isDark ? 'text-emerald-500/40 bg-emerald-500/5' : 'text-emerald-600/60 bg-emerald-50'}`}>{cap.id}</span>
                  </div>
                  <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-gray-400 group-hover:text-gray-200' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    {cap.desc}
                  </p>
                </div>
              ))}
            </section>



            {/* Neural Core Schematic (System Architecture) */}
            <section className="space-y-12">
              <h3 className={`text-3xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
                NEURAL_CORE_SCHEMATIC
                <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'text-emerald-500/50 bg-emerald-500/10' : 'text-emerald-600/70 bg-emerald-50'}`}>SYS_ARCH_V2</span>
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Synthetic Brain", tech: "Gemini 1.5 + Ollama", icon: "🧠", desc: "Advanced reasoning engine for symptom correlation and medical triage." },
                  { title: "Neural Interface", tech: "React + Vite + Tailwind", icon: "💠", desc: "High-latency visual cortex with holographic interaction layers." },
                  { title: "Logic Core", tech: "Node.js + Express", icon: "⚡", desc: "Asynchronous event handling and secure data routing." },
                  { title: "Secure Vault", tech: "MongoDB + AES-256", icon: "🔒", desc: "Military-grade encryption for biometric data persistence." }
                ].map((item, i) => (
                  <div key={i} className={`group relative p-6 border rounded-2xl transition-all duration-300 ${isDark ? 'bg-white/5 border-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:shadow-lg hover:border-emerald-200'}`}>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                    <h4 className="text-emerald-500 font-mono text-xs tracking-widest uppercase mb-2">{item.title}</h4>
                    <div className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.tech}</div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-slate-600'}`}>{item.desc}</p>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>

            {/* Security Protocols (FAQ) */}
            <section className={`max-w-4xl mx-auto space-y-8 border p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
              {/* Decorative background grid */}
              <div className={`absolute inset-0 bg-[url('/assets/grid.svg')] pointer-events-none ${isDark ? 'opacity-5' : 'opacity-10'}`} />

              <h3 className={`text-2xl font-bold flex items-center gap-3 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="text-emerald-500">🛡️</span> SECURITY_PROTOCOLS
              </h3>

              <div className="grid gap-6 relative z-10">
                {[
                  { q: "IS MY BIOMETRIC DATA SECURE?", a: "AFFIRMATIVE. All data is encrypted at rest using AES-256-CBC. Our zero-knowledge architecture ensures that even system administrators cannot access patient dialogues without the decryption key." },
                  { q: "IS THIS A LICENSED PHYSICIAN?", a: "NEGATIVE. Aether Clinic is a Type-2 Decision Support System. It provides triage guidance and health awareness. It does NOT replace human medical diagnostics." },
                  { q: "HOW ACCURATE IS THE VISION MODEL?", a: "The optical analysis engine (Gemini Vision) is calibrated for high-fidelity symptom recognition but operates with a conservatively tuned confidence threshold to prevent false positives." }
                ].map((faq, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="text-emerald-500 font-mono text-sm mt-1">0{i + 1}</div>
                    <div>
                      <div className="text-emerald-500/80 font-mono text-xs uppercase tracking-widest mb-1">QUERY: {faq.q}</div>
                      <div className={`text-sm leading-relaxed border-l-2 pl-4 ${isDark ? 'text-gray-300 border-emerald-500/20' : 'text-slate-600 border-emerald-200'}`}>{faq.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}