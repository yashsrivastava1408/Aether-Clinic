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
            <div className="w-24 h-24 relative animate-logo-pulse">
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg animate-glitch-logo opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold font-mono text-emerald-500">
                M
              </div>
            </div>
            <div className="absolute -inset-10 bg-emerald-500/10 blur-3xl animate-pulse" />
          </div>

          <div className="w-64 space-y-4 text-center">
            <div className="flex justify-between text-[10px] font-mono text-emerald-500/70 mb-1 tracking-widest">
              <span>INITIALIZING_PLATFORM</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-gray-600 animate-pulse">
              SECURE_HANDSHAKE: ENTERPRISE_V12.4
            </div>
          </div>
        </div>
      )}

      {/* HUD Bar Top */}
      <div className="fixed inset-x-0 top-0 h-10 bg-[#050505] z-50 border-b border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-300">LIVE PLATFORM</span>
          </div>
          <span className="opacity-30">|</span>
          <span>NODE_01: US_EAST</span>
        </div>
        <div className="flex items-center gap-6">
          <span>LAT: 8ms</span>
          <span>UPTIME: 99.99%</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* HUD Bar Bottom */}
      <div className="fixed inset-x-0 bottom-0 h-10 bg-[#050505] z-50 border-t border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <span>THROUGHPUT: 1.2 Gbps</span>
          <span>ENCRYPTION: AES-256</span>
        </div>
        <div className="flex items-center gap-2">
          <span>SESSION_ID:</span>
          <span className="text-emerald-500/70">MDN_8819</span>
        </div>
      </div>

      {/* Subtle Noise / Grid Effects */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.03] animate-noise bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

      {/* Main Content Area */}
      <div className={`transition-all duration-1000 ${isUnlocked ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'} animate-cinematic-pan`}>
        <div className="pt-32 pb-32 px-6 relative">
          <div className="max-w-6xl mx-auto relative z-10 space-y-32">

            {/* Mission Statement */}
            <section className="text-center space-y-8 mt-12">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4 font-mono tracking-widest uppercase text-[10px] shadow-sm ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-white shadow-emerald-500/10 text-emerald-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Pioneering Preventive Health
              </div>
              
              <h1 className={`text-6xl md:text-8xl font-bold tracking-tight relative ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Redefining Diagnostic <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 animate-text-gradient-flow relative z-10">
                  Intelligence.
                </span>
                <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[120%] h-[150%] blur-3xl rounded-full -z-10 animate-aurora ${isDark ? 'from-emerald-500/10 to-cyan-500/10 bg-gradient-to-r' : 'from-emerald-400/20 to-cyan-400/20 bg-gradient-to-r'}`} />
              </h1>
              
              <p className={`max-w-3xl mx-auto text-xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                MedNexus is a venture-backed, AI-driven diagnostic support platform. We combine <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>state-of-the-art machine learning algorithms</span>,
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}> immutable cloud architecture</span>, and <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>clinical-grade predictive analytics</span> to empower patients and assist practitioners in early disease detection.
              </p>
            </section>

            {/* Core Capabilities */}
            <section>
              <h3 className={`text-2xl font-bold tracking-tight mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                CORE CAPABILITIES
              </h3>
              <div className={`grid md:grid-cols-2 gap-6 pb-12 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                {[
                  {
                    title: "CONVERSATIONAL TRIAGE",
                    id: "AI_01",
                    desc: "Utilizing advanced Large Language Models to analyze symptom patterns and provide immediate, context-aware medical guidance with high clinical relevance and empathy."
                  },
                  {
                    title: "PREDICTIVE HEALTH ANALYTICS",
                    id: "ML_02",
                    desc: "Leveraging custom ensemble models trained on extensive clinical datasets to predict cardiovascular and metabolic risks (Heart Disease, Diabetes) with industry-leading precision."
                  },
                  {
                    title: "DOCUMENT INTELLIGENCE",
                    id: "VIS_03",
                    desc: "A powerful computer vision pipeline capable of parsing OCR from complex medical reports and identifying anomalies in user-uploaded imagery for second-opinion synthesis."
                  },
                  {
                    title: "ZERO-TRUST SECURITY",
                    id: "SEC_04",
                    desc: "End-to-end data sanitization and AES-256 storage encryption, ensuring HIPAA-compliant architectural standards for all patient conversations, reports, and health metrics."
                  }
                ].map((cap, i) => (
                  <div key={i} className={`p-8 border rounded-2xl transition-all duration-300 group hover:-translate-y-1 ${isDark ? 'border-white/10 bg-[#0a0a0a]/50 hover:bg-[#111]' : 'border-slate-200 bg-white hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-emerald-500 font-bold tracking-tight text-lg">{cap.title}</h3>
                      <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isDark ? 'text-emerald-500/40 bg-emerald-500/5 border border-emerald-500/10' : 'text-emerald-600/60 bg-emerald-50 border border-emerald-100'}`}>{cap.id}</span>
                    </div>
                    <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-600 group-hover:text-slate-800'}`}>
                      {cap.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Platform Infrastructure */}
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className={`text-3xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    PLATFORM INFRASTRUCTURE
                  </h3>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Designed for scale, reliability, and extreme low-latency processing.</p>
                </div>
                <span className={`text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-2 ${isDark ? 'text-emerald-500/70 border border-emerald-500/20 bg-emerald-500/10' : 'text-emerald-700 border border-emerald-200 bg-emerald-50'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ENTERPRISE_GRADE
                </span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Intelligent Engine", tech: "Gemini Pro + PyTorch", icon: <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>, desc: "Advanced reasoning and specialized ML orchestration for medical triage." },
                  { title: "Modern Interface", tech: "React + Tailwind", icon: <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, desc: "A frictionless, responsive user experience optimized for both mobile and web." },
                  { title: "Scalable compute", tech: "Node.js + Kubernetes", icon: <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>, desc: "Asynchronous event handling designed for high-throughput availability." },
                  { title: "Secure Data Vault", tech: "MongoDB + AES-256", icon: <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, desc: "Military-grade encryption securing sensitive biometric and health data." }
                ].map((item, i) => (
                  <div key={i} className={`group relative p-6 border rounded-2xl transition-all duration-300 hover:-translate-y-2 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5 hover:bg-emerald-950/20 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-300'}`}>
                    <div className="mb-5 group-hover:scale-110 transition-transform duration-300 origin-bottom-left">{item.icon}</div>
                    <h4 className="text-emerald-500 font-mono text-[10px] tracking-widest uppercase mb-2">{item.title}</h4>
                    <div className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.tech}</div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-slate-600'}`}>{item.desc}</p>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl" />
                  </div>
                ))}
              </div>
            </section>

            {/* Core Architecture (Founder) */}
            <section className="space-y-10 py-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className={`text-3xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    CORE ARCHITECTURE
                  </h3>
                  <p className={`mt-2 text-sm max-w-xl ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>MedNexus is engineered by a single, dedicated systems architect pushing the boundaries of applied machine learning in healthcare.</p>
                </div>
              </div>

              <div className={`p-8 border rounded-3xl backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${isDark ? 'bg-[#0a0a0a]/80 border-white/5 hover:border-emerald-500/20 hover:shadow-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-emerald-500/10'}`}>
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
                  {/* Avatar Placeholder */}
                  <div className={`w-28 h-28 shrink-0 rounded-2xl flex items-center justify-center font-bold text-4xl shadow-lg border ${isDark ? 'bg-gradient-to-br from-emerald-900/50 to-black border-emerald-500/20 text-emerald-500' : 'bg-gradient-to-br from-emerald-100 to-white border-emerald-200 text-emerald-600'}`}>
                    YS
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 font-mono tracking-widest uppercase text-[10px] shadow-sm border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                      FOUNDER & LEAD ENGINEER
                    </div>
                    <h4 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Yash Srivastava</h4>
                    <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Solo developer and architect behind MedNexus. Responsible for end-to-end implementation including the fine-tuned machine learning ensembles, the scalable zero-trust Node.js backend infrastructure, and the high-performance React user interface. Driven by the mission to democratize clinical-grade AI analytics.
                    </p>
                    
                    <div className="flex gap-4 mt-6 justify-center sm:justify-start">
                      <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        Full-Stack AI
                      </div>
                      <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Zero-Trust Security
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Corporate Transparency (FAQ) */}
            <section className={`max-w-4xl mx-auto space-y-8 border p-10 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-2xl ${isDark ? 'bg-gradient-to-b from-[#111] to-[#0a0a0a] border-white/10 shadow-black/50' : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-slate-200/50'}`}>
              <div className={`absolute inset-0 bg-[url('/assets/grid.svg')] pointer-events-none ${isDark ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} />

              <h3 className={`text-2xl font-bold flex items-center gap-3 relative z-10 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span> 
                TRUST & TRANSPARENCY
              </h3>

              <div className="grid gap-8 relative z-10 mt-8">
                {[
                  { q: "HOW IS MY HEALTH DATA SECURED?", a: "Protecting patient data is our highest priority. All data is encrypted at rest using AES-256-CBC and in transit via TLS 1.3. Our zero-trust architecture ensures that patient records and dialogues remain strictly confidential, compliant with global healthcare data standards." },
                  { q: "IS MEDNEXUS REPLACING MY PRIMARY CARE DOCTOR?", a: "No. MedNexus is a sophisticated clinical decision-support system. It empowers patients with actionable, data-driven insights but fundamentally serves to augment—not replace—professional medical diagnosis. Always consult a licensed physician." },
                  { q: "HOW ACCURATE ARE THE PREDICTIVE MODELS?", a: "Our proprietary cardiovascular and metabolic risk models are rigorously trained on extensive open-source clinical datasets. By incorporating advanced techniques like SMOTE for class balancing and Stacking Classifiers, we maximize accuracy and recall to ensure highly reliable risk detection." }
                ].map((faq, i) => (
                  <div key={i} className={`flex gap-6 items-start p-6 rounded-2xl border transition-colors ${isDark ? 'bg-black/40 border-white/5 hover:border-emerald-500/20' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                       <div className={`font-bold text-sm tracking-wide mb-3 ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{faq.q}</div>
                       <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{faq.a}</div>
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