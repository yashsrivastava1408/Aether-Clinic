import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import TiltCard from "../components/TiltCard";
import VoiceVisualizer from "../components/VoiceVisualizer";
import { getUserId } from "../utils/user";
import { useTheme } from "../context/ThemeContext";
import MLResultGauge from "../components/MLResultGauge";

export default function Chatbot({ doctor, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fake "System Init" state
  const [isInitializing, setIsInitializing] = useState(true);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial greeting when doctor selected
  useEffect(() => {
    if (doctor) {
      // Fetch history logic
      const userId = getUserId();
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/history/${userId}/${doctor.name}`)
        .then(res => {
          if (res.data.messages && res.data.messages.length > 0) {
            setMessages(res.data.messages);
            setIsInitializing(false); // Skip intro if history exists
          } else {
            // Default Intro
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
State your symptoms or upload a photo for analysis.`,
              },
            ]);
          }
        })
        .catch(err => {
          console.error("Failed to load history", err);
          setIsInitializing(false);
        });
    }
  }, [doctor]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const userMsg = {
      sender: "user",
      text: input,
      image: imagePreview
    };

    setMessages((prev) => [...prev, userMsg]);

    const formData = new FormData();
    formData.append("message", input);
    formData.append("specialization", doctor?.name || "General");
    formData.append("userId", getUserId());
    if (image) {
      formData.append("image", image);
    }

    setInput("");
    removeImage();
    setIsTyping(true);
    setError(null);

    try {
      // REAL API CALL
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
    <div className={`h-[85vh] w-full max-w-5xl mx-auto flex flex-col relative overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-500 ${isDark ? 'bg-[#030303] border-white/10' : 'bg-white border-slate-200'}`}>

      {/* Background Grid & Ambience */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-b pointer-events-none ${isDark ? 'from-emerald-900/10 via-transparent to-emerald-900/20' : 'from-emerald-500/5 via-transparent to-emerald-500/10'}`} />

      {/* Header (Holographic HUD) */}
      <div className={`relative z-10 p-6 border-b flex items-center justify-between backdrop-blur-md ${isDark ? 'border-white/5 bg-[#0a0a0a]/80' : 'border-slate-100 bg-white/80'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg border transition-all group ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className={`text-xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{doctor?.name}</h2>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Link Established
            </div>
          </div>
        </div>

        {/* Visualizer (Mini) */}
        <div className="hidden md:flex items-center gap-1 h-8">
          {isTyping && <VoiceVisualizer />}
        </div>
      </div>

      {/* System Boot Overlay */}
      {isInitializing && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center font-mono text-xs ${isDark ? 'bg-[#030303] text-emerald-500' : 'bg-slate-50 text-emerald-600'}`}>
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
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 mt-1 text-xs ${isDark ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200'}`}>
                🤖
              </div>
            )}

            <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed backdrop-blur-sm border whitespace-pre-wrap ${msg.isSystem
              ? "w-full text-center bg-transparent border-transparent text-emerald-500/50 font-mono text-xs my-2"
              : msg.sender === "user"
                ? "bg-blue-600/20 border-blue-500/30 text-blue-500 font-medium rounded-br-none"
                : (isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-bl-none" : "bg-emerald-50 border-emerald-200 text-slate-800 rounded-bl-none shadow-sm")
              }`}>
              {msg.image && (
                <img src={msg.image} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-2 border border-white/10" />
              )}
              <span className={msg.sender === "user" ? (isDark ? "text-blue-100" : "text-blue-900") : ""}>
                {/* Parse for Risk Analysis code block */}
                {(() => {
                  const riskMatch = msg.text.match(/\[RISK_ANALYSIS:\s*({.*?})\]/);
                  if (riskMatch) {
                    try {
                      const data = JSON.parse(riskMatch[1]);
                      const cleanText = msg.text.replace(/\[RISK_ANALYSIS:.*?\]/, '').trim();
                      return (
                        <div className="space-y-4">
                          <p>{cleanText}</p>
                          <div className={`flex justify-center p-6 rounded-xl ${isDark ? 'bg-black/40' : 'bg-white/50 shadow-inner'}`}>
                            <MLResultGauge
                              percentage={data.percentage}
                              level={data.level}
                              isDark={isDark}
                            />
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return msg.text;
                    }
                  }
                  return msg.text;
                })()}
              </span>
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

      {/* Error Message Display */}
      {error && (
        <div className="px-6 pb-2 text-red-500 text-xs font-mono animate-pulse">
          {">"} ERROR: {error}
        </div>
      )}

      {/* CLI Input Area */}
      <div className={`p-4 border-t relative z-20 ${isDark ? 'bg-[#0a0a0a]/90 border-white/5' : 'bg-slate-50/90 border-slate-200'}`}>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-emerald-500/50" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${isTyping ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : (isDark ? 'border-white/10 bg-black/50' : 'border-slate-300 bg-white shadow-inner')} `}>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-emerald-500 transition-colors"
            title="Upload medical image"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <span className="text-emerald-500 font-mono text-lg">{'>'}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter symptom data..."
            className={`flex-1 bg-transparent focus:outline-none font-mono text-sm ${isDark ? 'text-white placeholder-gray-600' : 'text-slate-900 placeholder-slate-400'}`}
            disabled={isTyping}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || (!input.trim() && !image)}
            className="text-xs font-mono text-emerald-500 hover:text-emerald-600 disabled:text-gray-400 uppercase tracking-wider transition-colors"
          >
            [ EXECUTE ]
          </button>
        </div>
        {/* Decorative Footer */}
        <div className="flex justify-between mt-2 px-2 text-[10px] text-gray-500 font-mono uppercase">
          <span>MEM: 64TB / 128TB</span>
          <span>ENC: AES-256</span>
        </div>
      </div>
    </div>
  );
}