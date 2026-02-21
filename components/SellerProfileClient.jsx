"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { ArrowLeft, Search, X, ShoppingBag, TrendingUp, BookOpen } from "lucide-react";
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
    const [stats, setStats] = useState({ totalSold: 0, totalEarnings: 0, totalBooks: 0 });

    // ─── THUMBNAIL HELPER ────────────────────────────────────
    const getThumbnailUrl = (book) => {
        if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            }
        }
        if (book.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
        }
        return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
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

              // 1. Get seller name from sellers collection
              let sellerName = "Unknown Seller";
              try {
                // First try sellers collection
                const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
                if (sellerDoc.exists() && sellerDoc.data().sellerName) {
                  sellerName = sellerDoc.data().sellerName;
                } else {
                  // Fallback to users collection
                  const userDoc = await getDoc(doc(db, "users", sellerId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    sellerName =
                      userData.displayName ||
                      `${userData.firstName} ${userData.surname}`.trim() ||
                      sellerName;
                  }
                }
              } catch (error) {
                console.error("Error fetching seller name:", error);
              }

              // 2. Get all books uploaded by this seller from advertMyBook
              const advertSnapshot = await getDocs(
                collection(db, "advertMyBook"),
              );
              const uploadedBooks = [];

              advertSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.userId === sellerId || data.sellerId === sellerId) {
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

              // 4. Also get purchased IDs for current user
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
                  // Also add firestore- prefixed
                  Object.values(myPurchased).forEach((p) => {
                    const id = p.bookId || p.id || p.firestoreId;
                    if (id) ids.add(`firestore-${id}`);
                  });
                  setPurchasedBookIds(ids);
                }
              }

              setSeller({ sellerId, sellerName });
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
            const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        setFilteredBooks(filtered);
    }, [searchQuery, selectedCategory, sellerBooks]);

    // ─── CATEGORIES from uploaded books ───────────────────────
    const categories = [
        { value: "all", label: "All" },
        ...Array.from(new Set(sellerBooks.map((b) => b.category)))
            .filter(Boolean)
            .map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })),
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
                        <p className="text-gray-600">Loading seller profile...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Seller Not Found</h2>
                    <p className="text-gray-500 mb-6">This seller profile doesn't exist or has been removed.</p>
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

            {/* ── Seller Header Banner ── */}
            <div className="max-w-7xl mx-auto px-4 mt-4">
                <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                    {/* decorative circles */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl md:text-4xl font-black text-white">
                                {seller.sellerName?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl md:text-3xl font-black">{seller.sellerName}</h1>
                            <p className="text-blue-200 text-sm mt-1">Verified Seller on LAN Library</p>

                            {/* Stats row */}
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                                <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-200" />
                                    <div>
                                        <p className="text-xs text-blue-200">Uploads</p>
                                        <p className="font-bold text-base">{stats.totalBooks}</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <ShoppingBag size={18} className="text-blue-200" />
                                    <div>
                                        <p className="text-xs text-blue-200">Sold</p>
                                        <p className="font-bold text-base">{stats.totalSold}</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-blue-200" />
                                    <div>
                                        <p className="text-xs text-blue-200">Earnings</p>
                                        <p className="font-bold text-base">₦{stats.totalEarnings.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search + Category Filter ── */}
            <div className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search books by this seller..."
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
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
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

            {/* ── Books Grid ── */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Result count */}
                <p className="text-sm text-gray-500 mb-4">
                    Showing <span className="font-semibold text-blue-950">{filteredBooks.length}</span> book{filteredBooks.length !== 1 ? "s" : ""}
                </p>

                {filteredBooks.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <BookOpen size={56} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No books found</h3>
                        <p className="text-gray-500 text-sm">
                            {searchQuery || selectedCategory !== "all"
                                ? "Try clearing your search or filters."
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
                                    <div key={rowIndex} className="overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                                            {row.map((book) => (
                                                <Link
                                                    key={book.id}
                                                    href={`/book/preview?id=${book.id}`}
                                                    className="flex-none w-[160px] sm:w-[180px] group"
                                                >
                                                    <div className="relative mb-2">
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-full h-[220px] sm:h-[250px] group-hover:shadow-lg transition-shadow"
                                                            onError={(e) => {
                                                                e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                                                            }}
                                                        />
                                                        {/* Owned badge */}
                                                        {isPurchased(book.id) && (
                                                            <span className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                                                                Owned
                                                            </span>
                                                        )}
                                                        {/* Sold count tag */}
                                                        {book.soldCount > 0 && (
                                                            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                                                                <ShoppingBag size={10} /> {book.soldCount} sold
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {book.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-0.5">{book.category}</p>
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
                                    href={`/book/preview?id=${book.id}`}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
                                >
                                    {/* Image */}
                                    <div className="relative">
                                        <img
                                            src={book.image}
                                            alt={book.title}
                                            className="w-full h-[280px] object-cover"
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                                            }}
                                        />
                                        {/* Owned */}
                                        {isPurchased(book.id) && (
                                            <span className="absolute top-3 left-3 bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow">
                                                Owned
                                            </span>
                                        )}
                                        {/* Sold count */}
                                        {book.soldCount > 0 && (
                                            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow">
                                                <ShoppingBag size={12} /> {book.soldCount} sold
                                            </span>
                                        )}
                                        {/* Status tag for pending / rejected */}
                                        {book.status && book.status !== "approved" && (
                                            <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-bold shadow ${
                                                book.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                            }`}>
                                                {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {book.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 capitalize">{book.category}</p>

                                        {/* Tags row */}
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {book.pages} pages
                                            </span>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {book.format}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <p className="text-lg font-bold text-blue-950 mt-3">₦{book.price?.toLocaleString()}</p>
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