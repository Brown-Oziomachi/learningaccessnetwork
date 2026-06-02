"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  BookOpen, DollarSign, BookOpenText, TrendingUp, Users,
  ArrowRight, CheckCircle, X, Play, ChevronLeft, ChevronRight,
  Star, Upload, Shield, Zap, Sparkles, GraduationCap,
  Monitor, Smartphone, Search,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import NetworkModal from "@/components/NetworkModal";

/* ─── design tokens (matches home + report pages) ─────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── shared CSS injected once ────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lan-landing { font-family: 'Lato', sans-serif; background: ${BG}; color: ${NAVY}; }
  .lan-serif   { font-family: 'Playfair Display', Georgia, serif; }

  /* ── dot-grid hero ── */
  .hero-bg {
    background-color: ${NAVY};
    background-image:
      radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px),
      radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 28px 28px, 14px 14px;
    background-position: 0 0, 7px 7px;
  }

  /* ── diagonal-line accent bg ── */
  .crest-bg {
    background-color: ${NAVY};
    background-image:
      repeating-linear-gradient(45deg,  transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px),
      repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
  }

  /* ── cream dot-grid ── */
  .cream-bg {
    background-color: ${CREAM};
    background-image: radial-gradient(rgba(13,34,68,0.05) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  /* ── card base ── */
  .lan-card {
    background: #fff;
    border: 0.5px solid #e5ddd0;
    transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s, border-color 0.25s;
  }
  .lan-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(13,34,68,0.12); border-color: ${GOLD}; }

  /* ── benefit card ── */
  .ben-card {
    background: #fff;
    border: 0.5px solid #e5ddd0;
    padding: 36px 28px;
    text-align: center;
    transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
  }
  .ben-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(13,34,68,0.11); border-color: ${GOLD}; }

  /* ── service card ── */
  .svc-card {
    position: relative; overflow: hidden; cursor: pointer;
    border: 0.5px solid rgba(255,255,255,0.1);
    transition: transform 0.22s, box-shadow 0.22s;
  }
  .svc-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.25); }

  /* ── book thumb ── */
  .book-card { border: 0.5px solid #e5ddd0; overflow: hidden; background: #fff; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
  .book-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,34,68,0.14); border-color: ${GOLD}; }
  .book-card:hover .book-img { transform: scale(1.06); }
  .book-img { transition: transform 0.5s cubic-bezier(.4,0,.2,1); }

  /* ── testimonial card ── */
  .test-card { background: #fff; border: 0.5px solid #e5ddd0; padding: 32px; }

  /* ── gold divider ── */
  .gold-line { display: flex; align-items: center; gap: 14px; }
  .gold-line::before, .gold-line::after { content: ""; flex: 1; height: 1px; background: rgba(184,150,62,0.3); }

  /* ── primary btn ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; background: ${GOLD}; color: ${NAVY};
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase;
    border: none; cursor: pointer; text-decoration: none;
    transition: background 0.18s, transform 0.15s;
  }
  .btn-primary:hover { background: ${GOLDD}; transform: translateY(-1px); }

  /* ── ghost btn ── */
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 48px; background: transparent; color: #fff;
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    border: 0.5px solid rgba(255,255,255,0.35); cursor: pointer; text-decoration: none;
    transition: background 0.18s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.08); }

  /* ── navy btn ── */
  .btn-navy {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; background: ${NAVY}; color: #fff;
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    border: none; cursor: pointer; text-decoration: none;
    transition: background 0.18s, transform 0.15s;
  }
  .btn-navy:hover { background: #1a3560; transform: translateY(-1px); }

  /* ── stat strip item ── */
  .stat-item { flex: 1 1 120px; padding: 24px 20px; border-right: 0.5px solid rgba(184,150,62,0.12); }

  /* ── hide scrollbar ── */
  .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
  .sbar-none::-webkit-scrollbar { display: none; }

  /* ── animations ── */
  @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .anim-up   { animation: slideUp 0.6s cubic-bezier(.4,0,.2,1) both; }
  .anim-up-2 { animation: slideUp 0.6s .12s cubic-bezier(.4,0,.2,1) both; }
  .anim-up-3 { animation: slideUp 0.6s .24s cubic-bezier(.4,0,.2,1) both; }
  .anim-up-4 { animation: slideUp 0.6s .36s cubic-bezier(.4,0,.2,1) both; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pageTurn {
    0%,100% { transform:perspective(600px) rotateY(0deg); opacity:0; }
    20%,80%  { opacity:1; }
    50%      { transform:perspective(600px) rotateY(-120deg); opacity:0.7; }
  }
  @keyframes dotPulse {
    0%,100% { transform:scale(1); opacity:0.5; }
    50%      { transform:scale(1.3); opacity:1; }
  }

  /* ── loading ── */
  .page-turn { position:absolute; right:2px; width:calc(100% - 8px); height:calc(100% - 8px); top:4px;
    background:linear-gradient(to right,#e5e7eb,#f9fafb 50%,#fff); border-radius:0 4px 4px 0;
    transform-origin:left center; opacity:0; box-shadow:2px 0 8px rgba(0,0,0,0.1); animation:pageTurn 3s ease-in-out infinite; }
  .p1{animation-delay:0s} .p2{animation-delay:.15s} .p3{animation-delay:.3s}
  .dot-anim { animation:dotPulse 1.2s ease-in-out infinite; }

  /* ── feature check row ── */
  .feat-row { display:flex; align-items:flex-start; gap:14px; padding:18px 20px; border-bottom:0.5px solid #f0ebe0; }
  .feat-row:last-child { border-bottom:none; }
  .feat-icon { width:32px; height:32px; border:0.5px solid rgba(184,150,62,0.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }

  /* ── footer ── */
  .footer-link { font-size:13px; color:rgba(245,240,232,0.55); text-decoration:none; transition:color .15s; font-family:'Lato',sans-serif; }
  .footer-link:hover { color:${GOLD}; }

  @media (max-width: 640px) {
  .grid-2col { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
}
`;

/* ─── helper ─────────────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
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

/* ─── data ───────────────────────────────────────────────────── */
const STATS = [
  { val: "90M+", label: "Documents" },
  { val: "2.4M+", label: "Learners" },
  { val: "200+", label: "Institutions" },
  { val: "85%", label: "Revenue Share" },
];

const STUDENT_FEATURES = [
  { title: "Discover Specialized Content", body: "Course-specific books, lecture notes, and research documents tailored to your university curriculum." },
  { title: "Instant Knowledge Unlock", body: "Gain immediate digital access to materials that help you ace your exams and master your field." },
  { title: "Global Academic Reach", body: "Browse thousands of verified resources from top-performing students and academics worldwide." },
];

const FOOTER_COLUMNS = [
  {
    heading: "For Students",
    links: [
      { label: "AI Tutor", href: "/students/ai-tutor" },
      { label: "My Library", href: "/students/my-library" },
      { label: "How to Buy", href: "/students/how-to-buy" },
      { label: "Past Questions", href: "/students/past-questions" },
      { label: "Study Groups", href: "/students/study-groups" },
      { label: "Saved", href: "/students/wishlist" },
      { label: "Student Network", href: "/students/network" },
    ],
  },
  {
    heading: "For Sellers",
    links: [
      { label: "Seller Network", href: "/seller/network" },
      { label: "Upload Document", href: "/seller/upload-document" },
      { label: "LAN Wallet", href: "/seller/lan-wallet" },
      { label: "Withdraw Earnings", href: "/seller/withdraw-earnings" },
      { label: "Referral Programme", href: "/seller/referral" },
      { label: "Seller Dashboard", href: "/seller/seller-dashboard" },
      { label: "Recharge Services", href: "/seller/recharge-services" },
    ],
  },
  {
    heading: "For Faculty",
    links: [
      { label: "Faculty Network", href: "/faculty/network" },
      { label: "Faculty Verification", href: "/faculty/verify" },
      { label: "Upload Materials", href: "/faculty/upload" },
      { label: "Faculty Dashboard", href: "/faculty/dashboard" },
      { label: "Withdraw Earnings", href: "/faculty/withdraw" },
      { label: "Recharge Services", href: "/faculty/recharge" },
      { label: "Referral Programme", href: "/faculty/referral" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About LAN", href: "/about/lan" },
      { label: "Help Centre", href: "/lan/net/help-center" },
      { label: "Documentation", href: "/docs" },
      { label: "Invite a Friend", href: "/ref/invite-friends" },
      { label: "Social Impact", href: "/social-impart" },
      { label: "Privacy Policy", href: "/lan/privacy-policy" },
      { label: "Terms of Service", href: "/lan/terms-of-service" },
      { label: "User Agreement", href: "/user-agreement=lib" },
      { label: "Author Development Series", href: "/writers-mindset" },
    ],
  },
];

const NETWORKS = [
  {
    key: "student",
    href: "/students/network",
    image: "/stud2.png",           // swap to your real asset
    fallback: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    tag: "🎓 Student Network",
    tagColor: "#7c3aed",
    tagBg: "rgba(124,58,237,.15)",
    tagBorder: "rgba(124,58,237,.35)",
    title: "Learn Smarter,\nConnect Deeper",
    body: "Access 128,000+ documents, join study groups, post Bounty requests, and build your academic reputation — all in one place.",
    cta: "Explore Student Network",
    accent: "#7c3aed",
    overlayFrom: "rgba(124,58,237,.85)",
    overlayTo: "rgba(11,11,15,.95)",
  },
  {
    key: "seller",
    href: "/seller/network",
    image: "/LAN seller.png",
    fallback: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    tag: "📚 Seller Network",
    tagColor: "#b8963e",
    tagBg: "rgba(184,150,62,.15)",
    tagBorder: "rgba(184,150,62,.35)",
    title: "Turn Knowledge\nInto Income",
    body: "Upload once, earn forever. 2,400+ verified sellers already earning passive income from their academic materials.",
    cta: "Explore Seller Network",
    accent: "#b8963e",
    overlayFrom: "rgba(13,34,68,.88)",
    overlayTo: "rgba(13,34,68,.97)",
  },
  {
    key: "faculty",
    href: "/faculty/network",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    fallback: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800",
    tag: "🏛️ Faculty Network",
    tagColor: "#0f7173",
    tagBg: "rgba(15,113,115,.15)",
    tagBorder: "rgba(15,113,115,.35)",
    title: "Publish Beyond\nYour Classroom",
    body: "Verified lecturers and professors reach students across Africa and earn from course materials they already have.",
    cta: "Explore Faculty Network",
    accent: "#0f7173",
    overlayFrom: "rgba(10,85,87,.88)",
    overlayTo: "rgba(26,26,46,.97)",
  },
];

const SELLER_FEATURES = [
  { title: "Monetize Your Knowledge", body: "Turn your high-quality study guides, research papers, or written books into a steady stream of passive income." },
  { title: "Empower Your Peers", body: "Help fellow students succeed by sharing the resources that helped you excel." },
  { title: "Seamless Selling", body: "Upload once, set your price, and reach a global audience of 90M+ learners with automated payouts." },
];

const BENEFITS = [
  { emoji: "⚡", title: "Instant Seller Payout", body: "Get paid immediately after a buyer purchases your book, directly into your LAN wallet." },
  { emoji: "🔄", title: "Flexible Withdrawal", body: "Withdraw your earnings at any time that suits you, to any Nigerian bank account." },
  { emoji: "🚫", title: "No Hidden Charges", body: "Transfer your money without surprise fees. What you earn is what you get." },
  { emoji: "💰", title: "Earn Up to ₦500K Monthly", body: "Top sellers on LAN Library earn consistently, from small daily sales to large monthly payouts." },
];

const SERVICES = [
  { gradient: "linear-gradient(135deg,#ea580c,#c2410c)", emoji: "📱", title: "Airtime", sub: "Instant top-up for all networks", cta: "From ₦50" },
  { gradient: "linear-gradient(135deg,#1d4ed8,#1e40af)", emoji: "📶", title: "Cheap Data", sub: "SME bundles from ₦250", cta: "Save up to 40%" },
  { gradient: "linear-gradient(135deg,#16a34a,#15803d)", emoji: "⚡", title: "Electricity", sub: "Pay for your hostel units", cta: "All discos supported" },
  { gradient: "linear-gradient(135deg,#7c3aed,#6d28d9)", emoji: "📺", title: "TV / Cable", sub: "DSTV, GOTV & Startimes", cta: "Quick renewal" },
];

const TESTIMONIALS = [
  // Verified Sellers

  {
    name: "Tunde Bakare",
    role: "Verified Seller",
    text: "LAN gave me a platform to monetise years of study materials. My balance keeps growing while I sleep.",
  },
  // Verified Faculty
  {
    name: "Dr. Ngozi Ibe",
    role: "Verified Faculty",
    text: "My students can now access my recommended reading directly on LAN. It has transformed my lectures.",
  },
  {
    name: "Prof. Abiodun Salami",
    role: "Verified Faculty",
    text: "I uploaded my course materials once and students across Nigeria are benefiting. LAN is a game changer.",
  },
  {
    name: "Bar. Justice Mercy",
    role: "Verified Faculty",
    text: "I uploaded my 400-level Economics lecture notes on LAN Library and within two weeks, students from three African universities had purchased them.It's the most rewarding thing I've done outside the classroom.",
  },
];


function NetworkCardsSection() {
  return (
    <section style={{ background: BG, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── header ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".22em",
            textTransform: "uppercase", color: GOLD, marginBottom: 12,
            fontFamily: "'Lato',sans-serif",
          }}>
            The LAN Ecosystem
          </p>
          <h2 className="lan-serif" style={{
            fontSize: "clamp(30px,4vw,52px)", fontWeight: 700,
            color: NAVY, margin: "0 0 14px", lineHeight: 1.08,
          }}>
            Three Networks.{" "}
            <span style={{ color: GOLD, fontStyle: "italic" }}>One Platform.</span>
          </h2>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
  <p style={{
    fontSize: "16px", 
    color: "#555555", 
    maxWidth: "540px",
    margin: "0 auto 16px auto", 
    lineHeight: "1.6", 
    fontWeight: "400",
    fontFamily: "'Lato', sans-serif"
  }}>
    Think of the entire LAN platform as a large <strong>Academic Airport</strong>, where these three networks are the different groups of people making it run:
  </p>
  
  <p style={{
    fontSize: "15px", 
    color: NAVY, 
    maxWidth: "460px",
    margin: "0 auto 30px auto", 
    lineHeight: "1.8", 
    fontWeight: "300",
    fontFamily: "'Lato', sans-serif"
  }}>
    A student in the 
    <a href="/students/network" style={{ color: NAVY, textDecoration: "underline", fontWeight: "700", marginLeft: "4px", marginRight: "4px" }}>
      Student Network
    </a> 
    buys a document created by a graduate in the 
    <a href="/seller/network" style={{ color: NAVY, textDecoration: "underline", fontWeight: "700", marginLeft: "4px", marginRight: "4px" }}>
      Seller Network
    </a>, 
    which might be vetted or supplemented by resources from a professor in the 
    <a href="/faculty/network" style={{ color: NAVY, textDecoration: "underline", fontWeight: "700", marginLeft: "4px" }}>
      Faculty Network
    </a>.         
  </p>
</div>
        </div>

        {/* ── cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {NETWORKS.map(n => (
            <a
              key={n.key}
              href={n.href}
              style={{
                display: "block", textDecoration: "none",
                position: "relative", overflow: "hidden",
                border: "0.5px solid #e5ddd0",
                transition: "transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s",
                minHeight: 440,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 24px 56px rgba(13,34,68,.16)";
                e.currentTarget.querySelector(".net-img").style.transform = "scale(1.07)";
                e.currentTarget.querySelector(".net-cta").style.gap = "14px";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.querySelector(".net-img").style.transform = "scale(1)";
                e.currentTarget.querySelector(".net-cta").style.gap = "8px";
              }}
            >
              {/* background image */}
              <img
                src={n.image}
                alt={n.tag}
                className="net-img"
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  transition: "transform .55s cubic-bezier(.4,0,.2,1)",
                }}
                onError={e => { e.target.src = n.fallback; }}
              />

              {/* gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(to top, ${n.overlayTo} 10%, ${n.overlayFrom} 40%, rgba(0,0,0,.2) 100%)`,
              }} />

              {/* content */}
              <div style={{
                position: "relative", zIndex: 2,
                height: "100%", minHeight: 440,
                display: "flex", flexDirection: "column",
                justifyContent: "flex-end",
                padding: "28px 28px 32px",
              }}>
                {/* top tag */}
                <div style={{ position: "absolute", top: 24, left: 28 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: ".14em",
                    textTransform: "uppercase", fontFamily: "'Lato',sans-serif",
                    color: n.tagColor, background: n.tagBg,
                    border: `1px solid ${n.tagBorder}`,
                    padding: "5px 14px",
                  }}>
                    {n.tag}
                  </span>
                </div>

                {/* title */}
                <h3 className="lan-serif" style={{
                  fontSize: "clamp(24px,2.8vw,34px)", fontWeight: 700,
                  color: "#fff", lineHeight: 1.15, marginBottom: 12,
                  whiteSpace: "pre-line",
                }}>
                  {n.title}
                </h3>

                {/* body */}
                <p style={{
                  fontSize: 13, color: "rgba(245,240,232,.65)",
                  lineHeight: 1.8, marginBottom: 22,
                  fontFamily: "'Lato',sans-serif", fontWeight: 300,
                  maxWidth: 320,
                }}>
                  {n.body}
                </p>

                {/* cta row */}
                <div
                  className="net-cta"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
                    textTransform: "uppercase", color: n.accent,
                    fontFamily: "'Lato',sans-serif",
                    transition: "gap .2s",
                    borderTop: `1px solid rgba(255,255,255,.1)`,
                    paddingTop: 16,
                  }}
                >
                  {n.cta}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke={n.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const currentYear = new Date().getFullYear();
  const [showPresentation, setShowPresentation] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const heroImages = ["/lanstu.png"];

  /* auth guard */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/home");
      else setTimeout(() => setLoading(false), 1400);
    });
    return () => unsub();
  }, [router]);

  /* hero auto-play */
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(p => (p + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* fetch books */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "advertMyBook"));
        const books = [];
        snap.forEach(d => {
          const data = d.data();
          if (!data.bookTitle) return;
          const b = {
            id: `firestore-${d.id}`, firestoreId: d.id,
            title: data.bookTitle, author: data.author || "Unknown",
            price: Number(data.price) || 0,
            driveFileId: data.driveFileId, pdfUrl: data.pdfUrl, embedUrl: data.embedUrl,
            rating: (4 + Math.random()).toFixed(1),
          };
          b.image = getThumbnailUrl(b);
          books.push(b);
        });
        setFeaturedBooks(books.sort(() => 0.5 - Math.random()));
      } catch { }
      finally { setLoadingBooks(false); }
    })();
  }, []);

  const goSignIn = () => router.push("/auth/signin");

  /* ── LOADING SCREEN ── */
  if (loading) return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="hero-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
        {/* wordmark */}
        <div className="anim-up" style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.12)", border: "1px solid rgba(184,150,62,0.25)", borderRadius: 999, padding: "7px 18px", marginBottom: 20 }}>
            <Sparkles size={12} style={{ color: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Africa's #1 Student Library</span>
          </div>
          <h1 className="lan-serif" style={{ fontSize: "clamp(36px,8vw,72px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>
            LAN <span style={{ color: GOLD, fontStyle: "italic" }}>Library</span>
          </h1>
          <p style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", marginTop: 8, fontFamily: "'Lato',sans-serif", letterSpacing: ".14em", textTransform: "uppercase" }}>
            The Global Student Library
          </p>
        </div>

        {/* animated book */}
        <div style={{ position: "relative", width: 88, height: 104 }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${NAVY},#1a3560)`, borderRadius: 8, boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: "rgba(0,0,0,0.3)", borderRadius: "8px 0 0 8px" }} />
            <div className="page-turn p1" />
            <div className="page-turn p2" />
            <div className="page-turn p3" />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={36} style={{ color: GOLD }} strokeWidth={1.5} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.15),transparent)", borderRadius: 8, pointerEvents: "none" }} />
          </div>
          <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="dot-anim" style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );

  /* ── MAIN PAGE ── */
  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="lan-landing">

        {/* ══════ HEADER ══════ */}
        <header className="hero-bg" style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "0.5px solid rgba(184,150,62,0.18)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
            {/* wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/lanlog.png" alt="LAN" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `1px solid rgba(184,150,62,0.3)` }} />
              <div>
                <div className="lan-serif" style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>LAN Library</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", fontFamily: "'Lato',sans-serif" }}>The Global Student Library</div>
              </div>
            </div>
          </div>
        </header>

        {/* ══════ HERO ══════ */}
        <section className="hero-bg" style={{ position: "relative", minHeight: 680, overflow: "hidden" }}>
          {/* image layer */}
          <AnimatePresence mode="wait">
            <motion.div key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
              style={{ position: "absolute", inset: 0 }}>
              <img src={heroImages[heroIdx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .49 }} />
            </motion.div>
          </AnimatePresence>

          {/* content */}
          <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "96px 24px 80px" }}>
            {/* eyebrow */}
            <div className="anim-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", borderRadius: 999, padding: "7px 16px", marginBottom: 28 }}>
              <Sparkles size={13} style={{ color: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Africa's #1 Student Library</span>
            </div>

            <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(44px,8vw,88px)", fontWeight: 900, color: "#fff", lineHeight: 1.02, letterSpacing: "-2px", margin: "0 0 12px" }}>
              Share the wealth
            </h1>
            <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(44px,8vw,88px)", fontWeight: 900, color: GOLD, fontStyle: "italic", lineHeight: 1.02, letterSpacing: "-2px", margin: "0 0 28px" }}>
              [of knowledge].
            </h1>

            <p className="anim-up-3" style={{ fontSize: 17, color: "rgba(245,240,232,0.7)", maxWidth: 560, lineHeight: 1.8, fontWeight: 300, margin: "0 0 12px" }}>
              Turn your books into income. Upload your work, reach a global audience of{" "}
              <strong style={{ color: "#fff", fontWeight: 700 }}>90M+</strong> learners,
              and earn whenever readers discover and purchase your content.{" "}
            </p>
         <p className="anim-up-3" style={{ fontSize: 17, color: "rgba(245,240,232,0.7)", maxWidth: 560, lineHeight: 1.8, fontWeight: 300, margin: "0 0 44px" }}>
            Join an ecosystem of thousands of members across Africa. Whether you are collaborating in the Student Network, earning in the Seller Network, or publishing verified resources in the Faculty Network, you can share strategies, request feedback, and grow together in the LAN Community hub.{" "}
           <button onClick={() => setShowNetworkModal(true)} style={{ color: GOLDD, fontWeight: 100, textDecoration: "underline", textUnderlineOffset: 9, background: "none", border: "none", cursor: "pointer", fontSize: 17 }}>
              Learn more
            </button>
          </p>

            <div className="anim-up-4" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button className="btn-primary" onClick={goSignIn}>
                Create Account <ArrowRight size={14} />
              </button>
              <a style={{ color: GOLD, background: NAVY }} href="/docs" className="btn-ghost font-extrabold">
                Documentation
              </a>

            </div>


            {/* stats strip */}
            <div style={{ marginTop: 64, borderTop: "0.5px solid rgba(184,150,62,0.2)", display: "flex", flexWrap: "wrap" }}>
              {STATS.map(({ val, label }) => (
                <div key={label} className="stat-item">
                  <div className="lan-serif" style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: 4, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <NetworkCardsSection />

        {/* ══════ FOR STUDENTS ══════ */}
        <section style={{ background: "#fff", padding: "96px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 56, alignItems: "center" }}>

            {/* text col */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>For Students & Learners</p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>
                Every document<br /><span style={{ color: GOLD, fontStyle: "italic" }}>your campus needs.</span>
              </h2>
              <div className="gold-line" style={{ maxWidth: 220, margin: "0 0 32px" }}>
                <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>

              <div className="lan-card" style={{ marginBottom: 24 }}>
                {STUDENT_FEATURES.map(({ title, body }) => (
                  <div key={title} className="feat-row">
                    <div className="feat-icon"><CheckCircle size={15} style={{ color: GOLD }} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>{title}</div>
                      <div style={{ fontSize: 12, color: "#888", lineHeight: 1.65, fontFamily: "'Lato',sans-serif" }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-navy" onClick={goSignIn}>
                <BookOpenText size={14} /> Start Learning
              </button>
            </div>

            {/* image col */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 200, height: 200, background: `radial-gradient(circle, rgba(184,150,62,0.12), transparent 70%)`, zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1, border: `0.5px solid #e5ddd0`, overflow: "hidden" }}>
                <img src="/studs.png" alt="Students using LAN Library"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                  onError={e => { e.target.src = "/stud2.png"; }}
                />
                {/* overlay badge */}
                <div style={{ position: "absolute", bottom: 1, left: 1, background: NAVY, padding: "12px 18px", display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Students Active Now</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Lato',sans-serif" }}>Reading purchased books · Browsing materials</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ FOR SELLERS ══════ */}
        <section className="cream-bg" style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 56, alignItems: "center" }}>

            {/* image col — reversed order on desktop via order */}
            <div style={{ position: "relative", order: 0 }}>
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 220, height: 220, background: `radial-gradient(circle, rgba(22,163,74,0.1), transparent 70%)`, zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1, border: `0.5px solid #e5ddd0`, overflow: "hidden" }}>
                <img src="/LAN seller.png" alt="Seller earning on LAN Library"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 1, left: 1, background: "#16a34a", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: "'Lato',sans-serif" }}>Sellers Earning Now</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "'Lato',sans-serif" }}>Uploading content · Processing transactions</span>
                </div>
              </div>
            </div>

            {/* text col */}
            <div style={{ order: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "#16a34a", marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>For Sellers · Students & Authors</p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>
                Monetize your<br /><span style={{ color: "#16a34a", fontStyle: "italic" }}>expertise.</span>
              </h2>
              <div className="gold-line" style={{ maxWidth: 220, margin: "0 0 32px" }}>
                <div style={{ width: 8, height: 8, background: "#16a34a", transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>

              <div className="lan-card" style={{ marginBottom: 24 }}>
                {SELLER_FEATURES.map(({ title, body }) => (
                  <div key={title} className="feat-row">
                    <div className="feat-icon" style={{ border: "0.5px solid rgba(22,163,74,0.3)" }}><CheckCircle size={15} style={{ color: "#16a34a" }} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>{title}</div>
                      <div style={{ fontSize: 12, color: "#888", lineHeight: 1.65, fontFamily: "'Lato',sans-serif" }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={goSignIn}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background .18s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
                onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}>
                <Upload size={14} /> Start Selling
              </button>
            </div>
          </div>
        </section>

        {/* ══════ FOR LECTURERS ══════ */}
        <section style={{ background: "#fff", padding: "96px 24px", borderTop: "0.5px solid #e5ddd0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* ── Top Label ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ height: "0.5px", width: 32, background: "rgba(184,150,62,0.4)" }} />
              <svg width="9" height="9" viewBox="0 0 9 9">
                <rect x="1" y="1" width="7" height="7" fill="none" stroke={GOLD} strokeWidth="1.2" transform="rotate(45 4.5 4.5)" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>For Lecturers & Faculty</span>
              <svg width="9" height="9" viewBox="0 0 9 9">
                <rect x="1" y="1" width="7" height="7" fill="none" stroke={GOLD} strokeWidth="1.2" transform="rotate(45 4.5 4.5)" />
              </svg>
              <div style={{ height: "0.5px", flex: 1, background: "rgba(184,150,62,0.4)" }} />
            </div>

            {/* ── Two-Column Layout ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 56, alignItems: "center" }}>

              {/* ── LEFT: text ── */}
              <div>
                <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: NAVY, margin: "0 0 6px", lineHeight: 1.08 }}>
                  The Faculty
                </h2>
                <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,52px)", fontWeight: 900, color: GOLD, fontStyle: "italic", margin: "0 0 20px", lineHeight: 1.08 }}>
                  Podium.
                </h2>
                <p style={{ fontSize: 15, color: "#777", lineHeight: 1.85, maxWidth: 460, fontWeight: 300, fontFamily: "'Lato',sans-serif", marginBottom: 32 }}>
                  Publish your course materials. Build your academic legacy across Africa.
                  Earn from the knowledge you've spent years developing — one upload,
                  millions of students.
                </p>

                {/* Feature rows */}
                <div className="lan-card"
                  style={{ border: "0.5px solid #e5ddd0", background: "#fff", marginBottom: 32 }}>
                  {[
                    {
                      icon: <BookOpen size={15} style={{ color: GOLD }} />,
                      title: "Publish Course Materials",
                      body: "Lecture notes, syllabi, past questions, and full course packs — organised by course code, semester, and level.",
                    },
                    {
                      icon: <DollarSign size={15} style={{ color: "#16a34a" }} />,
                      title: "Earn Passive Income",
                      body: "Set your own price. Earn every time a student downloads your material. Your life's work keeps paying.",
                    },
                    {
                      icon: <Users size={15} style={{ color: "#7c3aed" }} />,
                      title: "Reach Beyond Your Class",
                      body: "Your materials reach students at universities, polytechnics, and secondary schools across the continent.",
                    },
                    {
                      icon: <Shield size={15} style={{ color: "#0891b2" }} />,
                      title: "Faculty Verified Badge",
                      body: "Get officially verified. Your materials display your institution, rank, and department — establishing trust instantly.",
                    },
                  ].map(({ icon, title, body }, i, arr) => (
                    <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 20px", borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none" }}>
                      <div style={{ width: 32, height: 32, border: "0.5px solid rgba(184,150,62,0.25)", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>{title}</div>
                        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.65, fontFamily: "'Lato',sans-serif" }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <button
                    onClick={goSignIn}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background .18s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1a3560"}
                    onMouseLeave={e => e.currentTarget.style.background = NAVY}
                  >
                    <GraduationCap size={15} /> Join Faculty Podium
                  </button>
                  <button
                    onClick={goSignIn}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "transparent", color: NAVY, fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase", border: "0.5px solid #e5ddd0", cursor: "pointer", transition: "background .18s" }}
                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Upload size={15} /> Upload Materials
                  </button>
                </div>
              </div>

              {/* ── RIGHT: visual stack ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Image with testimonial overlay */}
                <div style={{ position: "relative", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                  <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                    alt="Lecturer at podium"
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800"; }}
                  />

                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,34,68,0.95) 0%, rgba(13,34,68,0.45) 50%, transparent 100%)" }} />

                  {/* Testimonial on image bottom */}
                  <div style={{ position: "absolute", bottom: -20, left: 0, right: 0, padding: "24px 24px 20px" }}>
                    <div className="lan-serif" style={{ fontSize: 56, color: "rgba(184,150,62,0.4)", lineHeight: 1, marginBottom: -6, userSelect: "none" }}>"</div>
                    <p className="lan-serif" style={{ fontSize: "clamp(13px,1.6vw,15px)", fontStyle: "italic", color: "rgba(245,240,232,0.92)", margin: "0 0 16px", lineHeight: 1.5, }}>
                      "I uploaded my 400-level Economics lecture notes in LAN Library and within two weeks, students from three African universities had purchased them. It's the most rewarding thing I've done outside the classroom."
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "0.5px solid rgba(184,150,62,0.25)", paddingTop: 14 }}>
                      <div style={{ width: 38, height: 38, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>LAN</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>Barr. Justice Mercy</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 10, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
                          Verified Faculty ·
                        </div>
                      </div>
                    </div>

                  </div>
                  {/* Top-left status badge */}
                  <div style={{ position: "absolute", top: 2, left: 2, background: NAVY, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Faculty Active Now</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Lato',sans-serif" }}>Publishing content · Earning monthly</span>
                  </div>

                </div>

                {/* How it works strip */}
                <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "24px 24px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: 16, fontFamily: "'Lato',sans-serif" }}>
                    How it works
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      "Apply for Faculty Verification",
                      "Upload your course materials",
                      "Set pricing — free or paid",
                      "Students discover & purchase",
                      "Earnings paid monthly",
                    ].map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 22, height: 22, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{i + 1}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(245,240,232,0.75)", margin: 0, lineHeight: 1.5, fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>


        {/* ══════ APP SHOWCASE BANNER ══════ */}
        <section className="crest-bg" style={{ padding: "88px 24px", overflow: "hidden" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 48, alignItems: "center" }}>
            {/* text */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 16, fontFamily: "'Lato',sans-serif" }}>One Smart Platform</p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: 900, color: "#fff", lineHeight: 1, margin: "0 0 20px", letterSpacing: "-2px" }}>
                Knowledge<br />that works<br />for every<br /><span style={{ color: GOLD, fontStyle: "italic" }}>student.</span>
              </h2>
              <p style={{ fontSize: 15, color: "rgba(245,240,232,0.55)", lineHeight: 1.8, maxWidth: 400, marginBottom: 36, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                Buy, sell, and access books instantly. Stay ahead with one smart library built for African scholars.
              </p>
              <button className="btn-primary" onClick={goSignIn} style={{ fontSize: 14, padding: "16px 32px" }}>
                Create Account <ArrowRight size={15} />
              </button>
            </div>

            {/* screenshot */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -2, background: `linear-gradient(135deg,${GOLD},transparent,${GOLD})`, borderRadius: 42, opacity: .4 }} />
                <img src="/dashboard.png" alt="LAN Library App"
                  style={{ position: "relative", width: "clamp(260px,40vw,460px)", borderRadius: 40, boxShadow: "0 40px 80px rgba(0,0,0,0.5)", display: "block" }}
                  onError={e => { e.target.style.display = "none"; }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════ KEY BENEFITS ══════ */}
        <section style={{ background: "#fff", padding: "96px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>Why LAN Library</p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>Key Benefits</h2>
              <div className="gold-line" style={{ maxWidth: 200, margin: "0 auto 16px" }}>
                <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: 14, color: "#888", maxWidth: 500, margin: "0 auto", lineHeight: 1.75, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                Our payment system is designed for sellers who need fast, reliable access to their earnings.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
              {BENEFITS.map(({ emoji, title, body }) => (
                <div key={title} className="ben-card">
                  <div style={{ width: 72, height: 72, border: `0.5px solid rgba(184,150,62,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
                    {emoji}
                  </div>
                  <h3 className="lan-serif" style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{title}</h3>
                  <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, fontFamily: "'Lato',sans-serif" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CAMPUS SERVICES ══════ */}
        <section className="cream-bg" style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* header */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <img src="/lanlog.png" alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 20px", border: `1px solid rgba(184,150,62,0.3)`, display: "block" }} />
              <div style={{ display: "inline-block", background: NAVY, color: "#fff", padding: "6px 20px", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", marginBottom: 16 }}>
                Beyond Books
              </div>
              <h2 className="lan-serif" style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>
                Campus Life <span style={{ color: GOLD, fontStyle: "italic" }}>Made Easy.</span>
              </h2>
              <p style={{ fontSize: 15, color: "#888", maxWidth: 520, margin: "0 auto", lineHeight: 1.75, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                Buy books, sell notes, and recharge everything — all in one platform built for students.
              </p>
            </div>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
              {SERVICES.map(({ gradient, emoji, title, sub, cta }) => (
                <div key={title} className="svc-card" style={{ background: gradient, padding: "36px 28px", borderRadius: 0 }}>
                  {/* decorative circles */}
                  <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: "50%", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -30, left: -30, width: 90, height: 90, background: "rgba(255,255,255,0.06)", borderRadius: "50%", pointerEvents: "none" }} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ width: 60, height: 60, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 18 }}>
                      {emoji}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{title}</h3>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 20px", fontFamily: "'Lato',sans-serif" }}>{sub}</p>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "'Lato',sans-serif", letterSpacing: ".08em" }}>
                      {cta} →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* trust badges */}
            <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 32 }}>
              {["Instant Delivery", "100% Secure", "24/7 Support", "Best Rates"].map(badge => (
                <div key={badge} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ FEATURED BOOKS ══════ */}
        {!loadingBooks && featuredBooks.length > 0 && (
          <section style={{ background: "#fff", padding: "96px 24px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>Community Uploads</p>
                <h2 className="lan-serif" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Featured Books</h2>
                <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>Recently published by our community of scholars</p>
              </div>

              <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
                {featuredBooks.slice(0, 6).map(book => (
                  <button key={book.id} className="book-card" onClick={goSignIn} style={{ background: "#fff", border: "none", textAlign: "left", cursor: "pointer", display: "block", width: "100%" }}>
                    <div style={{ position: "relative", background: "#ede8df" }}>
                      <img src={book.image} alt={book.title} className="book-img"
                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                        onError={e => { e.target.src = "/lanlog.png"; }}
                      />
                      <div style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 4, background: NAVY, padding: "3px 8px", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> PDF
                      </div>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.5),transparent)", opacity: 0, transition: "opacity .2s", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 12 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>Sign in to view</span>
                      </div>
                    </div>
                    <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                      <h4 className="lan-serif" style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                      <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={11} style={{ color: GOLD, fill: GOLD }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{book.rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ TESTIMONIALS ══════ */}
        <section className="cream-bg" style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: 1500, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>Social Proof</p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.15 }}>
                Over <span style={{ color: GOLD, fontStyle: "italic" }}>10,000+ people</span><br />love us. You will too.
              </h2>

              {/* Role legend */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 24 }}>
                {[
                  { role: "Verified Seller", color: "#16a34a", bg: "rgba(22,163,74,.1)", border: "rgba(22,163,74,.3)" },
                  { role: "Verified Faculty", color: NAVY, bg: "rgba(13,34,68,.07)", border: "rgba(13,34,68,.2)" },
                ].map(({ role, color, bg, border }) => (
                  <div key={role} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: bg, border: `0.5px solid ${border}`,
                    padding: "4px 12px", fontSize: 10, fontWeight: 700,
                    color, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em"
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
                    {role}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}>
              {TESTIMONIALS.map(({ name, role, text }) => {
                const roleMeta = {
                  "Verified Seller": { color: "#16a34a", bg: "rgba(22,163,74,.08)", border: "rgba(22,163,74,.25)" },
                  "Verified Faculty": { color: NAVY, bg: "rgba(13,34,68,.07)", border: "rgba(13,34,68,.2)" },
                };
                const meta = roleMeta[role] || roleMeta["Verified User"];

                return (
                  <div key={name} className="test-card lan-card">
                    <div className="lan-serif" style={{ fontSize: 64, color: CREAM, lineHeight: 1, marginBottom: -16 }}>"</div>
                    <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginBottom: 24, fontFamily: "'Lato',sans-serif" }}>{text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "0.5px solid #f0ebe0", paddingTop: 18 }}>
                      <div style={{ width: 40, height: 40, background: NAVY, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        <img src="/lanlog.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{name}</div>
                        {/* Dynamic role badge */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3,
                          fontSize: 10, fontWeight: 700, color: meta.color,
                          background: meta.bg, border: `0.5px solid ${meta.border}`,
                          padding: "2px 8px", fontFamily: "'Lato',sans-serif", letterSpacing: ".06em",
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color, display: "inline-block", flexShrink: 0 }} />
                          {role}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
              {/* video card */}
              <a href="/presentation"
                style={{ position: "relative", minHeight: 240, border: "0.5px solid #e5ddd0", overflow: "hidden", cursor: "pointer", background: "none" }}>
                <img src="/LAN seller.png" alt="Watch video" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.background = NAVY; e.target.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(13,34,68,0.55)" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                  <div style={{ width: 68, height: 68, background: "rgba(255,255,255,0.92)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .2s", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                    <Play size={26} style={{ color: NAVY, fill: NAVY, marginLeft: 4 }} />
                  </div>
                  <img src="/lanlog.png" alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(184,150,62,0.4)" }} />
                </div>
                <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="lan-serif" style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>How to Monetize Your Knowledge on LAN Library</span>
                </div>
              </a>

            </div>

            <div style={{ textAlign: "center" }}>
              <a href="/learn/make-money" target="_blank" className="btn-navy" style={{ textDecoration: "none", display: "inline-flex" }}>
                Watch More Videos <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="crest-bg" style={{ padding: "46px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
            <Star size={14} style={{ color: GOLD, fill: GOLD }} />
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
          </div>

          <h2 className="lan-serif" style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 700, color: "#fff", margin: "0 0 16px", lineHeight: 1.1 }}>
            Ready to <span style={{ color: GOLD, fontStyle: "italic" }}>Start Earning?</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.8, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
            Join thousands of sellers making money with their knowledge. Get 85% revenue share on every sale.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 56 }}>
            <button className="btn-primary" onClick={goSignIn} style={{ fontSize: 14, padding: "16px 32px" }}>
              <Upload size={15} /> Start Selling Now
            </button>
            <button className="btn-ghost" onClick={goSignIn} style={{ fontSize: 14, padding: "12px 32px" }}>
              <Search size={15} /> Browse Books
            </button>
          </div>
        </section>

        <footer
          className="hero-bg"
          style={{
            padding: "64px 16px 32px",
            borderTop: "0.5px solid rgba(184,150,62,0.15)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 32,
                marginBottom: 48,
              }}
            >
              {/* BRAND */}
              <div>
                <div className="lan-serif" style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                  LAN Library
                </div>
                <p style={{ fontSize: 12, color: "rgba(245,240,232,0.4)", lineHeight: 1.7, maxWidth: 260, fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>
                  Africa's #1 Student Library. Share the wealth of knowledge with 90M+ learners worldwide.
                </p>
              </div>

              {/* FOOTER COLUMNS — this is all you need, delete the stray <ul> below */}
              {FOOTER_COLUMNS.map(({ heading, links }) => (
                <div key={heading}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: ".18em",
                    textTransform: "uppercase", color: GOLD, marginBottom: 18,
                    fontFamily: "'Lato',sans-serif"
                  }}>
                    {heading}
                  </div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <a href={href} className="footer-link">{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM */}
          <div style={{
            borderTop: "0.5px solid rgba(184,150,62,0.15)",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            maxWidth: 1200,
            margin: "0 auto",
          }}>
            <p style={{ fontSize: 12, color: "rgba(245,240,232,0.35)", fontFamily: "'Lato',sans-serif" }}>
              © 2026 LAN Library — Learning Access Network. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: "'Lato',sans-serif" }}>
                All systems operational
              </span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: "'Lato',sans-serif", paddingTop: 24, textAlign: "center" }}>
            <p>LAN Library is operated by Learning Access Network Ltd., a digital academic resource platform dedicated to connecting African students and educators with quality learning materials. We are headquartered in Abuja, Nigeria, and serve learners within the African continent.</p>
          </div>

        </footer>

      {/* ══════ VIDEO MODAL ══════ */ }
  {
    showVideo && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        onClick={() => setShowVideo(false)}>
        <button onClick={() => setShowVideo(false)}
          style={{ position: "fixed", top: 20, right: 20, width: 44, height: 44, background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
          <X size={20} />
        </button>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 900, maxHeight: "80vh" }}>
          <video src="/presentation" controls autoPlay style={{ width: "100%", maxHeight: "80vh", display: "block" }} />
        </div>
      </div>
    )
  }
      </div >
      {showNetworkModal && <NetworkModal onClose={() => setShowNetworkModal(false)} />}
    </>
  );
}