"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import {
  ArrowLeft,
  Search,
  X,
  ShoppingBag,
  BookOpen,
  GraduationCap,
  UserPlus,
  UserCheck,
  Users,
  MapPin,
  Building2,
  Grid3X3,
  LayoutList,
  Star,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

// ─── THUMBNAIL ────────────────────────────────────────────
const getThumbnailUrl = (book) => {
  if (!book)
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (book.driveFileId)
    return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(
      /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/,
    );
    if (m) {
      const id = m[1] || m[2] || m[3];
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
    }
  }
  if (book.pdfUrl?.includes("drive.google.com")) {
    const m = book.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return (
    book.image ||
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
  );
};

const isLecturer = (title) => {
  const t = (title || "").toLowerCase();
  return (
    t === "lecturer" ||
    t === "dr." ||
    t === "prof." ||
    t === "professor" ||
    t === "mrs" ||
    t === "mr"
  );
};

// ─── BOOK CARD ────────────────────────────────────────────
function BookCard({ book, isPurchased, view }) {
  const href = `/book/preview?id=${String(book.id).replace("firestore-", "")}`;

  if (view === "list") {
    return (
      <Link
        href={href}
        className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all p-3 group"
      >
        <img
          src={book.image}
          alt={book.title}
          className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
            {book.title}
          </h4>
          <p className="text-xs text-gray-400 capitalize mt-0.5">
            {book.category}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {isPurchased(book.id) && (
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                Owned
              </span>
            )}
            {book.soldCount > 0 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <ShoppingBag size={9} />
                {book.soldCount} sold
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-blue-950">
            ₦{book.price?.toLocaleString()}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200"
    >
      <div className="relative">
        <img
          src={book.image}
          alt={book.title}
          className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
          }}
        />
        {isPurchased(book.id) && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            Owned
          </span>
        )}
        {book.soldCount > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <ShoppingBag size={9} />
            {book.soldCount}
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-bold text-xs text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug">
          {book.title}
        </h4>
        <p className="text-[10px] text-gray-400 capitalize mt-0.5">
          {book.category}
        </p>
        <p className="font-bold text-sm text-blue-950 mt-1.5">
          ₦{book.price?.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function SellerProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sellerId = searchParams.get("sellerId");

  const [seller, setSeller] = useState(null);
  const [sellerPhoto, setSellerPhoto] = useState(null);
  const [sellerBooks, setSellerBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState("materials");
  const [view, setView] = useState("grid");
  const [followLoading, setFollowLoading] = useState(false);
  const user = auth.currentUser;
  const [stats, setStats] = useState({
    totalSold: 0,
    totalEarnings: 0,
    totalBooks: 0,
  });

  // ─── FOLLOW CHECK ─────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      if (!user || !sellerId) return;
      const followDoc = await getDoc(
        doc(db, "follows", `${user.uid}_${sellerId}`),
      );
      setIsFollowing(followDoc.exists());
      const q = query(
        collection(db, "follows"),
        where("lecturerId", "==", sellerId),
      );
      const snap = await getDocs(q);
      setFollowerCount(snap.size);
    };
    check();
  }, [user, sellerId]);

  // ─── TOGGLE FOLLOW ────────────────────────────────────────
  const toggleFollow = async () => {
    if (!user) {
      alert("Please sign in to follow");
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);
    const followId = `${user.uid}_${sellerId}`;
    const followRef = doc(db, "follows", followId);
    const sellerRef = doc(db, "sellers", sellerId);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        try {
          await updateDoc(sellerRef, { followersCount: increment(-1) });
        } catch (e) {}
        setIsFollowing(false);
        setFollowerCount((p) => Math.max(0, p - 1));
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          lecturerId: sellerId,
          lecturerName: seller?.sellerName || "",
          createdAt: new Date(),
        });
        try {
          await updateDoc(sellerRef, { followersCount: increment(1) });
        } catch (e) {
          await setDoc(sellerRef, { followersCount: 1 }, { merge: true });
        }
        setIsFollowing(true);
        setFollowerCount((p) => p + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  // ─── FETCH DATA ───────────────────────────────────────────
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) {
        router.push("/");
        return;
      }
      try {
        setLoading(true);
        let sellerName = "Unknown",
          sellerTitle = "",
          sellerDept = "",
          sellerUni = "",
          photo = null;

        const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
        if (sellerDoc.exists()) {
          const d = sellerDoc.data();
          sellerName = d.sellerName || d.displayName || sellerName;
          sellerTitle = d.title || "";
          sellerDept = d.department || "";
          sellerUni = d.university || "";
        }
        const userDoc = await getDoc(doc(db, "users", sellerId));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          if (!sellerName || sellerName === "Unknown")
            sellerName =
              ud.displayName ||
              `${ud.firstName || ""} ${ud.surname || ""}`.trim() ||
              sellerName;
          photo = ud.photoBase64 || ud.photoURL || ud.profilePicture || null;
          if (!sellerDept) sellerDept = ud.department || "";
          if (!sellerUni) sellerUni = ud.university || "";
        }
        setSellerPhoto(photo);

        const advertSnap = await getDocs(collection(db, "advertMyBook"));
        const uploadedBooks = [];
        advertSnap.forEach((ds) => {
          const data = ds.data();
          if (
            (data.userId === sellerId || data.sellerId === sellerId) &&
            data.status === "approved"
          ) {
            const book = {
              id: `firestore-${ds.id}`,
              firestoreId: ds.id,
              title: data.bookTitle || data.title,
              author: data.author || "Unknown",
              category: (data.category || "General").toLowerCase(),
              price: Number(data.price) || 0,
              pages: data.pages || 0,
              format: data.format || "PDF",
              description: data.description || "",
              driveFileId: data.driveFileId,
              pdfUrl: data.pdfUrl || data.pdfLink,
              embedUrl: data.embedUrl,
              status: data.status || "pending",
              isFromFirestore: true,
            };
            book.image = getThumbnailUrl(book);
            uploadedBooks.push(book);
          }
        });

        let totalSold = 0,
          totalEarnings = 0;
        const bookSalesMap = {};
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.docs.forEach((ud) => {
          const purchased = ud.data().purchasedBooks || {};
          Object.values(purchased).forEach((p) => {
            if (p.sellerId === sellerId) {
              totalSold++;
              totalEarnings += p.amount || 0;
              const title = p.title || "Untitled";
              bookSalesMap[title] = (bookSalesMap[title] || 0) + 1;
            }
          });
        });
        uploadedBooks.forEach((b) => {
          b.soldCount = bookSalesMap[b.title] || 0;
        });

        const currentUser = auth.currentUser;
        if (currentUser) {
          const myDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (myDoc.exists()) {
            const myPurchased = myDoc.data().purchasedBooks || {};
            const ids = new Set();
            Object.values(myPurchased).forEach((p) => {
              const id = p.bookId || p.id || p.firestoreId;
              if (id) {
                ids.add(id);
                ids.add(`firestore-${id}`);
              }
            });
            setPurchasedBookIds(ids);
          }
        }

        setSeller({ sellerId, sellerName, sellerTitle, sellerDept, sellerUni });
        setSellerBooks(uploadedBooks);
        setFilteredBooks(uploadedBooks);
        setStats({
          totalSold,
          totalEarnings,
          totalBooks: uploadedBooks.length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [sellerId, router]);

  // ─── FILTER ───────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredBooks(
      sellerBooks.filter((b) => {
        const matchSearch =
          !q ||
          b.title?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q);
        const matchCat =
          selectedCategory === "all" || b.category === selectedCategory;
        return matchSearch && matchCat;
      }),
    );
  }, [searchQuery, selectedCategory, sellerBooks]);

  const categories = [
    { value: "all", label: "All" },
    ...Array.from(new Set(sellerBooks.map((b) => b.category)))
      .filter(Boolean)
      .map((c) => ({
        value: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
      })),
  ];

  const isPurchased = (id) =>
    purchasedBookIds.has(id) || purchasedBookIds.has(String(id));
  const lecturerMode = isLecturer(seller?.sellerTitle);
  const displayTitle = seller
    ? lecturerMode
      ? `${seller.sellerTitle} ${seller.sellerName}`
      : seller.sellerName
    : "Profile";

  // ─── LOADING ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-8 px-4 space-y-4 animate-pulse">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-200" />
            <div className="px-4 pb-6 pt-16 relative">
              <div className="absolute -top-12 left-4 w-24 h-24 rounded-full bg-gray-300 border-4 border-white" />
              <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-56" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <BookOpen size={56} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Profile Not Found
          </h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-950 text-white px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen " style={{ backgroundColor: "#f9f6f0" }}>
      <Navbar />

      {/* ── PAGE TITLE BAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-blue-950 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[13px] font-bold text-gray-900 leading-tight">
              {displayTitle}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              {stats.totalBooks} materials
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto pb-16">
        <div className="bg-white shadow-sm rounded-b-2xl overflow-visible mb-4">
          {/* Cover Photo */}
          <div className="relative h-[200px] sm:h-[280px] md:h-[340px] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
            {/* Decorative pattern */}
            <div
              className="absolute inset-0 "
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* LAN watermark */}
            {/* <img src="lanlog.png" className="h-full  w-full object-cover" /> */}
            <div className="absolute bottom-4 right-5 text-white/10 font-black text-8xl max-md:text-6xl select-none pointer-events-none">
              LAN Library
            </div>
            {lecturerMode && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <GraduationCap size={13} />
                {seller.sellerTitle}
              </div>
            )}
          </div>

          {/* Avatar + Name row */}
          <div className="px-4 sm:px-6 pb-0 relative">
            {/* Avatar — overlaps cover */}
            <div className="absolute -top-[52px] left-4 sm:left-6">
              <div className="relative w-[100px] h-[100px] sm:w-[140px] sm:h-[140px]">
                {sellerPhoto ? (
                  <img
                    src={sellerPhoto}
                    alt={seller.sellerName}
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-900 to-indigo-700 flex items-center justify-center">
                    {lecturerMode ? (
                      <GraduationCap size={48} className="text-white/80" />
                    ) : (
                      <span className="text-white text-4xl font-black">
                        {seller.sellerName?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Name + actions — right of avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pt-2 sm:pt-0 ml-[116px] sm:ml-[160px] min-h-[60px] sm:min-h-[80px] gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {displayTitle}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {stats.totalBooks} materials · {followerCount} followers
                </p>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    isFollowing
                      ? "bg-gray-300 text-gray-700 hover:bg-gray-200"
                      : "bg-blue-950 text-white hover:bg-blue-700"
                  }`}
                >
                  {isFollowing ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 sm:mx-6 mt-4 border-t border-gray-200" />

          {/* Tab navigation */}
          <div
            className="flex overflow-x-auto px-4 sm:px-6 gap-0"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              { id: "materials", label: lecturerMode ? "Materials" : "Books" },
              { id: "about", label: "About" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-none px-4 py-3 text-[13px] font-bold transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-[3px] border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ CONTENT AREA ════════════════════════════════════════════════════ */}
        <div className="px-4 sm:px-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* LEFT SIDEBAR */}
          <div className="space-y-4">
            {/* About card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">About</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {seller.sellerTitle && (
                  <div className="flex items-center gap-3">
                    <GraduationCap
                      size={18}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span>
                      <strong className="text-gray-800">
                        {seller.sellerTitle}
                      </strong>
                    </span>
                  </div>
                )}
                {seller.sellerDept && (
                  <div className="flex items-center gap-3">
                    <BookOpen
                      size={18}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span>{seller.sellerDept}</span>
                  </div>
                )}
                {seller.sellerUni && (
                  <div className="flex items-center gap-3">
                    <Building2
                      size={18}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span>{seller.sellerUni}</span>
                  </div>
                )}
                {!seller.sellerDept && !seller.sellerUni && (
                  <p className="text-gray-400 text-xs">
                    No additional info provided.
                  </p>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Total Materials",
                    value: stats.totalBooks,
                    icon: BookOpen,
                  },
                  {
                    label: "Total Sold",
                    value: stats.totalSold,
                    icon: ShoppingBag,
                  },
                  { label: "Followers", value: followerCount, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon size={16} className="text-gray-400" />
                      {label}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN FEED */}
          {activeTab === "materials" && (
            <div className="space-y-4">
              {/* Search + filter bar */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={15}
                    />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-gray-900"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                    >
                      <LayoutList size={16} />
                    </button>
                  </div>
                </div>

                {/* Category pills */}
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        selectedCategory === cat.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-4 font-medium">
                  {filteredBooks.length}{" "}
                  {filteredBooks.length === 1 ? "result" : "results"}
                </p>

                {filteredBooks.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen
                      size={48}
                      className="mx-auto text-gray-200 mb-3"
                    />
                    <p className="text-gray-400 text-sm font-medium">
                      {searchQuery || selectedCategory !== "all"
                        ? "No results. Clear your filters."
                        : "No materials uploaded yet."}
                    </p>
                    {(searchQuery || selectedCategory !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                        }}
                        className="mt-3 text-blue-600 text-sm font-bold"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : view === "list" ? (
                  <div className="space-y-2">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        isPurchased={isPurchased}
                        view="list"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        isPurchased={isPurchased}
                        view="grid"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h3 className="text-base font-bold text-gray-900">
                About {displayTitle}
              </h3>
              <div className="space-y-4 text-sm text-gray-700">
                {seller.sellerTitle && (
                  <div className="flex items-start gap-3 border-b border-gray-50 pb-4">
                    <GraduationCap
                      size={20}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Title
                      </p>
                      <p className="font-bold text-gray-900">
                        {seller.sellerTitle}
                      </p>
                    </div>
                  </div>
                )}
                {seller.sellerDept && (
                  <div className="flex items-start gap-3 border-b border-gray-50 pb-4">
                    <BookOpen
                      size={20}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Department
                      </p>
                      <p className="font-bold text-gray-900">
                        {seller.sellerDept}
                      </p>
                    </div>
                  </div>
                )}
                {seller.sellerUni && (
                  <div className="flex items-start gap-3">
                    <Building2
                      size={20}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1">
                        University
                      </p>
                      <p className="font-bold text-gray-900">
                        {seller.sellerUni}
                      </p>
                    </div>
                  </div>
                )}
                {!seller.sellerDept &&
                  !seller.sellerUni &&
                  !seller.sellerTitle && (
                    <p className="text-gray-400">
                      No profile information added yet.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
