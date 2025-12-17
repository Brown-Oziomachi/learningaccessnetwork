"use client";

import BookCard from "@/components/BookCard";
import { booksData } from "@/lib/booksData";
import { auth } from "@/lib/firebaseConfig";
import { FileText, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const q = searchParams.get("q")?.toLowerCase() || "";

    const [searchResults, setSearchResults] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // 🔍 SEARCH LOGIC
    useEffect(() => {
        if (!q) {
            setSearchResults([]);
            return;
        }

        const filtered = booksData.filter(
            (book) =>
                book.title?.toLowerCase().includes(q) ||
                book.author?.toLowerCase().includes(q) ||
                book.category?.toLowerCase().includes(q)
        );

        setSearchResults(filtered);
    }, [q]);

    // 🛒 PURCHASE HANDLER (IMPORTANT)
    const handlePurchase = (book) => {
        setSelectedBook(book);
        setShowPurchaseModal(true);
    };

    // 💳 PAYMENT REDIRECT
    const handleProceedToPayment = () => {
        if (!selectedBook) return;
        setShowPurchaseModal(false);
        router.push(`/payment?bookId=${selectedBook.id}`);
    };

    // ⬇ DOWNLOAD (placeholder)
    const handleDownload = (book) => {
        alert(`Downloading ${book.title}`);
    };

    // 🔐 PURCHASE CHECK (can connect Firebase later)
    const isPurchased = () => false;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 bg-white">
            <h2 className="text-2xl font-bold mb-6 text-blue-950">
                Search Results for: "{q}"
            </h2>

            {searchResults.length === 0 ? (
                <p className="text-gray-600">No results found.</p>
            ) : (
                <div
  className="
    flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide
    sm:gap-4
    lg:grid lg:grid-cols-3 xl:grid-cols-4
    lg:overflow-x-visible lg:snap-none
  "
  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
>
  {searchResults.map((book) => (
    <BookCard
      key={book.id}
      book={book}
      isPurchased={isPurchased}
      onPurchase={handlePurchase}
      onDownload={handleDownload}
    />
  ))}
</div>

            )}

            {/* 🧾 PURCHASE MODAL */}
            {showPurchaseModal && selectedBook && (
                <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Purchase PDF Book</h3>
                            <button onClick={() => setShowPurchaseModal(false)}>
                                <X size={24} className="text-gray-600 hover:text-gray-900" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <img
                                src={selectedBook.image}
                                alt={selectedBook.title}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                            />
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
