"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
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
  ThumbsUp,
  Flag,
  CheckCircle,
  Upload,
  User,
  HelpCircle,
   ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { fetchBookDetails } from "@/utils/bookUtils";
import WhatIsLanModal from "./WhatIsLanModal";

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
  const [allBooks, setAllBooks] = useState([]);
  const [showWhatIsLanModal, setShowWhatIsLanModal] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [bookSalesCount, setBookSalesCount] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [bookFeedbackCount, setBookFeedbackCount] = useState(0);


  // Helper function to get thumbnail from PDF
  const getThumbnailUrl = (book) => {
    if (book.driveFileId) {
      return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    }

    if (book.embedUrl) {
      const match = book.embedUrl.match(
        /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/
      );
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
      }
    }

    if (book.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
      const match = book.pdfUrl.match(/[-\w]{25,}/);
      if (match) {
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
      }
    }

    return (
      book.image ||
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

  const handleReport = () => {
    router.push(`/report/book?bookId=${bookId}`);
}
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

  // Handle upload button click
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
  
        // 👇 NO ROLE YET
        if (!data.role || data.role === "") {
          router.push("/role-selection");
          return;
        }
  
        // 👇 ROLE ROUTING
        if (data.role === "student") {
          router.push("/student/dashboard");
        } else if (data.role === "seller" || data.isSeller) {
          router.push("/my-account/seller-account");
        } else {
          router.push("/student/dashboard");
        }
      } catch (err) {
        console.error(err);
        router.push("/student/dashboard");
      }
    };
  
    useEffect(() => {
    const fetchBookSales = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const salesMap = {};

            usersSnapshot.docs.forEach(userDoc => {
                const userData = userDoc.data();
                const purchasedBooks = userData.purchasedBooks || {};

                Object.values(purchasedBooks).forEach(purchase => {
                    const bookId = purchase.bookId || purchase.id || purchase.firestoreId;
                    if (bookId) {
                        salesMap[bookId] = (salesMap[bookId] || 0) + 1;
                        // Also track firestore- prefixed version
                        salesMap[`firestore-${bookId}`] = (salesMap[`firestore-${bookId}`] || 0) + 1;
                    }
                });
            });

            setBookSalesCount(salesMap);
        } catch (error) {
            console.error("Error fetching sales count:", error);
        }
    };

    fetchBookSales();
}, []);

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

  // First, add this import at the top of your file (around line 20)

  // Then replace the entire useEffect with this:

