"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, MessageSquare, Send, Search, BookOpen, GraduationCap,
  ChevronRight, Sparkles, Plus, X, Circle, Wifi, Activity,
  Hash, Lock, Globe, ArrowLeft, MoreHorizontal, Smile,
  Paperclip, Phone, Video, Info, Bell, BellOff, UserPlus,
  LogOut, Settings, Star, BookMarked, Flame,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  doc, getDoc, collection, query, where, getDocs,
  orderBy, limit, addDoc, onSnapshot, serverTimestamp,
  updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Navbar from "@/components/NavBar";

/* ─── colour tokens (identical to dashboard) ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── helpers ─── */
const avatarPalettes = [
  { bg: NAVY,      text: GOLDD },
  { bg: "#1a3a5c", text: CREAM },
  { bg: "#2c1810", text: GOLDD },
  { bg: "#1a2c1a", text: "#a8d5a2" },
  { bg: "#2c1a2c", text: GOLDD },
  { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette  = (name = "?") => avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
const getInitials = (name = "?") => {
  const p = name.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const formatTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};
const formatMsgTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ─── Avatar ─── */
function Avatar({ name, photo, size = 36, border = false, online = false }) {
  const palette  = getPalette(name || "?");
  const initials = getInitials(name || "?");
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photo ? (
        <img src={photo} alt={name}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
            border: border ? `1.5px solid ${GOLD}` : "none" }}
          onError={e => e.target.style.display = "none"} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: palette.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: border ? `1.5px solid rgba(184,150,62,.3)` : "none" }}>
          <span style={{ color: palette.text, fontSize: size * 0.33,
            fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{initials}</span>
        </div>
      )}
      {online && (
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9,
          borderRadius: "50%", background: "#16a34a", border: "1.5px solid #fff" }} />
      )}
    </div>
  );
}

/* ─── Online Student Row (matching dashboard style) ─── */
function StudentRow({ student, rank, onClick, isSelected }) {
  const rankColors = ["#b8963e", "#aaa", "#cd7f32"];
  const rankBg = rank < 3
    ? `rgba(${rank === 0 ? "184,150,62" : rank === 1 ? "170,170,170" : "205,127,50"},.1)`
    : "rgba(13,34,68,.04)";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 16px", borderBottom: "0.5px solid #f0ebe0",
        cursor: "pointer", transition: "background .15s",
        background: isSelected ? CREAM : "#fff",
        borderLeft: isSelected ? `2px solid ${GOLD}` : "2px solid transparent",
      }}
    >
      {/* rank badge */}
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: rankBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: rankColors[rank] || "#888",
          fontFamily: "'Lato',sans-serif" }}>{rank + 1}</span>
      </div>

      <Avatar name={student.name} photo={student.photoURL} size={34} border online />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 1px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "'Lato',sans-serif" }}>{student.name}</p>
        <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {student.university || "Student"}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
          <span style={{ fontSize: 9, color: "#16a34a", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Active</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{ fontSize: 8, fontWeight: 700, color: NAVY, background: CREAM,
            border: `0.5px solid rgba(184,150,62,.3)`, padding: "2px 8px",
            cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: ".06em",
            textTransform: "uppercase" }}>
          Chat
        </button>
      </div>
    </div>
  );
}

