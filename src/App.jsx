import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { nanoid } from "nanoid";
import Logo from "./Logo";
import Citation from "./Citation";

const API_BASE_URL =
  "https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod";

// Helper to normalise Bedrock’s response payload
const resolveResponseText = (raw) => {
  if (typeof raw === "string") return raw;
  if (raw.text) return raw.text;
  return JSON.stringify(raw);
};

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: nanoid(),
      sender: "assistant",
      text:
        "I am the UK SME Tax & Accounting Advisor.\n\n" +
        "Ask me anything about Corporation Tax, VAT, PAYE, or financial reporting standards. Let's get started.",
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

  // Non-blocking, recursive poller
  const pollJobStatus = (jobId) => {
    const thinkingId = nanoid();
    setMessages((msgs) => [
      ...msgs,
      {
        id: thinkingId,
        sender: "assistant",
        text: "Analyzing with HMRC & ACCA sources…",
        timestamp: new Date(),
        isStatus: true,
      },
    ]);

    const maxAttempts = 60;
    const intervalMs = 4000;

    const checkStatus = async (attempts = 1) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/status?jobId=${jobId}`
        );
        const data = await res.json();

        if (data.status === "COMPLETE") {
          const finalResponse = resolveResponseText(data.response);
          setMessages((msgs) => [
            ...msgs.filter((m) => m.id !== thinkingId),
            {
              id: nanoid(),
              sender: "assistant",
              text: finalResponse,
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(attempts + 1), intervalMs);
        } else {
          // give up
          setMessages((msgs) => [
            ...msgs.filter((m) => m.id !== thinkingId),
            {
              id: nanoid(),
              sender: "assistant",
              text: "A technical error occurred. Please try again.",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(attempts + 1), intervalMs);
        } else {
          setMessages((msgs) => [
            ...msgs.filter((m) => m.id !== thinkingId),
            {
              id: nanoid(),
              sender: "assistant",
              text: "A technical error occurred. Please try again.",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
        }
      }
    };

    checkStatus();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = {
      id: nanoid(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.text }), // or { inputText: ... } if you’ve switched back
      });
      if (response.status === 202) {
        const { jobId } = await response.json();
        pollJobStatus(jobId);
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Unexpected response");
      }
    } catch (err) {
      setIsTyping(false);
      setMessages((msgs) => [
        ...msgs,
        {
          id: nanoid(),
          sender: "assistant",
          text: `A technical issue occurred: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-slate-50 font-sans">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-lg border-b border-brand-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <Logo className="w-8 h-8" />
          <h1 className="ml-3 text-lg font-bold text-brand-slate-800">
            UK SME Tax & Accounting Advisor
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
          <AnimatePresence>
            {messages.map((msg) => {
              const isError = msg.text.startsWith(
                "A technical error occurred"
              );
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-4 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "assistant" && (
                    <Logo className="w-8 h-8 mt-1" />
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md transition-shadow hover:shadow-lg ${
                      msg.sender === "user"
                        ? "bg-brand-indigo text-white"
                        : isError
                        ? "bg-red-50 border border-red-400 text-red-800"
                        : "bg-white text-brand-slate-800 border border-brand-slate-200"
                    }`}
                  >
                    {msg.isStatus ? (
                      <div className="flex items-center gap-2">
                        <Logo className="w-5 h-5 animate-pulse-glow" />
                        <span className="text-sm font-medium">
                          {msg.text}
                        </span>
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => (
                            <h1 className="text-2xl font-bold mb-2" {...props}/>
                          ),
                          h2: ({node, ...props}) => (
                            <h2 className="text-xl font-semibold mb-1" {...props}/>
                          ),
                          h3: ({node, ...props}) => (
                            <h3 className="text-lg font-semibold mb-1" {...props}/>
                          ),
                          p: ({node, ...props}) => (
                            <p className="mb-3" {...props}/>
                          ),
                          li: ({node, ...props}) => (
                            <li className="ml-4 list-disc mb-1" {...props}/>
                          ),
                          strong: ({node, ...props}) => (
                            <strong className="font-semibold" {...props}/>
                          )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                    <div
                      className={`text-xs mt-2 ${
                        msg.sender === "user"
                          ? "text-indigo-200"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {msg.sender === "user" && (
                    <UserAvatar initials="Y" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </main>

      <div className="bg-white/70 backdrop-blur-lg sticky bottom-0 mt-auto">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSend} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="e.g., What are the thresholds for Making Tax Digital for VAT?"
              className="w-full pl-4 pr-14 py-3 rounded-xl border border-brand-slate-300 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 resize-none transition-all duration-200 text-base min-h-[52px] max-h-40"
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-brand-indigo rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:bg-brand-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
