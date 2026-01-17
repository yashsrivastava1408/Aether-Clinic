import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LegalModal from "../components/LegalModal";
import TiltCard from "../components/TiltCard";
import VoiceVisualizer from "../components/VoiceVisualizer";
import NeuralSyncSequence from "../components/NeuralSyncSequence";
import { getUserId } from "../utils/user";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

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
  { id: 1, name: "Heart Specialist", role: "Cardiologist", description: "Check your heart health and rhythm.", accuracy: "99.9%", cases: "12,402", icon: <HeartIcon />, color: "rose" },
  { id: 2, name: "Brain Specialist", role: "Neurologist", description: "Help with headaches and nerve issues.", accuracy: "99.7%", cases: "8,291", icon: <BrainIcon />, color: "violet" },
  { id: 3, name: "Lung Specialist", role: "Pulmonologist", description: "Check your breathing and lungs.", accuracy: "99.5%", cases: "15,100", icon: <LungsIcon />, color: "cyan" },
  { id: 4, name: "Stomach Specialist", role: "Gastroenterologist", description: "Help with digestion and stomach pain.", accuracy: "99.8%", cases: "9,855", icon: <StomachIcon />, color: "emerald" },
  { id: 5, name: "Bone Specialist", role: "Orthopedist", description: "Check your bones and joints.", accuracy: "99.6%", cases: "11,203", icon: <BoneIcon />, color: "amber" },
];

