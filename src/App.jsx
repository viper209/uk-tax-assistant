import React, { useState, useRef, useEffect } from "react";
import reactLogo from "./react.png";
import "./index.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Welcome to the UK Tax Assistant. Ask me anything about UK company tax or financial planning.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      { sender: "user", text: input.trim() },
      {
        sender: "assistant",
        text: "This is a placeholder response. (Integrate backend for real answers.)",
      },
    ]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white shadow-md">
        <img src={reactLogo} alt="App Logo" className="h-10 w-10 rounded" />
        <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
          UK Tax Assistant
        </h1>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0">
        <div className="w-full max-w-2xl flex-1 flex flex-col py-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } mb-3`}
            >
              <div
                className={`px-4 py-2 rounded-2xl shadow-sm max-w-[80%] text-base ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-blue-900 border border-blue-100 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="w-full max-w-2xl mx-auto px-2 pb-4 flex gap-2"
        autoComplete="off"
      >
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base shadow-sm"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Type your question"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold shadow-md hover:bg-blue-800 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
