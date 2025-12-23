"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { FileText, X, Download } from "lucide-react";
import Link from "next/link";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q")?.toLowerCase() || "";

  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());

  // =========================
  // FETCH PURCHASED BOOKS
  // =========================
  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const purchased = userDoc.data().purchasedBooks || [];
            setPurchasedBookIds(new Set(purchased.map(book => book.id)));
          } else {
            const localPurchased = JSON.parse(localStorage.getItem(`purchased_${user.email}`) || "[]");
            setPurchasedBookIds(new Set(localPurchased.map(book => book.id)));
          }
        }
      } catch (error) {
        console.error("Error fetching purchased books:", error);
        const userEmail = auth.currentUser?.email;
        if (userEmail) {
          const localPurchased = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || "[]");
          setPurchasedBookIds(new Set(localPurchased.map(book => book.id)));
        }
      }
    };

    fetchPurchasedBooks();
  }, []);

  // =========================
  // SEARCH LOGIC
  // =========================
  useEffect(() => {
    const performSearch = async () => {
      if (!q) return setSearchResults([]);

      // Search in platform books
      const filtered = booksData.filter(
        book =>
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q) ||
          book.category?.toLowerCase().includes(q)
      );

      // TODO: Also search Firestore books if needed
      // const firestoreBooks = await searchFirestoreBooks(q);

      setSearchResults(filtered);
    };

    performSearch();
  }, [q]);

  // =========================
  // PURCHASE / DOWNLOAD
  // =========================
  const handlePurchase = book => {
    setSelectedBook(book);
    setShowPurchaseModal(true);
  };

  const handleProceedToPayment = () => {
    if (!selectedBook) return;
    setShowPurchaseModal(false);
    router.push(`/payment?bookId=${selectedBook.id}`);
  };

  const handleDownload = book => {
    alert(`Downloading ${book.title}`);
  };

  const isPurchased = bookId => purchasedBookIds.has(bookId);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-blue-950">
        Search Results for: "{q}"
      </h2>

      <style jsx>{`
        .overflow-x-auto::-webkit-scrollbar { display: none; }
        .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {searchResults.length === 0 ? (
        <p className="text-gray-600">No results found.</p>
      ) : (
        <>
          {/* =========================
              PURCHASED BOOKS
          ========================= */}
          {searchResults.filter(book => isPurchased(book.id)).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-blue-950">Purchased Books</h3>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: 'max-content' }}>
                  {searchResults
                    .filter(book => isPurchased(book.id))
                    .map(book => (
                      <div key={book.id} className="flex-none w-[160px] sm:w-[180px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow snap-start">
                        <div className="relative">
                          <img src={book.image} alt={book.title} className="w-full h-48 object-cover" />
                          <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                            Owned
                          </span>
                          {book.discount && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                              {book.discount}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                          <div className="flex text-yellow-400 text-xs mb-2">
                            {'★'.repeat(Math.floor(book.rating))}
                            <span className="text-gray-500 ml-1">({book.reviews})</span>
                          </div>
                          <div className="flex gap-2 items-center mb-2">
                            <p className="text-lg font-bold text-gray-900">₦{book.price.toLocaleString()}</p>
                            {book.oldPrice && (
                              <span className="text-xs text-gray-500 line-through">₦{book.oldPrice.toLocaleString()}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{book.pages} pages • {book.format}</p>

                          <button
                            onClick={() => handleDownload(book)}
                            className="w-full bg-green-600 text-white py-2 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1 font-semibold"
                          >
                            <Download size={14} /> Download PDF
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================
              OTHER BOOKS
          ========================= */}
          {searchResults.filter(book => !isPurchased(book.id)).length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-950">
                {searchResults.filter(book => isPurchased(book.id)).length > 0 ? "Other Books" : "All Results"}
              </h3>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: 'max-content' }}>
                  {searchResults
                    .filter(book => !isPurchased(book.id))
                    .map(book => (
                      <Link
                        key={book.id}
                        href={`/book/preview?id=${book.id}`}
                        className="flex-none w-[200px] sm:w-[300px] bg-gray-50 px-3 py-5 border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <div className="relative">
                          <img src={book.image} alt={book.title} className="w-full h-48 object-cover" />
                          {isPurchased(book.id) && <span className="absolute top-2 right-2 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">Owned</span>}
                        </div>
                        <div className="p-3 py-7">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-blue-950">{book.title}</h4>
                          <p className="text-gray-600 mb-1 text-xs">by {book.author}</p>
                          <p className="text-blue-950 font-bold mb-2">₦{book.price?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-2">Tap to preview →</p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================
          PURCHASE MODAL
      ========================= */}
      {showPurchaseModal && selectedBook && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Purchase PDF Book</h3>
              <button onClick={() => setShowPurchaseModal(false)}>
                <X size={24} className="text-gray-600 hover:text-gray-900" />
              </button>
            </div>

            <div className="mb-4">
              <img src={selectedBook.image} alt={selectedBook.title} className="w-full h-48 object-cover rounded-lg mb-4" />
              <h4 className="font-bold text-lg text-blue-950">{selectedBook.title}</h4>
              <p className="text-gray-600">{selectedBook.author}</p>
              <p className="text-2xl font-bold text-blue-950 mt-2">₦ {selectedBook.price.toLocaleString()}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-950 mt-1" />
                <div className="text-sm text-blue-950">
                  <p className="font-semibold mb-1">Instant PDF Access</p>
                  <p>After payment, the PDF will be sent to: <strong>{auth.currentUser?.email || 'user@example.com'}</strong></p>
                  <p className="mt-2">You can also download it from "My Books" section anytime.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
