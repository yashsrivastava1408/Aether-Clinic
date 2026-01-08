import React, { useEffect, useState, useCallback, useRef } from "react";

// Optimized Floating Particles - Reduced count
const Particles = () => {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 20 + Math.random() * 10,
    size: 2 + Math.random() * 2,
  }));

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};

// Typewriter Text Component
const TypewriterText = ({ text, delay = 0 }) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [text, delay]);

  return (
    <span>
      {displayText}
      {showCursor && <span className="animate-pulse text-emerald-400">|</span>}
    </span>
  );
};

// 🕸️ Holographic HUD Overlay
const HolographicHUD = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden hidden md:block">
      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-emerald-500/30 rounded-br-lg" />

      {/* Top Center Status - Moved down below Navbar */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#030303]/80 backdrop-blur border border-white/5 px-6 py-2 rounded-full">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-mono text-emerald-500/80 tracking-[0.2em]">AETHER_OS v2.0 :: SYSTEM_ONLINE</span>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      </div>

      {/* Side Hex Ticker - vertical */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="text-[8px] font-mono text-emerald-500">
            {Math.random().toString(16).substring(2, 6).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Right Side Scale */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-20 items-end">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="h-[2px] bg-emerald-500" style={{ width: Math.random() * 20 + 5 + 'px' }} />
        ))}
      </div>
    </div>
  );
};

// 🦠 Nano-Bot Swarm Component
const NanoBots = () => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const mouse = useRef({ x: 0, y: 0, active: false });
  const particles = useRef([]);

  // Initialize particles
  useEffect(() => {
    if (!context) return;
    const count = 15;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 1,
      color: '#10b981'
    }));
  }, [context]);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setContext(canvas.getContext('2d'));

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const handleMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    // Use global window event for smoother tracking
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!context) return;
    let animationFrameId;

    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const { x: mx, y: my, active } = mouse.current;

      particles.current.forEach(p => {
        // Physics
        if (active) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Attraction to mouse (but orbit behavior)
          if (dist > 50) { // Don't collapse completely
            p.vx += dx * 0.0005;
            p.vy += dy * 0.0005;
          }
        }

        // Random wandering
        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy += (Math.random() - 0.5) * 0.05;

        // Friction
        p.vx *= 0.96;
        p.vy *= 0.96;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Draw Bot
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = 'rgba(16, 185, 129, 0.6)';
        context.fill();

        // Draw Connection to Mouse
        if (active) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            context.beginPath();
            context.moveTo(p.x, p.y);
            context.lineTo(mx, my);
            context.strokeStyle = `rgba(16, 185, 129, ${0.2 - dist / 750})`;
            context.lineWidth = 0.5;
            context.stroke();
          }
        }
      });
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animate();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [context]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[60]" />;
};

import TiltCard from "../components/TiltCard";
import NeuralMap from "../components/NeuralMap";
import NeuralBackground from "../components/NeuralBackground";
import BiometricPulse from "../components/BiometricPulse";

