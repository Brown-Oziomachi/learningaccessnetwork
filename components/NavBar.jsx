"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  User,
  Menu,
  X,
  Upload,
  ChevronDown,
  LogOut,
  Bookmark,
  Book,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Crown,
  FileText,
  FileQuestion,
  GraduationCap,
  List,
  ClipboardList,
  PenTool,
  Folder,
  Home,
  WifiOff,
  ShoppingBag,
  Sparkle,
  BookOpenIcon,
  Copy,
  Globe2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { booksData } from "@/lib/booksData";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { createPortal } from "react-dom";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const searchTags = [
  { name: "Textbook", description: "Standard educational books", icon: Book },
  {
    name: "Lecture Note",
    description: "Summarized class materials",
    icon: FileText,
  },
  {
    name: "Past Question",
    description: "Previous exam papers",
    icon: FileQuestion,
  },
  {
    name: "Thesis",
    description: "Academic research papers",
    icon: GraduationCap,
  },
  { name: "Summary", description: "Quick study breakdowns", icon: List },
  { name: "Syllabus", description: "Course requirements", icon: ClipboardList },
  {
    name: "Course Outline",
    description: "Topic distributions",
    icon: BookOpen,
  },
  {
    name: "Assignment",
    description: "Practice tasks and projects",
    icon: PenTool,
  },
  { name: "Project", description: "Detailed student projects", icon: Folder },
];

const NAV_CATS = [
  { key: "education", label: "Education" },
  { key: "business", label: "Business" },
  { key: "technology", label: "Technology" },
  { key: "science", label: "Science" },
  {
    key: "sexeducation",
    label: "Sex Education",
    href: "/category/sex-education",
  },
];

const SAVED_MENU_ITEMS = [
  {
    icon: Bookmark,
    label: "Saved Books",
    description: "Your saved library collection",
    href: "/saved-my-book",
    color: GOLD,
  },
  {
    icon: ShoppingBag,
    label: "Explore Sellers",
    description: "Browse document from sellers",
    href: "/lan-sellers/en/@/lib",
    color: GOLD,
  },
  {
    icon: Crown,
    label: "Follow Lecturers",
    description: "Follow your favourite lecturer",
    href: "/lecturers",
    color: GOLD,
  },
  {
    icon: Globe2,
    label: "Invite Friends",
    description: "Refer friends & earn 500",
    href: "/ref/invite-friends",
    color: GOLD,
  },
  {
    icon: Copy,
    label: "Your Public Link",
    description: "Showcase your profile",
    href: "/my-account/seller-account/share-profile",
    color: GOLD,
  },
  {
    icon: Sparkle,
    label: "Ask AI",
    description: "Get summaries & Book concept",
    href: "/ai-chat",
    color: GOLD,
  },
 
];

