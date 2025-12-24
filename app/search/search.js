"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const [loading, setLoading] = useState(false);

  // Helper function to get thumbnail from PDF
  const getThumbnailUrl = (book) => {
    if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';

    if (book.driveFileId) {
      return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    }

    if (book.embedUrl) {
      const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
      }
    }

    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
      const match = book.pdfUrl.match(/[-\w]{25,}/);
      if (match) {
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
      }
    }

    return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
  };

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
          }
        }
      } catch (error) {
        console.error("Error fetching purchased books:", error);
      }
    };

    fetchPurchasedBooks();
  }, []);

  // =========================
  // SEARCH LOGIC
  // =========================
  useEffect(() => {
    const performSearch = async () => {
      if (!q) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      console.log('🔍 Searching for:', q);

      try {
        // 1. Search in platform books
        const platformResults = booksData
          .filter(book =>
            book.title?.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q) ||
            book.category?.toLowerCase().includes(q)
          )
          .map(book => ({
            ...book,
            image: getThumbnailUrl(book),
            source: 'platform'
          }));

        console.log('✅ Platform books found:', platformResults.length);

        // 2. Search in Firestore books
        const firestoreResults = [];

        try {
          const booksQuery = query(
            collection(db, 'advertMyBook'),
            where('status', '==', 'approved')
          );

          const querySnapshot = await getDocs(booksQuery);

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const bookTitle = (data.bookTitle || '').toLowerCase();
            const author = (data.author || '').toLowerCase();
            const category = (data.category || '').toLowerCase();

            if (bookTitle.includes(q) || author.includes(q) || category.includes(q)) {
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
                isFromFirestore: true,
                source: 'firestore'
              };

              bookData.image = getThumbnailUrl(bookData);
              firestoreResults.push(bookData);
            }
          });

          console.log('✅ Firestore books found:', firestoreResults.length);
        } catch (firestoreError) {
          console.warn('⚠️ Could not search Firestore books:', firestoreError);
        }

        const allResults = [...platformResults, ...firestoreResults];
        console.log('📊 Total results:', allResults.length);

        setSearchResults(allResults);
      } catch (error) {
        console.error('❌ Search error:', error);
        const platformResults = booksData
          .filter(book =>
            book.title?.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q) ||
            book.category?.toLowerCase().includes(q)
          )
          .map(book => ({
            ...book,
            image: getThumbnailUrl(book),
            source: 'platform'
          }));

        setSearchResults(platformResults);
      } finally {
        setLoading(false);
      }
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

    const paymentBookId = selectedBook.source === 'firestore'
      ? selectedBook.id
      : selectedBook.id;

    console.log('Navigating to payment with bookId:', paymentBookId);
    router.push(`/payment?bookId=${paymentBookId}`);
  };

  const handleDownload = book => {
    if (book.pdfUrl) {
      window.open(book.pdfUrl, '_blank');
    } else if (book.embedUrl) {
      window.open(book.embedUrl, '_blank');
    } else {
      alert(`Download link not available for ${book.title}`);
    }
  };

  const isPurchased = bookId => purchasedBookIds.has(bookId);

  // Split results into rows of 5 books each
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-blue-950">
        Search Results for: "{q}"
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
        </div>
      )}

      <style jsx>{`
        .overflow-x-auto::-webkit-scrollbar { display: none; }
        .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
        .snap-x { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
      `}</style>

      {!loading && searchResults.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No results found for "{q}"</p>
          <Link href="/home" className="text-blue-950 hover:underline mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      ) : !loading && (
        <>
          {/* =========================
              PURCHASED BOOKS (CAROUSEL)
          ========================= */}
          {searchResults.filter(book => isPurchased(book.id)).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-blue-950">Purchased Books ({searchResults.filter(book => isPurchased(book.id)).length})</h3>

              {/* Mobile/Tablet Carousel (rows of 5) */}
              <div className="lg:hidden space-y-4">
                {chunkArray(searchResults.filter(book => isPurchased(book.id)), 5).map((row, rowIndex) => (
                  <div key={rowIndex} className="overflow-x-auto pb-4">
                    <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: 'max-content' }}>
                      {row.map(book => (
                        <Link
                          key={book.id}
                          href={`/book/preview?id=${book.id}`}
                          className="flex-none w-[140px] sm:w-[160px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow snap-start"
                        >
                          <div className="relative">
                            <img
                              src={getThumbnailUrl(book)}
                              alt={book.title}
                              className="w-full h-40 sm:h-48 object-cover bg-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                              }}
                            />
                            <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                              Owned
                            </span>
                          </div>
                          <div className="p-2">
                            <h4 className="font-semibold text-xs text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1">{book.author}</p>
                            <p className="text-sm font-bold text-blue-950">₦{book.price?.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-5 gap-4">
                {searchResults
                  .filter(book => isPurchased(book.id))
                  .map(book => (
                    <Link
                      key={book.id}
                      href={`/book/preview?id=${book.id}`}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative">
                        <img
                          src={getThumbnailUrl(book)}
                          alt={book.title}
                          className="w-full h-48 object-cover bg-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                          }}
                        />
                        <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                          Owned
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-1">{book.author}</p>
                        <p className="text-sm font-bold text-blue-950">₦{book.price?.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* =========================
              OTHER BOOKS (CAROUSEL)
          ========================= */}
          {searchResults.filter(book => !isPurchased(book.id)).length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-950">
                {searchResults.filter(book => isPurchased(book.id)).length > 0 ? "Other Books" : "All Results"} ({searchResults.filter(book => !isPurchased(book.id)).length})
              </h3>

              {/* Mobile/Tablet Carousel (rows of 5) */}
              <div className="lg:hidden space-y-4">
                {chunkArray(searchResults.filter(book => !isPurchased(book.id)), 5).map((row, rowIndex) => (
                  <div key={rowIndex} className="overflow-x-auto pb-4">
                    <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: 'max-content' }}>
                      {row.map(book => (
                        <Link
                          key={book.id}
                          href={`/book/preview?id=${book.id}`}
                          className="flex-none w-[140px] sm:w-[160px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow snap-start"
                        >
                          <div className="relative">
                            <img
                              src={getThumbnailUrl(book)}
                              alt={book.title}
                              className="w-full h-40 sm:h-48 object-cover bg-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                              }}
                            />
                            {book.isFromFirestore && (
                              <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                                Upload
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <h4 className="font-semibold text-xs text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1">{book.author}</p>
                            <p className="text-sm font-bold text-blue-950 mb-1">₦{book.price?.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{book.pages}p • {book.format}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-5 gap-4">
                {searchResults
                  .filter(book => !isPurchased(book.id))
                  .map(book => (
                    <Link
                      key={book.id}
                      href={`/book/preview?id=${book.id}`}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative">
                        <img
                          src={getThumbnailUrl(book)}
                          alt={book.title}
                          className="w-full h-48 object-cover bg-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                          }}
                        />
                        {book.isFromFirestore && (
                          <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                            Upload
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-1">{book.author}</p>
                        <p className="text-sm font-bold text-blue-950 mb-1">₦{book.price?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{book.pages} pages • {book.format}</p>
                      </div>
                    </Link>
                  ))}
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
              <img
                src={getThumbnailUrl(selectedBook)}
                alt={selectedBook.title}
                className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-200"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                }}
              />
              <h4 className="font-bold text-lg text-blue-950">{selectedBook.title}</h4>
              <p className="text-gray-600">{selectedBook.author}</p>
              <p className="text-2xl font-bold text-blue-950 mt-2">₦ {selectedBook.price?.toLocaleString()}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-950 mt-1" />
                <div className="text-sm text-blue-950">
                  <p className="font-semibold mb-1">Instant PDF Access</p>
                  <p>After payment, the PDF will be sent to: <strong>{auth.currentUser?.email || 'your email'}</strong></p>
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