// 🧬 Glitch Morph Component (Unified)
const GlitchText = ({ initialText, hoverText, isHovered, className = "", redShift = false, blueShift = false }) => {
  const [displayText, setDisplayText] = useState(initialText);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
  const intervalRef = useRef(null);

  useEffect(() => {
    let iteration = 0;
    clearInterval(intervalRef.current);

    if (isHovered) {
      intervalRef.current = setInterval(() => {
        setDisplayText(
          hoverText
            .split("")
            .map((letter, index) => {
              if (index < iteration) return letter;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );
        if (iteration >= hoverText.length) clearInterval(intervalRef.current);
        iteration += 1 / 3;
      }, 30);
    } else {
      setDisplayText(initialText);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered, hoverText, initialText]);

  return (
    <span
      className={`inline-block transition-all duration-300 ${className}`}
      style={{
        textShadow: redShift && isHovered ? '-2px 0 red' : blueShift && isHovered ? '2px 0 blue' : 'none',
        transform: isHovered && (redShift || blueShift) ? `translate(${redShift ? -2 : 2}px, 0)` : 'none',
        opacity: redShift || blueShift ? 0.7 : 1,
        position: redShift || blueShift ? 'absolute' : 'relative',
        left: 0, top: 0,
        zIndex: redShift || blueShift ? 0 : 10
      }}
    >
      {displayText}
    </span>
  );
};

// Wrapper for the RGB Split Effect
const GlitchMetaText = ({ initialText, hoverText, isHovered, className = "" }) => {
  return (
    <div className="relative inline-block">
      {/* Main Text */}
      <GlitchText initialText={initialText} hoverText={hoverText} isHovered={isHovered} className={className} />

      {/* RGB Split Layers (only separate on hover ideally, but here we just render them) */}
      <GlitchText initialText={initialText} hoverText={hoverText} isHovered={isHovered} className={`${className} pointer-events-none`} redShift={true} />
      <GlitchText initialText={initialText} hoverText={hoverText} isHovered={isHovered} className={`${className} pointer-events-none`} blueShift={true} />
    </div>
  );
}

// 💬 The Synapse Component
const SynapseSection = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello. I am Aether. How can I assist with your health today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoScript = [
    { sender: 'user', text: 'I have a sharp pain in my left shoulder and vivid dreams.', delay: 1000 },
    { sender: 'bot', text: 'Analyzing symptoms... Correlating with recent vital scans.', delay: 2000, typing: true },
    { sender: 'bot', text: 'Potential indication of stress-induced varying arrhythmia. Advise immediate EKG.', delay: 1000 },
    { sender: 'user', text: 'Can I book an appointment?', delay: 1500 },
    { sender: 'bot', text: 'Affirmative. Dr. Sarah Chen is available at 14:00. Scheduling now...', delay: 1500, typing: true },
    { sender: 'system', text: 'APPOINTMENT_CONFIRMED [ID: #9X29]', delay: 500 }
  ];

  useEffect(() => {
    let timeout;
    if (demoStep < demoScript.length) {
      const step = demoScript[demoStep];

      timeout = setTimeout(() => {
        if (step.typing) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addMessage(step);
            setDemoStep(prev => prev + 1);
          }, 1500); // Fake typing duration
        } else {
          addMessage(step);
          setDemoStep(prev => prev + 1);
        }
      }, step.delay);
    } else {
      // Loop the demo after a long pause
      timeout = setTimeout(() => {
        setMessages([{ id: 1, sender: 'bot', text: 'Hello. I am Aether. How can I assist with your health today?' }]);
        setDemoStep(0);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [demoStep]);

  const addMessage = (step) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: step.sender, text: step.text }]);
  };

  return (
    <section className="relative py-32 px-6 flex items-center justify-center min-h-[80vh] bg-[#030303] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left: Text Info */}
        <div className="space-y-6 reveal-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Demo
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            The <span className="text-emerald-500">Synapse</span> Interface.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Experience real-time medical deduction. Our AI parses natural language, cross-references millions of case files, and delivers precision guidance in milliseconds.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl">⚡</div>
            <div>
              <div className="text-white font-semibold">Zero Latency</div>
              <div className="text-xs text-gray-500">Instant neural processing</div>
            </div>
          </div>
        </div>

        {/* Right: Phone/Chat Interface */}
        <div className="relative reveal-right">
          {/* Phone Frame */}
          <div className="relative mx-auto border-gray-800 bg-gray-900 border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden">
            {/* Screen Content */}
            <div className="h-full w-full bg-[#050505] relative flex flex-col">
              {/* Header */}
              <div className="bg-[#0a0a0a]/90 backdrop-blur p-4 border-b border-white/5 flex items-center gap-3 z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-black border border-white/20">AI</div>
                <div>
                  <div className="text-xs font-bold text-white">Aether Assistant</div>
                  <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'system' ? (
                      <div className="w-full text-center py-2">
                        <span className="text-[10px] font-mono text-emerald-500/70 border border-emerald-500/20 px-2 py-1 rounded bg-emerald-500/5">{msg.text}</span>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed animate-fade-in-up ${msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-[#1a1a1a] text-gray-300 border border-white/10 rounded-tl-none'
                        }`}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div style={{ float: "left", clear: "both" }} />
              </div>

              {/* Input Area (Fake) */}
              <div className="p-3 bg-[#0a0a0a] border-t border-white/5">
                <div className="bg-[#151515] rounded-full h-10 px-4 flex items-center text-xs text-gray-600 border border-white/5">
                  Type a message...
                </div>
              </div>

              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 🖥️ System Terminal Footer
const SystemFooter = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#050505] border-t border-white/10 flex items-center px-4 font-mono text-[10px] text-emerald-500/80 z-[100]">
      {/* Left: Status */}
      <div className="flex items-center gap-2 pr-4 border-r border-white/10 shrink-0">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="tracking-widest">SYSTEM_ONLINE</span>
      </div>

      {/* Center: Scrolling Log */}
      <div className="flex-1 overflow-hidden relative mx-4">
        <div className="animate-marquee whitespace-nowrap absolute top-1/2 -translate-y-1/2">
          <span>
            {">"} INITIALIZING SECURITY PROTOCOLS... {">"} NODE_TOKYO CONNECTED... {">"} ENCRYPTING DATA PACKETS... {">"} AETHER_CORE OPTIMIZED... {">"} SCANNING BIOMETRICS... {">"} VITAL SIGNS NORMAL... {">"}
            INITIALIZING SECURITY PROTOCOLS... {">"} NODE_TOKYO CONNECTED... {">"} ENCRYPTING DATA PACKETS... {">"} AETHER_CORE OPTIMIZED... {">"} SCANNING BIOMETRICS... {">"} VITAL SIGNS NORMAL...
          </span>
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 pl-4 border-l border-white/10 shrink-0 bg-[#050505]">
        <div className="hidden md:block">LAT: 12ms</div>
        <div className="hidden md:block">CPU: 12%</div>
        <div>MEM: 64TB</div>
      </div>
    </div>
  );
};

export default function Dashboard({ navigate }) {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rawMousePos, setRawMousePos] = useState({ x: 0, y: 0 });

  // Throttled parallax & mouse tracking
  useEffect(() => {
    let throttleTimeout = null;

    const handleMouseMove = (e) => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        setMousePos({
          x: (e.clientX - window.innerWidth / 2) / 100,
          y: (e.clientY - window.innerHeight / 2) / 100,
        });
        setRawMousePos({ x: e.clientX, y: e.clientY });
        throttleTimeout = null;
      }, 20); // Slightly smoother for flashlight
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden bg-[#030303] pb-8 glitch-reveal">
      <SystemFooter />
      <HolographicHUD />
      <NanoBots />
      {/* Hero Section - Professional Dark */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-[#030303]" />

        {/* Base Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* 🔦 Flashlight Reveal Layer - Higher Tech Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at center, #10b981 1px, transparent 1px), linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px, 40px 40px, 40px 40px',
            maskImage: `radial-gradient(circle 300px at ${rawMousePos.x}px ${rawMousePos.y}px, black, transparent)`,
            WebkitMaskImage: `radial-gradient(circle 300px at ${rawMousePos.x}px ${rawMousePos.y}px, black, transparent)`,
          }}
        />

        {/* Subtle ambient glow with parallax - optimized blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            willChange: 'transform',
          }}
        >
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-emerald-900/15" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px] bg-gray-800/20" />
        </div>

        {/* Particles replaced by NeuralBackground */}
        <NeuralBackground />

        {/* Subtle ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
          <div className="absolute inset-0 border border-white/[0.03] rounded-full animate-spin-slow" />
          <div className="absolute inset-20 border border-emerald-500/[0.05] rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '40s' }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] mb-12 animate-fade-in-up">
            <div className="relative">
              <span className="w-2 h-2 bg-emerald-500 rounded-full block" />
              <span className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm text-gray-400 font-medium tracking-wider uppercase">AI Healthcare Platform</span>
          </div>

          {/* Main Heading - Unified Morph Glitch */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fade-in-up stagger-1 tracking-tight leading-[1.1] cursor-pointer"
            onMouseEnter={() => setIsHeaderHovered(true)}
            onMouseLeave={() => setIsHeaderHovered(false)}
          >
            <GlitchMetaText
              initialText="Intelligent"
              hoverText="Aether"
              isHovered={isHeaderHovered}
              className="text-white hover:text-emerald-400 transition-colors"
            />
            <br />
            <GlitchMetaText
              initialText="Healthcare"
              hoverText="Clinic"
              isHovered={isHeaderHovered}
              className="text-emerald-500 hover:text-white transition-colors"
            />
          </h1>

          {/* Typewriter Subheading */}
          <div className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-14 h-14 animate-fade-in-up stagger-2">
            <TypewriterText
              text="Advanced AI providing instant medical consultations and personalized health guidance."
              delay={500}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <button
              className="group px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("consultation")}
            >
              <span className="flex items-center justify-center gap-3">
                Start Consultation
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            <button
              className="px-8 py-4 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              onClick={() => navigate("about")}
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-12 mt-24 max-w-2xl mx-auto animate-fade-in-up stagger-4">
            {[
              { value: "50K+", label: "Consultations" },
              { value: "98%", label: "Accuracy" },
              { value: "24/7", label: "Available" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-600 text-sm mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-emerald-500/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section className="py-32 relative border-t border-white/5 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        >
          <source src="/assets/section1.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay to maintain readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 reveal">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto reveal">
              Three steps to transform your healthcare experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Choose Specialist",
                desc: "Select from our range of AI specialists across various medical fields",
              },
              {
                num: "02",
                title: "Describe Symptoms",
                desc: "Engage in an intelligent conversation with our AI for accurate analysis",
              },
              {
                num: "03",
                title: "Get Guidance",
                desc: "Receive personalized recommendations and actionable next steps",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`group border border-white/5 bg-[#030303]/80 backdrop-blur-sm rounded-2xl p-10 reveal stagger-${i + 1} hover:border-emerald-500/20 hover:bg-[#030303]/90 transition-all duration-500`}
              >
                <div className="text-6xl font-bold text-white/5 group-hover:text-emerald-500/10 transition-colors mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💬 The Synapse: Chat Demo Section */}
      <SynapseSection />

      {/* Section 4: Features - Bento Grid */}
      <section className="py-32 relative border-t border-white/5 bg-[#030303]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 reveal">
              System Capabilities
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto reveal">
              Advanced modules for comprehensive analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {/* Card 1: Main AI Engine (Large 2x2) */}
            <TiltCard className="md:col-span-2 md:row-span-2 relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] reveal scan-overlay">
              <div className="absolute inset-0 bg-emerald-900/10 group-hover:bg-emerald-900/20 transition-colors" />
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen grayscale group-hover:grayscale-0 transition-all duration-700">
                <source src="/assets/section1.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-0 left-0 p-8 z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 backdrop-blur-md border border-emerald-500/30">
                  <span className="text-xl">🧠</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Neural Engine v9</h3>
                <p className="text-gray-400 text-sm max-w-xs">Processing millions of medical data points in real-time for precise diagnosis.</p>
              </div>
            </TiltCard>

            {/* Card 2: Real-time Analytics (Tall 1x2) */}
            <TiltCard className="md:col-span-1 md:row-span-2 relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 flex flex-col reveal delay-100 scan-overlay">
              <h3 className="text-lg font-semibold text-white mb-4">Live Vitals</h3>
              <div className="mb-4">
                <BiometricPulse color="#10b981" speed="1.5s" />
              </div>
              <div className="flex-1 space-y-3 relative overflow-hidden">
                {/* Fake scrolling data */}
                <div className="absolute inset-0 flex flex-col gap-3 animate-scroll-up opacity-50">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono text-emerald-500">
                      <span>HR_MONITOR_{i}</span>
                      <span>{60 + Math.floor(Math.random() * 40)} BPM</span>
                    </div>
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div key={`d-${i}`} className="flex items-center justify-between text-xs font-mono text-emerald-500">
                      <span>O2_LEVEL_{i}</span>
                      <span>{95 + Math.floor(Math.random() * 5)} %</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Status</div>
                <div className="text-emerald-400 font-mono">MONITORING_ACTIVE</div>
              </div>
              {/* Hover Glow */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-500/30 rounded-3xl transition-colors duration-500" />
            </TiltCard>

            {/* Card 3: Security (1x1) */}
            <TiltCard className="md:col-span-1 md:row-span-1 relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 hover:bg-[#0f0f0f] transition-colors reveal delay-200">
              <div className="absolute top-4 right-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div className="mt-auto">
                <h3 className="text-xl font-bold text-white mb-1">HIPAA</h3>
                <p className="text-sm text-gray-500">Enterprise-grade security</p>
              </div>
            </TiltCard>

            {/* Card 4: Global Access (1x1) */}
            <TiltCard className="md:col-span-1 md:row-span-1 relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 hover:bg-[#0f0f0f] transition-colors reveal delay-300">
              <div className="absolute top-4 right-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="mt-auto">
                <h3 className="text-xl font-bold text-white mb-1">Global</h3>
                <p className="text-sm text-gray-500">Accessible 24/7 anywhere</p>
              </div>
            </TiltCard>

          </div>
        </div>

        <style>{`
           @keyframes scrollUp {
              0% { transform: translateY(0); }
              100% { transform: translateY(-50%); }
           }
           .animate-scroll-up {
              animation: scrollUp 10s linear infinite;
           }
        `}</style>
      </section>

      {/* Section 3: Technology */}
      <section className="py-32 relative bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 reveal-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] mb-8">
                <span className="text-emerald-500">⚡</span>
                <span className="text-sm text-gray-400 uppercase tracking-wider">Advanced Technology</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Powered by
                <br />
                <span className="text-emerald-500">Advanced AI</span>
              </h2>

              <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                Our platform harnesses state-of-the-art neural networks trained on extensive medical data,
                delivering insights with clinical-grade accuracy.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: "🔐", title: "256-bit encryption", desc: "Enterprise security" },
                  { icon: "🧬", title: "Deep learning models", desc: "50M+ records analyzed" },
                  { icon: "⚡", title: "Real-time inference", desc: "< 100ms response" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 border border-white/5 rounded-xl bg-white/[0.01] hover:border-emerald-500/20 transition-colors">
                    <div className="text-2xl">{feature.icon}</div>
                    <div>
                      <div className="text-white font-medium">{feature.title}</div>
                      <div className="text-gray-600 text-sm">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 reveal-right">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative border border-white/10 rounded-2xl p-2 bg-[#0a0a0a]">
                  <NeuralMap />
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-4 -left-4 bg-[#0a0a0a] border border-white/10 px-5 py-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="py-32 relative bg-[#050505]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 reveal-scale">
            Ready to Get Started?
          </h2>

          <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto reveal">
            Join thousands who trust Aether Clinic for AI-powered healthcare.
          </p>

          <button
            className="group px-10 py-5 bg-emerald-600 text-white text-lg font-semibold rounded-lg hover:bg-emerald-500 transition-all duration-300 transform hover:-translate-y-1 reveal"
            onClick={() => navigate("consultation")}
          >
            <span className="flex items-center gap-3">
              Begin Free Consultation
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-10 reveal">
            {[
              { icon: "🛡️", text: "HIPAA Compliant" },
              { icon: "🔒", text: "256-bit Encryption" },
              { icon: "✓", text: "SOC 2 Certified" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <span>{item.icon}</span>
                <span className="text-sm uppercase tracking-wider">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <div className="text-xl font-semibold text-white mb-3">Aether Clinic</div>
          <p className="text-gray-600 text-sm">
            © 2026 Aether Clinic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}