"use client";
// components/BookAIChat.jsx
// Drop this into your book preview page.
// Usage: <BookAIChat bookId={book.firestoreId} bookTitle={book.title} aiEnabled={book.aiEnabled} />

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  X,
  MessageSquare,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { auth } from "@/lib/firebaseConfig";

// ── Single message bubble ──────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                ${isUser ? "bg-blue-950 text-white" : "bg-gradient-to-br from-purple-500 to-blue-600 text-white"}`}
      >
        {isUser ? "You" : <Sparkles size={14} />}
      </div>
      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${
                  isUser
                    ? "bg-blue-950 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ── Suggestion chips ───────────────────────────────────────────────────────────
const SUGGESTION_PROMPTS = [
  "Summarise the key points of this book",
  "What is the main topic covered?",
  "Give me 3 things to remember from this book",
  "Explain the most important concept in simple terms",
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function BookAIChat({ bookId, bookTitle, aiEnabled }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput("");
    setError("");

    const userMessage = { role: "user", content: question, id: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid || null;
      const res = await fetch("/api/book-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, question, bookTitle, userId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get answer");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          id: Date.now() + 1,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if this book doesn't have AI enabled
  if (!aiEnabled) return null;

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-blue-950 text-white rounded-2xl shadow-xl hover:bg-blue-900 transition-all active:scale-95 font-semibold text-sm"
        >
          <Sparkles size={16} className="text-yellow-300" />
          Ask AI about this book
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="bg-blue-950 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-800/60 border border-blue-700 flex items-center justify-center">
                <Sparkles size={16} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">
                  AI Book Assistant
                </p>
                <p className="text-blue-300 text-xs mt-0.5 truncate max-w-[180px]">
                  {bookTitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-blue-800 rounded-xl transition-colors"
            >
              <X size={16} className="text-blue-300" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                {/* Welcome */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    <Sparkles size={14} />
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[80%]">
                    Hi! I've read{" "}
                    <span className="font-semibold">"{bookTitle}"</span> and I'm
                    ready to help you understand it. What would you like to
                    know?
                  </div>
                </div>
                {/* Suggestion chips */}
                <div className="ml-11 space-y-2">
                  {SUGGESTION_PROMPTS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  <Sparkles size={14} />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="text-xs text-gray-500">
                    Searching the book...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Clear button (only shown when there are messages) */}
          {messages.length > 0 && (
            <div className="px-4 pb-1 flex-shrink-0">
              <button
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear conversation
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this book..."
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent max-h-24"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Answers are based only on this book's content
            </p>
          </div>
        </div>
      )}
    </>
  );
}
