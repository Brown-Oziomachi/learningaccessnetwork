"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Sparkles, Loader2, X, Send, ChevronRight,
    BookMarked, Star, ArrowLeft, Copy, Check,
    PlusCircle, MessageSquare, Menu, ShoppingCart,
    ChevronLeft, Trash2, Search, Library,
} from "lucide-react";
import {
    collection, addDoc, serverTimestamp, query,
    where, orderBy, getDocs, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";

/* ══════════════════════════════════════
   COPY BUTTON
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

/* ══════════════════════════════════════
   PURCHASE SUGGESTION CARD
   Shown when AI suggests buying the book
══════════════════════════════════════ */
function PurchaseSuggestionCard({ bookTitle, bookId, price, onPurchase }) {
    return (
        <div className="mt-3 bg-gradient-to-br from-sky-950 to-slate-900 border border-sky-500/30 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <BookMarked size={16} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-sky-400 font-semibold uppercase tracking-wider mb-0.5">
                        📚 Unlock Full Access
                    </p>
                    <p className="text-[13px] text-slate-200 font-medium line-clamp-2 mb-1">
                        {bookTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Get complete answers, summaries, and AI assistance on every page.
                    </p>
                </div>
            </div>
            <button
                onClick={onPurchase}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-all"
            >
                <ShoppingCart size={14} />
                {price ? `Purchase for ₦${Number(price).toLocaleString()}` : "Purchase & Unlock"}
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

/* ══════════════════════════════════════
   MESSAGE RENDERER
══════════════════════════════════════ */
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
   BOOK PICKER SCREEN
   Shown when user lands without a bookId
══════════════════════════════════════ */
function BookPickerScreen({ onSelectBook }) {
    const [allBooks, setAllBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingBooks, setLoadingBooks] = useState(true);

    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w200`;
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) { const id = match[1] || match[2] || match[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w200`; }
        }
        if (book.pdfUrl?.includes("drive.google.com")) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w200`;
        }
        return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200";
    };

    useEffect(() => {
        const loadBooks = async () => {
            setLoadingBooks(true);
            try {
                // Start with static booksData
                const staticBooks = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                setAllBooks(staticBooks);
                setFilteredBooks(staticBooks);

                // Then enrich with Firestore
                const q = query(collection(db, "advertMyBook"), where("status", "==", "approved"));
                const snap = await getDocs(q);
                const fsBooks = snap.docs.map(d => {
                    const data = d.data();
                    const book = {
                        id: `firestore-${d.id}`,
                        firestoreId: d.id,
                        title: data.bookTitle,
                        author: data.author,
                        category: data.category,
                        price: data.price,
                        description: data.description,
                        driveFileId: data.driveFileId,
                        pdfUrl: data.pdfUrl,
                        embedUrl: data.embedUrl,
                    };
                    book.image = getThumbnailUrl(book);
                    return book;
                });

                const combined = [...staticBooks, ...fsBooks].sort(() => Math.random() - 0.5);
                setAllBooks(combined);
                setFilteredBooks(combined);
            } catch (err) {
                console.warn("Book picker load error:", err.message);
            } finally {
                setLoadingBooks(false);
            }
        };
        loadBooks();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setFilteredBooks(allBooks); return; }
        const q = searchQuery.toLowerCase();
        setFilteredBooks(allBooks.filter(b =>
            b.title?.toLowerCase().includes(q) ||
            b.author?.toLowerCase().includes(q) ||
            b.category?.toLowerCase().includes(q)
        ));
    }, [searchQuery, allBooks]);

    return (
        <div className="flex flex-col h-screen bg-slate-950">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-sky-500/20 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
                    <Library size={15} className="text-sky-400" />
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-sky-50 leading-tight">LAN Library AI</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Select a book to start chatting</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Sparkles size={14} className="text-sky-400" />
                    <span className="text-[10px] text-slate-500 hidden sm:block">Gemini Flash</span>
                </div>
            </header>

            {/* Hero */}
            <div className="px-5 pt-8 pb-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
                    <BookMarked size={30} className="text-sky-400" />
                </div>
                <h1 className="text-xl font-bold text-slate-100 mb-1">Which book do you need help with?</h1>
                <p className="text-[13px] text-slate-400 max-w-sm mx-auto">
                    Pick a book from LAN library and ask anything — summaries, key concepts, explanations and more.
                </p>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
                <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:border-sky-500/50 transition-colors max-w-lg mx-auto">
                    <Search size={15} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by title, author, or category…"
                        className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-200 placeholder-slate-500"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300">
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Books Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
                {loadingBooks ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={28} className="animate-spin text-sky-500" />
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-16">
                        <BookMarked size={32} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-[14px] font-medium">No books found</p>
                        <p className="text-slate-600 text-[12px] mt-1">Try a different search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
                        {filteredBooks.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => onSelectBook(book)}
                                className="group text-left flex flex-col gap-2 focus:outline-none"
                            >
                                <div className="relative overflow-hidden border border-slate-700/60 group-hover:border-sky-500/50 transition-all group-hover:shadow-lg group-hover:shadow-sky-500/10">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        className="w-full h-[160px] sm:h-[190px] group-hover:scale-105 transition-transform duration-300"
                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200"; }}
                                        loading="lazy"
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/10 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-sky-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                            Ask AI ✦
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-slate-200 line-clamp-2 group-hover:text-sky-300 transition-colors leading-tight">
                                        {book.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{book.author}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
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
   SIDEBAR COMPONENT
══════════════════════════════════════ */
function ChatSidebar({ isOpen, onClose, chatSessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, bookTitle }) {
    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-700/50 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0
      `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <BookMarked size={16} className="text-sky-400" />
                        <span className="text-[13px] font-semibold text-slate-200">LAN AI Chats</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 hover:bg-sky-500/20 transition-colors text-[13px] font-medium"
                    >
                        <PlusCircle size={15} />
                        New Chat
                    </button>
                </div>

                {/* Book context badge */}
                <div className="px-3 pb-2">
                    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Current Book</p>
                        <p className="text-[11px] text-slate-300 font-medium line-clamp-2">{bookTitle}</p>
                    </div>
                </div>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
                    {chatSessions.length === 0 ? (
                        <div className="px-3 py-6 text-center">
                            <MessageSquare size={24} className="text-slate-600 mx-auto mb-2" />
                            <p className="text-[11px] text-slate-500">No previous chats yet</p>
                        </div>
                    ) : (
                        chatSessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${session.id === currentSessionId
                                        ? "bg-sky-500/15 border border-sky-500/20"
                                        : "hover:bg-slate-800 border border-transparent"
                                    }`}
                                onClick={() => { onSelectSession(session); onClose(); }}
                            >
                                <MessageSquare size={13} className={session.id === currentSessionId ? "text-sky-400 shrink-0" : "text-slate-500 shrink-0"} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] font-medium truncate ${session.id === currentSessionId ? "text-sky-300" : "text-slate-300"}`}>
                                        {session.title || "New conversation"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {session.updatedAt?.toDate?.()?.toLocaleDateString?.() || ""}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all shrink-0"
                                >
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-700/50">
                    <p className="text-[9px] text-slate-600 text-center uppercase tracking-wider">
                        Powered by LAN Library
                    </p>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════
   MAIN PAGE CONTENT
══════════════════════════════════════ */
export default function AiChatContentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramBookId = searchParams.get("bookId") || "";
    const paramBookTitle = searchParams.get("bookTitle") || "";
    const paramPdfUrl = searchParams.get("pdfUrl") || "";
    const userId = searchParams.get("userId") || "anonymous";
    const paramPrice = searchParams.get("price") || "";

    // If user lands without a book, they pick one here
    const [selectedBook, setSelectedBook] = useState(
        paramBookId ? { id: paramBookId, title: paramBookTitle, pdfUrl: paramPdfUrl, price: paramPrice } : null
    );

    // Derived values — always use selectedBook if set, else fall back to URL params
    const bookId = selectedBook?.id || paramBookId;
    const bookTitle = selectedBook?.title || paramBookTitle || "this book";
    const pdfUrl = selectedBook?.pdfUrl || paramPdfUrl;
    const bookPrice = selectedBook?.price || paramPrice;

    // ── All hooks declared here — NO early returns before this point ──
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [showWelcome, setShowWelcome] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Chat session management
    const [chatSessions, setChatSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    /* ── Scroll to bottom on new messages ── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    /* ── Auto-resize textarea ── */
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    }, [input]);

    /* ── Load chat sessions from Firebase ── */
    useEffect(() => {
        if (!userId || userId === "anonymous") return;

        const loadSessions = async () => {
            try {
                const q = query(
                    collection(db, "ai_chat_sessions"),
                    where("userId", "==", userId),
                    where("bookId", "==", bookId),
                    orderBy("updatedAt", "desc")
                );
                const snapshot = await getDocs(q);
                const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setChatSessions(sessions);
            } catch (err) {
                console.warn("Could not load chat sessions:", err.message);
            }
        };

        loadSessions();
    }, [userId, bookId]);

    /* ── Save vocab ── */
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

    /* ── Create or update Firebase session ── */
    const saveSessionToFirebase = useCallback(async (sessionId, updatedMessages, firstUserMessage) => {
        if (!userId || userId === "anonymous") return sessionId;

        try {
            const sessionData = {
                userId,
                bookId,
                bookTitle,
                messages: updatedMessages,
                title: firstUserMessage?.slice(0, 60) || "New conversation",
                updatedAt: serverTimestamp(),
            };

            if (sessionId) {
                // Update existing session
                await updateDoc(doc(db, "ai_chat_sessions", sessionId), sessionData);
                return sessionId;
            } else {
                // Create new session
                const docRef = await addDoc(collection(db, "ai_chat_sessions"), {
                    ...sessionData,
                    createdAt: serverTimestamp(),
                });
                setCurrentSessionId(docRef.id);
                // Add to local sessions list
                setChatSessions(prev => [{ id: docRef.id, ...sessionData, updatedAt: { toDate: () => new Date() } }, ...prev]);
                return docRef.id;
            }
        } catch (err) {
            console.warn("Could not save session:", err.message);
            return sessionId;
        }
    }, [userId, bookId, bookTitle]);

    /* ── Load a previous session ── */
    const handleSelectSession = useCallback((session) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        setShowWelcome(false);
    }, []);

    /* ── Start a new chat ── */
    const handleNewChat = useCallback(() => {
        setCurrentSessionId(null);
        setMessages([]);
        setShowWelcome(true);
        setInput("");
    }, []);

    /* ── Delete a session ── */
    const handleDeleteSession = useCallback(async (sessionId) => {
        try {
            await deleteDoc(doc(db, "ai_chat_sessions", sessionId));
            setChatSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        } catch (err) {
            console.warn("Could not delete session:", err.message);
        }
    }, [currentSessionId, handleNewChat]);

    /* ── Handle purchase redirect ── */
    const handlePurchaseRedirect = useCallback(() => {
        const cleanId = bookId?.replace("firestore-", "") || bookId;
        router.push(`/payment?bookId=${cleanId}`);
    }, [bookId, router]);

    /* ── Send message ── */
    const sendMessage = useCallback(async (text, type = "question") => {
        const trimmed = text?.trim();
        if (!trimmed || loading) return;

        setShowWelcome(false);
        const userMsg = { role: "user", text: trimmed };
        const updatedWithUser = [...messages, userMsg];
        setMessages(updatedWithUser);
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

            // Detect if AI is hinting at purchasing (keywords)
            const purchaseKeywords = [
                "purchase", "buy", "unlock", "full access", "full content",
                "complete book", "acquire", "get the book", "read more",
                "limited preview", "only available", "full version",
            ];
            const replyLower = data.reply.toLowerCase();
            const shouldSuggestPurchase = purchaseKeywords.some(kw => replyLower.includes(kw));

            const aiMsg = {
                role: "ai",
                text: data.reply,
                showPurchaseCta: shouldSuggestPurchase,
            };

            const finalMessages = [...updatedWithUser, aiMsg];
            setMessages(finalMessages);

            // Save to Firebase
            const firstUserText = messages.find(m => m.role === "user")?.text || trimmed;
            const newSessionId = await saveSessionToFirebase(currentSessionId, finalMessages, firstUserText);
            if (newSessionId && !currentSessionId) setCurrentSessionId(newSessionId);

        } catch (err) {
            const isNetwork = !navigator.onLine || err.message?.includes("fetch") || err.message?.includes("network");
            const friendlyError = isNetwork
                ? "⚠️ No internet connection. Please check your network and try again."
                : err.message || "Something went wrong. Please try again.";

            const errMessages = [...updatedWithUser, {
                role: "ai",
                text: `**${friendlyError}**`,
            }];
            setMessages(errMessages);
        } finally {
            setLoading(false);
        }
    }, [loading, bookTitle, bookId, pdfUrl, userId, messages, currentSessionId, saveSessionToFirebase]);

    const handleSubmit = (e) => { e?.preventDefault(); sendMessage(input); };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    // ── Book picker shown conditionally inside return — hooks always run ──
    if (!selectedBook && !paramBookId) {
        return (
            <BookPickerScreen
                onSelectBook={(book) => setSelectedBook(book)}
            />
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">

            {/* ── Sidebar ── */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                chatSessions={chatSessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={() => { handleNewChat(); setSidebarOpen(false); }}
                onDeleteSession={handleDeleteSession}
                bookTitle={bookTitle}
            />

            {/* ── Main Chat Area ── */}
            <div className="flex flex-col flex-1 min-w-0 h-full">

                {/* ── Header ── */}
                <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-sky-500/20 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <Menu size={16} />
                        </button>

                        {/* Back button */}
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
                                <button
                                    onClick={() => setSelectedBook(null)}
                                    className="text-[10px] text-slate-500 truncate max-w-[130px] sm:max-w-xs leading-tight hover:text-sky-400 transition-colors text-left flex items-center gap-1"
                                    title="Change book"
                                >
                                    <span className="truncate">{bookTitle}</span>
                                    <span className="text-slate-600 shrink-0">· change</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* New chat button (header shortcut) */}
                        <button
                            onClick={handleNewChat}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500/40 transition-colors text-[11px] font-medium"
                        >
                            <PlusCircle size={12} />
                            <span className="hidden sm:inline">New chat</span>
                        </button>
                        <Sparkles size={14} className="text-sky-400" />
                        <span className="text-[10px] text-slate-500 hidden sm:block">Gemini Flash</span>
                    </div>
                </header>

                {/* ── Messages area ── */}
                <main className="flex-1 overflow-y-auto bg-slate-950 px-4 py-5 space-y-4">

                    {/* Welcome screen */}
                    {showWelcome && messages.length === 0 && (
                        <div className="flex flex-col items-center pt-8 pb-4 px-2 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-1">
                                <BookMarked size={28} className="text-sky-500" />
                            </div>
                            <h1 className="text-lg font-semibold text-slate-200 text-center">What do you want to know?</h1>
                            <p className="text-[13px] text-slate-400 text-center">
                                Ask anything about <span className="text-sky-400 font-medium">{bookTitle}</span>
                            </p>

                            {/* Quick actions */}
                            <div className="w-full max-w-md flex flex-col gap-2 mt-3">
                                {QUICK_ACTIONS.map(({ label, type }, i) => (
                                    <button
                                        key={label}
                                        onClick={() => sendMessage(label, type)}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13.5px] border transition-all
                      ${i === 0
                                                ? "border-sky-500/30 text-sky-300 bg-sky-500/10 hover:bg-sky-500/15 font-medium"
                                                : "border-slate-700 text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
                                            }`}
                                    >
                                        <span>{label}</span>
                                        <ChevronRight size={14} className={i === 0 ? "text-sky-400" : "text-slate-500"} />
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] bg-slate-800 border border-slate-700 text-slate-400 rounded-md px-2 py-0.5 font-semibold">Highlight</span>
                                <span className="text-[12px] text-slate-500">any text on the book page, then ask here</span>
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
                                    ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm"
                                    : "bg-sky-600 border border-sky-500/30 text-white rounded-br-sm"
                                }`}
                            >
                                {msg.role === "ai" ? (
                                    <>
                                        <RenderMessage text={msg.text} onSaveVocab={handleSaveVocab} />
                                        {/* Purchase CTA — shown when AI hints at purchasing */}
                                        {msg.showPurchaseCta && (
                                            <PurchaseSuggestionCard
                                                bookTitle={bookTitle}
                                                bookId={bookId}
                                                price={bookPrice}
                                                onPurchase={handlePurchaseRedirect}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <p className="text-white">{msg.text}</p>
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center shrink-0 mb-0.5">
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
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
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
                <footer className="shrink-0 bg-slate-900 border-t border-slate-700/50 px-4 pt-3 pb-5 sm:pb-4">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-end gap-2.5 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2.5 focus-within:border-sky-500/50 transition-colors"
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about this book…"
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] text-slate-200 placeholder-slate-500 leading-relaxed max-h-36"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-9 h-9 shrink-0 bg-sky-600 rounded-xl flex items-center justify-center text-white hover:bg-sky-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none transition-all"
                        >
                            {loading
                                ? <Loader2 size={15} className="animate-spin" />
                                : <Send size={14} />
                            }
                        </button>
                    </form>
                    <p className="text-center text-[9px] text-slate-300 uppercase tracking-wider mt-2">
                        LAN Library AI · Ask questions, get summaries, and explore key concepts with ease
                    </p>
                </footer>
            </div>
        </div>
    );
}
