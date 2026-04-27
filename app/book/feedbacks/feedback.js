"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, ThumbsUp } from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function BookFeedbacksClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("bookId");

  const [feedbacks, setFeedbacks] = useState([]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [positivePercent, setPositivePercent] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cu) => {
      if (cu) setUser(cu);
      else router.push("/auth/signin");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookId) return;
      try {
        setLoading(true);
        const cleanId = bookId.replace("firestore-", "");
        const bookDoc = await getDoc(doc(db, "advertMyBook", cleanId));
        if (bookDoc.exists()) {
          const data = bookDoc.data();
          setBook({ title: data.bookTitle || data.title, author: data.author });
        } else {
          const { booksData } = await import("@/lib/booksData");
          const found = booksData.find(
            (b) => String(b.id) === String(bookId) || String(b.id) === cleanId
          );
          if (found) setBook({ title: found.title, author: found.author });
        }

        const q = query(
          collection(db, "bookFeedbacks"),
          where("bookId", "==", bookId),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }));
        setFeedbacks(list);

        // Calculate positive %
        if (list.length > 0) {
          const positive = list.filter(f => f.feedback?.trim().length > 0).length;
          setPositivePercent(Math.round((positive / list.length) * 100));
        }
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId]);

  const formatTimeAgo = (date) => {
    if (!date) return "Just now";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getInitial = (name) => (name || "A").charAt(0).toUpperCase();

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: NAVY }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .fb-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .fb-card { background:#fff; border:0.5px solid #e5ddd0; padding:16px; margin-bottom:8px; transition:background 0.15s; animation: slideUp 0.35s ease both; }
        .fb-card:hover { background:${CREAM}; }
        .load-btn { background:transparent; border:0.5px solid #e5ddd0; color:${NAVY}; font-size:11px; font-weight:700; padding:10px 24px; cursor:pointer; font-family:'Lato',sans-serif; letter-spacing:0.06em; transition:all 0.18s; }
        .load-btn:hover { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="fb-root">

        {/* ── HEADER ── */}
        <header style={{
          background: NAVY,
          backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
          position: "sticky", top: 0, zIndex: 40,
          borderBottom: "0.5px solid rgba(184,150,62,0.2)",
        }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px", height: "56px", display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => router.back()} style={{ width: "34px", height: "34px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Feedback</p>
              <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {book?.title || "Book"}
              </p>
            </div>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px" }}>

          {/* Stats bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "12px 16px", background: NAVY, border: "0.5px solid rgba(184,150,62,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: GOLD, animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
                {feedbacks.length} {feedbacks.length === 1 ? "Feedback" : "Feedbacks"}
              </span>
            </div>
            {positivePercent !== null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "5px 12px" }}>
                <ThumbsUp size={11} style={{ color: GOLD }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>{positivePercent}% Positive</span>
              </div>
            )}
          </div>

          {/* Empty state */}
          {feedbacks.length === 0 ? (
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: CREAM }}>
                <ThumbsUp size={22} style={{ color: NAVY }} />
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>No feedback yet</p>
              <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px", fontFamily: "'Lato',sans-serif" }}>Be the first to leave feedback on this book.</p>
              <button onClick={() => router.back()}
                style={{ background: NAVY, color: "#fff", padding: "12px 24px", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
                GO BACK & ADD FEEDBACK
              </button>
            </div>
          ) : (
            <>
              <div>
                {feedbacks.map((fb, i) => (
                  <div key={fb.id} className="fb-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      {/* Avatar */}
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: "13px", fontWeight: 700, flexShrink: 0, fontFamily: "'Playfair Display',serif" }}>
                        {getInitial(fb.userName)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {fb.userName || "Anonymous"}
                          </span>
                          <span style={{ fontSize: "10px", color: "#aaa", flexShrink: 0, marginLeft: "8px", fontFamily: "'Lato',sans-serif" }}>
                            {formatTimeAgo(fb.createdAt)}
                          </span>
                        </div>
                        {fb.feedback ? (
                          <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: 0 }}>
                            {fb.feedback}
                          </p>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#bbb", fontStyle: "italic", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                            (No details provided)
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Gold accent line */}
                    <div style={{ width: "24px", height: "1px", background: GOLD, margin: "10px 0 0 48px", opacity: 0.4 }} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button className="load-btn">VIEW MORE FEEDBACK</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}