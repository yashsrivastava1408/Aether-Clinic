import React, { useState, useEffect, useRef } from "react";
import TiltCard from "../components/TiltCard";
import VoiceVisualizer from "../components/VoiceVisualizer";
import NeuralSyncSequence from "../components/NeuralSyncSequence";
import { getUserId } from "../utils/user";
import axios from "axios";

// --- Assets / Icons ---
// Reuse same icons as before
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
  </svg>
);
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6.249a1 1 0 011.62-.78l5.38 6.271a1 1 0 010 1.56l-5.38 6.271A1 1 0 019 19z" transform="rotate(90 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 8.5a2.5 2.5 0 115 0" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 8.5a2.5 2.5 0 115 0" />
  </svg>
);
const LungsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15c-3-3-3-8 0-11s8-3 11 0c3 3 3 8 0 11l-5.5 5.5L6 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 15c3-3 3-8 0-11s-8-3-11 0c-3 3-3 8 0 11l5.5 5.5L18 15z" />
  </svg>
);
const StomachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6C6 6 3 9 3 13c0 4 3 7 9 7s9-3 9-7c0-4-3-7-9-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);
const BoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5c-1.104 0-2 .896-2 2v10c0 1.104.896 2 2 2h6c1.104 0 2-.896 2-2V7c0-1.104-.896-2-2-2H9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19a2 2 0 002 2h2a2 2 0 002-2" />
  </svg>
);

const specialists = [
  { id: 1, name: "Cardiology", role: "Cardiac Specialist", description: "Advanced heart rhythm analysis & vascular mapping.", accuracy: "99.9%", cases: "12,402", icon: <HeartIcon />, color: "rose" },
  { id: 2, name: "Neurology", role: "Brain & Nerves", description: "Neural pathway diagnostics & cognitive function assessment.", accuracy: "99.7%", cases: "8,291", icon: <BrainIcon />, color: "violet" },
  { id: 3, name: "Pulmonology", role: "Respiratory System", description: "Lung capacity modeling & respiratory tract imaging.", accuracy: "99.5%", cases: "15,100", icon: <LungsIcon />, color: "cyan" },
  { id: 4, name: "Gastroenterology", role: "Digestive Health", description: "Metabolic enzyme tracking & gut microbiome analysis.", accuracy: "99.8%", cases: "9,855", icon: <StomachIcon />, color: "emerald" },
  { id: 5, name: "Orthopedics", role: "Bone & Joint", description: "Skeletal structural integrity & kinetic movement scanning.", accuracy: "99.6%", cases: "11,203", icon: <BoneIcon />, color: "amber" },
];

