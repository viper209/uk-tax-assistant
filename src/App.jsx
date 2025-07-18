import React, { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import AdminPanel from "./AdminPanel.jsx";
import "./index.css";

export default function App() {
  // State for navigation
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "admin"
  
  // Existing chat state
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello! I'm your UK Tax Assistant. I can help you with company tax questions, corporation tax rates, allowances, and financial planning guidance. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (currentView === "chat") {
      inputRef.current?.focus();
    }
  }, [currentView]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const question = input.trim();
    const userMessage = {
      sender: "user",
      text: question,
      timestamp: new Date(),
    };

    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "https://o3s1dkulm6.execute-api.eu-west-2.amazonaws.com/prod/ask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }
      );
      const data = await response.json();

      let answer;
      if (data.body) {
        const body = JSON.parse(data.body);
        answer = body.answer;
      } else {
        answer = data.answer;
      }

      setMessages((msgs) => [
        ...msgs,
        {
          sender: "assistant",
          text: answer || "I apologize, but I couldn't find a relevant answer to your question. Please try rephrasing or ask about UK company tax, corporation tax rates, or financial planning.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "assistant",
          text: "I'm experiencing technical difficulties. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatMessage = (text) => {
    // Basic markdown-like formatting
    return text
      .replace(/^# (.*$)/gm, '<h3 class="text-xl font-bold text-slate-800 mb-3 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h4 class="text-lg font-semibold text-slate-700 mb-2 mt-3">$1</h4>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>');
  };

  // Render admin panel
  if (currentView === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Admin Header with Back Button */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <img src={reactLogo} alt="UK Tax Assistant" className="h-6 w-6 filter invert" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  UK Tax Assistant - Admin Panel
                </h1>
                <p className="text-sm text-slate-500">System configuration and monitoring</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView("chat")}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </header>
        
        {/* Admin Panel Content */}
        <AdminPanel />
      </div>
    );
  }

  // Render main chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <img src={reactLogo} alt="UK Tax Assistant" className="h-6 w-6 filter invert" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                UK Tax Assistant
              </h1>
              <p className="text-sm text-slate-500">AI-powered tax guidance for UK SMEs</p>
            </div>
          </div>
          
          {/* Admin Button */}
          <button
            onClick={() => setCurrentView("admin")}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
          >
            Admin Panel
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 min-h-[calc(100vh-140px)]">
        <div className="space-y-6 pb-32">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {msg.sender === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              )}
              
              <div
                className={`max-w-[75%] ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-lg"
                    : "bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-sm border border-slate-200/50"
                } px-5 py-4 transition-all duration-200 hover:shadow-md`}
              >
                {msg.sender === "user" ? (
                  <p className="text-base leading-relaxed">{msg.text}</p>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: `<p class="mb-3">${formatMessage(msg.text)}</p>`,
                    }}
                  />
                )}
                <div className={`text-xs mt-2 ${
                  msg.sender === "user" ? "text-blue-100" : "text-slate-400"
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 justify-start animate-fadeIn">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <div className="bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-sm border border-slate-200/50 px-5 py-4">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-sm text-slate-500 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Bar - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200/50 shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSend} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask about UK company tax, corporation tax rates, allowances..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm resize-none transition-all duration-200 text-base leading-relaxed max-h-32 min-h-[48px]"
                rows="1"
                disabled={isTyping}
              />
              <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {isTyping ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              Send
            </button>
          </form>
          <div className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
