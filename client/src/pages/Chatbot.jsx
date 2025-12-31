import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Chatbot({ doctor, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial greeting when doctor selected
  useEffect(() => {
    if (doctor) {
      setMessages([
        {
          sender: "ai",
          text: `👋 Hello! You are now chatting with the AI **${doctor.name}** specialist.`,
        },
        {
          sender: "ai",
          text: "Please describe your main symptom to begin. 🩺",
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
      const res = await axios.post("http://localhost:5050/api/chat", {
        message: input,
        specialization: doctor?.name || "General",
      });

      const aiReply = res.data.reply?.trim();
      if (aiReply) {
        // Simulate typing delay for better UX
        setTimeout(() => {
          setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
          setIsTyping(false);
        }, 800);
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      console.error("❌ Chat error:", err);
      setError("Something went wrong. Please try again.");
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
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-2xl">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          ← Back
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{doctor?.name}</h2>
          <span className="text-sm text-green-500">● Online</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
              style={{ wordBreak: "break-word" }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl p-3 flex space-x-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 text-center py-2 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isTyping}
        >
          Send
        </button>
      </div>
    </div>
  );
}