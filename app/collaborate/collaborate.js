"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope, Code2, Scale, Zap, Palette, FlaskConical,
  BookOpen, TrendingUp, Globe2, Atom, Music, Calculator,
  MessageSquare, Send, Users, Search, X, ArrowLeft,
  ChevronRight, Sparkles, Hash, Plus, Wifi, Activity,
  GraduationCap, Star, Clock, Crown, Flame,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  doc, getDoc, collection, query, where, getDocs,
  orderBy, limit, addDoc, onSnapshot, serverTimestamp,
  deleteDoc, setDoc, updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/components/NavBar";

/* ─── Palette ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#ede8df";

/* ─── Hub Definitions ─── */
const HUBS = [
  {
    id: "medicine",
    name: "Medicine & Health",
    short: "MBBS / Medicine",
    icon: Stethoscope,
    color: "#c0392b",
    accent: "#fde8e8",
    tag: "Clinical Sciences",
    description: "MBBS, Nursing, Pharmacy, Public Health",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    short: "CS / Software Eng",
    icon: Code2,
    color: "#1a6b3a",
    accent: "#e6f4ed",
    tag: "Technology",
    description: "Programming, AI, Data Science, Networks",
  },
  {
    id: "law",
    name: "Law & Legal Studies",
    short: "LLB / Law",
    icon: Scale,
    color: "#7b341e",
    accent: "#fdf0e8",
    tag: "Jurisprudence",
    description: "Constitutional, Corporate, Criminal Law",
  },
  {
    id: "engineering",
    name: "Engineering",
    short: "Civil / Mech / Elec",
    icon: Zap,
    color: "#1a3a6b",
    accent: "#e8eef8",
    tag: "Applied Sciences",
    description: "Civil, Mechanical, Electrical, Chemical",
  },
  {
    id: "arts",
    name: "Arts & Humanities",
    short: "Arts / Literature",
    icon: Palette,
    color: "#6b2d8b",
    accent: "#f3e8fa",
    tag: "Creative Arts",
    description: "Literature, History, Philosophy, Linguistics",
  },
  {
    id: "sciences",
    name: "Pure Sciences",
    short: "Physics / Chemistry",
    icon: FlaskConical,
    color: "#0a5c6b",
    accent: "#e8f6f8",
    tag: "Natural Sciences",
    description: "Physics, Chemistry, Biology, Mathematics",
  },
  {
    id: "business",
    name: "Business & Economics",
    short: "MBA / Economics",
    icon: TrendingUp,
    color: "#3d6b1a",
    accent: "#edf4e8",
    tag: "Commerce",
    description: "Accounting, Finance, Marketing, Management",
  },
  {
    id: "social-sciences",
    name: "Social Sciences",
    short: "Sociology / Psych",
    icon: Globe2,
    color: "#6b4c1a",
    accent: "#f8f0e3",
    tag: "Human Studies",
    description: "Psychology, Sociology, Political Science",
  },
  {
    id: "architecture",
    name: "Architecture & Design",
    short: "Architecture",
    icon: BookOpen,
    color: "#1a4a6b",
    accent: "#e8f0f8",
    tag: "Built Environment",
    description: "Architecture, Urban Planning, Interior Design",
  },
  {
    id: "mathematics",
    name: "Mathematics & Stats",
    short: "Maths / Statistics",
    icon: Calculator,
    color: "#5c1a6b",
    accent: "#f3e8fa",
    tag: "Quantitative",
    description: "Pure Math, Statistics, Actuarial Science",
  },
  {
    id: "education",
    name: "Education",
    short: "B.Ed / Teaching",
    icon: GraduationCap,
    color: "#6b1a1a",
    accent: "#f8e8e8",
    tag: "Pedagogy",
    description: "Teaching, Curriculum, Educational Psychology",
  },
  {
    id: "agriculture",
    name: "Agriculture & Env",
    short: "Agric Science",
    icon: Atom,
    color: "#2d6b1a",
    accent: "#eaf4e8",
    tag: "Agronomy",
    description: "Agronomy, Soil Science, Environmental Mgmt",
  },
];

