import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperAirplaneIcon, BookOpenIcon } from "@heroicons/react/24/solid";
import Logo from "./Logo"; // Import the new Logo component

const API_BASE_URL = "https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "I am the UK SME Tax & Accounting Advisor.\n\nAsk me anything about Corporation Tax, VAT, PAYE, or financial reporting standards. Let's get started.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pollJobStatus = async (jobId) => {
    const thinkingMessage = {
      sender: "assistant",
      text: "Analyzing with HMRC & ACCA sources...",
      timestamp: new Date(),
      isStatus: true, // Flag to style it differently
    };
    setMessages((msgs) => [...msgs, thinkingMessage]);
    
    let jobStatus = "PENDING";
    let finalResponse = "An error occurred. Please try again.";

    while (jobStatus === "PENDING" || jobStatus === "PROCESSING") {
      try {
        await new Promise(resolve => setTimeout(resolve, 4000));
        const response = await fetch(`${API_BASE_URL}/status?jobId=${jobId}`);
        const data = await response.json();
        jobStatus = data.status;
        if (jobStatus === "COMPLETE") {
          finalResponse = data.response;
        }
      } catch (err) {
        console.error("Polling error:", err);
        jobStatus = "ERROR";
      }
    }

    setIsTyping(false);
    // Replace the "Analyzing..." message with the final response
    setMessages((msgs) => [
      ...msgs.slice(0, -1),
      { sender: "assistant", text: finalResponse, timestamp: new Date() },
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { sender: "user", text: input.trim(), timestamp: new Date() };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (response.status === 202) {
        const data = await response.json();
        pollJobStatus(data.jobId);
      } else {
        const data = await response.json();
        throw new Error(data.detail || "An unexpected error occurred.");
      }
    } catch (err) {
      console.error("API Error:", err);
      setIsTyping(false);
      setMessages((msgs) => [
        ...msgs,
        { sender: "assistant", text: `A technical issue occurred: ${err.message}`, timestamp: new Date() },
      ]);
    }
  };

  const formatMessage = (text) => {
    const formattedText = text
      .replace(/\/g, `<span class="citation"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon"><path fill-rule="evenodd" d="M8.5 2.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V4.538l-3.136 7.168a.75.75 0 1 1-1.328-.58l3.136-7.168V3.5a.75.75 0 0 1 .75-.75h1.5Z" clip-rule="evenodd"></path></svg>$1</span>`)
      .replace(/^# (.*$)/gm, '<h3 class="text-xl font-bold text-brand-slate-800 mb-3 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h4 class="text-lg font-semibold text-brand-slate-700 mb-2 mt-3">$1</h4>')
      .replace(/^\* (.*$)/gm, '<li class="list-disc ml-4 mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-brand-slate-800">$1</strong>')
      .replace(/\n/g, '<br />');

    return `<div class="prose prose-sm max-w-none text-brand-slate-700 leading-relaxed">${formattedText}</div>`;
  };

  return (
    <div className="flex flex-col h-screen bg-brand-slate-50 font-sans">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-lg border-b border-brand-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-brand-slate-800 tracking-tight">UK SME Tax & Accounting Advisor</h1>
              <p className="text-sm text-brand-slate-700">AI-powered guidance from HMRC & ACCA sources</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-4 items-start ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && <div className="flex-shrink-0"><Logo className="w-8 h-8 mt-1" /></div>}
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md transition-shadow hover:shadow-lg ${
                    msg.sender === "user"
                      ? "bg-brand-indigo text-white rounded-br-lg"
                      : "bg-white text-brand-slate-800 rounded-bl-lg border border-brand-slate-200"
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p>{msg.text}</p>
                  ) : msg.isStatus ? (
                    <div className="flex items-center gap-3 text-brand-slate-700">
                      <Logo className="w-5 h-5 animate-pulse-glow" />
                      <span className="text-sm font-medium">{msg.text}</span>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                  )}
                  <div className={`text-xs mt-2 ${ msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-indigo-dark rounded-full flex items-center justify-center shadow-md text-white font-bold text-sm">
                    Y
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && !messages.some(m => m.isStatus) && ( // Show only if a job isn't already running
             <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 items-start justify-start"
            >
                <div className="flex-shrink-0"><Logo className="w-8 h-8 mt-1" /></div>
                <div className="bg-white rounded-2xl rounded-bl-lg px-5 py-4 shadow-md border border-brand-slate-200">
                    <Logo className="w-5 h-5 animate-pulse-glow" />
                </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <div className="bg-white/70 backdrop-blur-lg mt-auto sticky bottom-0">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSend} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="e.g., What are the thresholds for Making Tax Digital for VAT?"
              className="w-full pl-4 pr-14 py-3 rounded-xl border border-brand-slate-300 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 resize-none transition-all duration-200 text-base min-h-[52px] max-h-40"
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-brand-indigo rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:bg-brand-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 hover:scale-110 active:scale-95"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}