/* ─── Group Room Row ─── */
function GroupRow({ group, onClick, isSelected, unread = 0 }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 16px", borderBottom: "0.5px solid #f0ebe0",
        cursor: "pointer", transition: "background .15s",
        background: isSelected ? CREAM : "#fff",
        borderLeft: isSelected ? `2px solid ${GOLD}` : "2px solid transparent",
      }}
    >
      <div style={{ width: 36, height: 36, background: NAVY, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: isSelected ? `1.5px solid ${GOLD}` : "1.5px solid rgba(13,34,68,.1)" }}>
        <Hash size={14} style={{ color: GOLDD }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 2px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "'Lato',sans-serif" }}>{group.name}</p>
        <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {group.lastMessage || `${group.members?.length || 0} members`}
        </p>
      </div>
      {unread > 0 && (
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: GOLD,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: NAVY }}>{unread}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Chat Bubble ─── */
function ChatBubble({ msg, isOwn, showAvatar }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end",
      flexDirection: isOwn ? "row-reverse" : "row", marginBottom: 12 }}>
      {!isOwn && showAvatar && (
        <Avatar name={msg.senderName || "?"} photo={msg.senderPhoto} size={26} />
      )}
      {!isOwn && !showAvatar && <div style={{ width: 26 }} />}

      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start", gap: 2 }}>
        {!isOwn && showAvatar && (
          <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: ".06em",
            fontFamily: "'Lato',sans-serif", textTransform: "uppercase", marginLeft: 2 }}>
            {msg.senderName}
          </span>
        )}
        <div style={{
          background: isOwn ? NAVY : "#fff",
          color: isOwn ? "#fff" : NAVY,
          padding: "9px 13px",
          border: isOwn ? "none" : "0.5px solid #e5ddd0",
          fontSize: 13,
          fontFamily: "'Lato',sans-serif",
          lineHeight: 1.55,
          borderRadius: 0,
          borderTopLeftRadius: !isOwn && showAvatar ? 0 : 0,
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
          {formatMsgTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function StudyGroupsClient() {
  const router = useRouter();
  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeStudents, setActiveStudents] = useState([]);
  const [groups,         setGroups]         = useState([]);
  const [selectedRoom,   setSelectedRoom]   = useState(null); // { type: 'dm'|'group', id, name, photo?, membersCount? }
  const [messages,       setMessages]       = useState([]);
  const [msgInput,       setMsgInput]       = useState("");
  const [sending,        setSending]        = useState(false);
  const [search,         setSearch]         = useState("");
  const [leftTab,        setLeftTab]        = useState("students"); // 'students' | 'groups'
  const [showNewGroup,   setShowNewGroup]   = useState(false);
  const [newGroupName,   setNewGroupName]   = useState("");
  const [creatingGroup,  setCreatingGroup]  = useState(false);
  const [mobileView,     setMobileView]     = useState("list"); // 'list' | 'chat'

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const unsubMsgs      = useRef(null);

  /* ── auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/auth/signin"); return; }
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (!snap.exists()) { router.push("/auth/signin"); return; }
        const data = snap.data();
        setUser({
          uid: u.uid,
          name: data.displayName || `${data.firstName || ""} ${data.surname || ""}`.trim() || "Student",
          photo: data.photoBase64 || data.photoURL || null,
          university: data.university || data.institution || "",
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [router]);

  /* ── fetch students ── */
  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      try {
        const sq = query(collection(db, "users"), where("isStudent", "==", true), limit(50));
        const ss = await getDocs(sq);
        const list = ss.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.displayName || `${data.firstName || ""} ${data.surname || ""}`.trim() || "Student",
              photoURL: data.photoBase64 || data.photoURL || null,
              university: data.university || data.institution || "",
              lastActive: data.lastActive || data.updatedAt || null,
            };
          })
          .filter(s => s.name && s.name !== "Student" && s.id !== user.uid)
          .slice(0, 30);
        setActiveStudents(list);
      } catch (e) { console.error(e); }
    };
    fetchStudents();
  }, [user]);

  /* ── fetch / listen groups ── */
  useEffect(() => {
  if (!user) return;
  const q = query(
    collection(db, "study_groups"),
    orderBy("updatedAt", "desc"),
    limit(30)
  );
  const unsub = onSnapshot(q, 
    snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    err => {
      console.error("Groups listener error:", err.code, err.message);
    }
  );
  return () => unsub();
}, [user]);

  /* ── listen to messages ── */
  useEffect(() => {
    if (unsubMsgs.current) { unsubMsgs.current(); unsubMsgs.current = null; }
    setMessages([]);
    if (!selectedRoom) return;

    const colPath = selectedRoom.type === "dm"
      ? `dm_messages/${[user.uid, selectedRoom.id].sort().join("_")}/messages`
      : `study_groups/${selectedRoom.id}/messages`;

    const q = query(collection(db, colPath), orderBy("createdAt", "asc"), limit(80));
    unsubMsgs.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { if (unsubMsgs.current) unsubMsgs.current(); };
  }, [selectedRoom, user]);

  /* ── auto scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── send message ── */
  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedRoom || sending) return;
    setSending(true);
    const text = msgInput.trim();
    setMsgInput("");
    try {
      const colPath = selectedRoom.type === "dm"
        ? `dm_messages/${[user.uid, selectedRoom.id].sort().join("_")}/messages`
        : `study_groups/${selectedRoom.id}/messages`;

      await addDoc(collection(db, colPath), {
        text,
        senderId: user.uid,
        senderName: user.name,
        senderPhoto: user.photo || null,
        createdAt: serverTimestamp(),
      });

      /* update group last message */
      if (selectedRoom.type === "group") {
        await updateDoc(doc(db, "study_groups", selectedRoom.id), {
          lastMessage: text.length > 40 ? text.slice(0, 40) + "…" : text,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  /* ── create group ── */
  const createGroup = async () => {
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const ref = await addDoc(collection(db, "study_groups"), {
        name: newGroupName.trim(),
        createdBy: user.uid,
        members: [user.uid],
        lastMessage: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowNewGroup(false);
      setNewGroupName("");
      setSelectedRoom({ type: "group", id: ref.id, name: newGroupName.trim() });
      setMobileView("chat");
    } catch (e) { console.error(e); }
    finally { setCreatingGroup(false); }
  };

  /* ── join group ── */
  const joinGroup = async (groupId) => {
    try {
      await updateDoc(doc(db, "study_groups", groupId), {
        members: arrayUnion(user.uid),
      });
    } catch {}
  };

  const openDM = (student) => {
    setSelectedRoom({ type: "dm", id: student.id, name: student.name, photo: student.photoURL });
    setMobileView("chat");
  };

  const openGroup = async (group) => {
    await joinGroup(group.id);
    setSelectedRoom({ type: "group", id: group.id, name: group.name, membersCount: group.members?.length });
    setMobileView("chat");
  };

  /* ── filtered lists ── */
  const filteredStudents = activeStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.university || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, border: `3px solid ${GOLD}`, borderTopColor: "transparent",
          borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: NAVY }}>Loading Study Groups…</p>
      </div>
    </div>
  );

  const displayName = user?.name || "Scholar";

  /* ════════ RENDER ════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sg-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
        .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .sbar-none::-webkit-scrollbar { display: none; }
        .thin-scroll::-webkit-scrollbar { width: 4px; }
        .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        .thin-scroll::-webkit-scrollbar-thumb { background: #e5ddd0; border-radius: 2px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        .anim-up { animation: slideUp .35s cubic-bezier(.4,0,.2,1) both; }
        .pulse-dot { animation: pulse2 2s infinite; }

        .student-row-hover:hover { background: ${CREAM} !important; }
        .send-btn:hover { background: ${GOLDD} !important; }
        .tab-pill { padding: 7px 18px; font-size: 11px; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; font-family: 'Lato',sans-serif; cursor: pointer; border: none;
          transition: all .15s; }
        .tab-pill.active { background: ${NAVY}; color: #fff; }
        .tab-pill.inactive { background: transparent; color: #aaa; }
        .tab-pill.inactive:hover { color: ${NAVY}; background: ${CREAM}; }

        /* Mobile responsiveness */
        .sg-layout { display: flex; height: calc(100vh - 64px); }
        .sg-left  { width: 340px; flex-shrink: 0; border-right: 0.5px solid #e5ddd0;
          background: #fff; display: flex; flex-direction: column; }
        .sg-chat  { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        @media (max-width: 768px) {
          .sg-left  { width: 100%; }
          .sg-chat  { width: 100%; }
          .mob-hide { display: none !important; }
          .mob-show { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mob-show { display: none !important; }
          .sg-left  { display: flex !important; }
          .sg-chat  { display: flex !important; }
        }

        .msg-input { width: 100%; border: none; outline: none; background: transparent;
          font-size: 13px; color: ${NAVY}; font-family: 'Lato',sans-serif; resize: none;
          line-height: 1.5; max-height: 100px; }
        .msg-input::placeholder { color: #bbb; }

        .section-label { font-size: 10px; font-weight: 700; letter-spacing: .2em;
          text-transform: uppercase; color: ${GOLD}; font-family: 'Lato',sans-serif; }
      `}</style>

      <div className="sg-root">
        <Navbar />

        <div className="sg-layout">

          {/* ══ LEFT PANEL ══ */}
          <aside className={`sg-left ${mobileView === "chat" ? "mob-hide" : ""}`}>

            {/* Header */}
            <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 18px" }}>
              <p className="section-label" style={{ color: "rgba(184,150,62,.75)", marginBottom: 6 }}>Community</p>
              <h1 className="lan-serif" style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 4 }}>
                Study Groups
              </h1>
              <p style={{ fontSize: 11, color: "rgba(245,240,232,.5)", fontFamily: "'Lato',sans-serif" }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>●</span> {activeStudents.length} students online
              </p>
            </div>

            {/* Search */}
            <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #f0ebe0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: CREAM,
                border: "0.5px solid #e5ddd0", padding: "8px 12px" }}>
                <Search size={13} style={{ color: "#bbb", flexShrink: 0 }} />
                <input
                  type="text" placeholder="Search students or groups…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ border: "none", outline: "none", background: "transparent",
                    fontSize: 12, color: NAVY, fontFamily: "'Lato',sans-serif", width: "100%" }}
                />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 0 }}><X size={12} /></button>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "0.5px solid #e5ddd0" }}>
              <button className={`tab-pill ${leftTab === "students" ? "active" : "inactive"}`}
                onClick={() => setLeftTab("students")} style={{ flex: 1 }}>
                <Users size={11} style={{ display: "inline", marginRight: 5 }} />Students
              </button>
              <button className={`tab-pill ${leftTab === "groups" ? "active" : "inactive"}`}
                onClick={() => setLeftTab("groups")} style={{ flex: 1 }}>
                <Hash size={11} style={{ display: "inline", marginRight: 5 }} />Groups
              </button>
            </div>

            {/* List */}
            <div className="thin-scroll" style={{ flex: 1, overflowY: "auto" }}>

              {/* ── Students ── */}
              {leftTab === "students" && (
                <div className="anim-up">
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                      <Users size={32} style={{ color: "#e5ddd0", margin: "0 auto 10px" }} />
                      <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                        {search ? "No students found" : "No students online yet"}
                      </p>
                    </div>
                  ) : filteredStudents.map((s, i) => (
                    <StudentRow
                      key={s.id} student={s} rank={i}
                      onClick={() => openDM(s)}
                      isSelected={selectedRoom?.type === "dm" && selectedRoom?.id === s.id}
                    />
                  ))}
                </div>
              )}

              {/* ── Groups ── */}
              {leftTab === "groups" && (
                <div className="anim-up">
                  {/* Create group button */}
                  <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #f0ebe0" }}>
                    {showNewGroup ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          autoFocus
                          placeholder="Group name…"
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") { setShowNewGroup(false); setNewGroupName(""); } }}
                          style={{ flex: 1, border: "0.5px solid #e5ddd0", padding: "7px 10px",
                            fontSize: 12, fontFamily: "'Lato',sans-serif", color: NAVY,
                            background: CREAM, outline: "none" }}
                        />
                        <button onClick={createGroup} disabled={creatingGroup || !newGroupName.trim()}
                          style={{ padding: "7px 14px", background: NAVY, color: "#fff", border: "none",
                            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif",
                            opacity: creatingGroup ? .5 : 1 }}>
                          {creatingGroup ? "…" : "Create"}
                        </button>
                        <button onClick={() => { setShowNewGroup(false); setNewGroupName(""); }}
                          style={{ padding: "7px 10px", background: "none", border: "0.5px solid #e5ddd0",
                            cursor: "pointer", color: "#aaa" }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowNewGroup(true)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 6, padding: "8px", background: CREAM, border: `0.5px dashed rgba(184,150,62,.4)`,
                          cursor: "pointer", fontSize: 11, fontWeight: 700, color: GOLD,
                          fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        <Plus size={12} /> New Study Group
                      </button>
                    )}
                  </div>

                  {filteredGroups.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                      <Hash size={32} style={{ color: "#e5ddd0", margin: "0 auto 10px" }} />
                      <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                        {search ? "No groups found" : "No groups yet — create one!"}
                      </p>
                    </div>
                  ) : filteredGroups.map(g => (
                    <GroupRow
                      key={g.id} group={g}
                      onClick={() => openGroup(g)}
                      isSelected={selectedRoom?.type === "group" && selectedRoom?.id === g.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* User footer */}
            <div style={{ borderTop: "0.5px solid #f0ebe0", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={user?.name} photo={user?.photo} size={32} border online />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: NAVY, margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'Lato',sans-serif" }}>{displayName}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: ".1em",
                    textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>Online</span>
                </div>
              </div>
              <Link href="/my-account">
                <button style={{ padding: "5px", background: "none", border: "none", cursor: "pointer", color: "#bbb" }}>
                  <Settings size={14} />
                </button>
              </Link>
            </div>
          </aside>

          {/* ══ CHAT PANEL ══ */}
          <section className={`sg-chat ${mobileView === "list" ? "mob-hide" : ""}`}
            style={{ background: BG }}>

            {!selectedRoom ? (
              /* Empty state */
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 16, padding: 32, textAlign: "center" }}>
                <div style={{ width: 72, height: 72, background: "#fff", border: `0.5px solid #e5ddd0`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={28} style={{ color: "#e5ddd0" }} />
                </div>
                <div>
                  <p className="section-label" style={{ marginBottom: 6 }}>Study Groups</p>
                  <h2 className="lan-serif" style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                    Start a Conversation
                  </h2>
                  <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", maxWidth: 320, lineHeight: 1.65 }}>
                    Select a student to message directly, or join a study group to chat with multiple peers.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={() => setLeftTab("students")}
                    style={{ padding: "10px 20px", background: NAVY, color: "#fff", border: "none",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif",
                      display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={13} /> Message a Student
                  </button>
                  <button onClick={() => { setLeftTab("groups"); setShowNewGroup(true); }}
                    style={{ padding: "10px 20px", background: "transparent", color: NAVY,
                      border: `0.5px solid ${NAVY}`, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={13} /> Create Study Group
                  </button>
                </div>

                {/* Quick: Active Students Preview */}
                {activeStudents.length > 0 && (
                  <div style={{ width: "100%", maxWidth: 460, background: "#fff",
                    border: "0.5px solid #e5ddd0", padding: "18px 20px", marginTop: 8 }}>
                    <p className="section-label" style={{ marginBottom: 12 }}>Online Now</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {activeStudents.slice(0, 8).map(s => (
                        <button key={s.id} onClick={() => openDM(s)}
                          title={s.name}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <Avatar name={s.name} photo={s.photoURL} size={40} border online />
                          <span style={{ fontSize: 9, fontWeight: 700, color: NAVY,
                            fontFamily: "'Lato',sans-serif", maxWidth: 48,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active chat */
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }} className="anim-up">

                {/* Chat header */}
                <div style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0",
                  padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

                  {/* Mobile back */}
                  <button className="mob-show" onClick={() => { setMobileView("list"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}>
                    <ArrowLeft size={18} />
                  </button>

                  {selectedRoom.type === "dm" ? (
                    <Avatar name={selectedRoom.name} photo={selectedRoom.photo} size={36} border online />
                  ) : (
                    <div style={{ width: 36, height: 36, background: NAVY,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Hash size={16} style={{ color: GOLDD }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0,
                      fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedRoom.name}
                    </p>
                    <p style={{ fontSize: 10, color: selectedRoom.type === "dm" ? "#16a34a" : "#aaa",
                      margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                      {selectedRoom.type === "dm"
                        ? "● Active now"
                        : `${selectedRoom.membersCount || ""} members · Study Group`}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {selectedRoom.type === "dm" && (
                      <>
                        <button style={{ width: 32, height: 32, background: CREAM,
                          border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center",
                          justifyContent: "center", cursor: "pointer", color: NAVY }}>
                          <Phone size={13} />
                        </button>
                        <button style={{ width: 32, height: 32, background: CREAM,
                          border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center",
                          justifyContent: "center", cursor: "pointer", color: NAVY }}>
                          <Video size={13} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelectedRoom(null)}
                      style={{ width: 32, height: 32, background: CREAM,
                        border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", color: "#aaa" }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Messages area */}
                <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
                  {messages.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", height: "100%", gap: 10, opacity: .5 }}>
                      <MessageSquare size={28} style={{ color: "#bbb" }} />
                      <p style={{ fontSize: 12, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
                        No messages yet — say hello!
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => {
                        const isOwn = msg.senderId === user.uid;
                        const showAvatar = !isOwn &&
                          (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
                        return (
                          <ChatBubble key={msg.id} msg={msg} isOwn={isOwn} showAvatar={showAvatar} />
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input area */}
                <div style={{ background: "#fff", borderTop: "0.5px solid #e5ddd0",
                  padding: "12px 16px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10,
                    background: CREAM, border: "0.5px solid #e5ddd0", padding: "10px 14px" }}>
                    <textarea
                      ref={inputRef}
                      className="msg-input"
                      placeholder={`Message ${selectedRoom.name}…`}
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                      rows={1}
                      style={{ width: "100%", border: "none", outline: "none", background: "transparent",
                        fontSize: 13, color: NAVY, fontFamily: "'Lato',sans-serif", resize: "none",
                        lineHeight: 1.5, maxHeight: 100 }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!msgInput.trim() || sending}
                      className="send-btn"
                      style={{ width: 36, height: 36, background: msgInput.trim() ? GOLD : "#e5ddd0",
                        border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: msgInput.trim() ? "pointer" : "not-allowed",
                        flexShrink: 0, transition: "background .15s" }}>
                      <Send size={14} style={{ color: msgInput.trim() ? NAVY : "#bbb" }} />
                    </button>
                  </div>
                  <p style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif",
                    marginTop: 6, textAlign: "center" }}>
                    Press Enter to send · Shift+Enter for new line
                  </p>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}