/* ─── Helpers ─── */
const getPalette = (name = "?") => {
  const palettes = [
    { bg: NAVY, text: GOLDD },
    { bg: "#1a3a5c", text: CREAM },
    { bg: "#2c1810", text: GOLDD },
    { bg: "#1a2c1a", text: "#a8d5a2" },
  ];
  return palettes[name.charCodeAt(0) % palettes.length];
};
const getInitials = (name = "?") => {
  const p = name.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const formatMsgTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ─── Avatar ─── */
function Avatar({ name, photo, size = 32, online = false }) {
  const palette = getPalette(name || "?");
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photo ? (
        <img src={photo} alt={name}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
          onError={e => e.target.style.display = "none"} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: palette.bg,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: palette.text, fontSize: size * 0.34, fontWeight: 700,
            fontFamily: "'Playfair Display',serif" }}>{getInitials(name || "?")}</span>
        </div>
      )}
      {online && (
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8,
          borderRadius: "50%", background: "#16a34a", border: "1.5px solid #fff" }} />
      )}
    </div>
  );
}

/* ─── Hub Card ─── */
function HubCard({ hub, liveCount, myHubs, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon = hub.icon;
  const isMine = myHubs.includes(hub.id);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fff" : "#fff",
        border: `1px solid ${hovered ? GOLD : "#e5ddd0"}`,
        cursor: "pointer",
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? `0 8px 32px rgba(13,34,68,.12)` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: hovered
          ? `linear-gradient(90deg, ${hub.color}, ${GOLD})`
          : `linear-gradient(90deg, ${hub.color}44, transparent)`,
        transition: "all .2s",
      }} />

      {isMine && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: NAVY, padding: "2px 7px",
          fontSize: 9, fontWeight: 700, color: GOLD,
          fontFamily: "'Lato',sans-serif", letterSpacing: ".08em",
        }}>MY HUB</div>
      )}

      <div style={{ padding: "18px 16px 16px" }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, background: hub.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12, border: `1px solid ${hub.color}22`,
        }}>
          <Icon size={20} style={{ color: hub.color }} />
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 14, fontWeight: 700, color: NAVY,
          margin: "0 0 3px", lineHeight: 1.3,
        }}>{hub.name}</h3>

        <p style={{
          fontSize: 10, color: "#aaa", margin: "0 0 10px",
          fontFamily: "'Lato',sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{hub.description}</p>

        {/* Tag + Live */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: hub.color,
            background: hub.accent, padding: "2px 8px",
            fontFamily: "'Lato',sans-serif", letterSpacing: ".08em",
            textTransform: "uppercase",
          }}>{hub.tag}</span>

          {liveCount > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#16a34a",
                animation: "pulse2 2s infinite",
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#16a34a",
                fontFamily: "'Lato',sans-serif",
              }}>{liveCount} live</span>
            </div>
          ) : (
            <span style={{ fontSize: 10, color: "#ccc", fontFamily: "'Lato',sans-serif" }}>0 active</span>
          )}
        </div>
      </div>

      {/* Hover enter arrow */}
      <div style={{
        position: "absolute", bottom: 12, right: 14,
        opacity: hovered ? 1 : 0, transition: "opacity .2s",
      }}>
        <ChevronRight size={16} style={{ color: GOLD }} />
      </div>
    </div>
  );
}

