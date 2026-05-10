"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection, query, where, orderBy, getDocs,
  doc, getDoc, addDoc, updateDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, ThumbsUp, ThumbsDown, Flag, Star, Plus, X } from "lucide-react";

/* ── palette ── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const CARD = "#fff";
const BORDER = "#e5ddd0";
const TEXT = NAVY;
const MUTED = "#aaa";

/* ── helpers ── */
const formatDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
};
const getInitial = (name) => (name || "A").charAt(0).toUpperCase();
const avg = (list) => list.length === 0 ? 0 : list.reduce((s, f) => s + (f.rating || 0), 0) / list.length;

/* ── star component ── */
const Stars = ({ value, size = 14, interactive = false, onChange }) => (
  <span style={{ display: "inline-flex", gap: "2px" }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        fill={n <= Math.round(value) ? GOLD : "none"}
        stroke={n <= Math.round(value) ? GOLD : "#ccc"}
        style={{ cursor: interactive ? "pointer" : "default", transition: "transform 0.1s" }}
        onClick={() => interactive && onChange && onChange(n)}
        onMouseEnter={e => interactive && (e.currentTarget.style.transform = "scale(1.2)")}
        onMouseLeave={e => interactive && (e.currentTarget.style.transform = "scale(1)")}
      />
    ))}
  </span>
);

