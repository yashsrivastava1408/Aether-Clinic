import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import TiltCard from "../components/TiltCard";
import VoiceVisualizer from "../components/VoiceVisualizer";
import LegalModal from "../components/LegalModal";
import { getUserId } from "../utils/user";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MLResultGauge from "../components/MLResultGauge";

export default function Chatbot({ doctor, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();
  const { user, checkTokenLimit, consumeTokens, tokenUsage } = useAuth();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const { specialization } = useParams();

  // Reconstruct doctor object from serializable navigation state
  const stateDoctor = location.state?.specializationName ? {
    name: location.state.specializationName,
    role: location.state.specializationRole || "Specialist"
  } : null;

  // Prefer prop -> then state -> then URL param -> then fallback
  const activeDoctor = doctor || stateDoctor || (specialization ? { name: specialization, role: "Specialist" } : { name: "General", role: "Medical Assistant" });

  useEffect(() => {
    console.log("Chatbot Mounted. Active Doctor (Resolved):", activeDoctor);
    console.log("Location State:", location.state);
    console.log("URL Param:", specialization);
  }, [activeDoctor, location.state, specialization]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1); // Go back if no prop handler
  };

  // Fake "System Init" state
  const [isInitializing, setIsInitializing] = useState(true);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [messages, isTyping]);


  // Initial greeting when doctor selected
  useEffect(() => {
    if (activeDoctor && hasConsented) {
      // Fetch history logic
      const userId = getUserId();
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/history/${userId}/${encodeURIComponent(activeDoctor.name)}`)
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
                text: `// INITIATING SECURE SESSION WITH SPECIALIST ${activeDoctor.name.toUpperCase()}...`,
                isSystem: true
              },
              {
                sender: "ai",
                text: `Neural Link Active. I am the ${activeDoctor.role || "Specialist"} Interface.
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
  }, [activeDoctor?.name, hasConsented]);

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

    // Estimate token count (approx. 1 token per 4 chars, but we count chars for simplicity/safety)
    const usageCost = input.length + (image ? 500 : 0); // Image fixed cost?

    if (!checkTokenLimit(usageCost)) {
      setError("DAILY LIMIT EXCEEDED. REQUEST TOKEN RESET OR SIGN IN.");
      // Optional: Trigger a modal or just show the error
      return;
    }

    const userMsg = {
      sender: "user",
      text: input,
      image: imagePreview
    };

    setMessages((prev) => [...prev, userMsg]);

    const formData = new FormData();
    formData.append("message", input);
    formData.append("specialization", activeDoctor?.name || "General");
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

        // Consume tokens for Input + Output (Approx output if not provided)
        const outputCost = res.data.reply ? res.data.reply.length : 100;
        consumeTokens(usageCost + outputCost);
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

  const handleFeedback = async (messageIndex, type) => {
    try {
      const message = messages[messageIndex];
      // Update local state to show selection
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = { ...message, feedback: type };
      setMessages(updatedMessages);

      // API call to store feedback (fails gracefully if endpoint doesn't exist yet)
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/feedback`, {
        userId: getUserId(),
        messageText: message.text,
        type: type,
        specialization: activeDoctor?.name
      });
    } catch (err) {
      console.warn("Feedback recorded locally, but server sync failed.");
    }
  };

  return (
    <div className={`md:h-[85vh] h-[80vh] w-full max-w-5xl mx-auto flex flex-col relative overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-500 ${isDark ? 'bg-[#030303] border-white/10' : 'bg-white border-slate-200'}`}>

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
            onClick={handleBack}
            className={`p-2 rounded-lg border transition-all group ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className={`text-xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeDoctor?.name}</h2>
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
                    } catch {
                      return msg.text;
                    }
                  }
                  return msg.text;
                })()}
              </span>

              {/* FEEDBACK BUTTONS */}
              {msg.sender === 'ai' && !msg.isSystem && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-emerald-500/10">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Accurate?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback(i, 'up')}
                      className={`p-1.5 rounded-md transition-all ${msg.feedback === 'up' 
                        ? 'bg-emerald-500/20 text-emerald-500 scale-110' 
                        : 'text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                      title="Accurate Information"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 10c0-1.1-.9-2-2-2h-3.11l.46-2.21c.08-.38-.05-.73-.34-.97L13.89 4l-4.71 4.71c-.26.26-.41.61-.41.97v9c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.15-.38 1.38-.91l2.26-5.27c.07-.17.11-.36.11-.53V10zM4 21h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleFeedback(i, 'down')}
                      className={`p-1.5 rounded-md transition-all ${msg.feedback === 'down' 
                        ? 'bg-red-500/20 text-red-500 scale-110' 
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-500/10'}`}
                      title="Contains Errors"
                    >
                      <svg className="w-3.5 h-3.5 transform rotate-180" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 10c0-1.1-.9-2-2-2h-3.11l.46-2.21c.08-.38-.05-.73-.34-.97L13.89 4l-4.71 4.71c-.26.26-.41.61-.41.97v9c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.15-.38 1.38-.91l2.26-5.27c.07-.17.11-.36.11-.53V10zM4 21h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1z" />
                      </svg>
                    </button>
                  </div>
                  {msg.feedback && (
                    <span className="text-[9px] text-emerald-500 font-mono animate-pulse">THANK YOU FOR FEEDBACK</span>
                  )}
                </div>
              )}
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
          <span>TOKENS: {tokenUsage.toLocaleString()} / {user?.isGuest ? '10,000' : '100,000'}</span>

          {/* SUMMARIZE SYMPTOMS BUTTON */}
          {messages.length > 2 && !messages[messages.length - 1]?.text?.includes("FINAL MEDICAL ASSESSMENT") && (
            <button
              onClick={async () => {
                if (window.confirm("End consultation and generate summary?")) {
                  setIsTyping(true);
                  try {
                    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/chat/force-final`, {
                      userId: getUserId(),
                      specialization: activeDoctor.name
                    });
                    if (res.data.reply) {
                      setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
                      consumeTokens(500); // Fixed cost for report
                    }
                  } catch (err) {
                    console.error("Force final error", err);
                    setError("FAILED TO GENERATE REPORT");
                  }
                  setIsTyping(false);
                }
              }}
              className="text-amber-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="animate-pulse">⚠️</span> SUMMARIZE SYMPTOMS
            </button>
          )}

          <span>{user?.isGuest ? 'IDENTITY: GUEST' : 'IDENTITY: VERIFIED'}</span>
        </div>
      </div>

      {/* CONSENT MODAL OVERLAY */}
      {!hasConsented && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl transition-all duration-500 transform scale-100 ${isDark ? 'bg-[#0a0a0a] border-emerald-500/30' : 'bg-white border-slate-200'}`}>
            <div className="text-center space-y-6">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl ${isDark ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
                ⚖️
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Medical Liability Waiver
              </h3>
              <div className={`text-sm leading-relaxed text-left space-y-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <p>
                  By proceeding, you acknowledge that <span className="text-emerald-500 font-bold uppercase">Aether Clinic</span> is an experimental Artificial Intelligence platform for educational use.
                </p>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>I understand this is <span className="text-red-500 font-bold underline">NOT a doctor</span>.</li>
                    <li>I will not use this for life-threatening emergencies.</li>
                    <li>I will seek professional medical advice before taking any medicine.</li>
                  </ul>
                  <button 
                    onClick={() => setIsLegalOpen(true)}
                    className="mt-3 text-[10px] text-emerald-500 hover:text-emerald-400 underline font-mono uppercase block"
                  >
                    View Full Legal Protocols & Privacy
                  </button>
                </div>
              </div>
              <button
                onClick={() => setHasConsented(true)}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}
              >
                I UNDERSTAND & AGREE
              </button>
            </div>
          </div>
        </div>
      )}

      <LegalModal 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
      />
    </div>
  );
}