/* ─── Chat Bubble ─── */
function ChatBubble({ msg, isOwn, showAvatar }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-end",
      flexDirection: isOwn ? "row-reverse" : "row", marginBottom: 10,
    }}>
      {!isOwn && showAvatar && <Avatar name={msg.senderName || "?"} photo={msg.senderPhoto} size={24} />}
      {!isOwn && !showAvatar && <div style={{ width: 24 }} />}
      <div style={{
        maxWidth: "70%", display: "flex", flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start", gap: 2,
      }}>
        {!isOwn && showAvatar && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: GOLD,
            fontFamily: "'Lato',sans-serif", letterSpacing: ".06em",
            textTransform: "uppercase", marginLeft: 2,
          }}>{msg.senderName}</span>
        )}
        <div style={{
          background: isOwn ? NAVY : "#fff",
          color: isOwn ? "#fff" : NAVY,
          padding: "8px 12px",
          border: isOwn ? "none" : "0.5px solid #e5ddd0",
          fontSize: 13, fontFamily: "'Lato',sans-serif", lineHeight: 1.5,
        }}>{msg.text}</div>
        <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
          {formatMsgTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function GlobalHubsClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeHub, setActiveHub] = useState(null); // hub object
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [liveCounts, setLiveCounts] = useState({}); // hubId -> count
  const [hubPresence, setHubPresence] = useState([]); // users in active hub
  const [mobileView, setMobileView] = useState("grid"); // "grid" | "chat"
  const [myHubs, setMyHubs] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubMsgs = useRef(null);
  const unsubPresence = useRef(null);
  const unsubLive = useRef(null);
  const presenceRef = useRef(null);

  /* ── Auth ── */
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
          major: data.major || data.department || "",
        });
        // Detect "my hubs" from purchased books categories
        const pb = data.purchasedBooks || {};
        const cats = Object.values(pb).map(b => (b.category || "").toLowerCase());
        const matched = HUBS.filter(h =>
          cats.some(c => c.includes(h.id.split("-")[0]))
        ).map(h => h.id);
        setMyHubs(matched.length ? matched : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [router]);

  /* ── Live counts across all hubs ── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "hub_presence"));
    unsubLive.current = onSnapshot(q, snap => {
      const counts = {};
      snap.docs.forEach(d => {
        const hubId = d.data().hubId;
        if (hubId) counts[hubId] = (counts[hubId] || 0) + 1;
      });
      setLiveCounts(counts);
    }, err => console.warn("hub_presence listener:", err.code));
    return () => unsubLive.current?.();
  }, [user]);

  /* ── Enter hub ── */
  const enterHub = async (hub) => {
    // Leave previous hub presence
    if (presenceRef.current) {
      try { await deleteDoc(presenceRef.current); } catch {}
      presenceRef.current = null;
    }
    unsubMsgs.current?.();
    unsubPresence.current?.();

    setActiveHub(hub);
    setMessages([]);
    setMobileView("chat");

    if (!user) return;

    // Add presence
    const pRef = doc(db, "hub_presence", `${hub.id}_${user.uid}`);
    presenceRef.current = pRef;
    try {
      await setDoc(pRef, {
        hubId: hub.id,
        userId: user.uid,
        userName: user.name,
        userPhoto: user.photo || null,
        joinedAt: serverTimestamp(),
      });
    } catch (e) { console.warn("presence write:", e); }

    // Listen to presence in hub
    const pq = query(collection(db, "hub_presence"), where("hubId", "==", hub.id));
    unsubPresence.current = onSnapshot(pq, snap => {
      setHubPresence(snap.docs.map(d => d.data()));
    });

    // Listen to messages
    const mq = query(
      collection(db, "hub_messages"),
      where("hubId", "==", hub.id),
      orderBy("createdAt", "asc"),
      limit(80)
    );
    unsubMsgs.current = onSnapshot(mq, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn("hub_messages:", err.code));
  };

  /* ── Leave hub on unmount ── */
  useEffect(() => {
    return () => {
      if (presenceRef.current) {
        deleteDoc(presenceRef.current).catch(() => {});
      }
      unsubMsgs.current?.();
      unsubPresence.current?.();
      unsubLive.current?.();
    };
  }, []);

  /* ── Also clean up when navigating away while in hub ── */
  useEffect(() => {
    if (!activeHub) return;
    return () => {
      if (presenceRef.current) {
        deleteDoc(presenceRef.current).catch(() => {});
      }
    };
  }, [activeHub]);

  /* ── Scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ── */
  const sendMessage = async () => {
    if (!msgInput.trim() || !activeHub || sending || !user) return;
    setSending(true);
    const text = msgInput.trim();
    setMsgInput("");
    try {
      await addDoc(collection(db, "hub_messages"), {
        hubId: activeHub.id,
        text,
        senderId: user.uid,
        senderName: user.name,
        senderPhoto: user.photo || null,
        createdAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  /* ── Back ── */
  const leaveHub = async () => {
    if (presenceRef.current) {
      try { await deleteDoc(presenceRef.current); } catch {}
      presenceRef.current = null;
    }
    unsubMsgs.current?.();
    unsubPresence.current?.();
    setActiveHub(null);
    setMessages([]);
    setHubPresence([]);
    setMobileView("grid");
  };

  const filteredHubs = HUBS.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.description.toLowerCase().includes(search.toLowerCase()) ||
    h.tag.toLowerCase().includes(search.toLowerCase())
  );

  const myHubList = filteredHubs.filter(h => myHubs.includes(h.id));
  const otherHubs = filteredHubs.filter(h => !myHubs.includes(h.id));
  const studyBuddyHubs = filteredHubs
    .filter(h => (liveCounts[h.id] || 0) > 1)
    .sort((a, b) => (liveCounts[b.id] || 0) - (liveCounts[a.id] || 0));

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, border: `3px solid ${GOLD}`, borderTopColor: "transparent",
          borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: NAVY }}>Loading Global Hubs…</p>
      </div>
    </div>
  );

  /* ════ RENDER ════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${BG};}
        .gh-root{font-family:'Lato',sans-serif;background:${BG};min-height:100vh;}
        .serif{font-family:'Playfair Display',Georgia,serif;}
        .thin-scroll::-webkit-scrollbar{width:3px;}
        .thin-scroll::-webkit-scrollbar-track{background:transparent;}
        .thin-scroll::-webkit-scrollbar-thumb{background:#e0d8cc;border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes goldGlow{0%,100%{box-shadow:0 0 0 0 rgba(184,150,62,.35)}50%{box-shadow:0 0 0 8px rgba(184,150,62,0)}}
        .anim-up{animation:slideUp .3s cubic-bezier(.4,0,.2,1) both;}
        .msg-input{width:100%;border:none;outline:none;background:transparent;font-size:13px;color:${NAVY};font-family:'Lato',sans-serif;resize:none;line-height:1.5;max-height:90px;}
        .msg-input::placeholder{color:#bbb;}
        .section-label{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};font-family:'Lato',sans-serif;}
        .hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
        @media(max-width:640px){.hub-grid{grid-template-columns:1fr 1fr;gap:10px;}}
        @media(max-width:400px){.hub-grid{grid-template-columns:1fr;}}
        .chat-panel{display:flex;flex-direction:column;height:calc(100vh - 64px);}
        @media(max-width:768px){
          .mob-grid{display:block!important;}
          .mob-chat{display:flex!important;}
        }
      `}</style>

      <div className="gh-root">
        <Navbar />

        {/* ══ GRID VIEW ══ */}
        {(!activeHub || mobileView === "grid") && (
          <div className="anim-up" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 60px" }}>

            {/* Hero */}
            <div style={{
              background: NAVY,
              backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
              backgroundSize: "24px 24px",
              padding: "36px 32px", marginBottom: 28,
              borderBottom: `2px solid ${GOLD}`,
            }}>
              <p className="section-label" style={{ color: "rgba(184,150,62,.8)", marginBottom: 8 }}>
                ✦ Academic Community
              </p>
              <h1 className="serif" style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 8 }}>
                Global Academic Hubs
              </h1>
              <p style={{ fontSize: 13, color: "rgba(245,240,232,.55)", fontFamily: "'Lato',sans-serif", maxWidth: 500 }}>
                Join discipline-specific study rooms. Connect with peers across faculties, share insights, and collaborate in real time.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
                {[
                  { icon: <Users size={12} />, label: `${Object.values(liveCounts).reduce((a, b) => a + b, 0)} students active` },
                  { icon: <Hash size={12} />, label: `${HUBS.length} subject hubs` },
                  { icon: <Wifi size={12} />, label: "Real-time chat" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GOLDD }}>{icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,240,232,.7)", fontFamily: "'Lato',sans-serif" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff",
                border: "0.5px solid #e5ddd0", padding: "10px 16px", maxWidth: 420 }}>
                <Search size={14} style={{ color: "#bbb" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search hubs by subject, department…"
                  style={{ border: "none", outline: "none", background: "transparent",
                    fontSize: 13, color: NAVY, fontFamily: "'Lato',sans-serif", width: "100%" }}
                />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><X size={12} /></button>}
              </div>
            </div>

            {/* Study Buddies Active */}
            {studyBuddyHubs.length > 0 && !search && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Flame size={16} style={{ color: GOLD }} />
                  <p className="section-label">Hot Right Now</p>
                  <div style={{ height: 1, flex: 1, background: "#e5ddd0" }} />
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {studyBuddyHubs.slice(0, 4).map(hub => {
                    const Icon = hub.icon;
                    return (
                      <button key={hub.id} onClick={() => enterHub(hub)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: "#fff", border: `1px solid ${GOLD}44`,
                          padding: "10px 16px", cursor: "pointer",
                          animation: "goldGlow 2.5s ease-in-out infinite",
                          transition: "border-color .2s",
                        }}>
                        <div style={{ width: 28, height: 28, background: hub.accent,
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={14} style={{ color: hub.color }} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: NAVY, margin: 0,
                            fontFamily: "'Lato',sans-serif" }}>{hub.short}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", animation: "pulse2 1.5s infinite" }} />
                            <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                              {liveCounts[hub.id]} active
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My Hubs */}
            {myHubList.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Crown size={14} style={{ color: GOLD }} />
                  <p className="section-label">My Active Rooms</p>
                  <div style={{ height: 1, flex: 1, background: "#e5ddd0" }} />
                </div>
                <div className="hub-grid">
                  {myHubList.map(hub => (
                    <HubCard key={hub.id} hub={hub} liveCount={liveCounts[hub.id] || 0}
                      myHubs={myHubs} onClick={() => enterHub(hub)} />
                  ))}
                </div>
              </div>
            )}

            {/* Discover Hubs */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Globe2 size={14} style={{ color: GOLD }} />
                <p className="section-label">{myHubList.length > 0 ? "Discover Other Hubs" : "All Academic Hubs"}</p>
                <div style={{ height: 1, flex: 1, background: "#e5ddd0" }} />
              </div>
              <div className="hub-grid">
                {(myHubList.length > 0 ? otherHubs : filteredHubs).map(hub => (
                  <HubCard key={hub.id} hub={hub} liveCount={liveCounts[hub.id] || 0}
                    myHubs={myHubs} onClick={() => enterHub(hub)} />
                ))}
              </div>
              {filteredHubs.length === 0 && (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <Search size={32} style={{ color: "#e5ddd0", margin: "0 auto 10px", display: "block" }} />
                  <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>No hubs matched "{search}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CHAT VIEW ══ */}
        {activeHub && (
          <div className="anim-up chat-panel" style={{ display: mobileView === "chat" || window?.innerWidth > 768 ? "flex" : "none" }}>

            {/* Chat header */}
            <div style={{
              background: "#fff", borderBottom: "0.5px solid #e5ddd0",
              padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
            }}>
              <button onClick={leaveHub}
                style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}>
                <ArrowLeft size={18} />
              </button>

              <div style={{ width: 38, height: 38, background: activeHub.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${activeHub.color}33` }}>
                {<activeHub.icon size={18} style={{ color: activeHub.color }} />}
              </div>

              <div style={{ flex: 1 }}>
                <h2 className="serif" style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 2px" }}>
                  {activeHub.name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", animation: "pulse2 2s infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", fontFamily: "'Lato',sans-serif" }}>
                      {hubPresence.length} student{hubPresence.length !== 1 ? "s" : ""} in hub
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#ccc" }}>·</span>
                  <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{activeHub.tag}</span>
                </div>
              </div>

              {/* Active avatars */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {hubPresence.slice(0, 5).map((p, i) => (
                  <div key={p.userId} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }}>
                    <Avatar name={p.userName} photo={p.userPhoto} size={26} online />
                  </div>
                ))}
                {hubPresence.length > 5 && (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: CREAM,
                    border: "1.5px solid #fff", display: "flex", alignItems: "center",
                    justifyContent: "center", marginLeft: -8, fontSize: 9, fontWeight: 700, color: NAVY,
                    fontFamily: "'Lato',sans-serif",
                  }}>+{hubPresence.length - 5}</div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 18px", background: BG }}>
              {messages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: 12, textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, background: activeHub.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${activeHub.color}22` }}>
                    {<activeHub.icon size={26} style={{ color: activeHub.color }} />}
                  </div>
                  <div>
                    <p className="serif" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                      Welcome to {activeHub.name}
                    </p>
                    <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif", maxWidth: 300, lineHeight: 1.6 }}>
                      Be the first to start a discussion. This is a space for {activeHub.description.toLowerCase()}.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isOwn = msg.senderId === user?.uid;
                    const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
                    return <ChatBubble key={msg.id} msg={msg} isOwn={isOwn} showAvatar={showAvatar} />;
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ background: "#fff", borderTop: "0.5px solid #e5ddd0", padding: "12px 16px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10,
                background: CREAM, border: "0.5px solid #e5ddd0", padding: "10px 14px" }}>
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  placeholder={`Message ${activeHub.short}…`}
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!msgInput.trim() || sending}
                  style={{
                    width: 36, height: 36,
                    background: msgInput.trim() ? GOLD : "#e5ddd0",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: msgInput.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "background .15s",
                  }}>
                  <Send size={14} style={{ color: msgInput.trim() ? NAVY : "#bbb" }} />
                </button>
              </div>
              <p style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif", marginTop: 5, textAlign: "center" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}