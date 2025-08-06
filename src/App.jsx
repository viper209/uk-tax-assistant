import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import Logo from "./Logo";
import Citation from "./Citation"; // Import the new Citation component

const API_BASE_URL = "https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod";

//******************************************************************//
// THIS IS THE CORRECTED AND VERIFIED PARSE FUNCTION
//******************************************************************//
const parseMessage = (text) => {
  // This regex splits the text by the pattern, but keeps the pattern in the resulting array.
  const parts = text.split(/(\)/g);

  return parts.map((part, index) => {
    // This regex checks if a part is a source citation and captures the text inside.
    const match = part.match(/\/);

    if (match) {
      // If it's a citation, render the Citation component.
      return <Citation key={index} text={match[1]} />;
    }
    
    // If it's just regular text, render it, making sure to handle newlines correctly.
    return part.split('\n').map((line, i) => (
      <React.Fragment key={`${index}-${i}`}>
        {i > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
};


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
      isStatus: true,
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
                  <div className="prose prose-sm max-w-none text-brand-slate-700 leading-relaxed">
                    {msg.sender === 'user' ? (
                      <p className="text-white">{msg.text}</p>
                    ) : msg.isStatus ? (
                      <div className="flex items-center gap-3">
                        <Logo className="w-5 h-5 animate-pulse-glow" />
                        <span className="text-sm font-medium">{msg.text}</span>
                      </div>
                    ) : (
                      <p>{parseMessage(msg.text)}</p>
                    )}
                  </div>
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
          {isTyping && !messages.some(m => m.isStatus) && (
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