export default function Consultation({ onSelectDoctor }) {
  // Use Ref for rotation to avoid re-renders on every scroll event
  const rotationRef = useRef(0);
  const carouselRef = useRef(null);
  const rafRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Modal State
  const [showDisclaimer, setShowDisclaimer] = useState(false);
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
      // Prevent default page scroll behavior
      e.preventDefault();

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

    // Use passive: false to allow preventDefault()
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const handleDoctorSelect = async (doctor) => {
    console.log("🔥 Card clicked - Checking for existing session:", doctor?.name);

    if (!doctor) return;

    setIsCheckingHistory(true);
    const userId = getUserId();

    try {
      // Check for existing history
      // Ensure we encode the name to handle special chars like spaces/slashes
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/history/${userId}/${encodeURIComponent(doctor.name)}`);

      const hasHistory = res.data.messages && res.data.messages.length > 0;
      console.log(`📜 History check for ${doctor.name}: ${hasHistory ? 'FOUND' : 'EMPTY'}`);

      if (hasHistory) {
        // Get last active time from the last message
        const lastMsg = res.data.messages[res.data.messages.length - 1];
        const lastActive = lastMsg ? lastMsg.timestamp : null;

        setPendingDoctor({ ...doctor, lastActive });
        setShowHistoryModal(true);
      } else {
        // No history, go straight to chat
        navigateToChat(doctor);
      }

    } catch (error) {
      console.error("Failed to check history, proceeding to chat:", error);
      // Fallback: just go to chat
      navigateToChat(doctor);
    } finally {
      setIsCheckingHistory(false);
    }
  };

  const navigateToChat = (doctor) => {
    navigate(`/chatbot/${encodeURIComponent(doctor.name)}`, {
      state: {
        specializationName: doctor.name,
        specializationRole: doctor.role
      }
    });
  };

  const handleContinue = () => {
    console.log("Resuming session for:", pendingDoctor?.name);
    if (pendingDoctor) {
      navigateToChat(pendingDoctor);
    }
    setShowHistoryModal(false);
    setPendingDoctor(null);
  }

  const handleNewChat = async () => {
    console.log("Starting new session for:", pendingDoctor?.name);
    if (!pendingDoctor) return;

    const userId = getUserId();
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/history/${userId}/${encodeURIComponent(pendingDoctor.name)}`);
      console.log("🗑️ History cleared.");
    } catch (e) {
      console.error("Failed to clear history", e);
    }

    navigateToChat(pendingDoctor);
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
      className={`h-screen relative flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? 'bg-[#030303]' : 'bg-slate-50'}`}
      style={{ perspective: "1500px", overflow: "hidden" }}
    >
      {/* Module Splash Screen Overhaul */}
      {loading && (
        <NeuralSyncSequence onComplete={() => setLoading(false)} />
      )}

      {/* Legal Disclaimer Gate */}
      <LegalModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />

      {/* History Selection Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`relative border p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.2)] ${isDark ? 'bg-[#0f0f0f] border-emerald-500/30' : 'bg-white border-emerald-300'}`}>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setPendingDoctor(null);
              }}
              className={`absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 ${isDark ? 'hover:bg-white/10 text-gray-400' : 'text-slate-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Previous Session Detected</h3>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              History found with {pendingDoctor?.name}.
            </p>
            {pendingDoctor?.lastActive && (
              <p className="text-xs font-mono text-emerald-500 mb-6 uppercase tracking-wider">
                LAST ACTIVE: {new Date(pendingDoctor.lastActive).toLocaleString()}
              </p>
            )}

            <div className="flex gap-4 justify-center">
              <button onClick={handleNewChat} className={`px-6 py-2 rounded-lg border transition-all text-sm font-mono uppercase ${isDark ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5' : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-100'}`}>
                Start New
              </button>
              <button onClick={handleContinue} className="px-6 py-2 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-sm font-mono uppercase">
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-[0.05]' : 'opacity-[0.03]'}`}
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
                                  linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Header */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center z-50 pointer-events-none">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono tracking-widest uppercase mb-4 ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500/30 bg-white/80 text-emerald-600 shadow-sm'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </div>
        <h2 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a Doctor</h2>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Scroll to rotate • Click card to chat</p>

        {/* Loading Indicator for History Check */}
        {isCheckingHistory && (
          <div className="mt-2 text-emerald-500 text-xs font-mono animate-pulse">
            CONNECTING...
          </div>
        )}
      </div>

      {/* Central Hologram Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative animate-pulse opacity-60">
          <div className={`absolute inset-0 blur-[80px] rounded-full mix-blend-screen ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-400/10'}`} />
          <h1 className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b tracking-tighter select-none ${isDark ? 'from-white/20 to-transparent' : 'from-slate-900/10 to-transparent'}`}>
            HEALTH
          </h1>
          <div className="text-emerald-500/30 text-lg md:text-xl font-mono tracking-[1.2em] text-center mt-[-10px] ml-[1.2em] select-none">
            CLINIC
          </div>
        </div>
      </div>

      {/* 3D Carousel Container */}
      <div
        ref={carouselRef}
        className="relative w-[300px] h-[400px] preserve-3d will-change-transform z-50"
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
                zIndex: 100 // Force high z-index for individual cards
              }}
              onClick={() => {
                console.log("🟢 OUTER CONTAINER CLICKED:", spec.name);
                handleDoctorSelect(spec);
              }}
            >
              <div
                onClick={(e) => {
                  console.log("🔵 MIDDLE DIV CLICKED:", spec.name);
                  e.stopPropagation(); // Prevent bubbling issues
                  handleDoctorSelect(spec);
                }}
                onMouseDown={() => console.log("🟡 MOUSE DOWN:", spec.name)}
                onMouseUp={() => console.log("🟠 MOUSE UP:", spec.name)}
                className="w-full h-full cursor-pointer transition-all duration-300 hover:scale-105 pointer-events-auto relative"
                style={{ zIndex: 200 }}
              >
                <TiltCard
                  className={`relative group w-full h-full backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-500 ${isDark ? 'bg-[#0a0a0a]/90 border-white/10 hover:border-white/30' : 'bg-white/90 border-slate-200 hover:border-slate-300 shadow-lg'} ${getGlow(spec.color)}`}
                  onClick={() => {
                    console.log("🟣 TILT CARD CLICKED:", spec.name);
                    handleDoctorSelect(spec);
                  }}
                >
                  <div
                    className="p-6 h-full flex flex-col"
                    onClick={() => {
                      console.log("🔴 INNER CONTENT CLICKED:", spec.name);
                      handleDoctorSelect(spec);
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2.5 border ${getColorClass(spec.color)}`}>
                        {spec.icon}
                      </div>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-white/30' : 'text-slate-400'}`}>ID_{String(spec.id).padStart(2, '0')}</div>
                    </div>

                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{spec.name}</h3>
                      <div className={`text-${spec.color}-500/80 text-xs font-medium uppercase tracking-wider mb-2`}>{spec.role}</div>
                      <p className={`text-xs leading-relaxed line-clamp-3 ${isDark ? 'text-gray-500' : 'text-slate-600'}`}>{spec.description}</p>
                    </div>

                    <div className={`pt-4 border-t flex justify-between items-end mt-2 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                      <div>
                        <div className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Accuracy</div>
                        <div className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{spec.accuracy}</div>
                      </div>
                      <div className={`w-16 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
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
      <div className={`absolute bottom-0 w-full h-1/3 bg-gradient-to-t z-40 pointer-events-none ${isDark ? 'from-[#030303] to-transparent' : 'from-slate-50 to-transparent'}`} />
    </div>
  );
}