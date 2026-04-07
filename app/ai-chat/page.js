"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Sparkles, Loader2, X, Send, ChevronRight,
    BookMarked, Star, ArrowLeft, Copy, Check,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/* ══════════════════════════════════════
   INLINE CODE + CODE BLOCK RENDERING
   ══════════════════════════════════════ */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-[11px] transition-colors"
        >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

function RenderMessage({ text, onSaveVocab, onJumpToPage }) {
    if (!text) return null;
    const codeChunks = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {codeChunks.map((chunk, ci) => {
                if (chunk.startsWith("```")) {
                    const lines = chunk.slice(3, -3).split("\n");
                    const lang = lines[0].trim() || "code";
                    const code = lines.slice(1).join("\n");
                    return (
                        <div key={ci} className="rounded-xl overflow-hidden border border-slate-700 my-2">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                                <span className="text-[10px] font-bold tracking-widest text-sky-400 font-mono uppercase">{lang}</span>
                                <CopyButton text={code} />
                            </div>
                            <pre className="bg-slate-900 px-4 py-3 overflow-x-auto text-[12.5px] leading-relaxed text-slate-200 font-mono whitespace-pre">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }
                return (
                    <span key={ci}>
                        {chunk.split("\n").map((line, li) => {
                            const listMatch = line.match(/^(\d+)\.\s+(.*)/);
                            if (listMatch) return (
                                <span key={li} className="flex gap-2 my-1">
                                    <span className="font-bold text-sky-500 shrink-0">{listMatch[1]}.</span>
                                    <InlineParse text={listMatch[2]} onSaveVocab={onSaveVocab} onJumpToPage={onJumpToPage} />
                                </span>
                            );
                            return (
                                <span key={li}>
                                    <InlineParse text={line} onSaveVocab={onSaveVocab} onJumpToPage={onJumpToPage} />
                                    {li < chunk.split("\n").length - 1 && <br />}
                                </span>
                            );
                        })}
                    </span>
                );
            })}
        </div>
    );
}

function InlineParse({ text, onSaveVocab, onJumpToPage }) {
    const tokens = text.split(/(\[\[.*?\]\]|\[p\.\s*\d+\]|\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
        <>
            {tokens.map((tok, i) => {
                const vocabMatch = tok.match(/^\[\[(.+?):\s*(.+?)\]\]$/);
                if (vocabMatch) return <VocabBadge key={i} term={vocabMatch[1]} definition={vocabMatch[2]} onSave={onSaveVocab} />;
                const pageMatch = tok.match(/^\[p\.\s*(\d+)\]$/);
                if (pageMatch) return (
                    <button key={i} onClick={() => onJumpToPage?.(parseInt(pageMatch[1]))}
                        className="inline-flex items-center bg-sky-50 border border-sky-200 text-sky-700 rounded px-2 py-0.5 text-[11px] font-semibold hover:bg-sky-100 transition-colors mx-0.5">
                        p. {pageMatch[1]}
                    </button>
                );
                if (tok.startsWith("**") && tok.endsWith("**")) return <strong key={i}>{tok.slice(2, -2)}</strong>;
                if (tok.startsWith("`") && tok.endsWith("`")) return (
                    <code key={i} className="bg-slate-100 border border-slate-200 text-red-600 rounded px-1.5 py-0.5 text-[12px] font-mono mx-0.5">{tok.slice(1, -1)}</code>
                );
                return <span key={i}>{tok}</span>;
            })}
        </>
    );
}

function VocabBadge({ term, definition, onSave }) {
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);
    return (
        <span className="inline">
            <button onClick={() => setExpanded(v => !v)}
                className="inline-flex items-center gap-1 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-full px-2.5 py-0.5 text-[11px] font-semibold hover:bg-yellow-200 transition-colors mx-0.5">
                <Star size={9} />
                {term}
            </button>
            {expanded && (
                <span className="flex flex-col gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[12px] text-amber-900 mt-1.5 max-w-xs">
                    {definition}
                    <button onClick={() => { onSave?.({ term, definition }); setSaved(true); }} disabled={saved}
                        className={`text-left text-[11px] font-semibold ${saved ? "text-green-600 cursor-default" : "text-sky-600 hover:underline"}`}>
                        {saved ? "✓ Saved to study list" : "Save to study list"}
                    </button>
                </span>
            )}
        </span>
    );
}

/* ══════════════════════════════════════
   QUICK ACTIONS
   ══════════════════════════════════════ */
const QUICK_ACTIONS = [
    { label: "Summarize this book", type: "summary" },
    { label: "What are the key concepts?", type: "question" },
    { label: "Explain the main argument", type: "question" },
];

/* ══════════════════════════════════════
   MAIN PAGE CONTENT
   ══════════════════════════════════════ */
function AiChatContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const bookTitle = searchParams.get("bookTitle") || "this book";
    const bookId = searchParams.get("bookId") || "";
    const pdfUrl = searchParams.get("pdfUrl") || "";
    const userId = searchParams.get("userId") || "anonymous";

    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [showWelcome, setShowWelcome] = useState(true);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    }, [input]);

    const handleSaveVocab = useCallback(async ({ term, definition }) => {
        try {
            await addDoc(collection(db, "student_vocabulary"), {
                term, definition,
                bookId: bookId || "unknown",
                bookTitle,
                studentId: userId,
                timestamp: serverTimestamp(),
            });
        } catch (err) { console.error("Vocab save error:", err); }
    }, [bookId, bookTitle, userId]);

    const sendMessage = useCallback(async (text, type = "question") => {
        const trimmed = text?.trim();
        if (!trimmed || loading) return;

        setShowWelcome(false);
        setMessages(prev => [...prev, { role: "user", text: trimmed }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookTitle, bookId, pdfUrl,
                    userQuestion: trimmed,
                    userId,
                    type,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Connection Error");
            setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "ai",
                text: `**Error:** ${err.message}. Check your connection and try again.`,
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, bookTitle, bookId, pdfUrl, userId]);

    const handleSubmit = (e) => { e?.preventDefault(); sendMessage(input); };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    return (
        <div className="flex flex-col h-screen bg-white">

            {/* ── Header ── */}
            <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-sky-500/20 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-400 hover:bg-sky-500/20 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
                            <BookMarked size={15} className="text-sky-400" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-sky-50 leading-tight">LAN Library AI</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs leading-tight" title={bookTitle}>
                                {bookTitle}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Sparkles size={14} className="text-sky-400" />
                    <span className="text-[10px] text-slate-500 hidden sm:block">Gemini 1.5 Flash</span>
                </div>
            </header>

            {/* ── Messages area ── */}
            <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 space-y-4">

                {/* Welcome screen */}
                {showWelcome && messages.length === 0 && (
                    <div className="flex flex-col items-center pt-8 pb-4 px-2 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-1">
                            <BookMarked size={28} className="text-sky-500" />
                        </div>
                        <h1 className="text-lg font-semibold text-slate-800 text-center">What do you want to know?</h1>
                        <p className="text-[13px] text-slate-500 text-center">
                            Ask anything about <span className="text-sky-600 font-medium">{bookTitle}</span>
                        </p>

                        {/* Quick actions */}
                        <div className="w-full max-w-md flex flex-col gap-2 mt-3">
                            {QUICK_ACTIONS.map(({ label, type }, i) => (
                                <button
                                    key={label}
                                    onClick={() => sendMessage(label, type)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13.5px] border transition-all
                    ${i === 0
                                            ? "border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 font-medium"
                                            : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300"
                                        }`}
                                >
                                    <span>{label}</span>
                                    <ChevronRight size={14} className={i === 0 ? "text-sky-400" : "text-slate-400"} />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-600 rounded-md px-2 py-0.5 font-semibold">Highlight</span>
                            <span className="text-[12px] text-slate-400">any text on the book page, then come here to ask</span>
                        </div>
                    </div>
                )}

                {/* Chat messages */}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                        {msg.role === "ai" && (
                            <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 mb-0.5">
                                <BookMarked size={12} className="text-sky-500" />
                            </div>
                        )}

                        <div className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed
              ${msg.role === "ai"
                                ? "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                : "bg-slate-900 border border-sky-500/20 text-slate-100 rounded-br-sm"
                            }`}
                        >
                            {msg.role === "ai"
                                ? <RenderMessage text={msg.text} onSaveVocab={handleSaveVocab} />
                                : <p className="text-slate-100">{msg.text}</p>
                            }
                        </div>

                        {msg.role === "user" && (
                            <div className="w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center shrink-0 mb-0.5">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                            <BookMarked size={12} className="text-sky-500" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                            {[0, 200, 400].map(delay => (
                                <span key={delay} className="w-2 h-2 rounded-full bg-sky-400 opacity-40 animate-bounce"
                                    style={{ animationDelay: `${delay}ms` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </main>

            {/* ── Input bar ── */}
            <footer className="shrink-0 bg-white border-t border-slate-100 px-4 pt-3 pb-5 sm:pb-4">
                <form onSubmit={handleSubmit}
                    className="flex items-end gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-sky-400 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about this book…"
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] text-slate-800 placeholder-slate-400 leading-relaxed max-h-36"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-9 h-9 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center text-sky-400 hover:bg-slate-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none transition-all"
                    >
                        {loading
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Send size={14} />
                        }
                    </button>
                </form>
                <p className="text-center text-[9px] text-slate-300 uppercase tracking-wider mt-2">
                    Airtel MiFi Optimized · Secured by Firestore
                </p>
            </footer>

        </div>
    );
}

/* ══════════════════════════════════════
   PAGE EXPORT (wrapped in Suspense for useSearchParams)
   ══════════════════════════════════════ */
export default function AiChatPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <Loader2 className="animate-spin text-sky-400" size={32} />
            </div>
        }>
            <AiChatContent />
        </Suspense>
    );
}