/* ── rating bar ── */
const RatingBar = ({ star, pct }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
    <span style={{ fontSize: "12px", color: NAVY, width: "8px", textAlign: "right", fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>{star}</span>
    <Star size={11} fill={GOLD} stroke="none" />
    <div style={{ flex: 1, height: "6px", background: BORDER }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${GOLD},#d4aa55)`, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════ */
export default function BookFeedbacksClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("bookId");

  const [feedbacks, setFeedbacks] = useState([]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("helpful");
  const [showModal, setShowModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState({});
  const [visible, setVisible] = useState(5);

  /* ── auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cu) => {
      if (cu) setUser(cu);
      else router.push("/auth/signin");
    });
    return () => unsub();
  }, [router]);

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      const cleanId = bookId.replace("firestore-", "");
      const bookDoc = await getDoc(doc(db, "advertMyBook", cleanId));
      if (bookDoc.exists()) {
        const d = bookDoc.data();
        setBook({ title: d.bookTitle || d.title, author: d.author });
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
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        helpfulCount: d.data().helpfulCount || 0,
        unhelpfulCount: d.data().unhelpfulCount || 0,
      }));
      setFeedbacks(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── derived stats ── */
  const average = avg(feedbacks);
  const totalCount = feedbacks.length;
  const barPcts = [5, 4, 3, 2, 1].map((star) => {
    const cnt = feedbacks.filter((f) => Math.round(f.rating) === star).length;
    return { star, pct: totalCount > 0 ? (cnt / totalCount) * 100 : 0 };
  });

  /* ── sorted list ── */
  const sorted = [...feedbacks].sort((a, b) => {
    if (sortBy === "helpful") return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    if (sortBy === "recent") return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === "highest") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "lowest") return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

  /* ── vote ── */
  const handleVote = async (fb, type) => {
    if (!user) return;
    const prev = voted[fb.id];
    if (prev === type) return;
    const ref = doc(db, "bookFeedbacks", fb.id);
    const upd = {};
    if (type === "up") { upd.helpfulCount = increment(1); if (prev === "down") upd.unhelpfulCount = increment(-1); }
    if (type === "down") { upd.unhelpfulCount = increment(1); if (prev === "up") upd.helpfulCount = increment(-1); }
    await updateDoc(ref, upd);
    setVoted((v) => ({ ...v, [fb.id]: type }));
    setFeedbacks((list) =>
      list.map((f) => {
        if (f.id !== fb.id) return f;
        const delta = (field, sign) => (f[field] || 0) + sign;
        return {
          ...f,
          helpfulCount: type === "up" ? delta("helpfulCount", 1) : prev === "up" ? delta("helpfulCount", -1) : f.helpfulCount,
          unhelpfulCount: type === "down" ? delta("unhelpfulCount", 1) : prev === "down" ? delta("unhelpfulCount", -1) : f.unhelpfulCount,
        };
      })
    );
  };

  /* ── submit review ── */
  const handleSubmit = async () => {
    if (!newRating || !newText.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookFeedbacks"), {
        bookId,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        rating: newRating,
        feedback: newText.trim(),
        helpfulCount: 0,
        unhelpfulCount: 0,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setNewRating(0);
      setNewText("");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabel = (r) => ["", "Poor", "Fair", "Good", "Great", "Excellent"][r] || "";

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "44px", height: "44px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "14px", color: NAVY }}>Loading reviews…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .fb-root{font-family:'Lato',sans-serif;background:${BG};min-height:100vh;color:${NAVY};}

        .sort-btn{
          background:#fff;
          border:0.5px solid ${BORDER};
          color:${NAVY};
          font-size:11px;
          font-weight:700;
          padding:7px 14px;
          cursor:pointer;
          font-family:'Lato',sans-serif;
          letter-spacing:0.04em;
          transition:all 0.15s;
        }
        .sort-btn:hover{background:${CREAM};border-color:${GOLD};}
        .sort-btn.active{background:${NAVY};color:#fff;border-color:${NAVY};}

        .add-btn{
          background:${NAVY};
          color:#fff;
          border:none;
          font-size:11px;
          font-weight:700;
          padding:9px 18px;
          cursor:pointer;
          font-family:'Lato',sans-serif;
          display:flex;
          align-items:center;
          gap:6px;
          letter-spacing:0.06em;
          transition:background 0.15s;
        }
        .add-btn:hover{background:#1a3a6e;}

        .fb-card{
          background:${CARD};
          border:0.5px solid ${BORDER};
          padding:18px;
          margin-bottom:8px;
          animation:fadeUp 0.3s ease both;
          transition:background 0.15s;
        }
        .fb-card:hover{background:${CREAM};}

        .vote-btn{
          background:transparent;
          border:0.5px solid ${BORDER};
          cursor:pointer;
          color:${MUTED};
          display:flex;
          align-items:center;
          gap:5px;
          font-size:11px;
          font-family:'Lato',sans-serif;
          font-weight:700;
          padding:5px 10px;
          transition:all 0.15s;
        }
        .vote-btn:hover{border-color:${NAVY};color:${NAVY};}
        .vote-btn.voted-up{background:rgba(13,34,68,0.08);border-color:${NAVY};color:${NAVY};}
        .vote-btn.voted-down{background:rgba(239,68,68,0.07);border-color:#f87171;color:#dc2626;}

        .flag-btn{background:transparent;border:none;cursor:pointer;color:${MUTED};padding:5px;transition:color 0.15s;margin-left:auto;}
        .flag-btn:hover{color:#dc2626;}

        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
        .modal{background:${NAVY};width:100%;max-width:460px;overflow:hidden;animation:fadeUp 0.25s ease;}

        .modal-input{
          width:100%;
          background:${CREAM};
          border:0.5px solid ${BORDER};
          color:${NAVY};
          padding:12px;
          font-family:'Lato',sans-serif;
          font-size:13px;
          resize:vertical;
          min-height:100px;
          outline:none;
        }
        .modal-input:focus{border-color:${GOLD};}
        .modal-input::placeholder{color:#bbb;}

        .submit-btn{
          background:${GOLD};
          color:${NAVY};
          border:none;
          font-size:12px;
          font-weight:700;
          padding:11px 24px;
          cursor:pointer;
          font-family:'Lato',sans-serif;
          letter-spacing:0.06em;
          transition:opacity 0.15s;
        }
        .submit-btn:hover:not(:disabled){opacity:0.85;}
        .submit-btn:disabled{opacity:0.4;cursor:not-allowed;}

        .cancel-btn{
          background:transparent;
          border:0.5px solid rgba(255,255,255,0.2);
          color:rgba(255,255,255,0.6);
          font-size:12px;
          font-weight:700;
          padding:11px 20px;
          cursor:pointer;
          font-family:'Lato',sans-serif;
          transition:background 0.15s;
        }
        .cancel-btn:hover{background:rgba(255,255,255,0.06);}

        .load-more{
          background:transparent;
          border:0.5px solid ${BORDER};
          color:${NAVY};
          padding:11px 28px;
          font-size:11px;
          font-weight:700;
          cursor:pointer;
          font-family:'Lato',sans-serif;
          letter-spacing:0.06em;
          transition:all 0.18s;
        }
        .load-more:hover{background:${NAVY};color:#fff;border-color:${NAVY};}

        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:0.4}}
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
          <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 20px", height: "56px", display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={() => router.back()} style={{ width: "34px", height: "34px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Ratings and reviews</p>
              {book?.title && (
                <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {book.title}{book.author ? ` · ${book.author}` : ""}
                </p>
              )}
            </div>
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <Plus size={13} /> Add Review
            </button>
          </div>
        </header>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 20px" }}>

          {/* ── RATING SUMMARY ── */}
          <div style={{ background: "#fff", border: `0.5px solid ${BORDER}`, padding: "24px", marginBottom: "20px", display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
            {/* big number */}
            <div style={{ textAlign: "center", minWidth: "100px" }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "72px", fontWeight: 900, lineHeight: 1, color: NAVY, margin: "0 0 8px" }}>
                {totalCount > 0 ? average.toFixed(1) : "—"}
              </p>
              <Stars value={average} size={16} />
              <p style={{ fontSize: "10px", color: MUTED, marginTop: "6px", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {totalCount.toLocaleString()} {totalCount === 1 ? "Rating" : "Ratings"}
              </p>
            </div>
            {/* divider */}
            <div style={{ width: "0.5px", background: BORDER, alignSelf: "stretch", minHeight: "80px" }} />
            {/* bars */}
            <div style={{ flex: 1, minWidth: "160px", paddingTop: "4px" }}>
              {barPcts.map(({ star, pct }) => (
                <RatingBar key={star} star={star} pct={pct} />
              ))}
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: MUTED, marginRight: "4px", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Sort by:</span>
            {[
              { key: "helpful", label: "Most helpful" },
              { key: "recent", label: "Most recent" },
              { key: "highest", label: "Highest rated" },
              { key: "lowest", label: "Lowest rated" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`sort-btn${sortBy === key ? " active" : ""}`}
                onClick={() => { setSortBy(key); setVisible(5); }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── REVIEWS ── */}
          {feedbacks.length === 0 ? (
            <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, padding: "60px 24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", border: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: CREAM }}>
                <Star size={22} stroke={NAVY} fill="none" />
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>No reviews yet</p>
              <p style={{ fontSize: "12px", color: MUTED, marginBottom: "20px", fontFamily: "'Lato',sans-serif" }}>Be the first to review this book.</p>
              <button className="add-btn" style={{ margin: "0 auto" }} onClick={() => setShowModal(true)}>
                <Plus size={13} /> Write a review
              </button>
            </div>
          ) : (
            <>
              {sorted.slice(0, visible).map((fb, i) => (
                <div key={fb.id} className="fb-card" style={{ animationDelay: `${i * 0.04}s` }}>

                  {/* top row: avatar + name + date + stars */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: "13px", fontWeight: 700, flexShrink: 0, fontFamily: "'Playfair Display',serif" }}>
                      {getInitial(fb.userName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                          {fb.userName || "Anonymous"}
                        </span>
                        <span style={{ fontSize: "10px", color: MUTED, fontFamily: "'Lato',sans-serif" }}>
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <Stars value={fb.rating || 0} size={12} />
                        {fb.rating > 0 && (
                          <span style={{ fontSize: "10px", color: GOLD, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                            {fb.rating?.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* review text */}
                  {fb.feedback ? (
                    <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: "0 0 12px 48px" }}>
                      {fb.feedback}
                    </p>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#bbb", fontStyle: "italic", fontFamily: "'Lato',sans-serif", margin: "0 0 12px 48px" }}>
                      (No details provided)
                    </p>
                  )}

                  {/* gold accent + votes */}
                  <div style={{ marginLeft: "48px", paddingTop: "10px", borderTop: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: MUTED, fontFamily: "'Lato',sans-serif", marginRight: "4px" }}>Helpful?</span>
                    <button
                      className={`vote-btn${voted[fb.id] === "up" ? " voted-up" : ""}`}
                      onClick={() => handleVote(fb, "up")}
                    >
                      <ThumbsUp size={12} />
                      {fb.helpfulCount > 0 && <span>{fb.helpfulCount}</span>}
                    </button>
                    <button
                      className={`vote-btn${voted[fb.id] === "down" ? " voted-down" : ""}`}
                      onClick={() => handleVote(fb, "down")}
                    >
                      <ThumbsDown size={12} />
                      {fb.unhelpfulCount > 0 && <span>{fb.unhelpfulCount}</span>}
                    </button>
                    <button className="flag-btn"><Flag size={12} /></button>
                  </div>
                </div>
              ))}

              {visible < sorted.length && (
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                  <button className="load-more" onClick={() => setVisible((v) => v + 10)}>
                    LOAD MORE REVIEWS
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ADD REVIEW MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setNewRating(0); setNewText(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {/* Modal header — NAVY bg */}
            <div style={{ background: NAVY, padding: "20px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "10px", color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                  Your Review
                </p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Write a Review
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); setNewRating(0); setNewText(""); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px", background: NAVY }}>
              {book?.title && (
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "18px", fontFamily: "'Lato',sans-serif", fontStyle: "italic" }}>
                  {book.title}
                </p>
              )}

              {/* Star picker */}
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>
                Your rating
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={30}
                      fill={n <= newRating ? GOLD : "none"}
                      stroke={n <= newRating ? GOLD : "rgba(255,255,255,0.3)"}
                      style={{ cursor: "pointer", transition: "transform 0.1s" }}
                      onClick={() => setNewRating(n)}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                  ))}
                </div>
                {newRating > 0 && (
                  <span style={{ fontSize: "12px", color: GOLD, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                    {ratingLabel(newRating)}
                  </span>
                )}
              </div>

              <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", marginBottom: "20px" }} />

              {/* Text input */}
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>
                Your review
              </p>
              <textarea
                autoFocus
                className="modal-input"
                placeholder="Share your thoughts about this book…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "6px", marginBottom: "18px", fontFamily: "'Lato',sans-serif" }}>
                {newText.length}/500
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="cancel-btn"
                  onClick={() => { setShowModal(false); setNewRating(0); setNewText(""); }}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  style={{ flex: 1 }}
                  disabled={!newRating || !newText.trim() || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}