useEffect(() => {
  const fetchBook = async () => {
    try {
      setLoading(true);

      const bookData = await fetchBookDetails(bookId);

      if (bookData) {
        // 🔍 ADD THESE DEBUG LINES
        console.log("📚 Full bookData:", bookData);
        console.log("📄 embedUrl:", bookData.embedUrl);
        console.log("📄 pdfUrl:", bookData.pdfUrl);
        console.log("📄 driveFileId:", bookData.driveFileId);

        setBook({
          ...bookData,
          image: getThumbnailUrl(bookData),
        });

        setPreviewContent(
          bookData.previewText ||
            bookData.introduction ||
            bookData.message ||
            bookData.description
        );
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


// Add this useEffect after your existing useEffects (around line 200):
useEffect(() => {
  const fetchAllBooks = async () => {
    try {
      console.log('🔍 Fetching all books for related section...');
      
      // Process booksData with thumbnails FIRST (immediate fallback)
      const processedBooksData = booksData.map(book => ({
        ...book,
        image: getThumbnailUrl(book)
      }));

      // Set immediately so books show right away
      setAllBooks(processedBooksData);
      console.log('✅ Set initial books from booksData:', processedBooksData.length);

      // Then try to fetch Firestore books to add more variety
      try {
        const q = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);

        const firestoreBooks = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const bookData = {
            id: `firestore-${docSnap.id}`,
            firestoreId: docSnap.id,
            title: data.bookTitle,
            author: data.author,
            category: data.category,
            price: data.price,
            pages: data.pages,
            format: data.format || 'PDF',
            description: data.description,
            driveFileId: data.driveFileId,
            pdfUrl: data.pdfUrl,
            previewUrl: data.previewUrl,
            embedUrl: data.embedUrl,
            isFromFirestore: true
          };

          // Use thumbnail from PDF
          bookData.image = getThumbnailUrl(bookData);
          firestoreBooks.push(bookData);
        });

        console.log('✅ Fetched Firestore books:', firestoreBooks.length);

        // Combine and shuffle for variety
        const combined = [...processedBooksData, ...firestoreBooks];
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setAllBooks(shuffled);
        console.log('✅ Total books available:', shuffled.length);
      } catch (firestoreError) {
        console.warn('⚠️ Could not fetch Firestore books, using booksData only:', firestoreError);
        // Keep the booksData we already set
      }
    } catch (error) {
      console.error('❌ Error in fetchAllBooks:', error);
      // Emergency fallback - use booksData with thumbnails
      const processedBooksData = booksData.map(book => ({
        ...book,
        image: getThumbnailUrl(book)
      }));
      setAllBooks(processedBooksData);
    }
  };

  fetchAllBooks();
}, []);

  // Improved checkPurchaseStatus function for BookPreviewPage

  const checkPurchaseStatus = async (userId) => {
    try {

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const purchasedBooks = userData.purchasedBooks || {};

        console.log("Purchased books keys:", Object.keys(purchasedBooks));

        // Clean the book ID (remove firestore- prefix if present)
        const cleanBookId = bookId?.replace("firestore-", "");

        // Check all possible variations
        let purchased = false;

        // Direct match with original bookId
        if (purchasedBooks[bookId]) {
          purchased = true;
          console.log("✓ Found purchase with original ID:", bookId);
        }

        // Match with cleaned bookId
        if (!purchased && purchasedBooks[cleanBookId]) {
          purchased = true;
          console.log("✓ Found purchase with cleaned ID:", cleanBookId);
        }

        // Check with firestore- prefix added
        if (!purchased && purchasedBooks[`firestore-${cleanBookId}`]) {
          purchased = true;
          console.log("✓ Found purchase with firestore- prefix");
        }

        // Deep search through all keys
        if (!purchased) {
          const bookKeys = Object.keys(purchasedBooks);
          purchased = bookKeys.some((key) => {
            const cleanKey = key.replace("firestore-", "");
            const match =
              key === bookId ||
              key === cleanBookId ||
              cleanKey === bookId ||
              cleanKey === cleanBookId ||
              key === `firestore-${bookId}` ||
              key === `firestore-${cleanBookId}`;

            if (match) {
              console.log("✓ Found purchase with key:", key);
            }
            return match;
          });
        }

        console.log(
          "Purchase status:",
          purchased ? "PURCHASED" : "NOT PURCHASED"
        );
        setIsPurchased(purchased);

        // Show success message if just purchased
        if (purchased && searchParams.get("purchased") === "true") {
          showToastMessage("Purchase successful! You now have full access.");

          // Clean up URL
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
    // If it's already a Firestore book (has firestore- prefix), use as-is
    // If it's from lib/booksData (numeric ID), don't add prefix
    let paymentBookId;

    if (bookId?.startsWith("firestore-")) {
      // Already has prefix, use as-is
      paymentBookId = bookId;
    } else if (book?.source === "firestore" && book?.firestoreId) {
      // Firestore book but ID doesn't have prefix yet
      paymentBookId = `firestore-${book.firestoreId}`;
    } else {
      // Platform book from lib/booksData - use numeric ID
      paymentBookId = bookId;
    }

    // console.log("Navigating to payment with bookId:", paymentBookId);
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
        title: `LAN Library | ${book.title},`,
        text: `Check out "${book.title}" by ${book.author}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage("Link copied to clipboard!");
    }
    setShowOptionsModal(false);
  };

  useEffect(() => {
  const fetchFeedbackCount = async () => {
    try {
      if (!bookId) return;
      const { collection: col, query: q, where: w, getDocs: gd } = await import("firebase/firestore");
      const feedbackQuery = q(col(db, "bookFeedbacks"), w("bookId", "==", bookId));
      const snapshot = await gd(feedbackQuery);
      setBookFeedbackCount(snapshot.size);
    } catch (error) {
      console.error("Error fetching feedback count:", error);
    }
  };
  fetchFeedbackCount();
}, [bookId]);

const submitFeedback = async () => {
  try {
    setIsSubmittingFeedback(true);
    await addDoc(collection(db, "bookFeedbacks"), {
      bookId: bookId,
      bookTitle: book?.title || book?.bookTitle || "Unknown Book",
      bookAuthor: book?.author || "Unknown Author",
      userId: user?.uid,
      userEmail: user?.email,
      userName: user?.displayName || user?.email?.split("@")[0] || "Anonymous",
      feedback: feedbackText.trim(),
      createdAt: serverTimestamp(),
    });
    
    setFeedbackText("");
    setShowFeedbackModal(false);
    setBookFeedbackCount((prev) => prev + 1);
    showToastMessage("Feedback submitted! Redirecting...");
    
    // ✅ Redirect to feedback page after 1 second
    setTimeout(() => {
      router.push(`/book/feedbacks?bookId=${bookId}`);
    }, 1000);
    
  } catch (error) {
    console.error("Error submitting feedback:", error);
    showToastMessage("Error submitting feedback. Try again.");
  } finally {
    setIsSubmittingFeedback(false);
  }
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
            Book Not Found / Check Your Network Connection
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
              <div className="text-4xl font-bold text-blue-50">
                [LAN Library]
                <h2 className="text-xs sm:text-base">
                  The Global Student Library 📚
                </h2>
              </div>
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
                <div className="text-3xl font-bold text-blue-950">
                  [LAN Library]
                  <h2 className="text-xs sm:text-base">
                    The Global Student Library 📚
                  </h2>
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

              <button
                onClick={handleMyAccountClick}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-4"
              >
                <span>My Account</span>
                <ChevronRight />
              </button>
              <Link
                href="/my-books"
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-4"
              >
                <span className="font-medium">My Books</span>
                <ChevronRight />
              </Link>

              <div className="">
                <Link
                  href="/lan/net/help-center"
                  className="flex mx-auto items-center gap-3 p-3 hover:bg-gray-50 "
                >
                  <HelpCircle size={20} />
                  <span>FAQ and support</span>
                  <ChevronRight className="ml-auto" />
                </Link>
              </div>

              <div className="border-t border-blue-950 my-4"></div>
              <div className="mt-6">
                <button
                  onClick={() => setShowWhatIsLanModal(true)}
                  className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap z-50"
                >
                  What is LAN Library?
                </button>

                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <div key={index}>
                      <button
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === index ? null : index,
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
                  href="/documents"
                  onClick={() => setShowNavMenu(false)}
                  className="block p-3 hover:bg-gray-50 rounded-lg font-medium mt-2"
                >
                  All Documents
                </Link>
              </div>
              <button
                onClick={HandleClick}
                disabled={checkingSeller}
                className="bg-blue-950 hover:bg-blue-800 mt-5 transition-colors text-white font-semibold px-8 py-2 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  className="w-full h-auto border border-gray-200 p-5.5"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                  }}
                />
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500">Uploaded by</p>
                <p className="font-semibold text-gray-900">{book.sellerName}</p>
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
                    Open in My Books
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full hidden bg-blue-950 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold mb-3"
                >
                  Purchase and Access - ₦{book.price?.toLocaleString()}
                </button>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6 mt-3">
                <button className="flex text-blue-50 bg-blue-950 items-center justify-center gap-2 px-4 py-2 border rounded-lg">
                  <Layers size={18} />
                  <span className="text-sm">
                    Price: {book.price?.toLocaleString()}
                  </span>
                </button>
                <button className="flex items-center text-blue-50 bg-blue-950 justify-center gap-2 px-4 py-2 border  rounded-lg">
                  <ShoppingBag size={12} />
                  <span className="text-sm">
                    {bookSalesCount[book.id] ||
                      bookSalesCount[book.firestoreId] ||
                      0}{" "}
                    sold
                  </span>
                </button>
                <button
                  onClick={() =>
                    router.push(`/book/feedbacks?bookId=${bookId}`)
                  }
                  className="flex items-center text-blue-50 bg-blue-950 justify-center gap-2 px-4 py-2 border  rounded-lg "
                >
                  <ThumbsUp className="w-4 h-4 " />
                  <span className="">FeedBack: {bookFeedbackCount}</span>
                </button>
                <button className="flex items-center text-blue-50 bg-blue-950 justify-center gap-2 px-4 py-2 border  rounded-lg">
                  <FileText size={18} />
                  <span className="text-sm">{book.pages} Pages</span>
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
                      <div className="w-full relative">
                        <iframe
                          src={book.embedUrl}
                          className="w-full h-[1000px] border-none rounded-lg"
                          title={book.title}
                          allow="autoplay"
                        />
                        {/* Desktop mask — hides the pop-out button */}
                        <div
                          className="absolute top-0 right-0 h-[76px] bg-[#323639] z-10 hidden md:flex items-center justify-end px-5 gap-3 select-none"
                          style={{ width: "220px" }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <div className="flex flex-col items-end leading-tight">
                            <div>
                              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                LAN Library |
                              </span>
                              <span className="text-gray-400 text-[9px] font-mono">
                                {" The Global Student Library"}
                              </span>
                            </div>
                          </div>
                          <div className="h-6 w-[1px] bg-gray-600/50 mx-1" />
                          <Lock size={16} className="text-gray-400" />
                        </div>
                        {/* Mobile mask */}
                        <div
                          className="absolute top-0 right-0 h-[78px] bg-[#323639] z-10 md:hidden flex items-center justify-end px-4 select-none"
                          style={{ width: "120px" }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <div>
                            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                              LAN Library |
                            </span>
                            <span className="text-gray-400 text-[9px] font-mono">
                              {" The Global Student Library"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : book.pdfUrl ? (
                      <div className="w-full relative">
                        <iframe
                          src={`${book.pdfUrl}#view=FitH`}
                          className="w-full h-[1000px] border-none rounded-lg"
                          title={book.title}
                        />
                        {/* Desktop mask */}
                        <div
                          className="absolute top-0 right-0 h-[56px] bg-[#323639] z-10 hidden md:flex items-center justify-end px-5 gap-3 select-none"
                          style={{ width: "220px" }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <div className="flex flex-col items-end leading-tight">
                            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                              LAN Library
                            </span>
                            <span className="text-gray-400 text-[9px] font-mono">
                              ID:{" "}
                              {user?.uid?.substring(0, 8).toUpperCase() ||
                                "USER"}
                            </span>
                          </div>
                          <div className="h-6 w-[1px] bg-gray-600/50 mx-1" />
                          <Lock size={16} className="text-gray-400" />
                        </div>
                        {/* Mobile mask */}
                        <div
                          className="absolute top-0 right-0 h-[48px] bg-[#323639] z-10 md:hidden flex items-center justify-end px-4 select-none"
                          style={{ width: "120px" }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <span className="text-gray-400 text-[9px] font-bold uppercase">
                            LAN Lib's
                          </span>
                        </div>
                      </div>
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
                      {book.embedUrl ? (
                        // Show embedUrl for Firestore books
                        <div className="h-[600px] overflow-hidden">
                          <iframe
                            src={book.embedUrl}
                            className="w-full h-full border-none pointer-events-none"
                            title={`${book.title} - Preview`}
                            scrolling="no"
                          />
                        </div>
                      ) : book.pdfUrl ? (
                        //  Show pdfUrl for platform books
                        <div className="h-[600px] overflow-hidden">
                          <iframe
                            src={`${book.pdfUrl}#view=FitH&page=1&toolbar=0`}
                            className="w-full h-full border-none pointer-events-none"
                            title={`${book.title} - Preview`}
                            scrolling="no"
                          />
                        </div>
                      ) : (
                        // Fallback: Show text preview if no PDF URL
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

              <div className="border-t border-gray-200 p-4 flex items-center justify-between text-blue-950">
                <button
                  onClick={() => setShowOverview(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <Layers size={18} />
                  Overview
                </button>
                <button
                  onClick={() => setShowSummary(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <FileText size={18} />
                  Summary
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

          {/* Mobile/Tablet: 2-Column Grid */}
          <div className="md:hidden">
            <div className="grid grid-cols-2 gap-4">
              {(allBooks.length > 0 ? allBooks : booksData)
                .filter((relatedBook) => relatedBook.id !== bookId)
                .slice(0, 10)
                .map((relatedBook) => (
                  <Link
                    key={relatedBook.id}
                    href={`/book/preview?id=${relatedBook.id}`}
                    className="group"
                  >
                    <div className="relative mb-3">
                      <img
                        src={getThumbnailUrl(relatedBook)}
                        alt={relatedBook.title}
                        className="w-full h-[240px] sm:h-[280px]  group-hover:shadow-xl transition-shadow"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {relatedBook.title}
                      </h4>
                      <p className="text-gray-600 text-xs">
                        {relatedBook.author}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(allBooks.length > 0 ? allBooks : booksData)
              .filter((relatedBook) => relatedBook.id !== bookId)
              .slice(0, 20)
              .map((relatedBook) => (
                <Link
                  key={relatedBook.id}
                  href={`/book/preview?id=${relatedBook.id}`}
                  className="group"
                >
                  <div className="relative mb-3">
                    <img
                      src={getThumbnailUrl(relatedBook)}
                      alt={relatedBook.title}
                      className="w-full h-[380px] group-hover:shadow-xl transition-shadow"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedBook.title}
                    </h4>
                    <p className="text-gray-600 text-xs">
                      {relatedBook.author}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {showOverview && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowOverview(false)}
          />
          <div className="fixed inset-y-0 left-0 w-96 lg:w-200 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <button
                  onClick={() => setShowOverview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <img
                src={book.image || book.coverImage}
                alt={book.title}
                className="w-full object-cover rounded-lg mb-4"
              />

              <h3 className="text-xl font-bold mb-2 text-gray-900">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                By <span className="underline">{book.author}</span>
              </p>
              <>
                <h3 className="font-bold mb-2 text-gray-900">Description</h3>
                <p className="text-sm text-gray-600 mb-6">{book.description}</p>
              </>
              <h3 className="font-bold mb-2 text-gray-900">Category</h3>
              <p className="text-sm text-gray-600 mb-6">
                {book.category || "General"}
              </p>

              <h3 className="font-bold mb-2 text-gray-900">Format</h3>
              <p className="text-sm text-gray-600">
                {book.format || "PDF"} • {book.pages || "N/A"} pages
              </p>
            </div>
          </div>
        </>
      )}

      {showSummary && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowSummary(false)}
          />
          <div className="fixed inset-y-0 right-0 w-96 lg:w-200 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {book.title}
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <img
                src={book.image || book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover rounded-lg mb-4"
              />
              <>
                <h3 className="font-bold mb-2 text-gray-900">Summary</h3>
                <p className="text-sm text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
                  {book.message}
                </p>
              </>
              <p className="text-sm text-gray-600 mb-4">
                By:<span className="underline">{book.author}</span>
              </p>
            </div>
          </div>
        </>
      )}

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

                <button
                  onClick={() => {
                    setShowOptionsModal(false);
                    setShowFeedbackModal(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <ThumbsUp size={24} className="text-gray-700" />
                  <span className="font-medium text-gray-900 text-lg">
                    Feedback
                  </span>
                </button>

                <button
                  onClick={handleReport}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => {
              setShowFeedbackModal(false);
              setFeedbackText("");
            }}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center px-4">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-1">Feedback</h2>
              <p className="text-gray-400 text-sm mb-4">
                Please provide details: (optional)
              </p>

              <textarea
                autoFocus
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What was satisfying about this response?"
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
              />

              <p className="text-gray-500 text-xs mt-2 mb-5">
                Submitting this feedback will help us improve this book's
                experience.{" "}
                <button
                  onClick={() =>
                    router.push(`/book/feedbacks?bookId=${bookId}`)
                  }
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  View all feedback
                </button>
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackText("");
                  }}
                  className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={isSubmittingFeedback}
                  className="px-5 py-2 rounded-lg bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit"}
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
      <WhatIsLanModal
        isOpen={showWhatIsLanModal}
        onClose={() => setShowWhatIsLanModal(false)}
      />
    </div>
  );
}
