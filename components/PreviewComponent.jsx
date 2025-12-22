"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { booksData } from "@/lib/booksData";
import {
  Download,
  Share2,
  Bookmark,
  MoreVertical,
  Lock,
  Search,
  Menu,
  X,
  Eye,
  FileText,
  ChevronRight,
  Layers,
  ThumbsDown,
  Flag,
  CheckCircle,
  Upload,
  HelpCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function BookPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");

  const [book, setBook] = useState(null);
  const [user, setUser] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  // FIXED: Helper function to get thumbnail from PDF
  const getThumbnailUrl = (book) => {
    console.log("Getting thumbnail for:", book?.title, book);

    // Priority 1: driveFileId
    if (book?.driveFileId) {
      const url = `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
      console.log("Using driveFileId:", url);
      return url;
    }

    // Priority 2: Extract from embedUrl
    if (book?.embedUrl) {
      const match = book.embedUrl.match(
        /\/d\/([\w-]+)|\/file\/d\/([\w-]+)|id=([\w-]+)/
      );
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
          const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
          console.log("Using embedUrl fileId:", url);
          return url;
        }
      }
    }

    // Priority 3: Extract from pdfUrl
    if (book?.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
      const match = book.pdfUrl.match(
        /\/d\/([\w-]+)|\/file\/d\/([\w-]+)|id=([\w-]+)/
      );
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
          const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
          console.log("Using pdfUrl fileId:", url);
          return url;
        }
      }
    }

    // Fallback
    console.log("Using fallback image");
    return (
      book?.image ||
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
    );
  };

  const categories = [
    {
      name: "Education",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("education"))
        .slice(0, 5),
    },
    {
      name: "Business",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("business"))
        .slice(0, 5),
    },
    {
      name: "Technology",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("technology"))
        .slice(0, 5),
    },
    {
      name: "Science",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("science"))
        .slice(0, 5),
    },
    {
      name: "Personal Development",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("personal"))
        .slice(0, 5),
    },
    {
      name: "Arts & Culture",
      books: booksData
        .filter((b) => b.category?.toLowerCase().includes("arts"))
        .slice(0, 5),
    },
  ];

  // Check seller status
  const checkSellerStatus = async (userId) => {
    try {
      setCheckingSeller(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isUserSeller = userData.isSeller === true;
        setIsSeller(isUserSeller);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
      setIsSeller(false);
    } finally {
      setCheckingSeller(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkSellerStatus(currentUser.uid);
        await checkPurchaseStatus(currentUser.uid);
        await checkSavedStatus(currentUser.uid);
      } else {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const HandleClick = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (isSeller) {
      router.push("/advertise");
    } else {
      router.push("/become-seller");
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        await checkPurchaseStatus(user.uid);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, bookId]);

  useEffect(() => {
    if (user && bookId) {
      checkPurchaseStatus(user.uid);
    }
  }, [user, bookId]);

  // FIXED: Fetch book with proper embedUrl handling
  useEffect(() => {
    const fetchBook = async () => {
      try {
        console.log("Fetching book with ID:", bookId);

        if (bookId?.startsWith("firestore-")) {
          const firestoreId = bookId.replace("firestore-", "");
          console.log("Fetching from Firestore:", firestoreId);

          const bookDoc = await getDoc(doc(db, "advertMyBook", firestoreId));

          if (bookDoc.exists()) {
            const data = bookDoc.data();
            console.log("Firestore book data:", data);

            const bookData = {
              id: bookId,
              firestoreId: firestoreId,
              title: data.bookTitle,
              author: data.author,
              category: data.category,
              price: data.price,
              pages: data.pages,
              format: data.format || "PDF",
              description: data.description,
              message: data.message,
              rating: 4.5,
              reviews: 0,
              driveFileId: data.driveFileId,
              pdfUrl: data.pdfUrl,
              previewUrl: data.previewUrl,
              embedUrl: data.embedUrl, // ✅ CRITICAL: Include embedUrl
              introduction: data.introduction || data.message,
              previewText: data.previewText || data.description,
              source: "firestore",
            };

            // Generate thumbnail
            bookData.image = getThumbnailUrl(bookData);

            console.log("Final book data:", bookData);
            setBook(bookData);

            setPreviewContent(
              data.previewText ||
                data.introduction ||
                data.message ||
                data.description
            );
          } else {
            console.error("Book document not found");
          }
        } else {
          const foundBook = booksData.find((b) => b.id === parseInt(bookId));
          if (foundBook) {
            setBook({
              ...foundBook,
              image: getThumbnailUrl(foundBook),
              source: "platform",
            });
            setPreviewContent(
              foundBook.previewText ||
                foundBook.introduction ||
                foundBook.message ||
                foundBook.description
            );
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book:", error);
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  // FIXED: Check purchase status
  const checkPurchaseStatus = async (userId) => {
    try {
      console.log("=== CHECKING PURCHASE STATUS ===");
      console.log("User ID:", userId);
      console.log("Book ID from URL:", bookId);

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const purchasedBooks = userData.purchasedBooks || {};

        console.log("Purchased books:", purchasedBooks);

        // Clean the book ID
        const cleanBookId = bookId?.replace("firestore-", "");

        // Check all possible variations
        let purchased = false;

        // Check with original ID
        if (purchasedBooks[bookId]) {
          purchased = true;
          console.log("✓ Found with original ID:", bookId);
        }

        // Check with cleaned ID
        if (!purchased && cleanBookId && purchasedBooks[cleanBookId]) {
          purchased = true;
          console.log("✓ Found with cleaned ID:", cleanBookId);
        }

        // Check with firestore- prefix
        if (
          !purchased &&
          cleanBookId &&
          purchasedBooks[`firestore-${cleanBookId}`]
        ) {
          purchased = true;
          console.log("✓ Found with firestore- prefix");
        }

        // Deep search
        if (!purchased) {
          const keys = Object.keys(purchasedBooks);
          for (const key of keys) {
            const cleanKey = key.replace("firestore-", "");
            if (
              key === bookId ||
              key === cleanBookId ||
              cleanKey === bookId ||
              cleanKey === cleanBookId ||
              key === `firestore-${bookId}` ||
              key === `firestore-${cleanBookId}`
            ) {
              purchased = true;
              console.log("✓ Found with key:", key);
              break;
            }
          }
        }

        console.log(
          "Purchase status:",
          purchased ? "PURCHASED" : "NOT PURCHASED"
        );
        setIsPurchased(purchased);

        if (purchased && searchParams.get("purchased") === "true") {
          showToastMessage("Purchase successful! You now have full access.");
          const url = new URL(window.location);
          url.searchParams.delete("purchased");
          window.history.replaceState({}, "", url);
        }
      } else {
        console.log("User document does not exist");
        setIsPurchased(false);
      }
    } catch (error) {
      console.error("Error checking purchase status:", error);
      setIsPurchased(false);
    }
  };

  const checkSavedStatus = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedBooks = userData.savedBooks || [];

        let saved = false;

        if (Array.isArray(savedBooks)) {
          saved = savedBooks.some((b) => b.id === bookId);
        } else if (typeof savedBooks === "object") {
          saved = savedBooks[bookId] !== undefined;
        }

        setIsSaved(saved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const handleSaveForLater = async () => {
    try {
      if (!user) {
        alert("Please sign in to save books");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      let savedBooksArray = [];
      if (userDoc.exists()) {
        const userData = userDoc.data();
        savedBooksArray = userData.savedBooks || [];
      }

      if (isSaved) {
        savedBooksArray = savedBooksArray.filter((b) => b.id !== bookId);
        setIsSaved(false);
        showToastMessage("Removed from saved books");
      } else {
        const bookToSave = {
          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          savedAt: new Date().toISOString(),
        };
        savedBooksArray.push(bookToSave);
        setIsSaved(true);
        showToastMessage("Saved for later!");
      }

      await updateDoc(userDocRef, {
        savedBooks: savedBooksArray,
      });

      setShowOptionsModal(false);
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Error saving book. Please try again.");
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePurchase = () => {
    // Ensure we're passing the correct ID format
    const paymentBookId = bookId;
    console.log("Redirecting to payment with bookId:", paymentBookId);
    router.push(`/payment?bookId=${paymentBookId}`);
  };

  const handleDownload = () => {
    if (!isPurchased) {
      alert("Please purchase to download");
      return;
    }

    if (book.pdfUrl) {
      const link = document.createElement("a");
      link.href = book.pdfUrl;
      link.download = `${book.title}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToastMessage("Download started!");
    } else {
      showToastMessage("Download link not available");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage("Link copied to clipboard!");
    }
    setShowOptionsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Book Not Found
          </h2>
          <Link href="/home" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-950 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="p-2 hover:bg-blue-900 rounded-lg text-blue-50"
            >
              {showNavMenu ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/home" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-50">LAN Library</div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOptionsModal(true)}
                className="p-2 hover:bg-blue-900 rounded-lg text-blue-50"
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu Modal */}
      {showNavMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowNavMenu(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white text-blue-950 z-[70] overflow-y-auto animate-slideRight">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-blue-950">
                  LAN Library
                </div>
                <button onClick={() => setShowNavMenu(false)}>
                  <X size={24} />
                </button>
              </div>

              {!isPurchased && (
                <button
                  onClick={() => {
                    setShowNavMenu(false);
                    handlePurchase();
                  }}
                  className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold mb-4"
                >
                  Purchase This Book
                </button>
              )}

              <Link
                href="/my-account"
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-1"
              >
                <span className="font-medium">My Account</span>
                <ChevronRight />
              </Link>
              <Link
                href="/saved-my-book"
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-4"
              >
                <span className="font-medium">Saved Books</span>
                <ChevronRight />
              </Link>
              <Link
                href="/my-books"
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-4"
              >
                <span className="font-medium">My Books</span>
                <ChevronRight />
              </Link>

              <div className="border-t border-gray-200 my-4"></div>

              <div className="space-y-2">
                <button
                  onClick={HandleClick}
                  disabled={checkingSeller}
                  className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-2 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {checkingSeller ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : isSeller ? (
                    <>
                      <Upload size={20} />
                      Upload Document
                    </>
                  ) : (
                    <>Become a Seller</>
                  )}
                </button>

                <Link
                  href="/lan/net/help-center"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <HelpCircle size={20} />
                  <span>FAQ and support</span>
                </Link>
              </div>

              <div className="mt-6">
                <Link href="/about/lan">
                  <h3 className="font-bold text-gray-900 mb-3">What is LAN?</h3>
                </Link>

                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <div key={index}>
                      <button
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === index ? null : index
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium">{category.name}</span>
                        <ChevronRight
                          size={20}
                          className={`transition-transform ${
                            expandedCategory === index ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {expandedCategory === index &&
                        category.books.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {category.books.map((book) => (
                              <Link
                                key={book.id}
                                href={`/category/${category.name
                                  .toLowerCase()
                                  .replace(/ & /g, "-")
                                  .replace(/ /g, "-")}`}
                                onClick={() => setShowNavMenu(false)}
                                className="block p-2 pl-4 hover:bg-gray-50 rounded text-sm text-gray-700 hover:text-blue-950"
                              >
                                {book.title}
                              </Link>
                            ))}
                            <Link
                              href={`/category/${category.name
                                .toLowerCase()
                                .replace(/ & /g, "-")
                                .replace(/ /g, "-")}`}
                              onClick={() => setShowNavMenu(false)}
                              className="block p-2 pl-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View all {category.name} →
                            </Link>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                <Link
                  href="/pdf"
                  onClick={() => setShowNavMenu(false)}
                  className="block p-3 hover:bg-gray-50 rounded-lg font-medium mt-2"
                >
                  All Documents
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={18} className="text-gray-500" />
                <span className="text-gray-600">{book.pages} pages</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {book.title}
              </h1>

              {/* Book Cover/Thumbnail - FIXED */}
              <div className="mb-4">
                <img
                  src={getThumbnailUrl(book)}
                  alt={"Cover of " + book.title}
                  className="w-full h-auto rounded-lg shadow-md object-cover border border-gray-200"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                  }}
                />
              </div>

              <div className="text-gray-600 text-sm mb-4">
                <h2 className="font-bold text-blue-950 mb-2">Introduction:</h2>
                {book.description}
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500">Uploaded by</p>
                <p className="font-semibold text-gray-900">{book.author}</p>
              </div>

              {isPurchased ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      You own this book
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/my-books")}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <Download size={20} />
                    Download Full PDF
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold mb-3"
                >
                  Purchase and Access - ₦{book.price?.toLocaleString()}
                </button>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6 mt-3">
                <button className="flex text-blue-950 items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Layers size={18} />
                  <span className="text-sm">Outline</span>
                </button>
                <button className="flex items-center text-blue-950 justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileText size={18} />
                  <span className="text-sm">Page view</span>
                </button>
              </div>

              <div className="flex items-center justify-around py-4 border-t border-gray-200">
                <button
                  onClick={handleSaveForLater}
                  className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-950"
                >
                  <Bookmark
                    size={20}
                    className={isSaved ? "fill-blue-950 text-blue-950" : ""}
                  />
                  <span className="text-xs">{isSaved ? "Saved" : "Save"}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-950"
                >
                  <Share2 size={20} />
                  <span className="text-xs">Share</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Category: {book.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Format: {book.format}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - PDF Preview with Lock Below */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">
                  {isPurchased ? "Full Access" : "Preview"}
                </span>
                {isPurchased && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                    Purchased
                  </span>
                )}
              </div>

              <div className="bg-gray-100">
                {isPurchased ? (
                  <div className="p-8">
                    {book.embedUrl ? (
                      <iframe
                        src={book.embedUrl}
                        className="w-full h-[1000px] border-none rounded-lg"
                        title={book.title}
                        allow="autoplay"
                      />
                    ) : book.pdfUrl ? (
                      <iframe
                        src={`${book.pdfUrl}#view=FitH`}
                        className="w-full h-[1000px] border-none rounded-lg"
                        title={book.title}
                      />
                    ) : (
                      <div className="bg-white p-8 rounded-lg">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                          <CheckCircle size={24} className="text-green-600" />
                          <div>
                            <h3 className="font-bold text-green-900">
                              Full Access Granted
                            </h3>
                            <p className="text-sm text-green-700">
                              You have full access to {book.title}
                            </p>
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-4 text-gray-900">
                          {book.title}
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {book.description}
                        </p>

                        {book.introduction && (
                          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <div>
                              <h4 className="font-bold text-lg mb-3 text-gray-900">
                                Introduction
                              </h4>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {book.introduction}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900">
                            <strong>Note:</strong> Click the "Download Full PDF"
                            button above to download and read the complete
                            document.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* PDF Preview (First Page/Beginning) */}
                    <div className="relative">
                      {book.embedUrl || book.pdfUrl ? (
                        <div className="h-[600px] overflow-hidden">
                          <iframe
                            src={`${
                              book.embedUrl || book.pdfUrl
                            }#view=FitH&page=1&toolbar=0`}
                            className="w-full h-full border-none pointer-events-none"
                            title={`${book.title} - Preview`}
                            scrolling="no"
                          />
                        </div>
                      ) : (
                        <div className="h-[600px] p-8 bg-white">
                          <h3 className="text-2xl font-bold mb-6 text-gray-900">
                            {book.title}
                          </h3>

                          {book.introduction ? (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-blue-950">
                                Introduction
                              </h4>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {book.introduction.slice(0, 800)}
                                {book.introduction.length > 800 && "..."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-gray-700 leading-relaxed">
                                <p>{book.description}</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                  <strong>Pages:</strong> {book.pages} |{" "}
                                  <strong>Format:</strong> {book.format}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lock Section Below PDF Preview */}
                    <div className="bg-gradient-to-b from-gray-100 to-white p-12">
                      <div className="text-center max-w-md mx-auto">
                        <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Lock className="w-10 h-10 text-blue-950" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Purchase to unlock full access
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Get instant access to all {book.pages} pages of this
                          document
                        </p>
                        <button
                          onClick={handlePurchase}
                          className="bg-blue-950 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
                        >
                          Purchase for ₦{book.price?.toLocaleString()}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-4 flex items-center justify-between md:hidden text-blue-950">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                  <Layers size={18} />
                  Overview
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                  <Search size={18} />
                  Find
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                  <FileText size={18} />
                  Summarize
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Books */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            You might also like
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-blue-950">
            {booksData.slice(0, 4).map((relatedBook) => (
              <Link
                key={relatedBook.id}
                href={`/book/preview?id=${relatedBook.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <img
                  src={getThumbnailUrl(relatedBook)}
                  alt={relatedBook.title}
                  className="w-full h-48 object-cover bg-gray-200"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                  }}
                  loading="lazy"
                />
                <div className="p-3">
                  <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                    {relatedBook.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    By: {relatedBook.author}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Options Modal */}
      {showOptionsModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowOptionsModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slideUp">
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

              <div className="space-y-1">
                <button
                  onClick={handleSaveForLater}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <Bookmark
                    size={24}
                    className={
                      isSaved ? "text-blue-950 fill-blue-950" : "text-gray-700"
                    }
                  />
                  <span className="font-medium text-gray-900 text-lg">
                    {isSaved ? "Saved for later" : "Save for later"}
                  </span>
                  {isSaved && (
                    <CheckCircle size={20} className="ml-auto text-blue-950" />
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <Share2 size={24} className="text-gray-700" />
                  <span className="font-medium text-gray-900 text-lg">
                    Share
                  </span>
                </button>

                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  <ThumbsDown size={24} className="text-gray-700" />
                  <span className="font-medium text-gray-900 text-lg">
                    Don't show again
                  </span>
                </button>

                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  <Flag size={24} className="text-gray-700" />
                  <span className="font-medium text-gray-900 text-lg">
                    Report
                  </span>
                </button>

                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="w-full mt-4 p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-gray-900"
                >
                  <X size={20} className="inline mr-2" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fadeIn">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideRight {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideRight {
          animation: slideRight 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
