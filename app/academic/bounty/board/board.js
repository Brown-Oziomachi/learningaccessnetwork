"use client";


import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import {
  subscribeToBounties,
  createBounty,
  incrementProposals,
} from "@/lib/bountyService";

/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── Icons ─────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const ArrowUpRightIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const UserIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const ChatIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
);
const HelpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const ChevronDownIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .25s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

/* ─── How It Works content ──────────────────────────────────── */
const HOW_IT_WORKS_STEPS = [
  {
    n: "01",
    title: "Student Posts a Bounty",
    body: "Any registered student can post a request for a document, past question, lecture note, or any learning material missing from the library. Set a reward amount — funds go straight into secure escrow.",
  },
  {
    n: "02",
    title: "Author Claims & Fulfils",
    body: "Content creators, lecturers, and subject-matter experts browse open bounties, claim one that matches their expertise, and upload the completed asset. The student is notified to confirm receipt.",
  },
  {
    n: "03",
    title: "Automated Payout & Split",
    body: "Once confirmed, escrow releases automatically. The author receives 80% of the reward directly to their LAN wallet. LAN Library retains 20% as a platform fee. The student gains lifetime access.",
  },
];

/* ─── How It Works section ──────────────────────────────────── */
function HowItWorksSection() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 28, border: `.5px solid #e5ddd0`, background: "#fff" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Lato',sans-serif",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HelpIcon />
          <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, letterSpacing: ".06em", textTransform: "uppercase" }}>
            How the Bounty Board Works
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="https://learningaccessnetwork.vercel.app/lan/net/help-center/article/bounty-board"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 10, fontWeight: 700, color: GOLD, textDecoration: "underline", fontFamily: "'Lato',sans-serif" }}
          >
            Full Guide →
          </a>
          <ChevronDownIcon open={open} />
        </span>
      </button>

      {open && (
        <div style={{ borderTop: ".5px solid #f0ebe0", padding: "20px" }}>
          {/* 3-step grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
            {HOW_IT_WORKS_STEPS.map(s => (
              <div key={s.n} style={{ background: CREAM, border: `.5px solid rgba(184,150,62,.25)`, padding: "18px 20px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 900, color: GOLD, opacity: .35, lineHeight: 1, marginBottom: 8 }}>{s.n}</div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</h4>
                <p style={{ fontSize: 12, color: "#666", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Escrow highlight */}
          <div style={{ background: NAVY, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <LockIcon style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>
                Escrow Protection
              </p>
              <p style={{ fontSize: 12, color: "rgba(245,240,232,.7)", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, margin: 0 }}>
                Every bounty reward is locked in escrow the moment the request is posted. Authors are always paid for valid fulfilments. Students are never charged unless their material is delivered. The 80/20 split is automatic — no manual steps.
              </p>
            </div>
          </div>

          {/* Payout example */}
          <div style={{ marginTop: 14, padding: "13px 16px", background: "rgba(184,150,62,.06)", border: `.5px solid rgba(184,150,62,.25)` }}>
            <p style={{ fontSize: 11, color: "#666", fontFamily: "'Lato',sans-serif", margin: 0 }}>
              <strong style={{ color: NAVY }}>Example:</strong> A student posts a ₦5,000 bounty. The author who fulfils it receives{" "}
              <strong style={{ color: NAVY }}>₦4,000 (80%)</strong>. LAN Library retains{" "}
              <strong style={{ color: NAVY }}>₦1,000 (20%)</strong>.
            </p>
          </div>

          <a
            href="https://learningaccessnetwork.vercel.app/lan/net/help-center/article/bounty-board"
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14, fontSize: 11, fontWeight: 700, color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif" }}
          >
            Read the full bounty board guide <ArrowUpRightIcon />
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── Create Modal ───────────────────────────────────────────── */
function CreateModal({ onClose, user }) {
  const [form, setForm] = useState({ title: "", university: "", department: "", reward: "", deadline: "", tags: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!user) { setError("Please sign in to post a bounty."); return; }
    if (!form.title || !form.reward) { setError("Title and reward amount are required."); return; }
    if (isNaN(Number(form.reward)) || Number(form.reward) <= 0) { setError("Enter a valid reward amount."); return; }
    setError("");
    setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      await createBounty({ ...form, tags }, user);
      onClose();
    } catch (e) {
      setError("Failed to post bounty. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "10px 14px",
    border: ".5px solid #e5ddd0",
    fontSize: 13,
    fontFamily: "'Lato',sans-serif",
    outline: "none",
    width: "100%",
    background: BG,
    color: NAVY,
    boxSizing: "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,34,68,.65)",
        zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          border: ".5px solid #e5ddd0",
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          position: "relative",
          animation: "fadeUp .3s both",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#ccc", lineHeight: 1 }}
          aria-label="Close"
        >×</button>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
          New Request
        </p>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
          Post a Bounty
        </h3>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 22, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
          Your reward amount will be held in <strong>secure escrow</strong> until the material is delivered.
        </p>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.08)", border: ".5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Document title or description (be specific)" style={inputStyle} value={form.title} onChange={set("title")} />
          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="University (e.g. UNILAG)" style={{ ...inputStyle, flex: 1 }} value={form.university} onChange={set("university")} />
            <input placeholder="Department" style={{ ...inputStyle, flex: 1 }} value={form.department} onChange={set("department")} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="Reward amount (₦)" type="number" min="100" style={{ ...inputStyle, flex: 1 }} value={form.reward} onChange={set("reward")} />
            <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.deadline} onChange={set("deadline")} />
          </div>
          <input placeholder="Tags (comma-separated, e.g. Past Questions, Maths)" style={inputStyle} value={form.tags} onChange={set("tags")} />

          {/* Escrow note */}
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(13,34,68,.04)", border: ".5px solid rgba(13,34,68,.12)" }}>
            <LockIcon />
            <p style={{ fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
              Your reward is held safely in escrow. You are only charged once a valid submission is accepted. Authors receive 80%, LAN Library retains 20%.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 4, padding: "13px 28px", background: loading ? "#ccc" : GOLD, color: NAVY,
              fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
              border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <><span style={{ width: 14, height: 14, border: "2px solid rgba(13,34,68,.3)", borderTopColor: NAVY, borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Posting…</>
            ) : (
              <><PlusIcon /> Submit Bounty Request</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bounty Card ────────────────────────────────────────────── */
function BountyCard({ bounty, highlighted }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const pct = bounty.maxProposals > 0
    ? Math.round((bounty.proposals / bounty.maxProposals) * 100)
    : 0;

  // Scroll into view + flash if highlighted
  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  const handleBid = async () => {
    try { await incrementProposals(bounty.id); } catch { /* silent */ }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: highlighted ? "rgba(184,150,62,.05)" : "#fff",
        border: `.5px solid ${highlighted ? GOLD : hovered ? GOLD : "#e5ddd0"}`,
        marginBottom: 16,
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: highlighted
          ? `0 0 0 3px rgba(184,150,62,.25), 0 14px 36px rgba(13,34,68,.10)`
          : hovered
            ? "0 14px 36px rgba(13,34,68,.10)"
            : "none",
        transition: "border-color .22s, transform .22s, box-shadow .22s",
      }}
    >
      <div style={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between" }}>
        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ background: NAVY, padding: "3px 10px" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                {bounty.university}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#aaa", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
              {bounty.department}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: hovered ? GOLD : NAVY, lineHeight: 1.35, marginBottom: 10, transition: "color .15s" }}>
            {bounty.title}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", fontWeight: 700, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <UserIcon /> Posted by <span style={{ color: NAVY, marginLeft: 3 }}>{bounty.postedBy}</span>
            </span>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ChatIcon /> <span style={{ color: GOLD }}>{bounty.proposals} proposals</span>
            </span>
            <span>·</span>
            <span>{bounty.createdAt?.toDate ? timeAgo(bounty.createdAt.toDate()) : "recently"}</span>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>
              Bounty Reward
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 14, color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>₦</span>
              {bounty.rewardFmt?.replace("₦", "") ?? Number(bounty.reward).toLocaleString("en-NG")}
            </div>
          </div>

          {bounty.status === "open" ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,.07)", border: ".5px solid rgba(239,68,68,.22)", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "5px 12px", letterSpacing: ".06em", fontFamily: "'Lato',sans-serif" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
              <ClockIcon /> {bounty.deadlineLabel || bounty.deadline || "Open"}
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(22,163,74,.07)", border: ".5px solid rgba(22,163,74,.22)", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "5px 12px", letterSpacing: ".06em", fontFamily: "'Lato',sans-serif" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <CheckIcon /> Fulfilled
            </div>
          )}

          <button
            disabled={bounty.status === "fulfilled"}
            onClick={bounty.status === "open" ? handleBid : undefined}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px",
              background: bounty.status === "fulfilled" ? "transparent" : NAVY,
              color: bounty.status === "fulfilled" ? "#ccc" : "#fff",
              border: bounty.status === "fulfilled" ? ".5px solid #e5ddd0" : "none",
              fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
              fontFamily: "'Lato',sans-serif",
              cursor: bounty.status === "fulfilled" ? "default" : "pointer",
              opacity: bounty.status === "fulfilled" ? .45 : 1,
              transition: "background .15s",
            }}
            onMouseEnter={e => { if (bounty.status === "open") e.currentTarget.style.background = "#1a3a6e"; }}
            onMouseLeave={e => { if (bounty.status === "open") e.currentTarget.style.background = NAVY; }}
          >
            {bounty.status === "fulfilled" ? "Fulfilled" : <>Bid on Bounty <ArrowUpRightIcon /></>}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: ".5px solid #f0ebe0", padding: "12px 24px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", background: "#f9f6f1" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(bounty.tags || []).map(tag => (
            <span key={tag} style={{ display: "inline-block", background: CREAM, border: ".5px solid rgba(184,150,62,.3)", color: GOLD, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 9px", fontFamily: "'Lato',sans-serif" }}>
              {tag}
            </span>
          ))}
        </div>
        {bounty.maxProposals > 0 && (
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 9, color: "#aaa", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: ".06em", marginBottom: 4 }}>
              {bounty.proposals}/{bounty.maxProposals} proposal slots
            </div>
            <div style={{ height: 3, background: "#e5ddd0" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: GOLD, transition: "width .4s" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = (Date.now() - date) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AcademicBountyBoardClient() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [modal, setModal] = useState(false);
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get("highlight") || null;

  /* Auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  /* Live bounties */
  useEffect(() => {
    const unsub = subscribeToBounties((list) => {
      setBounties(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = [...bounties];
    if (filter !== "all") list = list.filter(b => b.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.university?.toLowerCase().includes(q) ||
        b.department?.toLowerCase().includes(q)
      );
    }
    if (sort === "reward") list.sort((a, b) => (b.reward ?? 0) - (a.reward ?? 0));
    if (sort === "proposals") list.sort((a, b) => (b.proposals ?? 0) - (a.proposals ?? 0));
    return list;
  }, [bounties, filter, search, sort]);

  /* Stats from live data */
  const totalRewards = bounties.filter(b => b.status === "open").reduce((s, b) => s + (b.reward || 0), 0);
  const activeCt = bounties.filter(b => b.status === "open").length;
  const totalProps = bounties.reduce((s, b) => s + (b.proposals || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .bb-select:focus { outline:none; border-color:${GOLD} !important; }
        .bb-input:focus  { outline:none; border-color:${GOLD} !important; }
        .bb-tab-btn { transition: background .16s, color .16s; }
      `}</style>

      <div style={{ fontFamily: "'Lato',sans-serif", background: BG, minHeight: "100vh", paddingBottom: 80 }}>

        {/* ── HERO ── */}
        <section style={{
          backgroundColor: NAVY,
          backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px), radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)`,
          backgroundSize: "28px 28px, 14px 14px",
          backgroundPosition: "0 0, 7px 7px",
          padding: "52px 32px 0",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,.14)", border: "1px solid rgba(184,150,62,.3)", borderRadius: 999, padding: "7px 16px", marginBottom: 20 }}>
                <StarIcon />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>
                  Campus Economy Hub · LAN Library
                </span>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-.5px", margin: "0 0 6px" }}>Academic</h1>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-.5px", margin: "0 0 14px" }}>Bounty Board</h1>
              <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "clamp(16px,2vw,20px)", color: GOLD, marginBottom: 18 }}>
                | Post a request. Get it fulfilled.
              </p>
              <p style={{ fontSize: 14, color: "rgba(245,240,232,.65)", maxWidth: 480, lineHeight: 1.8, fontWeight: 300, marginBottom: 32 }}>
                Can't find a file? Post a paid academic request and let top campus sellers from across Africa create it for you. Browse open bounties, submit proposals, and earn.
              </p>
              <button
                onClick={() => setModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", transition: "background .18s" }}
                onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
                onMouseLeave={e => (e.currentTarget.style.background = GOLD)}
              >
                <PlusIcon /> Post a Bounty Request
              </button>
            </div>

            {/* Live stat cards */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 12, paddingTop: 8, alignItems: "flex-end" }}>
              {[
                { n: loading ? "…" : `₦${totalRewards.toLocaleString("en-NG")}`, l: "Total rewards posted" },
                { n: loading ? "…" : String(activeCt), l: "Active bounties live" },
                { n: loading ? "…" : String(totalProps), l: "Proposals submitted" },
              ].map(({ n, l }) => (
                <div key={l} style={{ background: "rgba(184,150,62,.12)", border: ".5px solid rgba(184,150,62,.25)", padding: "14px 20px", textAlign: "right", minWidth: 160 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>{n}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(184,150,62,.65)", fontFamily: "'Lato',sans-serif", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ borderTop: ".5px solid rgba(184,150,62,.2)", marginTop: 40, display: "flex", flexWrap: "wrap", maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
            {[
              { val: "2,400+", label: "Verified Sellers" },
              { val: "94%", label: "Fulfilment Rate" },
              { val: "48hrs", label: "Avg. Delivery" },
              { val: "200+", label: "Institutions" },
            ].map(({ val, label }) => (
              <div key={label} style={{ flex: "1 1 100px", padding: "20px 24px", borderRight: ".5px solid rgba(184,150,62,.12)" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(184,150,62,.65)", marginTop: 3, fontFamily: "'Lato',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTROLS ── */}
        <div style={{ maxWidth: 1100, margin: "32px auto 0", padding: "0 24px" }}>

          {/* How It Works */}
          <HowItWorksSection />

          <div style={{ background: "#fff", border: ".5px solid #e5ddd0", padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 24 }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {[["all", "All Bounties"], ["open", "Live"], ["fulfilled", "Fulfilled"]].map(([key, label]) => (
                <button key={key} className="bb-tab-btn" onClick={() => setFilter(key)}
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "9px 20px", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", background: filter === key ? NAVY : "rgba(13,34,68,.06)", color: filter === key ? "#fff" : "#777" }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }}><SearchIcon /></span>
              <input className="bb-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search active bounties…"
                style={{ width: "100%", padding: "9px 12px 9px 34px", border: ".5px solid #e5ddd0", fontSize: 13, fontFamily: "'Lato',sans-serif", background: BG, color: NAVY, boxSizing: "border-box", outline: "none" }} />
            </div>
            {/* Sort */}
            <select className="bb-select" value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", padding: "9px 14px", border: ".5px solid #e5ddd0", fontFamily: "'Lato',sans-serif", color: NAVY, background: BG, cursor: "pointer" }}>
              <option value="newest">Newest First</option>
              <option value="reward">Highest Reward</option>
              <option value="proposals">Most Proposals</option>
            </select>
          </div>

          {/* Section heading */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
              Open Requests
            </p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: NAVY }}>
              Browse Active Bounties
            </h2>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "#fff", border: ".5px solid #e5ddd0", padding: "28px 24px", animation: "pulse 1.5s ease-in-out infinite" }}>
                  <div style={{ height: 12, background: "#f0ebe0", width: "60%", marginBottom: 12 }} />
                  <div style={{ height: 20, background: "#f0ebe0", width: "80%", marginBottom: 10 }} />
                  <div style={{ height: 10, background: "#f0ebe0", width: "40%" }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#fff", border: ".5px solid #e5ddd0", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>📭</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: NAVY, marginBottom: 6 }}>No bounties found</h3>
              <p style={{ fontSize: 13, color: "#aaa" }}>Try adjusting your filters or be the first to post a request.</p>
              <button onClick={() => setModal(true)} style={{ marginTop: 16, padding: "11px 24px", background: GOLD, color: NAVY, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                Post the First Bounty
              </button>
            </div>
          ) : (
            filtered.map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                highlighted={bounty.id === highlightId}
              />
            ))
          )}

          {/* Bottom CTA */}
          <div style={{ background: NAVY, backgroundImage: `radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px)`, backgroundSize: "22px 22px", padding: "40px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, marginTop: 32 }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                Are you a campus seller?
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 300, maxWidth: 420, lineHeight: 1.7 }}>
                Bid on open requests, deliver academic materials, and earn direct rewards from student requesters across Africa.
              </p>
            </div>
            <button
              onClick={() => setFilter("open")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: GOLD, color: NAVY, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
              onMouseLeave={e => (e.currentTarget.style.background = GOLD)}
            >
              <SendIcon /> Browse Open Requests
            </button>
          </div>
        </div>
      </div>

      {modal && <CreateModal onClose={() => setModal(false)} user={user} />}
    </>
  );
}