"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  collection, getDocs, doc, getDoc, setDoc, 
  deleteDoc, query, where, updateDoc, increment // <-- Add these
} from "firebase/firestore";

import { auth, db } from "@/lib/firebaseConfig";
import {
  ArrowLeft,
  Search,
  X,
  ShoppingBag,
  TrendingUp,
  BookOpen,
  GraduationCap,
  BookMarked,
  Building,
  UserPlus,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

export default function SellerProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sellerId = searchParams.get("sellerId");

  const [seller, setSeller] = useState(null);
  const [sellerBooks, setSellerBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const user = auth.currentUser;
  const [stats, setStats] = useState({
    totalSold: 0,
    totalEarnings: 0,
    totalBooks: 0,
  });

  // ─── THUMBNAIL HELPER ────────────────────────────────────
  const getThumbnailUrl = (book) => {
    if (!book)
      return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    if (book.driveFileId)
      return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
      const match = book.embedUrl.match(
        /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/,
      );
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId)
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }
    if (book.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
      const match = book.pdfUrl.match(/[-\w]{25,}/);
      if (match)
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
    }
    return (
      book.image ||
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
    );
  };

  // ─── CHECK IF LECTURER ───────────────────────────────────
  const isLecturer = (title) => {
    const t = (title || "").toLowerCase();
    return (
      t === "lecturer" || t === "dr." || t === "prof." || t === "professor"
    );
  };

  // 1. Check if following on load
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !sellerId) return;
      const followId = `${user.uid}_${sellerId}`;
      const followDoc = await getDoc(doc(db, "follows", followId));
      setIsFollowing(followDoc.exists());

      // Get total follower count
      const q = query(
        collection(db, "follows"),
        where("lecturerId", "==", sellerId),
      );
      const snap = await getDocs(q);
      setFollowerCount(snap.size);
    };
    checkFollowStatus();
  }, [user, sellerId]);

  // 2. The Toggle Function
  const toggleFollow = async () => {
    if (!user) {
      alert("Please sign in to follow lecturers");
      return;
    }

    const followId = `${user.uid}_${sellerId}`;
    const followRef = doc(db, "follows", followId);
    const sellerRef = doc(db, "sellers", sellerId); // Reference to the seller's doc

    try {
      if (isFollowing) {
        // 1. Delete follow record
        await deleteDoc(followRef);

        // 2. Decrement count in the sellers collection
        // We use try-catch inside in case the 'sellers' doc doesn't exist yet
        try {
          await updateDoc(sellerRef, {
            followersCount: increment(-1),
          });
        } catch (e) {
          console.log("Seller doc not found for decrement");
        }

        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        // 1. Create follow record
        await setDoc(followRef, {
          followerId: user.uid,
          lecturerId: sellerId,
          lecturerName: seller.sellerName,
          createdAt: new Date(),
        });

        // 2. Increment count in the sellers collection
        try {
          await updateDoc(sellerRef, {
            followersCount: increment(1),
          });
        } catch (e) {
          // If the seller doc doesn't exist, create it with count 1
          await setDoc(sellerRef, { followersCount: 1 }, { merge: true });
        }

        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  // ─── FETCH SELLER + BOOKS + STATS ────────────────────────
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);

        // 1. Get seller info from sellers collection
        let sellerName = "Unknown";
        let sellerTitle = "";
        let sellerDepartment = "";
        let sellerUniversity = "";

        try {
          const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
          if (sellerDoc.exists()) {
            const d = sellerDoc.data();
            sellerName = d.sellerName || d.displayName || sellerName;
            sellerTitle = d.title || "";
            sellerDepartment = d.department || "";
            sellerUniversity = d.university || "";
          } else {
            // Fallback to users collection
            const userDoc = await getDoc(doc(db, "users", sellerId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              sellerName =
                userData.displayName ||
                `${userData.firstName || ""} ${userData.surname || ""}`.trim() ||
                sellerName;
              sellerTitle = userData.title || "";
              sellerDepartment = userData.department || "";
              sellerUniversity = userData.university || "";
            }
          }
        } catch (error) {
          console.error("Error fetching seller info:", error);
        }

        // 2. Get all books uploaded by this seller from advertMyBook
        const advertSnapshot = await getDocs(collection(db, "advertMyBook"));
        const uploadedBooks = [];

        advertSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            (data.userId === sellerId || data.sellerId === sellerId) &&
            data.status === "approved"
          ) {
            uploadedBooks.push({
              id: `firestore-${docSnap.id}`,
              firestoreId: docSnap.id,
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
            });
          }
        });

        // Add thumbnail
        uploadedBooks.forEach((book) => {
          book.image = getThumbnailUrl(book);
        });

        // 3. Scan all users for purchase stats of this seller
        let totalSold = 0;
        let totalEarnings = 0;
        const bookSalesMap = {};

        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.docs.forEach((userDoc) => {
          const userData = userDoc.data();
          const purchased = userData.purchasedBooks || {};

          Object.values(purchased).forEach((purchase) => {
            if (purchase.sellerId === sellerId) {
              totalSold += 1;
              totalEarnings += purchase.amount || 0;
              const title = purchase.title || "Untitled";
              bookSalesMap[title] = (bookSalesMap[title] || 0) + 1;
            }
          });
        });

        // Attach sales count to each uploaded book
        uploadedBooks.forEach((book) => {
          book.soldCount = bookSalesMap[book.title] || 0;
        });

        // 4. Get purchased IDs for current user
        const currentUser = auth.currentUser;
        if (currentUser) {
          const myDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (myDoc.exists()) {
            const myPurchased = myDoc.data().purchasedBooks || {};
            const ids = new Set(
              Object.values(myPurchased)
                .map((p) => p.bookId || p.id || p.firestoreId)
                .filter(Boolean),
            );
            Object.values(myPurchased).forEach((p) => {
              const id = p.bookId || p.id || p.firestoreId;
              if (id) ids.add(`firestore-${id}`);
            });
            setPurchasedBookIds(ids);
          }
        }

        setSeller({
          sellerId,
          sellerName,
          sellerTitle,
          sellerDepartment,
          sellerUniversity,
        });
        setSellerBooks(uploadedBooks);
        setFilteredBooks(uploadedBooks);
        setStats({
          totalSold,
          totalEarnings,
          totalBooks: uploadedBooks.length,
        });
      } catch (error) {
        console.error("Error fetching seller data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, router]);

  // ─── FILTER / SEARCH ──────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = sellerBooks.filter((book) => {
      const matchesSearch =
        !q ||
        book.title?.toLowerCase().includes(q) ||
        book.category?.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredBooks(filtered);
  }, [searchQuery, selectedCategory, sellerBooks]);

  // ─── CATEGORIES ───────────────────────────────────────────
  const categories = [
    { value: "all", label: "All" },
    ...Array.from(new Set(sellerBooks.map((b) => b.category)))
      .filter(Boolean)
      .map((cat) => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
      })),
  ];

  const isPurchased = (bookId) => {
    return purchasedBookIds.has(bookId) || purchasedBookIds.has(String(bookId));
  };

  // ─── LOADING ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── NO SELLER ────────────────────────────────────────────
  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <BookOpen size={64} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            This profile doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-950 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const lecturerMode = isLecturer(seller.sellerTitle);

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Back Button ── */}
      <div className="max-w-7xl mx-auto px-4 pt-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-950 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* ── Profile Header Banner ── */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="relative rounded-2xl p-6 md:p-8 text-white overflow-hidden min-h-[200px] flex items-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/lanlog.png" // REPLACE with your image URL
              alt="Banner Background"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay to ensure text is always readable */}
            <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            {/* Avatar */}
            <div
              className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 flex items-center justify-center flex-shrink-0 shadow-xl ${
                lecturerMode
                  ? "bg-indigo-800/50 border-indigo-400/40"
                  : "bg-white/10 border-white/30"
              }`}
            >
              {lecturerMode ? (
                <GraduationCap size={48} className="text-indigo-200" />
              ) : (
                <span className="text-3xl md:text-5xl font-black text-white">
                  {seller.sellerName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  {lecturerMode && (
                    <span className="inline-flex items-center gap-1.5 bg-indigo-500/40 border border-indigo-400/40 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                      <GraduationCap size={12} />
                      {seller.sellerTitle || "Lecturer"}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                    {seller.sellerName}
                  </h1>
                  <p className="text-blue-200 text-sm mt-1 font-medium">
                    {lecturerMode
                      ? "Verified University Lecturer"
                      : "Verified Seller on LAN Library"}
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={toggleFollow}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
                    isFollowing
                      ? "bg-white/20 border border-white/40 text-white backdrop-blur-md"
                      : "bg-white text-blue-950 hover:bg-blue-50"
                  }`}
                >
                  {isFollowing ? (
                    <UserCheck size={20} />
                  ) : (
                    <UserPlus size={20} />
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                {/* Followers Stat */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 min-w-[100px]">
                  <Users size={20} className="text-blue-300" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">
                      Followers
                    </p>
                    <p className="font-bold text-lg leading-none">
                      {followerCount || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 min-w-[100px]">
                  <BookOpen size={20} className="text-blue-300" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">
                      Materials
                    </p>
                    <p className="font-bold text-lg leading-none">
                      {stats.totalBooks}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 min-w-[100px]">
                  <ShoppingBag size={20} className="text-blue-300" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">
                      Sold
                    </p>
                    <p className="font-bold text-lg leading-none">
                      {stats.totalSold}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Category Filter ── */}
      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={
              lecturerMode
                ? "Search materials..."
                : "Search books by this seller..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-blue-950 pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex-none px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === cat.value
                  ? "bg-blue-950 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-blue-950"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Books / Materials Grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">
          Showing{" "}
          <span className="font-semibold text-blue-950">
            {filteredBooks.length}
          </span>{" "}
          {lecturerMode ? "material" : "book"}
          {filteredBooks.length !== 1 ? "s" : ""}
        </p>

        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <BookOpen size={56} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nothing found
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || selectedCategory !== "all"
                ? "Try clearing your search or filters."
                : lecturerMode
                  ? "This lecturer hasn't uploaded any materials yet."
                  : "This seller hasn't uploaded any books yet."}
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 bg-blue-950 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-900"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile carousel rows */}
            <div className="lg:hidden space-y-6">
              {(() => {
                const chunks = [];
                for (let i = 0; i < filteredBooks.length; i += 5) {
                  chunks.push(filteredBooks.slice(i, i + 5));
                }
                return chunks.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="overflow-x-auto pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div
                      className="flex gap-3"
                      style={{ minWidth: "max-content" }}
                    >
                      {row.map((book) => (
                        <Link
                          key={book.id}
                          href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
                          className="flex-none w-[160px] sm:w-[180px] group"
                        >
                          <div className="relative mb-2">
                            <img
                              src={book.image}
                              alt={book.title}
                              className="w-full h-[220px] sm:h-[250px] group-hover:shadow-lg transition-shadow"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                              }}
                            />
                            {isPurchased(book.id) && (
                              <span className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                                Owned
                              </span>
                            )}
                            {book.soldCount > 0 && (
                              <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                                <ShoppingBag size={10} /> {book.soldCount} sold
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {book.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {book.category}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Desktop grid */}
            <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="relative">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-[280px] object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                      }}
                    />
                    {isPurchased(book.id) && (
                      <span className="absolute top-3 left-3 bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow">
                        Owned
                      </span>
                    )}
                    {book.soldCount > 0 && (
                      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow">
                        <ShoppingBag size={12} /> {book.soldCount} sold
                      </span>
                    )}
                    {book.status && book.status !== "approved" && (
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-bold shadow ${
                          book.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {book.status.charAt(0).toUpperCase() +
                          book.status.slice(1)}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {book.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {book.pages} pages
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {book.format}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-950 mt-3">
                      ₦{book.price?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
