"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc, getDoc, getDocs, collection, query, where,
  addDoc, updateDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { fetchBookDetails } from "@/utils/bookUtils";
import { Package, MapPin, ArrowLeft, CheckCircle, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

export default function BuyPhysicalPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawId        = searchParams.get("bookId");
  const bookId       = rawId?.startsWith("firestore-") ? rawId : rawId ? `firestore-${rawId}` : null;

  const [user,        setUser]        = useState(null);
  const [book,        setBook]        = useState(null);
  const [inventory,   setInventory]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState(false);
  const [step,        setStep]        = useState(1); // 1=confirm, 2=success
  const [orderId,     setOrderId]     = useState("");
  const [pickupCode,  setPickupCode]  = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) setUser(u);
      else router.push("/auth/signin");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!bookId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [bookData] = await Promise.all([fetchBookDetails(bookId)]);
        if (bookData) setBook(bookData);

        const variants = [bookId, bookId.replace("firestore-", ""), `firestore-${bookId.replace("firestore-", "")}`];
        for (const id of variants) {
          const snap = await getDocs(query(collection(db, "physicalInventory"), where("bookId", "==", id)));
          if (!snap.empty) { setInventory({ id: snap.docs[0].id, ...snap.docs[0].data() }); break; }
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [bookId]);

  const generatePickupCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

 const handleConfirmPurchase = async () => {
  if (!user || !book || !inventory) return;
  setProcessing(true);
  try {
    const code           = generatePickupCode();
    const oId            = `PHY-${Date.now()}`;
    const inventoryDocId = inventory.id || inventory.inventoryId;

    if (!inventoryDocId) throw new Error("Inventory document ID is missing. Contact support.");

    // 1. Create order
  await addDoc(collection(db, "physicalOrders"), {
  orderId:       oId,
  pickupCode:    code,
  bookId:        bookId,
  bookTitle:     book.title        || "Unknown Title",
  bookAuthor:    book.author       || "Unknown Author",
  price:         Number(book.price) || 0,
  userId:        user.uid,
  userEmail:     user.email        || "",
  userName:      user.displayName  || user.email?.split("@")[0] || "Student",
  sellerId:      book.userId       || book.sellerId  || book.uploadedBy || "", // ← ADD
  sellerName:    book.sellerName   || book.author    || "",                    // ← ADD
  inventoryId:   inventoryDocId,
  shelfLocation: inventory.shelfLocation || "",
  section:       inventory.section       || "",
  status:        "pending_pickup",
  createdAt:     serverTimestamp(),
});

    // 2. Decrement stock
    await updateDoc(doc(db, "physicalInventory", inventoryDocId), {
      currentStock:  increment(-1),
      reservedStock: increment(1),
    });

    // 3. Notify seller (non-critical — won't break flow if it fails)
   try {
  const sellerId = book.userId || book.sellerId || book.uploadedBy;
  if (sellerId) {
    await addDoc(collection(db, "notifications"), {
      recipientId: sellerId,
      userId:      sellerId,
      type:        "physical_reserved",   // ← was "physical_sale"
      title:       `Physical copy reserved — ${book.title}`,
      message:     `A student has reserved a physical copy of "${book.title}". Pickup Code: ${code}`,
      orderId:     oId,
      bookId:      bookId,
      assetId:     inventory.assetId || "",
      // NO amount field — money has not moved yet
      read:        false,
      createdAt:   serverTimestamp(),
    });
  }
} catch (notifErr) {
  console.warn("Notification skipped:", notifErr.message);
}

    setOrderId(oId);
    setPickupCode(code);
    setStep(2);

  } catch (err) {
    console.error("Physical purchase error:", err);
    alert(`Something went wrong: ${err.message}`);
  } finally {
    setProcessing(false);
  }
};

  const getThumbnailUrl = (book) => {
    if (book?.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    return book?.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!book || !inventory || inventory.currentStock === 0) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", textAlign: "center", maxWidth: "400px", width: "100%" }}>
        <Package size={40} style={{ color: "#ddd", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>Not Available</p>
        <p style={{ fontSize: "13px", color: "#888", fontFamily: "'Lato',sans-serif", marginBottom: "24px" }}>This physical copy is no longer available for purchase.</p>
        <Link href={`/book/preview?id=${rawId}`} style={{ color: GOLD, fontWeight: 700, fontFamily: "'Lato',sans-serif", fontSize: "13px" }}>← Back to Book</Link>
      </div>
    </div>
  );

  /* ── Step 2: Success / Receipt ── */
  if (step === 2) {
    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');`}</style>
        <header style={{ background: NAVY, padding: "0 16px", height: "56px", display: "flex", alignItems: "center", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: 900, color: "#fff", margin: 0 }}>[LAN Library]</p>
        </header>
        <div style={{ maxWidth: "520px", margin: "32px auto", padding: "0 16px" }}>
          {/* Success header */}
          <div style={{ background: NAVY, padding: "32px 28px", textAlign: "center", marginBottom: "16px" }}>
            <div style={{ width: "60px", height: "60px", background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={28} style={{ color: "#22c55e" }} />
            </div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>Order Confirmed</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Physical Copy Reserved</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Show this receipt at LAN Head Office, Abuja</p>
          </div>

          {/* Receipt card */}
          <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
            {/* Dashed top border (perforated look) */}
            <div style={{ height: "6px", background: `repeating-linear-gradient(90deg, ${GOLD} 0, ${GOLD} 8px, transparent 8px, transparent 14px)` }} />

            <div style={{ padding: "28px 24px" }}>
              {/* Pickup Code */}
              <div style={{ background: NAVY, padding: "20px", textAlign: "center", marginBottom: "24px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 8px" }}>Your Pickup Code</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "32px", fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "0.12em" }}>{pickupCode}</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: 0 }}>Present this code to LAN staff</p>
              </div>

              {/* Book info */}
              <div style={{ display: "flex", gap: "14px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "0.5px dashed #e5ddd0" }}>
                <img src={getThumbnailUrl(book)} alt={book.title} style={{ width: "64px", aspectRatio: "3/4", objectFit: "cover", border: "0.5px solid #e5ddd0", flexShrink: 0 }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                <div>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "14px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</p>
                  <p style={{ fontSize: "11px", color: "#888", margin: "0 0 8px" }}>by {book.author}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY }}>₦{book.price?.toLocaleString()}</p>
                </div>
              </div>

              {/* Details grid */}
              {[
                ["Order ID",       orderId],
                ["Buyer",          user?.displayName || user?.email?.split("@")[0] || "Student"],
                ["Shelf Location", [inventory.section, inventory.shelfLocation].filter(Boolean).join(" — ") || "Ask staff on arrival"],
                ["Collection At",  "LAN Head Office, Abuja Registry"],
                ["Status",         "Pending Pickup"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "0.5px solid #f5f0e8", gap: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: NAVY, textAlign: "right" }}>{value}</span>
                </div>
              ))}

              {/* Map / location note */}
              <div style={{ marginTop: "20px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <MapPin size={16} style={{ color: GOLD, flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 3px" }}>LAN Head Office — Abuja</p>
                  <p style={{ fontSize: "11px", color: "#888", margin: 0, lineHeight: 1.55 }}>Bring this receipt (screenshot or printed). Staff will verify your pickup code and hand you your copy.</p>
                </div>
              </div>
            </div>

            {/* Dashed bottom border */}
            <div style={{ height: "6px", background: `repeating-linear-gradient(90deg, ${GOLD} 0, ${GOLD} 8px, transparent 8px, transparent 14px)` }} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", background: "#fff", border: `0.5px solid #e5ddd0`, fontSize: "12px", fontWeight: 700, color: NAVY, cursor: "pointer" }}>
              Print / Save PDF
            </button>
            <Link href="/home" style={{ flex: 1, padding: "12px", background: NAVY, color: "#fff", textAlign: "center", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "block" }}>
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1: Confirm ── */
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');`}</style>
      <header style={{ background: NAVY, padding: "0 16px", height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: 900, color: "#fff", margin: 0 }}>[LAN Library]</p>
      </header>

      <div style={{ maxWidth: "520px", margin: "32px auto", padding: "0 16px" }}>
        <div style={{ background: NAVY, padding: "24px 24px 20px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Physical Purchase</p>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Confirm Your Order</h1>
        </div>

        {/* Book summary */}
        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            <img src={getThumbnailUrl(book)} alt={book.title} style={{ width: "70px", aspectRatio: "3/4", objectFit: "cover", border: "0.5px solid #e5ddd0", flexShrink: 0 }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
            <div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</p>
              <p style={{ fontSize: "11px", color: "#888", margin: "0 0 10px" }}>by {book.author}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Package size={12} style={{ color: GOLD }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>Physical Copy</span>
                <span style={{ fontSize: "10px", color: "#aaa" }}>• {inventory.currentStock} left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup location */}
        <div style={{ background: CREAM, border: `1.5px solid ${GOLD}`, padding: "16px 18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <MapPin size={16} style={{ color: GOLD, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Collection Point</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 2px" }}>LAN Head Office — Abuja Registry</p>
              {(inventory.section || inventory.shelfLocation) && (
                <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>
                  {inventory.section && `Section: ${inventory.section}`}
                  {inventory.section && inventory.shelfLocation && " · "}
                  {inventory.shelfLocation && `Shelf: ${inventory.shelfLocation}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "#888" }}>Book Price</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY }}>₦{book.price?.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "10px", borderBottom: "0.5px solid #f0ebe0" }}>
            <span style={{ fontSize: "12px", color: "#888" }}>Pickup Fee</span>
            <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 700 }}>Free</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: NAVY }}>Total</span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif" }}>₦{book.price?.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleConfirmPurchase}
          disabled={processing}
          style={{ width: "100%", background: processing ? "#888" : NAVY, color: "#fff", padding: "15px", border: "none", fontSize: "13px", fontWeight: 700, cursor: processing ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.18s", marginBottom: "10px" }}
          onMouseEnter={e => { if (!processing) e.currentTarget.style.background = "#1a3a6e"; }}
          onMouseLeave={e => { if (!processing) e.currentTarget.style.background = NAVY; }}
        >
          {processing ? (
            <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
          ) : (
            <><ShoppingBag size={15} />Confirm Physical Purchase</>
          )}
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <p style={{ fontSize: "11px", color: "#aaa", textAlign: "center", fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
          By confirming, you agree to collect this copy in person at LAN Head Office, Abuja. A pickup code will be generated for you.
        </p>
      </div>
    </div>
  );
}