export default function Consultation({ onSelectDoctor }) {
  // Use Ref for rotation to avoid re-renders on every scroll event
  const rotationRef = useRef(0);
  const carouselRef = useRef(null);
  const rafRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [pendingDoctor, setPendingDoctor] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isCheckingHistory, setIsCheckingHistory] = useState(false);

  useEffect(() => {
    // Simulate Neural Link initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Carousel Config
  const ITEM_COUNT = specialists.length;
  const ANGLE_PER_ITEM = 360 / ITEM_COUNT;
  const RADIUS = 500;

  useEffect(() => {
    const handleWheel = (e) => {
      // Direct update logic
      // e.deltaY is usually around 10-100. Lower divisor = faster spin.
      const delta = e.deltaY * 0.1;
      rotationRef.current -= delta;

      // Use requestAnimationFrame for smooth visual update
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (carouselRef.current) {
            carouselRef.current.style.transform = `rotateY(${rotationRef.current}deg)`;
          }
          rafRef.current = null;
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const handleDoctorSelect = async (doctor) => {
    setPendingDoctor(doctor);
    setIsCheckingHistory(true);
    const userId = getUserId();

    try {
      const res = await axios.get(`http://localhost:5050/api/chat/history/${userId}/${doctor.name}`);
      if (res.data.messages && res.data.messages.length > 0) {
        setShowHistoryModal(true);
      } else {
        onSelectDoctor(doctor);
      }
    } catch (e) {
      console.error("History check failed, proceeding as new", e);
      onSelectDoctor(doctor);
    } finally {
      setIsCheckingHistory(false);
    }
  };

  const handleContinue = () => {
    onSelectDoctor(pendingDoctor);
    setShowHistoryModal(false);
    setPendingDoctor(null);
  }

  const handleNewChat = async () => {
    const userId = getUserId();
    try {
      // Clear history for this doctor
      await axios.delete(`http://localhost:5050/api/chat/history/${userId}/${pendingDoctor.name}`);
    } catch (e) {
      console.error("Failed to clear history", e);
    }
    // Convert to simple "New Chat" logic by just proceeding. 
    // The backend won't find history now (or we deleted it).
    onSelectDoctor(pendingDoctor);
    setShowHistoryModal(false);
    setPendingDoctor(null);
  }


  const getColorClass = (color) => {
    switch (color) {
      case 'rose': return 'text-rose-500 border-rose-500/30 bg-rose-500/10 group-hover:bg-rose-500/20 group-hover:border-rose-500/50';
      case 'violet': return 'text-violet-500 border-violet-500/30 bg-violet-500/10 group-hover:bg-violet-500/20 group-hover:border-violet-500/50';
      case 'cyan': return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50';
      case 'emerald': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50';
      case 'amber': return 'text-amber-500 border-amber-500/30 bg-amber-500/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/50';
      default: return 'text-gray-500';
    }
  };

  const getGlow = (color) => {
    switch (color) {
      // Reduced shadow intensity for performance
      case 'rose': return 'shadow-[0_0_20px_rgba(244,63,94,0.1)] group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]';
      case 'violet': return 'shadow-[0_0_20px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]';
      case 'cyan': return 'shadow-[0_0_20px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]';
      case 'emerald': return 'shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]';
      case 'amber': return 'shadow-[0_0_20px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]';
      default: return '';
    }
  };

  return (
    <div
      className="h-screen bg-[#030303] overflow-hidden relative flex flex-col items-center justify-center perspective-1000"
      style={{ perspective: "1500px" }}
    >
      {/* Module Splash Screen Overhaul */}
      {loading && (
        <NeuralSyncSequence onComplete={() => setLoading(false)} />
      )}

      {/* History Selection Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-emerald-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <h3 className="text-xl font-bold text-white mb-2">Previous Session Detected</h3>
            <p className="text-gray-400 text-sm mb-6">A consultation history exists with {pendingDoctor?.name}. Would you like to resume where you left off?</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleNewChat} className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-mono uppercase">
                Start New
              </button>
              <button onClick={handleContinue} className="px-6 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-sm font-mono uppercase">
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Header */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center z-50 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">Neural Orbit</h2>
        <p className="text-gray-500 text-sm">Scroll to rotate • Click node to engage</p>
      </div>

      {/* Central Hologram Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative animate-pulse opacity-60">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full mix-blend-screen" />
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent tracking-tighter select-none">
            AETHER
          </h1>
          <div className="text-emerald-500/30 text-lg md:text-xl font-mono tracking-[1.2em] text-center mt-[-10px] ml-[1.2em] select-none">
            CLINIC
          </div>
        </div>
      </div>

      {/* 3D Carousel Container */}
      <div
        ref={carouselRef}
        className="relative w-[300px] h-[400px] preserve-3d will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(0deg)` // Initial state
        }}
      >
        {specialists.map((spec, index) => {
          const angle = index * ANGLE_PER_ITEM;
          return (
            <div
              key={spec.id}
              className="absolute inset-0 w-full h-full will-change-transform"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
              }}
            >
              <div
                onClick={() => handleDoctorSelect(spec)}
                className="w-full h-full cursor-pointer transition-all duration-300 hover:scale-105"
              >
                {/* Reduced blur from xl to md for performance */}
                <TiltCard className={`relative group w-full h-full bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-500 ${getGlow(spec.color)}`}>
                  {/* Card Content Reuse */}
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2.5 border ${getColorClass(spec.color)}`}>
                        {spec.icon}
                      </div>
                      <div className="text-[10px] font-mono text-white/30">ID_{String(spec.id).padStart(2, '0')}</div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{spec.name}</h3>
                      <div className={`text-${spec.color}-500/80 text-xs font-medium uppercase tracking-wider mb-2`}>{spec.role}</div>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{spec.description}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-end mt-2">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider">Accuracy</div>
                        <div className="text-sm font-mono font-bold text-white">{spec.accuracy}</div>
                      </div>
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-${spec.color}-500 w-[${spec.accuracy.slice(0, -1)}%]`} />
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Reflection Gradient */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#030303] to-transparent z-40 pointer-events-none" />
    </div>
  );
}