import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import TiltCard from "../components/TiltCard";

export default function Chatbot({ doctor, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Fake "System Init" state
  const [isInitializing, setIsInitializing] = useState(true);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial greeting when doctor selected
  useEffect(() => {
    if (doctor) {
      setTimeout(() => setIsInitializing(false), 2000);

      setMessages([
        {
          sender: "ai",
          text: `// INITIATING SECURE SESSION WITH SPECIALIST ${doctor.name.toUpperCase()}...`,
          isSystem: true
        },
        {
          sender: "ai",
          text: `Neural Link Active. I am the ${doctor.role || "Specialist"} Interface.
State your symptoms for analysis.`,
        },
      ]);
    }
  }, [doctor]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      /*
      // MOCK MODE DISABLED - Connecting to Neural Core
      setTimeout(() => {
        // ... (Mock code preserved here if needed for fallback, but commented)
      }, 2000);
      */

      // REAL API CALL
      const res = await axios.post("http://localhost:5050/api/chat", {
        message: input,
        specialization: doctor?.name || "General",
      });

      if (res.data.reply) {
        setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
      }
      setIsTyping(false);

    } catch (err) {
      console.error("❌ Chat error:", err);
      setError("CONNECTION INTERRUPTED. RETRY.");
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[85vh] w-full max-w-5xl mx-auto flex flex-col relative overflow-hidden bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-2xl">

      {/* Background Grid & Ambience */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-emerald-900/20 pointer-events-none" />

      {/* Header (Holographic HUD) */}
      <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{doctor?.name}</h2>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Link Established
            </div>
          </div>
        </div>

        {/* Visualizer (Mini) */}
        <div className="hidden md:flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 bg-emerald-500/50 rounded-full animate-pulse"
              style={{
                height: isTyping ? `${Math.random() * 100}%` : '20%',
                animationDuration: `${0.5 + i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* System Boot Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-50 bg-[#030303] flex items-center justify-center font-mono text-emerald-500 text-xs">
          <div className="space-y-2">
            <div className="animate-typewriter overflow-hidden whitespace-nowrap border-r border-emerald-500 pr-1">
              {">"} INITIALIZING NEURAL INTERFACE...
            </div>
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {">"} LOADING MEDICAL DATABASE [||||||||||] 100%
            </div>
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '1s' }}>
              {">"} HANDSHAKE COMPLETE.
            </div>
          </div>
        </div>
      )}

      {/* Messages Area (Data Logs) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>

            {msg.sender === 'ai' && !msg.isSystem && (
              <div className="w-8 h-8 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center mr-3 mt-1 text-xs">
                🤖
              </div>
            )}

            <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed backdrop-blur-sm border whitespace-pre-wrap ${msg.isSystem
              ? "w-full text-center bg-transparent border-transparent text-emerald-500/50 font-mono text-xs my-2"
              : msg.sender === "user"
                ? "bg-blue-600/20 border-blue-500/30 text-blue-100 rounded-br-none"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-bl-none"
              }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start items-center gap-2 ml-10">
            <span className="text-emerald-500 text-xs font-mono animate-pulse">PROCESSING...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* CLI Input Area */}
      <div className="p-4 bg-[#0a0a0a]/90 border-t border-white/5 relative z-20">
        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${isTyping ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/10'
          } bg-black/50`}>
          <span className="text-emerald-500 font-mono text-lg">{'>'}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter symptom data..."
            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none font-mono text-sm"
            disabled={isTyping}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="text-xs font-mono text-emerald-500 hover:text-white disabled:text-gray-600 uppercase tracking-wider transition-colors"
          >
            [ EXECUTE ]
          </button>
        </div>
        {/* Decorative Footer */}
        <div className="flex justify-between mt-2 px-2 text-[10px] text-gray-600 font-mono uppercase">
          <span>MEM: 64TB / 128TB</span>
          <span>ENC: AES-256</span>
        </div>
      </div>
    </div>
  );
}