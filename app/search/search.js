"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  doc, getDoc, collection, query, where,
  getDocs, setDoc, increment
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { FileText, X, TrendingUp, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

/* ─── colour tokens (match homepage) ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── helpers ─── */
const getThumbnailUrl = (book) => {
  if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
    if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
  }
  if (book.pdfUrl?.includes("drive.google.com")) {
    const m = book.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

/* ════════════════════════════════════════
   COMPONENT
════════════════════════════════════════ */
export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q")?.toLowerCase() || "";

  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [mostSearchedBooks, setMostSearchedBooks] = useState([]);
  const [showMostSearched, setShowMostSearched] = useState(false);

  /* ── track search ── */
  const trackSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return;
    try {
      await setDoc(doc(db, "searchAnalytics", searchQuery), {
        query: searchQuery, count: increment(1), lastSearched: new Date().toISOString(),
      }, { merge: true });
    } catch {}
  };

  /* ── most searched ── */
  const fetchMostSearchedBooks = async () => {
    try {
      const snap = await getDocs(collection(db, "searchAnalytics"));
      const searches = [];
      snap.forEach(d => searches.push({ query: d.data().query, count: d.data().count }));
      searches.sort((a, b) => b.count - a.count);
      const top = searches.slice(0, 10);
      const matched = [];
      for (const s of top) {
        const book = booksData.find(b =>
          b.title?.toLowerCase().includes(s.query) || b.author?.toLowerCase().includes(s.query)
        );
        if (book && !matched.find(m => m.id === book.id)) {
          matched.push({ ...book, image: getThumbnailUrl(book), searchCount: s.count, source: "platform" });
        }
      }
      setMostSearchedBooks(matched);
    } catch {}
  };

  /* ── purchased books ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const ud = await getDoc(doc(db, "users", user.uid));
        if (ud.exists()) {
          const pb = ud.data().purchasedBooks || [];
          setPurchasedBookIds(new Set(pb.map(b => b.id)));
        }
      } catch {}
    };
    fetch();
    fetchMostSearchedBooks();
  }, []);

  /* ── search logic ── */
  useEffect(() => {
    const performSearch = async () => {
      if (!q) { setSearchResults([]); setShowMostSearched(true); return; }
      setShowMostSearched(false); setLoading(true);
      trackSearch(q);
      try {
        const platformResults = booksData
          .filter(b => {
            const searchableText = [
              b.title, b.author, b.category, b.courseCode,
              b.university, b.department, b.faculty,
              b.resourceType, b.description, b.subject, b.level,
              ...(b.tags || []),
            ].filter(Boolean).join(" ").toLowerCase();
            return searchableText.includes(q);
          })
          .map(b => ({ ...b, image: getThumbnailUrl(b), source: "platform" }));

        const firestoreResults = [];
        try {
          const snap = await getDocs(query(collection(db, "advertMyBook"), where("status", "==", "approved")));
          snap.forEach(d => {
            const data = d.data();
            const searchableText = [
              data.bookTitle,
              data.author,
              data.category,
              data.courseCode,
              data.university,
              data.department,
              data.faculty,
              data.resourceType,
              data.description,
              data.tags?.join(" "),
              data.subject,
              data.level,
            ].filter(Boolean).join(" ").toLowerCase();

            if (searchableText.includes(q)) {
              const b = {
                id: `firestore-${d.id}`, firestoreId: d.id,
                title: data.bookTitle, author: data.author, category: data.category,
                price: data.price, pages: data.pages, format: data.format || "PDF",
                description: data.description, driveFileId: data.driveFileId,
                pdfUrl: data.pdfUrl, previewUrl: data.previewUrl, embedUrl: data.embedUrl,
                isFromFirestore: true, source: "firestore",
                // ← ADD THESE:
                courseCode: data.courseCode || "",
                university: data.university || "",
                department: data.department || "",
                faculty: data.faculty || "",
                resourceType: data.resourceType || "",
                subject: data.subject || "",
                level: data.level || "",
                tags: data.tags || [],
              };
              b.image = getThumbnailUrl(b);
              firestoreResults.push(b);
            }
          });
        } catch {}

        setSearchResults([...platformResults, ...firestoreResults]);
      } catch {
        setSearchResults(booksData
          .filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q))
          .map(b => ({ ...b, image: getThumbnailUrl(b), source: "platform" }))
        );
      } finally { setLoading(false); }
    };
    performSearch();
  }, [q]);

  const handlePurchase = (book) => { setSelectedBook(book); setShowPurchaseModal(true); };
  const handleProceedToPayment = () => {
    if (!selectedBook) return;
    setShowPurchaseModal(false);
    router.push(`/payment?bookId=${selectedBook.id}`);
  };
  const isPurchased = id => purchasedBookIds.has(id);

  /* ── Book Card ── */
  const BookCard = ({ book, showTrending = false }) => {
    const owned = isPurchased(book.id);
    return (
      <Link
        href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div style={{ position: "relative", background: "#ede8df", overflow: "hidden" }}>
          <img
            src={getThumbnailUrl(book)}
            alt={book.title}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block", transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" }}
            className="book-thumb-img"
            onError={e => { e.target.style.display = "none"; }}
          />
          {/* PDF badge */}
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff", fontFamily: "'Lato', sans-serif" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            PDF
          </div>
          {owned && (
            <span style={{ position: "absolute", top: "8px", right: "8px", background: "#15803d", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato', sans-serif" }}>OWNED</span>
          )}
          {!owned && book.isFromFirestore && (
            <span style={{ position: "absolute", top: "8px", right: "8px", background: GOLD, color: NAVY, fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato', sans-serif" }}>UPLOAD</span>
          )}
          {showTrending && book.searchCount && (
            <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ea580c", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: "'Lato', sans-serif" }}>
              <TrendingUp size={10} /> {book.searchCount}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0", background: "#fff" }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
            {book.title}
          </h4>
          <p style={{ fontSize: "11px", color: "#888", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato', sans-serif" }}>
            {book.author}
          </p>
          {/* University / dept / course meta */}
          {(book.university || book.department || book.courseCode) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
              {book.courseCode && (
                <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(13,34,68,0.08)", color: NAVY, padding: "2px 6px", letterSpacing: "0.06em", fontFamily: "'Lato',sans-serif" }}>
                  {book.courseCode}
                </span>
              )}
              {book.university && (
                <span style={{ fontSize: "9px", color: "#888", fontFamily: "'Lato',sans-serif", padding: "2px 0" }}>
                  {book.university}
                </span>
              )}
            </div>
          )}
          {book.resourceType && (
            <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", display: "block", marginBottom: "4px" }}>
              {book.resourceType}
            </span>
          )}
          {book.price && (
            <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato', sans-serif" }}>
              ₦{Number(book.price).toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    );
  };

  /* ── Book Grid Section ── */
  const BookSection = ({ title, books, showTrending = false, count }) => (
    <div style={{ marginBottom: "48px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ width: "4px", height: "28px", background: GOLD }} />
        <div>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato', sans-serif" }}>
            {showTrending ? "Most Popular" : title}
          </p>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: 0 }}>
            {title}
            {count !== undefined && (
              <span style={{ fontSize: "14px", fontWeight: 400, color: "#bbb", marginLeft: "8px", fontFamily: "'Lato', sans-serif" }}>({count})</span>
            )}
          </h3>
        </div>
      </div>

      {/* Mobile carousel */}
      <div className="lg:hidden space-y-4">
        {chunkArray(books, 5).map((row, ri) => (
          <div key={ri} style={{ overflowX: "auto", paddingBottom: "12px" }} className="sbar-none">
            <div style={{ display: "flex", gap: "10px", minWidth: "max-content" }}>
              {row.map(book => (
                <div key={book.id} style={{ flexShrink: 0, width: "150px" }}>
                  <BookCard book={book} showTrending={showTrending} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="hidden lg:grid" style={{ display: "none", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
        {books.map(book => <BookCard key={book.id} book={book} showTrending={showTrending} />)}
      </div>
      <div className="lg-grid-override" style={{ display: "none" }}>
        {books.map(book => <BookCard key={book.id} book={book} showTrending={showTrending} />)}
      </div>
    </div>
  );

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .search-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
        .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .sbar-none::-webkit-scrollbar { display: none; }
        .book-thumb-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
        .book-thumb-wrapper:hover .book-thumb-img { transform: scale(1.06); }
        @media (min-width: 1024px) {
          .lg-grid-override { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
          .hidden.lg\\:grid { display: none !important; }
        }
        .purchase-modal-overlay {
          position: fixed; inset: 0; background: rgba(13,34,68,0.82); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px;
        }
        .purchase-modal {
          background: ${BG};
          border: 0.5px solid rgba(184,150,62,0.35);
          border-top: 2px solid ${GOLD};
          max-width: 440px; width: 100%;
          box-shadow: 0 32px 80px rgba(13,34,68,0.3);
        }
        .purchase-btn {
          width: 100%; padding: 14px;
          background: ${NAVY}; color: #fff;
          font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: none; cursor: pointer;
          transition: background 0.18s;
        }
        .purchase-btn:hover { background: #162f5a; }
        .search-hero {
          background-color: ${NAVY};
          background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          padding: 48px 24px;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(13,34,68,0.1);
          border-top-color: ${GOLD};
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="search-root">
        <Navbar />

        {/* ── Search Hero ── */}
        <div className="search-hero">
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {q ? (
              <>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                  Search Results
                </p>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.08 }}>
                  Results for{" "}
                  <span style={{ color: GOLD, fontStyle: "italic" }}>"{q}"</span>
                </h1>
                {!loading && (
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 300 }}>
                    {searchResults.length} document{searchResults.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                  Trending
                </p>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.08 }}>
                  Most Searched{" "}
                  <span style={{ color: GOLD, fontStyle: "italic" }}>Documents</span>
                </h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 300 }}>
                  What students across Africa are looking for
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>

          {/* Loading spinner */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div className="spinner" />
              <p style={{ fontSize: "12px", color: "#bbb", marginTop: "16px", fontWeight: 300 }}>Searching documents…</p>
            </div>
          )}

          {/* Most searched */}
          {!loading && showMostSearched && (
            mostSearchedBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ width: "64px", height: "64px", border: `0.5px solid #e5ddd0`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Search size={28} style={{ color: "#ccc" }} />
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: NAVY, margin: "0 0 6px" }}>No search data yet</p>
                <p style={{ fontSize: "12px", color: "#bbb" }}>Be the first to search for something!</p>
              </div>
            ) : (
              <BookSection title="Most Searched Books" books={mostSearchedBooks} showTrending={true} />
            )
          )}

          {/* No results */}
          {!loading && !showMostSearched && searchResults.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ width: "64px", height: "64px", border: `0.5px solid #e5ddd0`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileText size={28} style={{ color: "#ccc" }} />
              </div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: NAVY, margin: "0 0 8px" }}>No results found</p>
              <p style={{ fontSize: "13px", color: "#bbb", marginBottom: "24px", fontWeight: 300 }}>
                No documents matched "{q}". Try a different search.
              </p>
              <Link href="/home" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 24px", background: NAVY, color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato', sans-serif" }}>
                ← Back to Home
              </Link>
            </div>
          )}

          {/* Results */}
          {!loading && !showMostSearched && searchResults.length > 0 && (() => {
            const purchased = searchResults.filter(b => isPurchased(b.id));
            const unpurchased = searchResults.filter(b => !isPurchased(b.id));

            // group unpurchased by resourceType
            const groups = {};
            unpurchased.forEach(b => {
              const key = b.resourceType || b.category || "Other Documents";
              if (!groups[key]) groups[key] = [];
              groups[key].push(b);
            });

            return (
              <>
                {purchased.length > 0 && (
                  <BookSection
                    title="Your Purchased Documents"
                    books={purchased}
                    count={purchased.length}
                  />
                )}
                {Object.entries(groups).map(([type, books]) => (
                  <BookSection
                    key={type}
                    title={type}
                    books={books}
                    count={books.length}
                  />
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Purchase Modal ── */}
      {showPurchaseModal && selectedBook && (
        <div className="purchase-modal-overlay">
          <div className="purchase-modal">
            {/* Header */}
            <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px)", backgroundSize: "22px 22px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Purchase Document</p>
              <button onClick={() => setShowPurchaseModal(false)} style={{ width: "32px", height: "32px", border: "0.5px solid rgba(184,150,62,0.3)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(184,150,62,0.7)" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <img
                src={getThumbnailUrl(selectedBook)}
                alt={selectedBook.title}
                style={{ width: "100%", height: "200px", objectFit: "cover", marginBottom: "20px", display: "block" }}
                onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
              />

              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>{selectedBook.title}</p>
              <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px", fontWeight: 300 }}>{selectedBook.author}</p>

              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "20px" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: NAVY, margin: 0 }}>
                  ₦{Number(selectedBook.price)?.toLocaleString()}
                </p>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>NGN</span>
              </div>

              {/* Info */}
              <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, borderLeft: `3px solid ${GOLD}`, padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px" }}>
                <FileText size={16} style={{ color: GOLD, flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Instant PDF Access</p>
                  <p style={{ fontSize: "12px", color: "#777", margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                    After payment, the PDF will be sent to{" "}
                    <strong style={{ color: NAVY }}>{auth.currentUser?.email || "your email"}</strong>.
                    Also available in "My Books" anytime.
                  </p>
                </div>
              </div>

              <button className="purchase-btn" onClick={handleProceedToPayment}>
                Proceed to Payment <ArrowRight size={14} style={{ display: "inline", marginLeft: "4px" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}