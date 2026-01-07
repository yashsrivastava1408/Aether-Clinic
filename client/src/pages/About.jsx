import React, { useState, useEffect } from "react";
import TiltCard from "../components/TiltCard";

export default function About() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

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
    <div className="min-h-screen bg-[#030303] text-gray-300 font-sans relative overflow-hidden">

      {/* Cinematic Splash Screen */}
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

      {/* Cinematic HUD (Top/Bottom Letterboxing) */}
      <div className="fixed inset-x-0 top-0 h-10 bg-black z-50 border-b border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
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

      <div className="fixed inset-x-0 bottom-0 h-10 bg-black z-50 border-t border-white/10 flex items-center justify-between px-6 font-mono text-[10px] text-gray-500">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Dossier Analysis
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight relative">
                Architecting the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 animate-text-gradient-flow">Future of Care.</span>
                <div className="absolute -inset-1 blur-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 -z-10 animate-aurora" />
              </h1>
              <p className="max-w-3xl mx-auto text-lg text-gray-400 leading-relaxed">
                Aether Clinic represents the convergence of <span className="text-white font-semibold">advanced machine learning</span>,
                <span className="text-white font-semibold"> cloud-native architecture</span>, and <span className="text-white font-semibold">human-centric design</span>.
                It is a <span className="text-emerald-400">digital immune system</span> for the modern era.
              </p>
            </section>

            {/* Developer Dossier */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* Profile Card */}
              <div className="lg:col-span-12 lg:flex gap-12 items-center">
                <div className="lg:w-1/3">
                  <TiltCard className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden p-1 hover:border-emerald-500/50 transition-all duration-500 shadow-2xl">
                    <div className="relative h-[500px] w-full rounded-2xl overflow-hidden bg-gray-900">
                      <img
                        src="/assets/yash.jpg"
                        alt="Yash Srivastava"
                        className="w-full h-full object-cover grayscale"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="text-4xl font-bold text-white mb-1">Yash Srivastava</h2>
                        <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase">Full Stack Developer & DevOps Enthusiast</div>
                      </div>
                    </div>
                  </TiltCard>
                </div>

                <div className="lg:w-2/3 space-y-12">
                  {/* Continuous Laser Line Timeline */}
                  <div className="space-y-8 relative">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-emerald-500" /> Professional Trajectory
                    </h3>

                    {[
                      { company: "XenKrypt Technologies", role: "DevOps Intern", date: "Present", desc: "Optimizing high-performance CI/CD pipelines and infrastructure reliability." },
                      { company: "SheSafe", role: "R&D Lead", date: "2025", desc: "Developing safety-critical hardware interfaces for women's security." },
                      { company: "CodeTech It Solutions", role: "Full Stack Developer", date: "2024", desc: "Building a cloud-native AI-powered medical report analysis system." }
                    ].map((job, i) => (
                      <div key={i} className="group pl-6 border-l border-white/10 relative">
                        <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 group-hover:bg-emerald-500 transition-all" />
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors uppercase">{job.role}</h4>
                          <span className="text-[10px] font-mono text-gray-600">{job.date}</span>
                        </div>
                        <div className="text-emerald-500/70 text-[10px] uppercase tracking-widest mb-2">{job.company}</div>
                        <p className="text-gray-500 text-sm">{job.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: "CORE", value: "React, Node, Py" },
                      { label: "CLOUD", value: "K8s, Docker, EC2" },
                      { label: "AI", value: "LLama, OpenCV" },
                      { label: "OPS", value: "GitHub, CI/CD" }
                    ].map(skill => (
                      <div key={skill.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                        <span className="block text-[10px] text-emerald-500 mb-1 font-mono tracking-widest uppercase">{skill.label}</span>
                        <span className="text-white text-xs whitespace-nowrap">{skill.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}