const MORE_TOOLS_ITEMS = [
  {
    icon: HelpCircle,
    label: "Help Center",
    description: "Guides & support articles",
    href: "/lan/net/help-center",
    color: GOLD,
  },
  {
    icon: FileText,
    label: "Bounty Board-ABB",
    description: "Request missing study materials",
    href: "/academic/bounty/board",
    color: GOLD,
  },
  {
    icon: GraduationCap,
    label: "Open Resources",
    description: "Free academic materials",
    href: "/open-access",
    color: GOLD,
  },
   {
    icon: Video,
    label: "Watch More Videos",
    description: "Step-by-Step Tutorials",
    href: "/learn/make-money",
    color: GOLD,
  },
];

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [showSearchTags, setShowSearchTags] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true,
  );
  const [announcement, setAnnouncement] = useState(null);
  const [showSavedMenu, setShowSavedMenu] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const savedMenuRef = useRef(null);
  const savedBtnRef = useRef(null);
  const savedMenuTimer = useRef(null);
  const moreToolsRef = useRef(null);
  const moreToolsTriggerRef = useRef(null);
  const moreToolsTimer = useRef(null);
  const catButtonRefs = useRef({});
  const searchTagsRef = useRef(null);
  const dropdownTimer = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const ref = doc(db, "siteSettings", "announcement");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAnnouncement(d.active ? d : null);
      } else setAnnouncement(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(
          collection(db, "advertMyBook"),
          where("status", "==", "approved"),
        );
        const snap = await getDocs(q);
        const firestoreBooks = [];
        snap.forEach((d) => {
          const data = d.data();
          firestoreBooks.push({
            id: `firestore-${d.id}`,
            title: data.bookTitle,
            author: data.author,
            category: data.category,
            price: data.price,
            rating: 4.5,
          });
        });
        setAllBooks([...booksData, ...firestoreBooks]);
      } catch {
        setAllBooks(booksData);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      setUser(cu);
      if (cu) {
        try {
          setCheckingSeller(true);
          const ud = await getDoc(doc(db, "users", cu.uid));
          setIsSeller(ud.exists() ? ud.data().isSeller === true : false);
        } catch {
          setIsSeller(false);
        } finally {
          setCheckingSeller(false);
        }
      } else {
        setIsSeller(false);
        setCheckingSeller(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchTagsRef.current && !searchTagsRef.current.contains(e.target))
        setShowSearchTags(false);
    };
    if (showSearchTags) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSearchTags]);

  useEffect(() => {
    const handler = (e) => {
      if (
        savedMenuRef.current &&
        !savedMenuRef.current.contains(e.target) &&
        savedBtnRef.current &&
        !savedBtnRef.current.contains(e.target)
      )
        setShowSavedMenu(false);
    };
    if (showSavedMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSavedMenu]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch {
      alert("Failed to logout. Please try again.");
    }
  };

  const HandleClick = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    router.push(isSeller ? "/upload-document" : "/become-seller");
  };

  const handleMyAccountClick = async () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        router.push("/role-selection");
        return;
      }
      const data = snap.data();
      if (!data.role) {
        router.push("/role-selection");
        return;
      }
      if (data.role === "student") router.push("/student/dashboard");
      else if (data.role === "seller" || data.isSeller)
        router.push("/my-account/seller-account");
      else router.push("/");
    } catch {
      router.push("/");
    }
  };

  const openSavedMenu = () => {
    clearTimeout(savedMenuTimer.current);
    setShowSavedMenu(true);
  };
  const closeSavedMenu = () => {
    savedMenuTimer.current = setTimeout(() => setShowSavedMenu(false), 180);
  };
  const openMoreTools = () => {
    clearTimeout(moreToolsTimer.current);
    setShowMoreTools(true);
  };
  const closeMoreTools = () => {
    moreToolsTimer.current = setTimeout(() => setShowMoreTools(false), 180);
  };

  const menuCategories = useMemo(() => {
    const get = (cat) =>
      allBooks
        .filter((b) => b.category?.toLowerCase().includes(cat.toLowerCase()))
        .slice(0, 6);
    return {
      education: {
        title: "Education Documents",
        description: "Academic resources and study guides",
        books: get("education"),
      },
      business: {
        title: "Business Documents",
        description: "Management, finance, entrepreneurship",
        books: get("business"),
      },
      technology: {
        title: "Technology Documents",
        description: "Programming, IT, digital innovation",
        books: get("technology"),
      },
      science: {
        title: "Science Documents",
        description: "Research, discoveries, exploration",
        books: get("science"),
      },
      sexeducation: {
        title: "Sex Education",
        description: "Sexual health, relationships, wellness",
        books: get("sex education"),
      },
    };
  }, [allBooks]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const openDropdown = (key) => {
    clearTimeout(dropdownTimer.current);
    const btn = catButtonRefs.current[key];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left });
    }
    setActiveDropdown(key);
  };
  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 180);
  };

  /* ── shared inner renderer for Space menu items ── */
  const spaceItemInner = (item) => {
    const Icon = item.icon;
    return (
      <>
        <div
          style={{
            width: "64px",
            height: "34px",
            borderRadius: "9px",
            flexShrink: 0,
            border: `0.5px solid ${item.color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: NAVY,
          }}
        >
          <Icon size={15} style={{ color: item.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: NAVY,
              fontFamily: "'Lato',sans-serif",
              lineHeight: 1.2,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#888",
              fontFamily: "'Lato',sans-serif",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.description}
          </div>
        </div>
        <ChevronRight size={13} style={{ color: "#999", flexShrink: 0 }} />
      </>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

        .lan-nav-link { display:flex; align-items:center; gap:5px; font-size:13px; font-family:'Lato',sans-serif; font-weight:400; padding:8px 12px; border-radius:6px; color:rgba(245,240,232,0.82); transition:color 0.18s,background 0.18s; text-decoration:none; cursor:pointer; background:none; border:none; }
        .lan-nav-link:hover { color:${CREAM}; background:rgba(255,255,255,0.07); }

        .lan-cat-btn { display:flex; align-items:center; gap:4px; font-size:12px; font-family:'Lato',sans-serif; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:10px 14px; color:#555; background:none; border:none; cursor:pointer; transition:color 0.15s,background 0.15s; white-space:nowrap; }
        .lan-cat-btn:hover, .lan-cat-btn.active { color:${NAVY}; background:rgba(13,34,68,0.06); }

        .lan-dropdown-wrapper { position:relative; }
        .lan-dropdown-wrapper::after { content:''; position:absolute; top:100%; left:0; right:0; height:8px; background:transparent; }

        .lan-dropdown { position:fixed; min-width:640px; background:#fff; border:0.5px solid #e8e2d8; box-shadow:0 20px 60px rgba(13,34,68,0.14); z-index:9999; padding:0; animation:dropIn 0.18s cubic-bezier(0.4,0,0.2,1); }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .lan-saved-dropdown { position:absolute; top:calc(100% + 10px); right:0; background:#fff; border:0.5px solid #e8e2d8; border-radius:14px; box-shadow:0 20px 60px rgba(13,34,68,0.16); z-index:9999; width:260px; padding:8px; animation:dropIn 0.18s cubic-bezier(0.4,0,0.2,1); }
        .lan-saved-menu-item { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:10px; text-decoration:none; cursor:pointer; transition:background 0.15s; border:none; background:none; width:100%; text-align:left; }
        .lan-saved-menu-item:hover { background:#f9f6f0; }
        .lan-saved-menu-divider { height:0.5px; background:#f0ebe0; margin:4px 8px; }

        .lan-saved-trigger { display:flex; align-items:center; gap:5px; font-size:13px; font-family:'Lato',sans-serif; font-weight:400; padding:8px 12px; border-radius:6px; color:rgba(245,240,232,0.82); transition:color 0.18s,background 0.18s; cursor:pointer; background:none; border:none; position:relative; }
        .lan-saved-trigger:hover, .lan-saved-trigger.open { color:${CREAM}; background:rgba(255,255,255,0.07); }
        .lan-saved-trigger .chevron { transition:transform 0.2s; }
        .lan-saved-trigger.open .chevron { transform:rotate(180deg); }

        .lan-more-tools-trigger { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:10px; cursor:pointer; transition:background 0.15s; border:none; background:none; width:100%; text-align:left; }
        .lan-more-tools-trigger:hover { background:#f9f6f0; }
        .lan-more-tools-panel { position:absolute; bottom:0; right:calc(100% + 10px); width:240px; background:#fff; border:0.5px solid #e8e2d8; border-radius:14px; box-shadow:0 20px 60px rgba(13,34,68,0.16); z-index:10000; padding:8px; animation:dropIn 0.18s cubic-bezier(0.4,0,0.2,1); }

        .lan-book-card { padding:10px; border:0.5px solid #ede8df; border-radius:6px; transition:border-color 0.15s,box-shadow 0.15s; text-decoration:none; display:block; }
        .lan-book-card:hover { border-color:${GOLD}; box-shadow:0 4px 16px rgba(184,150,62,0.12); }

        .lan-sell-btn { font-family:'Lato',sans-serif; font-weight:700; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; padding:9px 18px; border-radius:6px; background:${GOLD}; color:${NAVY}; border:none; cursor:pointer; transition:background 0.18s; white-space:nowrap; }
        .lan-sell-btn:hover:not(:disabled) { background:${GOLDD}; }
        .lan-sell-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .lan-logout-btn { display:flex; align-items:center; gap:6px; padding:8px 12px; border-radius:6px; font-size:12px; background:rgba(185,28,28,0.12); color:#ef4444; border:0.5px solid rgba(239,68,68,0.2); cursor:pointer; transition:background 0.15s; font-family:'Lato',sans-serif; }
        .lan-logout-btn:hover { background:rgba(185,28,28,0.22); }

        .lan-search-wrap { position:relative; flex:1; max-width:480px; }
        .lan-search-input { width:100%; padding:9px 40px 9px 16px; background:rgba(255,255,255,0.09); border:0.5px solid rgba(184,150,62,0.3); border-radius:8px; font-size:13px; color:${CREAM}; font-family:'Lato',sans-serif; outline:none; transition:border-color 0.18s,background 0.18s; }
        .lan-search-input::placeholder { color:rgba(245,240,232,0.38); }
        .lan-search-input:focus { border-color:${GOLD}; background:rgba(255,255,255,0.13); }

        .lan-tag-dropdown { position:absolute; top:calc(100% + 8px); left:0; right:0; background:#fff; border:0.5px solid #e8e2d8; box-shadow:0 16px 48px rgba(13,34,68,0.16); border-radius:10px; z-index:999; padding:12px; animation:dropIn 0.18s cubic-bezier(0.4,0,0.2,1); }
        .lan-tag-btn { display:flex; align-items:flex-start; gap:8px; padding:10px; border-radius:7px; cursor:pointer; text-align:left; width:100%; background:none; border:none; transition:background 0.15s; }
        .lan-tag-btn:hover { background:#f9f6f0; }

        .lan-mobile-overlay { position:fixed; inset:0; background:#fff; z-index:9999; overflow-y:auto; font-family:'Lato',sans-serif; animation:slideInLeft 0.25s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideInLeft { from{transform:translateX(-100%);opacity:0.6} to{transform:translateX(0);opacity:1} }

        .lan-mobile-link { display:flex; align-items:center; gap:12px; padding:13px 20px; border-radius:8px; font-size:14px; color:${NAVY}; text-decoration:none; font-weight:500; transition:background 0.15s; cursor:pointer; background:none; border:none; width:100%; }
        .lan-mobile-link:hover { background:#f9f6f0; }

        .lan-mobile-book-card { padding:12px 16px; border:0.5px solid #ede8df; border-radius:8px; background:#fdfaf6; text-decoration:none; display:block; transition:border-color 0.15s,box-shadow 0.15s; }
        .lan-mobile-book-card:hover { border-color:${GOLD}; box-shadow:0 4px 16px rgba(184,150,62,0.12); }

        .lan-sell-btn-wrap { transition:opacity 0.3s ease-in-out,transform 0.3s ease-in-out; }
        .lan-sell-btn-wrap.offline { opacity:0.7; }

        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fabPop { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }

        @media (max-width:900px) {
          #hamburger-btn    { display:flex !important; }
          .lan-search-wrap  { display:none !important; }
          nav               { display:none !important; }
          .lan-category-bar { display:none !important; }
        }
      `}</style>

      {/* ══ ANNOUNCEMENT BANNER ══ */}
      {announcement && (
        <>
          <style>{`
            @keyframes tickerScroll { 0%{transform:translateX(0%)} 100%{transform:translateX(-50%)} }
            .lan-ticker-track { display:flex; white-space:nowrap; animation:tickerScroll 18s linear infinite; width:max-content; }
            .lan-ticker-track:hover { animation-play-state:paused; }
          `}</style>
          <div
            style={{
              background: announcement.bgColor || NAVY,
              borderBottom: "1px solid rgba(184,150,62,0.22)",
              overflow: "hidden",
              height: "34px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: GOLD,
                color: NAVY,
                fontFamily: "'Lato',sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "3px 10px",
                margin: "0 16px",
                zIndex: 3,
                position: "relative",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: NAVY,
                  display: "inline-block",
                }}
              />
              {announcement.label || "NOTICE"}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div className="lan-ticker-track">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: "'Lato',sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: announcement.textColor || CREAM,
                      letterSpacing: "0.03em",
                      paddingRight: "80px",
                    }}
                  >
                    {announcement.message}
                    {announcement.linkUrl && (
                      <a
                        href={announcement.linkUrl}
                        style={{
                          color: GOLD,
                          fontWeight: 700,
                          marginLeft: "12px",
                          textDecoration: "underline",
                        }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {announcement.linkText || "Learn more →"}
                      </a>
                    )}
                    <span
                      style={{ margin: "0 32px", color: GOLD, opacity: 0.4 }}
                    >
                      ◆
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ MAIN HEADER ══ */}
      <header
        style={{
          background: NAVY,
          borderBottom: "1px solid rgba(184,150,62,0.18)",
          position: "sticky",
          top: 0,
          zIndex: 500,
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 20px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              height: "64px",
            }}
          >
            {/* hamburger */}
            <button
              className="lan-nav-link"
              style={{ padding: "8px", display: "none" }}
              id="hamburger-btn"
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowMobileSearch(false);
              }}
              aria-label="Menu"
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* brand */}
            <Link
              href="/home"
              style={{ textDecoration: "none", flexShrink: 0 }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  lineHeight: 1.05,
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: CREAM,
                    letterSpacing: "-0.5px",
                  }}
                >
                  [LAN Library]
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 300,
                    color: GOLD,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontFamily: "'Lato',sans-serif",
                    marginTop: "1px",
                  }}
                >
                  The Global Student Library
                </div>
              </div>
            </Link>

            {/* desktop search */}
            <div
              className="lan-search-wrap"
              ref={searchTagsRef}
              style={{ margin: "0 12px" }}
            >
              <input
                className="lan-search-input"
                type="text"
                placeholder="Search 90M+ documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchTags(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: GOLD,
                  display: "flex",
                }}
              >
                <Search size={16} />
              </button>
              {showSearchTags && (
                <div className="lan-tag-dropdown">
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#aaa",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      paddingLeft: "10px",
                    }}
                  >
                    Browse by type
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "4px",
                    }}
                  >
                    {searchTags.map((tag) => {
                      const Icon = tag.icon;
                      return (
                        <button
                          key={tag.name}
                          className="lan-tag-btn"
                          onClick={() => {
                            setSearchQuery(tag.name);
                            setShowSearchTags(false);
                            handleSearch();
                          }}
                        >
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              background: "#f9f6f0",
                              border: "0.5px solid #ede8df",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={14} style={{ color: NAVY }} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: NAVY,
                              }}
                            >
                              {tag.name}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#888",
                                marginTop: "1px",
                              }}
                            >
                              {tag.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* desktop nav */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                marginLeft: "auto",
              }}
            >
              <Link href="/my-books" className="lan-nav-link">
                <Book size={15} style={{ color: GOLD }} /> My Books
              </Link>
              <button className="lan-nav-link" onClick={handleMyAccountClick}>
                <User size={15} style={{ color: GOLD }} /> Account
              </button>
              <Link href="/lecturers" className="lan-nav-link">
                <Crown size={15} style={{ color: GOLD }} /> Faculties
              </Link>

              {/* ── YOUR SPACE DROPDOWN ── */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={openSavedMenu}
                onMouseLeave={closeSavedMenu}
              >
                <button
                  ref={savedBtnRef}
                  className={`lan-saved-trigger ${showSavedMenu ? "open" : ""}`}
                  onClick={() => setShowSavedMenu((p) => !p)}
                  aria-haspopup="true"
                  aria-expanded={showSavedMenu}
                >
                  <Bookmark size={15} style={{ color: GOLD }} />
                  Space
                  <ChevronDown size={12} className="chevron" />
                </button>

                {showSavedMenu && (
                  <div
                    className="lan-saved-dropdown"
                    ref={savedMenuRef}
                    style={{ background: CREAM, color: NAVY }}
                  >
                    {/* header */}
                    <div
                      style={{
                        padding: "10px 12px 8px",
                        borderBottom: "0.5px solid #f0ebe0",
                        marginBottom: "6px",
                        background: NAVY,
                        borderRadius: "10px 10px 0 0",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 900,
                          color: CREAM,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          fontFamily: "'Lato',sans-serif",
                          margin: 5,
                          textAlign: "center",
                        }}
                      >
                        Your Space
                      </p>
                    </div>

                    {/* ── SAVED_MENU_ITEMS ── */}
                    {SAVED_MENU_ITEMS.map((item, idx) => {
                      const isLast = idx === SAVED_MENU_ITEMS.length - 1;
                      return (
                        <React.Fragment key={item.label}>
                          {item.isDynamic ? (
                            <button
                              className="lan-saved-menu-item"
                              onClick={() => {
                                setShowSavedMenu(false);
                                handleMyAccountClick();
                              }}
                            >
                              {spaceItemInner(item)}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              className="lan-saved-menu-item"
                              onClick={() => setShowSavedMenu(false)}
                            >
                              {spaceItemInner(item)}
                            </Link>
                          )}
                          {/* divider between items (not after last — More Tools row comes next) */}
                          {!isLast && (
                            <div className="lan-saved-menu-divider" />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* ── MORE TOOLS trigger (after the list, before closing div) ── */}
                    <div className="lan-saved-menu-divider" />
                    <div
                      style={{ position: "relative" }}
                      ref={moreToolsTriggerRef}
                      onMouseEnter={openMoreTools}
                      onMouseLeave={closeMoreTools}
                    >
                      <button className="lan-more-tools-trigger">
                        <div
                          style={{
                            width: "64px",
                            height: "34px",
                            borderRadius: "9px",
                            flexShrink: 0,
                            border: `0.5px solid ${GOLD}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: NAVY,
                          }}
                        >
                          <Sparkle size={15} style={{ color: GOLD }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: NAVY,
                              fontFamily: "'Lato',sans-serif",
                              lineHeight: 1.2,
                            }}
                          >
                            More Tools
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              fontFamily: "'Lato',sans-serif",
                              marginTop: "2px",
                            }}
                          >
                            Extra features & resources
                          </div>
                        </div>
                        <ChevronRight
                          size={13}
                          style={{ color: GOLD, flexShrink: 0 }}
                        />
                      </button>

                      {/* ── SIDE PANEL — appears to the LEFT ── */}
                      {showMoreTools && (
                        <div
                          className="lan-more-tools-panel"
                          ref={moreToolsRef}
                          onMouseEnter={openMoreTools}
                          onMouseLeave={closeMoreTools}
                        >
                          <div
                            style={{
                              padding: "10px 12px 8px",
                              borderBottom: "0.5px solid #f0ebe0",
                              marginBottom: "6px",
                              background: NAVY,
                              borderRadius: "10px 10px 0 0",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: 900,
                                color: CREAM,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                fontFamily: "'Lato',sans-serif",
                                margin: 5,
                                textAlign: "center",
                              }}
                            >
                              More Tools
                            </p>
                          </div>
                          {MORE_TOOLS_ITEMS.map((item, idx) => {
                            const isLast = idx === MORE_TOOLS_ITEMS.length - 1;
                            return (
                              <React.Fragment key={item.label}>
                                <Link
                                  href={item.href}
                                  className="lan-saved-menu-item"
                                  onClick={() => {
                                    setShowMoreTools(false);
                                    setShowSavedMenu(false);
                                  }}
                                >
                                  {spaceItemInner(item)}
                                </Link>
                                {!isLast && (
                                  <div className="lan-saved-menu-divider" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* ── END MORE TOOLS ── */}
                  </div>
                )}
              </div>
              {/* ── END YOUR SPACE ── */}

              {/* sell / upload button */}
              <div
                className={`lan-sell-btn-wrap ${isOnline ? "online" : "offline"}`}
                style={{ marginLeft: "6px" }}
              >
                {!isOnline ? (
                  <button
                    disabled
                    className="lan-sell-btn"
                    style={{
                      background: "rgba(100,100,100,0.18)",
                      color: "rgba(245,240,232,0.45)",
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <WifiOff size={13} style={{ color: "#f59e0b" }} /> Offline
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#ef4444",
                        display: "inline-block",
                        marginLeft: "2px",
                      }}
                    />
                  </button>
                ) : checkingSeller ? (
                  <button className="lan-sell-btn" disabled>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          border: "2px solid rgba(13,34,68,0.3)",
                          borderTopColor: NAVY,
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Checking…
                    </span>
                  </button>
                ) : isSeller ? (
                  <button className="lan-sell-btn" onClick={HandleClick}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Upload size={13} /> Upload
                    </span>
                  </button>
                ) : (
                  <button className="lan-sell-btn" onClick={HandleClick}>
                    Become a Seller
                  </button>
                )}
              </div>

              <button
                className="lan-logout-btn"
                onClick={handleLogout}
                style={{ marginLeft: "4px" }}
              >
                <LogOut size={14} />
              </button>
            </nav>
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div
          className="lan-category-bar"
          style={{
            background: CREAM,
            borderTop: "1px solid rgba(13,34,68,0.1)",
            position: "relative",
            zIndex: 600,
            overflow: "visible",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
            }}
          >
            <Link
              href="/docs"
              target="_blank"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "10px 14px",
                color: "#888",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              What is LAN?
            </Link>
            <div
              style={{
                width: "1px",
                height: "18px",
                background: "rgba(184,150,62,0.3)",
                flexShrink: 0,
              }}
            />

            {NAV_CATS.map(({ key, label, href }) => (
              <div
                key={key}
                className="lan-dropdown-wrapper"
                style={{ position: "relative" }}
                onMouseEnter={() => openDropdown(key)}
                onMouseLeave={closeDropdown}
              >
                <button
                  ref={(el) => (catButtonRefs.current[key] = el)}
                  className={`lan-cat-btn ${activeDropdown === key ? "active" : ""}`}
                >
                  {label}
                  <ChevronDown
                    size={11}
                    style={{
                      transition: "transform 0.2s",
                      transform:
                        activeDropdown === key ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>

                {activeDropdown === key &&
                  isDesktop &&
                  createPortal(
                    <div
                      className="lan-dropdown"
                      style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                      }}
                      onMouseEnter={() => openDropdown(key)}
                      onMouseLeave={closeDropdown}
                    >
                      <div
                        style={{
                          padding: "20px 24px 16px",
                          borderBottom: "1px solid #f0ebe0",
                          background: "#fdfaf6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: "3px",
                              height: "20px",
                              background: GOLD,
                              borderRadius: "2px",
                            }}
                          />
                          <h3
                            style={{
                              fontFamily: "'Playfair Display',serif",
                              fontSize: "18px",
                              fontWeight: 700,
                              color: NAVY,
                              margin: 0,
                            }}
                          >
                            {menuCategories[key]?.title}
                          </h3>
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#888",
                            margin: "0 0 0 13px",
                            fontFamily: "'Lato',sans-serif",
                          }}
                        >
                          {menuCategories[key]?.description}
                        </p>
                      </div>
                      {menuCategories[key]?.books?.length > 0 ? (
                        <>
                          <div style={{ padding: "16px 24px 0" }}>
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: GOLD,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                margin: "0 0 12px",
                              }}
                            >
                              Recommended for you
                            </p>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3,1fr)",
                                gap: "10px",
                              }}
                            >
                              {menuCategories[key].books.map((book) => (
                                <Link
                                  key={book.id}
                                  href={`/book/preview?id=${book.id}`}
                                  className="lan-book-card"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  <h5
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: NAVY,
                                      margin: "0 0 4px",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {book.title}
                                  </h5>
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#888",
                                      margin: 0,
                                    }}
                                  >
                                    by {book.author}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div style={{ padding: "14px 24px 16px" }}>
                            <Link
                              href={href || `/category/${key}`}
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: GOLD,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                letterSpacing: "0.04em",
                              }}
                              onClick={() => setActiveDropdown(null)}
                            >
                              View all {label} documents{" "}
                              <ChevronRight size={12} />
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: "24px", textAlign: "center" }}>
                          <BookOpen
                            size={28}
                            style={{ color: "#ddd", margin: "0 auto 8px" }}
                          />
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#aaa",
                              fontFamily: "'Lato',sans-serif",
                            }}
                          >
                            No documents yet in this category.
                          </p>
                          <Link
                            href="/upload-document"
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: GOLD,
                              textDecoration: "none",
                            }}
                          >
                            Be the first to upload →
                          </Link>
                        </div>
                      )}
                    </div>,
                    document.body,
                  )}
              </div>
            ))}

            <div
              style={{
                width: "1px",
                height: "18px",
                background: "rgba(184,150,62,0.3)",
                flexShrink: 0,
              }}
            />
            <Link
              href="/documents"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "10px 14px",
                color: "#555",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              All Documents
            </Link>
          </div>
        </div>
      </header>

      {/* ══ MOBILE MENU OVERLAY ══ */}
      {showMobileMenu && (
        <div className="lan-mobile-overlay">
          <div style={{ padding: "16px 20px" }}>
            {/* header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "20px",
                  fontWeight: 900,
                  color: NAVY,
                }}
              >
                [LAN Library]
                <div
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "10px",
                    color: GOLD,
                    fontWeight: 300,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  The Global Student Library
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: "8px",
                  background: "#f9f6f0",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: NAVY,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* mobile search */}
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Search documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 14px",
                  border: "1px solid rgba(13,34,68,0.15)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "'Lato',sans-serif",
                  outline: "none",
                  color: NAVY,
                  background: "#fdfaf6",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: GOLD,
                }}
              >
                <Search size={17} />
              </button>
            </div>

            {/* ══════════════ THREE-WAY TERNARY ══════════════
                null          → main menu
                'more-tools'  → More Tools submenu       ← FIX
                anything else → category submenu
            ═══════════════════════════════════════════════ */}
            {mobileSubmenu === null ? (
              <>
                {/* sell button */}
                <div
                  className={`lan-sell-btn-wrap ${isOnline ? "online" : "offline"}`}
                  style={{ marginBottom: "20px" }}
                >
                  {!isOnline ? (
                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: "14px 20px",
                        background: "rgba(100,100,100,0.12)",
                        color: "rgba(13,34,68,0.35)",
                        border: "0.5px solid rgba(13,34,68,0.1)",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "'Lato',sans-serif",
                        cursor: "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <WifiOff size={16} style={{ color: "#f59e0b" }} /> Offline
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          display: "inline-block",
                          marginLeft: "2px",
                        }}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={HandleClick}
                      disabled={checkingSeller}
                      style={{
                        width: "100%",
                        padding: "14px 20px",
                        background: GOLD,
                        color: NAVY,
                        border: "none",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "'Lato',sans-serif",
                        cursor: checkingSeller ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        opacity: checkingSeller ? 0.6 : 1,
                      }}
                    >
                      {checkingSeller ? (
                        "Checking…"
                      ) : isSeller ? (
                        <>
                          <Upload size={16} /> Upload Document
                        </>
                      ) : (
                        "Become a Seller"
                      )}
                    </button>
                  )}
                </div>

                <div className="lan-divider-gold" />

                {/* quick links */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginBottom: "12px",
                  }}
                >
                  {[
                    { href: "/home", icon: Home, label: "Home" },
                    { href: "/my-books", icon: Book, label: "My Books" },
                    {
                      fn: handleMyAccountClick,
                      icon: User,
                      label: "My Account",
                    },
                    { href: "/transfer", icon: Bookmark, label: "Transfer" },
                    {
                      href: "/lan/net/help-center",
                      icon: HelpCircle,
                      label: "Help & FAQ",
                    },
                  ].map(({ href, fn, icon: Icon, label }) =>
                    href ? (
                      <Link
                        key={label}
                        href={href}
                        className="lan-mobile-link"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Icon size={17} style={{ color: GOLD }} /> {label}
                      </Link>
                    ) : (
                      <button
                        key={label}
                        className="lan-mobile-link"
                        onClick={() => {
                          fn?.();
                          setShowMobileMenu(false);
                        }}
                      >
                        <Icon size={17} style={{ color: GOLD }} /> {label}
                      </button>
                    ),
                  )}
                </div>

                <div className="lan-divider-gold" />

                {/* Your Space */}
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: NAVY,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "12px 0 6px",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Your Space
                </p>
                {SAVED_MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return item.isDynamic ? (
                    <button
                      key={item.label}
                      className="lan-mobile-link"
                      onClick={() => {
                        handleMyAccountClick();
                        setShowMobileMenu(false);
                      }}
                    >
                      <Icon size={17} style={{ color: item.color }} />{" "}
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="lan-mobile-link"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon size={17} style={{ color: item.color }} />{" "}
                      {item.label}
                    </Link>
                  );
                })}

                {/* More Tools entry in mobile Your Space */}
                <button
                  className="lan-mobile-link"
                  onClick={() => setMobileSubmenu("more-tools")}
                  style={{ justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Sparkle size={17} style={{ color: GOLD }} /> More Tools
                  </span>
                  <ChevronRight size={15} style={{ color: "#ccc" }} />
                </button>

                <div className="lan-divider-gold" />

                {/* Categories */}
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: NAVY,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "12px 0 6px",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Categories
                </p>
                {NAV_CATS.map(({ key, label }) => (
                  <button
                    key={key}
                    className="lan-mobile-link"
                    onClick={() => setMobileSubmenu(key)}
                    style={{ justifyContent: "space-between" }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <BookOpen size={16} style={{ color: GOLD }} />
                      {menuCategories[key]?.title?.replace(" Documents", "") ??
                        label}
                    </span>
                    <ChevronRight size={15} style={{ color: "#ccc" }} />
                  </button>
                ))}
                <Link
                  href="/documents"
                  className="lan-mobile-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Book size={16} style={{ color: GOLD }} /> All Documents
                </Link>

                <div className="lan-divider-gold" />
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)",
                    border: "0.5px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "'Lato',sans-serif",
                    cursor: "pointer",
                    marginTop: "12px",
                    width: "100%",
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : mobileSubmenu === "more-tools" ? (
              /* ══ MORE TOOLS SUBMENU ══ */
              <div>
                <button
                  onClick={() => setMobileSubmenu(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: NAVY,
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ChevronRight
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />{" "}
                  Back
                </button>
                <h2
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: NAVY,
                    marginBottom: "4px",
                  }}
                >
                  More Tools
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "20px",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Extra features & resources
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {MORE_TOOLS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="lan-mobile-link"
                        onClick={() => {
                          setShowMobileMenu(false);
                          setMobileSubmenu(null);
                        }}
                      >
                        <Icon size={17} style={{ color: item.color }} />
                        <span>
                          <span style={{ display: "block", fontWeight: 700 }}>
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              fontWeight: 400,
                            }}
                          >
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ══ CATEGORY SUBMENU (unchanged) ══ */
              <div>
                <button
                  onClick={() => setMobileSubmenu(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: NAVY,
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ChevronRight
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />{" "}
                  Back
                </button>
                <h2
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: NAVY,
                    marginBottom: "4px",
                  }}
                >
                  {menuCategories[mobileSubmenu]?.title ??
                    NAV_CATS.find((c) => c.key === mobileSubmenu)?.label}
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "20px",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  {menuCategories[mobileSubmenu]?.description ??
                    "Browse documents in this category"}
                </p>

                {allBooks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid rgba(184,150,62,0.3)",
                        borderTopColor: GOLD,
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#aaa",
                        marginTop: "12px",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      Loading documents…
                    </p>
                  </div>
                ) : menuCategories[mobileSubmenu]?.books?.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {menuCategories[mobileSubmenu].books.map((book) => (
                      <Link
                        key={book.id}
                        href={`/book/preview?id=${book.id}`}
                        className="lan-mobile-book-card"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <h5
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: NAVY,
                            margin: "0 0 4px",
                          }}
                        >
                          {book.title}
                        </h5>
                        <p
                          style={{ fontSize: "12px", color: "#888", margin: 0 }}
                        >
                          by {book.author}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <BookOpen
                      size={32}
                      style={{ color: "#ddd", margin: "0 auto 10px" }}
                    />
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#aaa",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      No documents yet in this category.
                    </p>
                    <Link
                      href="/upload-document"
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: GOLD,
                        textDecoration: "none",
                      }}
                    >
                      Be the first to upload →
                    </Link>
                  </div>
                )}

                {menuCategories[mobileSubmenu]?.books?.length > 0 && (
                  <Link
                    href={
                      NAV_CATS.find((c) => c.key === mobileSubmenu)?.href ||
                      `/category/${mobileSubmenu}`
                    }
                    onClick={() => setShowMobileMenu(false)}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "14px",
                      marginTop: "20px",
                      fontWeight: 700,
                      color: GOLD,
                      textDecoration: "none",
                      fontFamily: "'Lato',sans-serif",
                      fontSize: "13px",
                      borderTop: "1px solid #ede8df",
                    }}
                  >
                    View all{" "}
                    {menuCategories[mobileSubmenu]?.title ??
                      NAV_CATS.find((c) => c.key === mobileSubmenu)?.label}{" "}
                    →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
