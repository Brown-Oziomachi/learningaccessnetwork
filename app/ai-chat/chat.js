"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Sparkles, Loader2, X, Send, ChevronRight,
    BookMarked, Star, ArrowLeft, Copy, Check,
    PlusCircle, MessageSquare, Menu, ShoppingCart,
    Trash2, Search, Library, ChevronDown, Zap,
    Crown, CreditCard, Lock, GraduationCap, FileText,
    TrendingUp,
} from "lucide-react";
import {
    collection, addDoc, serverTimestamp, query,
    where, getDocs, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { booksData } from "@/lib/booksData";
import mermaid from "mermaid";
mermaid.initialize({ startOnLoad: false });

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lan-root   { font-family: 'Lato', sans-serif; background: ${BG}; color: ${NAVY}; }
.lan-serif  { font-family: 'Playfair Display', Georgia, serif; }
.hero-bg {
  background-color: ${NAVY};
  background-image:
    radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
    radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 28px 28px, 14px 14px;
  background-position: 0 0, 7px 7px;
}
.cream-bg {
  background-color: ${CREAM};
  background-image: radial-gradient(rgba(13,34,68,0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}
.lan-card { border: 0.5px solid #e5ddd0; background: #fff; transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s; }
.lan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(13,34,68,.12); border-color: ${GOLD}; }
.book-cover { transition: box-shadow .2s; }
.book-cover:hover { box-shadow: 0 8px 28px rgba(13,34,68,.2); }
.session-row { display: flex; align-items: center; gap: 8px; padding: 9px 12px; cursor: pointer; border: 0.5px solid transparent; transition: background .15s, border-color .15s; }
.session-row:hover { background: rgba(13,34,68,.05); }
.session-row.active { background: rgba(184,150,62,.1); border-color: rgba(184,150,62,.3); }
.gold-line { display: flex; align-items: center; gap: 12px; }
.gold-line::before, .gold-line::after { content:""; flex:1; height:1px; background: rgba(184,150,62,0.3); }
.lan-tab { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 9px 20px; border: none; cursor: pointer; font-family: 'Lato', sans-serif; transition: background .18s, color .18s; }
.lan-tab-active   { background: ${NAVY}; color: #fff; }
.lan-tab-inactive { background: rgba(13,34,68,.06); color: #888; }
.lan-tab-inactive:hover { background: rgba(13,34,68,.1); color: ${NAVY}; }
.sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
.sbar-none::-webkit-scrollbar { display: none; }
.gold-scroll { scrollbar-width: thin; scrollbar-color: rgba(184,150,62,.3) transparent; }
.gold-scroll::-webkit-scrollbar { width: 4px; }
.gold-scroll::-webkit-scrollbar-thumb { background: rgba(184,150,62,.3); border-radius: 4px; }
.msg-ai   { background: #fff; border: 0.5px solid #e5ddd0; color: ${NAVY}; }
.msg-user { background: ${NAVY}; color: #fff; }
.lan-input { border: 0.5px solid #d9d0c0; background: #fff; font-family: 'Lato', sans-serif; font-size: 13.5px; color: ${NAVY}; outline: none; resize: none; transition: border-color .2s; }
.lan-input:focus { border-color: ${GOLD}; }
.lan-input::placeholder { color: #b0a89a; }
.send-btn { background: ${NAVY}; color: #fff; border: none; cursor: pointer; transition: background .18s, transform .12s; }
.send-btn:hover:not(:disabled) { background: #1a3a6b; }
.send-btn:active:not(:disabled) { transform: scale(.95); }
.send-btn:disabled { opacity: .35; cursor: not-allowed; }
.quick-chip { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 13px 18px; border: 0.5px solid #e5ddd0; background: #fff; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY}; text-align: left; transition: border-color .18s, background .18s; }
.quick-chip:hover { border-color: ${GOLD}; background: ${CREAM}; }
.quick-chip.primary { border-color: rgba(184,150,62,.5); background: rgba(184,150,62,.06); }
.upgrade-card { border: 0.5px solid rgba(184,150,62,.4); background: linear-gradient(135deg, rgba(13,34,68,.04) 0%, rgba(184,150,62,.06) 100%); }
.purchase-card { border: 0.5px solid rgba(13,34,68,.15); background: ${CREAM}; }
.modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(13,34,68,.7); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 16px; }
@media (min-width: 600px) { .modal-backdrop { align-items: center; } }
.modal-panel { width: 100%; max-width: 420px; background: #fff; border: 0.5px solid #e5ddd0; animation: slideUp .28s cubic-bezier(.4,0,.2,1) both; }
@keyframes slideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
.sidebar { width: 280px; flex-shrink: 0; background: ${BG}; border-right: 0.5px solid #e5ddd0; display: flex; flex-direction: column; height: 100%; transition: transform .3s cubic-bezier(.4,0,.2,1); }
@media (max-width: 1023px) { .sidebar { position: fixed; top:0; left:0; z-index:50; height:100%; } .sidebar.closed { transform: translateX(-100%); } .sidebar.open { transform: translateX(0); } }
.hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(184,150,62,.14); border: 1px solid rgba(184,150,62,.3); border-radius: 999px; padding: 6px 14px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .7s linear infinite; }
@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
.bounce-dot { animation: bounce 1.2s ease-in-out infinite; }
`;

/* ══════════════════════════════════════
   MERMAID DIAGRAM  ← fixed: outside main component
══════════════════════════════════════ */

                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "loose",   // ← add this
                    theme: "base",
                    themeVariables: {
                        primaryColor: "#0d2244",
                        primaryTextColor: "#fff",
                        primaryBorderColor: "#b8963e",
                        lineColor: "#b8963e",
                        secondaryColor: "#f5f0e8",
                        tertiaryColor: "#fff",
                        fontFamily: "Lato, sans-serif",
                    },
                });
                
function MermaidDiagram({ chart }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || !chart) return;

        ref.current.innerHTML = ""; // clear stale content

        const render = async () => {
            try {
                // ✅ Fresh ID every call — avoids the stale-element conflict
                const uid = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const { svg } = await mermaid.render(uid, chart);

                if (ref.current) ref.current.innerHTML = svg;
            } catch (err) {
                console.error("Mermaid render error:", err);
                if (ref.current)
                    ref.current.innerHTML = `<p style="color:#e53e3e;font-size:12px;padding:8px">Diagram could not be rendered.</p>`;
            }
        };

        render();
    }, [chart]);

    return (
        <div ref={ref}
            style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px", marginTop: 10, marginBottom: 10, overflowX: "auto" }}
        />
    );
}

/* ══════════════════════════════════════
   UPGRADE MODAL
══════════════════════════════════════ */
function UpgradeModal({ type, hoursLeft, onClose, onContactSupport }) {
    const isRateLimit = type === "rateLimit";
    return (
        <div className="modal-backdrop">
            <div className="modal-panel">
                <div className="hero-bg" style={{ padding: "36px 28px 28px", textAlign: "center", position: "relative" }}>
                    <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.1)", border: "0.5px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={12} />
                    </button>
                    <div style={{ width: 52, height: 52, border: `1.5px solid ${GOLD}`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <Crown size={20} style={{ color: GOLD, transform: "rotate(-45deg)" }} />
                    </div>
                    <h2 className="lan-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                        {isRateLimit ? "Daily Limit Reached" : "Pro Feature"}
                    </h2>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,.65)", fontWeight: 300 }}>
                        {isRateLimit
                            ? `Coming Soon${hoursLeft ? `. Resets in ${hoursLeft}h` : ""}.`
                            : "Smart Summaries are exclusive to LAN AI Pro."}
                    </p>
                </div>
                <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ border: `0.5px solid rgba(184,150,62,.4)`, background: `rgba(184,150,62,.06)`, padding: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Zap size={15} style={{ color: GOLD }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>LAN AI Pro</p>
                                <p style={{ fontSize: 11, color: "#999", fontFamily: "'Lato',sans-serif" }}>Unlimited questions & summaries</p>
                            </div>
                        </div>
                        {["Unlimited questions daily", "Smart Book Summaries", "Best AI model", "Longer, richer answers"].map(f => (
                            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <Check size={10} style={{ color: GOLD }} />
                                <span style={{ fontSize: 12, color: "#777", fontFamily: "'Lato',sans-serif" }}>{f}</span>
                            </div>
                        ))}
                        <button style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", border: "none", cursor: "pointer", letterSpacing: ".04em" }}>
                            <Crown size={13} /> Upgrade to Pro <ChevronRight size={13} />
                        </button>
                    </div>
                    {isRateLimit && (
                        <div style={{ border: `0.5px solid #e5ddd0`, background: "#fff", padding: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, border: `0.5px solid #e5ddd0`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <CreditCard size={15} style={{ color: NAVY }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>AI Credits</p>
                                    <p style={{ fontSize: 11, color: "#999", fontFamily: "'Lato',sans-serif" }}>Pay-as-you-go</p>
                                </div>
                            </div>
                            <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", background: "transparent", border: `0.5px solid ${NAVY}`, color: NAVY, fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer", letterSpacing: ".04em" }}>
                                <CreditCard size={13} /> Buy AI Credits
                            </button>
                        </div>
                    )}
                    <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
                        Contact support to activate your plan instantly
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   INLINE UPGRADE CARD
══════════════════════════════════════ */
function UpgradeCard({ upgradeType, hoursLeft, onShowModal }) {
    const isRateLimit = upgradeType === "rateLimit";
    return (
        <div className="upgrade-card" style={{ marginTop: 12, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isRateLimit ? <Lock size={14} style={{ color: GOLD }} /> : <Crown size={14} style={{ color: GOLD }} />}
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>
                        {isRateLimit ? "Daily limit reached" : "Pro feature"}
                    </p>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                        {isRateLimit
                            ? `You've used all 5 free questions today${hoursLeft ? `. Resets in ${hoursLeft}h` : ""}. Upgrade for unlimited access.`
                            : "Smart Summaries are available on LAN AI Pro. Upgrade to unlock full summaries, unlimited questions, and the best AI model."}
                    </p>
                </div>
            </div>
            <button onClick={onShowModal}
                style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", border: "none", cursor: "pointer" }}>
                <Crown size={12} /> {isRateLimit ? "Upgrade or Buy Credits" : "Upgrade to Pro"} <ChevronRight size={12} />
            </button>
        </div>
    );
}

/* ══════════════════════════════════════
   COPY BUTTON
══════════════════════════════════════ */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#999", fontSize: 11, background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", transition: "color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = GOLD}
            onMouseLeave={e => e.currentTarget.style.color = "#999"}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

/* ══════════════════════════════════════
   PURCHASE CARD
══════════════════════════════════════ */
function PurchaseSuggestionCard({ bookTitle, bookId, price, onPurchase }) {
    return (
        <div className="purchase-card" style={{ marginTop: 12, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, border: `0.5px solid ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookMarked size={14} style={{ color: NAVY }} />
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>📚 Unlock Full Access</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", marginBottom: 4, lineHeight: 1.3 }}>{bookTitle}</p>
                    <p style={{ fontSize: 11, color: "#888", fontFamily: "'Lato',sans-serif" }}>Get complete answers, summaries, and AI assistance on every page.</p>
                </div>
            </div>
            <button onClick={onPurchase}
                style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", background: GOLD, color: NAVY, fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", border: "none", cursor: "pointer", letterSpacing: ".04em" }}
                onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                <ShoppingCart size={13} />
                {price ? `Purchase for ₦${Number(price).toLocaleString()}` : "Purchase & Unlock"}
                <ChevronRight size={13} />
            </button>
        </div>
    );
}

/* ══════════════════════════════════════
   MESSAGE RENDERER  ← single definition, with Mermaid
══════════════════════════════════════ */
function RenderMessage({ text, onSaveVocab, onJumpToPage }) {
    if (!text) return null;
    const codeChunks = text.split(/(```[\s\S]*?```)/g);
    return (
        <div style={{ lineHeight: 1.75, fontSize: 13.5 }}>
            {codeChunks.map((chunk, ci) => {
                if (chunk.startsWith("```")) {
                    const lines = chunk.slice(3, -3).split("\n");
                    const lang = lines[0].trim().toLowerCase() || "code";
                    const code = lines.slice(1).join("\n");

                    // ── Mermaid diagram ──
                    if (lang === "mermaid") {
                        return (
                            <div key={ci}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, marginTop: 8 }}>
                                    <div style={{ width: 4, height: 16, background: GOLD }} />
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                        Diagram
                                    </span>
                                </div>
                                <MermaidDiagram chart={code} />
                            </div>
                        );
                    }

                    // ── Regular code block ──
                    return (
                        <div key={ci} style={{ border: `0.5px solid #e5ddd0`, marginTop: 8, marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: CREAM, borderBottom: `0.5px solid #e5ddd0` }}>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{lang}</span>
                                <CopyButton text={code} />
                            </div>
                            <pre style={{ background: "#fff", padding: "12px 16px", overflowX: "auto", fontSize: 12.5, color: NAVY, fontFamily: "'Courier New',monospace", lineHeight: 1.6 }}>
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }

                // ── Plain text ──
                return (
                    <span key={ci}>
                        {chunk.split("\n").map((line, li) => {
                            const listMatch = line.match(/^(\d+)\.\s+(.*)/);
                            if (listMatch) return (
                                <div key={li} style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 4, alignItems: "flex-start" }}>
                                    <span style={{ fontWeight: 700, color: GOLD, flexShrink: 0, minWidth: 18, lineHeight: 1.75 }}>
                                        {listMatch[1]}.
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0, lineHeight: 1.75, wordBreak: "break-word", overflowWrap: "break-word" }}>
                                        <InlineParse text={listMatch[2]} onSaveVocab={onSaveVocab} onJumpToPage={onJumpToPage} />
                                    </div>
                                </div>
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
                        style={{ display: "inline-flex", alignItems: "center", background: CREAM, border: `0.5px solid rgba(184,150,62,.4)`, color: GOLD, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer", margin: "0 2px" }}>
                        p. {pageMatch[1]}
                    </button>
                );
                if (tok.startsWith("**") && tok.endsWith("**")) return <strong key={i} style={{ fontWeight: 700 }}>{tok.slice(2, -2)}</strong>;
                if (tok.startsWith("`") && tok.endsWith("`")) return (
                    <code key={i} style={{ background: CREAM, border: `0.5px solid #e5ddd0`, color: "#c0392b", padding: "1px 6px", fontSize: 12, fontFamily: "'Courier New',monospace", margin: "0 2px" }}>{tok.slice(1, -1)}</code>
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
        <span>
            <button onClick={() => setExpanded(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: CREAM, border: `0.5px solid rgba(184,150,62,.5)`, color: GOLD, padding: "2px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer", margin: "0 2px", borderRadius: 999 }}>
                <Star size={9} style={{ fill: GOLD }} />{term}
            </button>
            {expanded && (
                <span style={{ display: "block", background: "#fffdf7", border: `0.5px solid rgba(184,150,62,.3)`, padding: "10px 14px", marginTop: 6, fontSize: 12, color: NAVY, lineHeight: 1.65 }}>
                    {definition}
                    <button onClick={() => { onSave?.({ term, definition }); setSaved(true); }} disabled={saved}
                        style={{ display: "block", marginTop: 6, fontSize: 11, fontWeight: 700, color: saved ? "#16a34a" : GOLD, background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                        {saved ? "✓ Saved to study list" : "Save to study list"}
                    </button>
                </span>
            )}
        </span>
    );
}

/* ══════════════════════════════════════
   BOOK PICKER
══════════════════════════════════════ */
function BookPickerScreen({ onSelectBook }) {
    const [allBooks, setAllBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingBooks, setLoadingBooks] = useState(true);

    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w200`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w200`; }
        }
        if (book.pdfUrl?.includes("drive.google.com")) {
            const m = book.pdfUrl.match(/[-\w]{25,}/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w200`;
        }
        return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200";
    };

    useEffect(() => {
        const load = async () => {
            setLoadingBooks(true);
            try {
                const static_ = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                setAllBooks(static_); setFilteredBooks(static_);
                const q = query(collection(db, "advertMyBook"), where("status", "==", "approved"));
                const snap = await getDocs(q);
                const fs = snap.docs.map(d => {
                    const data = d.data();
                    const book = { id: `firestore-${d.id}`, firestoreId: d.id, title: data.bookTitle, author: data.author, category: data.category, price: data.price, description: data.description, driveFileId: data.driveFileId, pdfUrl: data.pdfUrl, embedUrl: data.embedUrl };
                    book.image = getThumbnailUrl(book); return book;
                });
                const combined = [...static_, ...fs].sort(() => Math.random() - .5);
                setAllBooks(combined); setFilteredBooks(combined);
            } catch (e) { console.warn(e.message); }
            finally { setLoadingBooks(false); }
        };
        load();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setFilteredBooks(allBooks); return; }
        const q = searchQuery.toLowerCase();
        setFilteredBooks(allBooks.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q)));
    }, [searchQuery, allBooks]);

    return (
        <div className="lan-root" style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
            <div className="cream-bg" style={{ padding: "40px 28px 32px", textAlign: "center", flexShrink: 0 }}>
                <h1 className="lan-serif" style={{ fontSize: "clamp(24px,5vw,42px)", fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                    Which book do you need help with?
                </h1>
                <div className="gold-line" style={{ maxWidth: 260, margin: "0 auto 12px" }}>
                    <div style={{ width: 7, height: 7, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
                </div>
                <p style={{ fontSize: 14, color: "#888", maxWidth: 460, margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
                    Pick a book from the LAN library and ask anything — summaries, key concepts, explanations and more.
                </p>
            </div>
            <div style={{ background: "#fff", borderTop: `0.5px solid #e5ddd0`, borderBottom: `0.5px solid #e5ddd0`, padding: "14px 28px", flexShrink: 0 }}>
                <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by title, author, or category…"
                        className="lan-input"
                        style={{ width: "100%", padding: "10px 14px 10px 38px", border: `0.5px solid #e5ddd0`, color: 'black' }} />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#bbb", cursor: "pointer" }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>
            <div className="gold-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "28px 28px 48px", background: BG }}>
                {loadingBooks ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                        <Loader2 size={28} style={{ color: GOLD, animation: "spin .8s linear infinite" }} />
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: 80 }}>
                        <FileText size={36} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                        <h3 className="lan-serif" style={{ fontSize: 20, color: NAVY, marginBottom: 6 }}>No books found</h3>
                        <p style={{ fontSize: 13, color: "#bbb" }}>Try a different search term</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
                        {filteredBooks.map(book => (
                            <button key={book.id} onClick={() => onSelectBook(book)}
                                style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                <div style={{ position: "relative", background: "#ede8df", overflow: "hidden", border: `0.5px solid #e5ddd0`, transition: "border-color .2s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e5ddd0"}>
                                    <img src={book.image} alt={book.title} className="book-cover"
                                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                                        onError={e => { e.target.src = "/lanlog.png"; }} loading="lazy" />
                                    <div style={{ position: "absolute", top: 8, left: 8, background: NAVY, padding: "3px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".06em", color: "#fff", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> PDF
                                    </div>
                                </div>
                                <div>
                                    <p className="lan-serif" style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 3 }}>
                                        {book.title}
                                    </p>
                                    <p style={{ fontSize: 10, color: "#999", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</p>
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
    { label: "Summarize this book", type: "question", sessionType: "summary" },
    { label: "What are the key concepts?", type: "question", sessionType: "key_concepts" },
    { label: "Explain the main argument", type: "question", sessionType: "main_argument" },
    { label: "Create a diagram of this topic", type: "question", sessionType: "diagram" },
];

/* ══════════════════════════════════════
   BOOK SESSION GROUP
══════════════════════════════════════ */
function BookSessionGroup({ bookTitle, sessions, currentSessionId, onSelectSession, onDeleteSession, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ marginBottom: 4 }}>
            <button onClick={() => setOpen(v => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(13,34,68,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <div style={{ width: 20, height: 20, border: `0.5px solid rgba(184,150,62,.4)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookMarked size={10} style={{ color: GOLD }} />
                </div>
                <span className="lan-serif" style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bookTitle}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#999", background: "rgba(13,34,68,.06)", borderRadius: 999, padding: "2px 7px", flexShrink: 0, fontFamily: "'Lato',sans-serif" }}>
                    {sessions.length}
                </span>
                <ChevronDown size={10} style={{ color: "#bbb", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s", flexShrink: 0 }} />
            </button>
            {open && (
                <div style={{ marginLeft: 12, paddingLeft: 8, borderLeft: `0.5px solid #e5ddd0` }}>
                    {sessions.map(session => (
                        <div key={session.id}
                            className={`session-row ${session.id === currentSessionId ? "active" : ""}`}
                            onClick={() => onSelectSession(session)}
                            style={{ position: "relative" }}>
                            <MessageSquare size={10} style={{ color: session.id === currentSessionId ? GOLD : "#ccc", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 11.5, fontWeight: 600, color: session.id === currentSessionId ? NAVY : "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                                    {session.title || "New conversation"}
                                </p>
                                <p style={{ fontSize: 9.5, color: "#bbb", marginTop: 2, fontFamily: "'Lato',sans-serif" }}>
                                    {session.updatedAt?.toDate?.()?.toLocaleDateString?.() || ""}
                                </p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
                                style={{ opacity: 0, position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#ccc", transition: "opacity .15s" }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#e53e3e"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
                                className="delete-btn">
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const DELETE_HOVER_STYLE = `.session-row:hover .delete-btn { opacity: 1 !important; }`;

/* ══════════════════════════════════════
   SIDEBAR
══════════════════════════════════════ */
function ChatSidebar({ isOpen, onClose, chatSessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, bookTitle }) {
    const grouped = chatSessions.reduce((acc, s) => {
        const t = s.bookTitle || "Unknown Book";
        if (!acc[t]) acc[t] = [];
        acc[t].push(s);
        return acc;
    }, {});

    const keys = Object.keys(grouped).sort((a, b) => {
        if (a === bookTitle) return -1; if (b === bookTitle) return 1;
        return (grouped[b][0]?.updatedAt?.toDate?.()?.getTime() || 0) - (grouped[a][0]?.updatedAt?.toDate?.()?.getTime() || 0);
    });

    return (
        <>
            {isOpen && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(13,34,68,.5)", zIndex: 40 }} className="lg-hidden" />}
            <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
                <div className="hero-bg" style={{ padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BookMarked size={14} style={{ color: GOLD }} />
                        <span className="lan-serif" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>LAN AI Chats</span>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "0.5px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} className="lg-hidden">
                        <X size={12} />
                    </button>
                </div>
                <div style={{ padding: "12px 14px", borderBottom: `0.5px solid #e5ddd0`, flexShrink: 0 }}>
                    <button onClick={onNewChat}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "transparent", border: `0.5px solid ${GOLD}`, color: NAVY, fontSize: 12, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer", letterSpacing: ".04em", transition: "background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = CREAM}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <PlusCircle size={13} style={{ color: GOLD }} /> New Chat
                    </button>
                </div>
                <div className="gold-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
                    {chatSessions.length === 0 ? (
                        <div style={{ padding: "48px 16px", textAlign: "center" }}>
                            <MessageSquare size={24} style={{ color: "#ddd", margin: "0 auto 10px" }} />
                            <p style={{ fontSize: 12, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>No previous chats yet</p>
                        </div>
                    ) : (
                        keys.map(k => (
                            <BookSessionGroup key={k} bookTitle={k} sessions={grouped[k]}
                                currentSessionId={currentSessionId}
                                onSelectSession={s => { onSelectSession(s); onClose(); }}
                                onDeleteSession={onDeleteSession}
                                defaultOpen={k === bookTitle} />
                        ))
                    )}
                </div>
                <div style={{ padding: "12px 16px", borderTop: `0.5px solid #e5ddd0`, flexShrink: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
                        Powered by LAN Library
                    </p>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════
   SUPPORT CONTACT  ← restored
══════════════════════════════════════ */
function openSupportContact(type, userId) {
    const phone = "2348000000000";
    const msgs = {
        pro: `Hi, I'd like to upgrade to LAN AI Pro. My user ID is: ${userId || "not logged in"}`,
        credits: `Hi, I'd like to buy AI Credits for LAN Library. My user ID is: ${userId || "not logged in"}`,
    };
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgs[type] || msgs.pro)}`, "_blank");
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function AiChatContentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramBookId = searchParams.get("bookId") || "";
    const paramBookTitle = searchParams.get("bookTitle") || "";
    const paramPdfUrl = searchParams.get("pdfUrl") || "";
    const paramUserId = searchParams.get("userId") || "";
    const paramPrice = searchParams.get("price") || "";

    const [firebaseUserId, setFirebaseUserId] = useState(paramUserId || "");
    const [authReady, setAuthReady] = useState(!!paramUserId);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            if (u) setFirebaseUserId(u.uid);
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    const userId = firebaseUserId || paramUserId || "anonymous";

    const [selectedBook, setSelectedBook] = useState(
        paramBookId ? { id: paramBookId, title: paramBookTitle, pdfUrl: paramPdfUrl, price: paramPrice } : null
    );

    const bookId = selectedBook?.id || paramBookId;
    const bookTitle = selectedBook?.title || paramBookTitle || "this book";
    const pdfUrl = selectedBook?.pdfUrl || paramPdfUrl;
    const bookPrice = selectedBook?.price || paramPrice;

    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [showWelcome, setShowWelcome] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [upgradeModal, setUpgradeModal] = useState(null);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (!authReady || !userId || userId === "anonymous") return;
        const load = async () => {
            try {
                const q = query(collection(db, "ai_chat_sessions"), where("userId", "==", userId));
                const snap = await getDocs(q);
                const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0));
                setChatSessions(sessions);
            } catch (e) { console.warn(e.message); }
        };
        load();
    }, [userId, authReady]);

    const handleSaveVocab = useCallback(async ({ term, definition }) => {
        try {
            await addDoc(collection(db, "student_vocabulary"), { term, definition, bookId: bookId || "unknown", bookTitle, studentId: userId, timestamp: serverTimestamp() });
        } catch (e) { console.error(e); }
    }, [bookId, bookTitle, userId]);

    const saveSessionToFirebase = useCallback(async (sessionId, updatedMessages, firstUserMessage, sessionType = null) => {
        if (!userId || userId === "anonymous" || !bookId) return sessionId;
        try {
            const data = {
                userId, bookId, bookTitle,
                messages: updatedMessages.map(({ showPurchaseCta, upgradePrompt, upgradeType, hoursLeft, ...rest }) => rest),
                title: firstUserMessage?.slice(0, 60) || "New conversation",
                updatedAt: serverTimestamp(),
                ...(sessionType ? { sessionType } : {}),
            };
            if (sessionId) {
                await updateDoc(doc(db, "ai_chat_sessions", sessionId), data);
                setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...data, updatedAt: { toDate: () => new Date() } } : s));
                return sessionId;
            } else {
                const ref = await addDoc(collection(db, "ai_chat_sessions"), { ...data, createdAt: serverTimestamp() });
                setCurrentSessionId(ref.id);
                setChatSessions(prev => [{ id: ref.id, ...data, updatedAt: { toDate: () => new Date() } }, ...prev]);
                return ref.id;
            }
        } catch (e) { console.warn(e.message); return sessionId; }
    }, [userId, bookId, bookTitle]);

    const handleSelectSession = useCallback(s => {
        setCurrentSessionId(s.id); setMessages(s.messages || []); setShowWelcome(false);
        if (s.bookId && s.bookTitle) setSelectedBook({ id: s.bookId, title: s.bookTitle, pdfUrl: s.pdfUrl || "", price: s.price || "" });
    }, []);

    const handleNewChat = useCallback(() => {
        setCurrentSessionId(null); setMessages([]); setShowWelcome(true); setInput("");
    }, []);

    const handleDeleteSession = useCallback(async sessionId => {
        try {
            await deleteDoc(doc(db, "ai_chat_sessions", sessionId));
            setChatSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) handleNewChat();
        } catch (e) { console.warn(e.message); }
    }, [currentSessionId, handleNewChat]);

    const handlePurchaseRedirect = useCallback(() => {
        const cleanId = bookId?.replace("firestore-", "") || bookId;
        router.push(`/payment?bookId=${cleanId}`);
    }, [bookId, router]);

    const sendMessage = useCallback(async (text, type = "question", sessionType = null, overrideSessionId, overrideMessages) => {
        const trimmed = text?.trim();
        if (!trimmed || loading) return;

        const activeSessionId = overrideSessionId !== undefined ? overrideSessionId : currentSessionId;
        const baseMessages = overrideMessages !== undefined ? overrideMessages : messages;

        setShowWelcome(false);
        const userMsg = { role: "user", text: trimmed };
        const updatedWithUser = [...baseMessages, userMsg];
        setMessages(updatedWithUser); setInput(""); setLoading(true);

        try {
            const res = await fetch("/api/ai/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookTitle, bookId, pdfUrl, userQuestion: trimmed, userId, type }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.upgradePrompt) {
                    setMessages(prev => [...prev, { role: "ai", text: data.error, upgradePrompt: true, upgradeType: data.upgradeType || "rateLimit", hoursLeft: data.hoursLeft }]);
                    setLoading(false); return;
                }
                throw new Error(data.error || "Connection Error");
            }

            const purchaseKw = ["purchase", "buy", "unlock", "full access", "full content", "complete book", "acquire", "limited preview", "only available", "full version"];
            const shouldSuggest = purchaseKw.some(kw => data.reply.toLowerCase().includes(kw));
            const aiMsg = { role: "ai", text: data.reply, showPurchaseCta: shouldSuggest };
            const finalMessages = [...updatedWithUser, aiMsg];
            setMessages(finalMessages);

            const firstUserText = baseMessages.find(m => m.role === "user")?.text || trimmed;
            const newId = await saveSessionToFirebase(activeSessionId, finalMessages, firstUserText, sessionType);
            if (newId && !activeSessionId) setCurrentSessionId(newId);

        } catch (e) {
            const isNetwork = !navigator.onLine || e.message?.includes("fetch") || e.message?.includes("network");
            const msg = isNetwork ? "No internet connection. Please check your network." : e.message || "Something went wrong.";
            setMessages(prev => [...prev, { role: "ai", text: `**${msg}**` }]);
        } finally { setLoading(false); }
    }, [loading, bookTitle, bookId, pdfUrl, userId, messages, currentSessionId, saveSessionToFirebase]);

    const handleSubmit = e => { e?.preventDefault(); sendMessage(input); };
    const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

    const handleQuickAction = useCallback((label, type, sessionType) => {
        const existing = chatSessions.find(s => s.bookId === bookId && s.sessionType === sessionType);
        if (existing) {
            setCurrentSessionId(existing.id); setMessages(existing.messages || []); setShowWelcome(false);
            sendMessage(label, type, sessionType, existing.id, existing.messages || []);
        } else {
            sendMessage(label, type, sessionType, null, []);
        }
    }, [chatSessions, bookId, sendMessage]);

    if (!selectedBook && !paramBookId) return <BookPickerScreen onSelectBook={b => setSelectedBook(b)} />;

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <style>{DELETE_HOVER_STYLE}</style>
            <style>{`@media(min-width:1024px){.sidebar{position:relative!important;transform:none!important;z-index:auto!important;}.lg-hidden{display:none!important;}}`}</style>

            {upgradeModal && (
                <UpgradeModal type={upgradeModal.type} hoursLeft={upgradeModal.hoursLeft}
                    onClose={() => setUpgradeModal(null)}
                    onContactSupport={t => { setUpgradeModal(null); openSupportContact(t, userId); }} />
            )}

            <div className="lan-root" style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>

                <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
                    chatSessions={chatSessions} currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={() => { handleNewChat(); setSidebarOpen(false); }}
                    onDeleteSession={handleDeleteSession} bookTitle={bookTitle} />

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}>

                    {/* Nav */}
                    <header className="hero-bg" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={() => setSidebarOpen(v => !v)}
                                style={{ width: 34, height: 34, border: `0.5px solid rgba(255,255,255,.15)`, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <Menu size={15} />
                            </button>
                            <button onClick={() => router.back()}
                                style={{ width: 34, height: 34, border: `0.5px solid rgba(184,150,62,.3)`, background: "rgba(184,150,62,.08)", color: GOLD, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <ArrowLeft size={15} />
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <BookMarked size={14} style={{ color: GOLD }} />
                                </div>
                                <div>
                                    <p className="lan-serif" style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>LAN Library AI</p>
                                    <button onClick={() => setSelectedBook(null)}
                                        style={{ fontSize: 10, color: "rgba(184,150,62,.65)", fontFamily: "'Lato',sans-serif", background: "none", border: "none", cursor: "pointer", padding: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textAlign: "left" }}
                                        title="Change book">{bookTitle}</button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setUpgradeModal({ type: "rateLimit" })}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(184,150,62,.12)", border: `0.5px solid rgba(184,150,62,.35)`, color: GOLD, fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>
                                <Crown size={11} /> Pro
                            </button>
                            <button onClick={() => { handleNewChat(); setSidebarOpen(false); }}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(255,255,255,.06)", border: `0.5px solid rgba(255,255,255,.15)`, color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: "pointer" }}>
                                <PlusCircle size={11} />
                            </button>
                        </div>
                    </header>

                    {/* Messages */}
                    <main className="gold-scroll" style={{ flex: 1, overflowY: "auto", background: BG, padding: "28px 24px", minHeight: 0 }}>

                        {showWelcome && messages.length === 0 && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, paddingBottom: 20 }}>
                                <div style={{ width: 64, height: 64, border: `1.5px solid ${GOLD}`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                                    <BookMarked size={26} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
                                </div>
                                <h1 className="lan-serif" style={{ fontSize: "clamp(22px,4vw,38px)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: 10 }}>
                                    What do you want to know?
                                </h1>
                                <div className="gold-line" style={{ maxWidth: 240, width: "100%", marginBottom: 10 }}>
                                    <div style={{ width: 7, height: 7, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
                                </div>
                                <p style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 32, fontWeight: 300, lineHeight: 1.75 }}>
                                    Ask anything about{" "}
                                    <span className="lan-serif" style={{ color: NAVY, fontWeight: 700 }}>{bookTitle}</span>
                                </p>
                                <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 8 }}>
                                    {QUICK_ACTIONS.map(({ label, type, sessionType }, i) => (
                                        <button key={label} onClick={() => handleQuickAction(label, type, sessionType)}
                                            className={`quick-chip ${i === 0 ? "primary" : ""}`}>
                                            <span>{label}</span>
                                            <ChevronRight size={13} style={{ color: i === 0 ? GOLD : "#bbb", flexShrink: 0 }} />
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
                                    <span style={{ fontSize: 11, background: "#fff", border: `0.5px solid #e5ddd0`, color: NAVY, padding: "3px 10px", fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em" }}>TIP</span>
                                    <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Try asking for a diagram to visualise concepts</span>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
                                {msg.role === "ai" && (
                                    <div style={{ width: 30, height: 30, border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
                                        <BookMarked size={12} style={{ color: GOLD }} />
                                    </div>
                                )}
                                <div className={msg.role === "ai" ? "msg-ai" : "msg-user"}
                                    style={{ maxWidth: "80%", padding: "14px 16px", fontSize: 13.5, lineHeight: 1.75, wordBreak: "break-word", overflowWrap: "break-word", overflow: "hidden", minWidth: 0 }}>
                                    {msg.role === "ai" ? (
                                        <>
                                            <RenderMessage text={msg.text} onSaveVocab={handleSaveVocab} />
                                            {msg.upgradePrompt && (
                                                <UpgradeCard upgradeType={msg.upgradeType} hoursLeft={msg.hoursLeft}
                                                    onShowModal={() => setUpgradeModal({ type: msg.upgradeType, hoursLeft: msg.hoursLeft })} />
                                            )}
                                            {msg.showPurchaseCta && !msg.upgradePrompt && (
                                                <PurchaseSuggestionCard bookTitle={bookTitle} bookId={bookId} price={bookPrice} onPurchase={handlePurchaseRedirect} />
                                            )}
                                        </>
                                    ) : (
                                        <p style={{ color: "#fff", fontFamily: "'Lato',sans-serif", fontSize: 13.5 }}>{msg.text}</p>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div style={{ width: 30, height: 30, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: "flex-start", marginBottom: 16 }}>
                                <div style={{ width: 30, height: 30, border: `0.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <BookMarked size={12} style={{ color: GOLD }} />
                                </div>
                                <div className="msg-ai" style={{ padding: "14px 20px", display: "flex", gap: 6, alignItems: "center" }}>
                                    {[0, 200, 400].map(d => (
                                        <span key={d} className="bounce-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, display: "inline-block", animationDelay: `${d}ms` }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </main>

                    {/* ── Input footer ── */}
                    <footer style={{ flexShrink:0, background:"#fff", borderTop:`0.5px solid #e5ddd0`, padding:"16px 24px 20px" }}>

                        <form onSubmit={handleSubmit} style={{ display:"flex", alignItems:"flex-end", gap:10, border:`0.5px solid #d9d0c0`, background:"#fff", padding:"10px 12px", transition:"border-color .2s" }}
                            onFocusCapture={e => e.currentTarget.style.borderColor=GOLD}
                            onBlurCapture={e => e.currentTarget.style.borderColor="#d9d0c0"}>
                            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                placeholder={`Ask anything about "${bookTitle}"…`} rows={1}
                                className="lan-input"
                                style={{ flex:1, border:"none", outline:"none", resize:"none", maxHeight:140, padding:"2px 0" }} />
                            <button type="submit" disabled={loading || !input.trim()} className="send-btn"
                                style={{ width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                {loading
                                    ? <Loader2 size={14} style={{ animation:"spin .8s linear infinite" }} />
                                    : <Send size={14} />}
                            </button>
                        </form>

                        <p style={{ textAlign:"center", fontSize:9, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#bbb", fontFamily:"'Lato',sans-serif", marginTop:10 }}>
                            LAN Library AI · Ask questions, get summaries, explore key concepts
                        </p>
                    </footer>

                </div>
            </div>
        </>
    );
}