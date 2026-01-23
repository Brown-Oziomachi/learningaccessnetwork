"use client";
import React, { useState, useEffect } from "react";
import { Book, Edit, Trash2, Eye, DollarSign, Download, Plus, Search, Filter, MoreVertical, TrendingUp, AlertCircle, CheckCircle, X, Upload, BookOpen } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

export default function MyPostedBooksClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [postedBooks, setPostedBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedBook, setSelectedBook] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await fetchUserAndBooks(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchUserAndBooks = async (uid) => {
        try {
            setLoading(true);

            // Fetch user data
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();

                if (!userData.isSeller) {
                    router.push('/my-account');
                    return;
                }

                setUser({
                    uid,
                    ...userData
                });

                // Fetch seller's posted books
                await fetchPostedBooks(uid, userData.email);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPostedBooks = async (uid, email) => {
        try {
            const advertBooksRef = collection(db, "advertMyBook");
            const q = query(advertBooksRef, where("userId", "==", uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Try querying by email as fallback
                const emailQuery = query(advertBooksRef, where("userEmail", "==", email));
                const emailSnapshot = await getDocs(emailQuery);

                if (!emailSnapshot.empty) {
                    const books = emailSnapshot.docs.map(doc => ({
                        id: doc.id,
                        firestoreId: doc.id,
                        ...doc.data(),
                        uploadedAt: doc.data().createdAt?.toDate?.() || new Date()
                    }));
                    setPostedBooks(books);
                    setFilteredBooks(books);
                    return;
                }
            }

            const books = snapshot.docs.map(doc => ({
                id: doc.id,
                firestoreId: doc.id,
                ...doc.data(),
                uploadedAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            setPostedBooks(books);
            setFilteredBooks(books);
            console.log(`✅ Loaded ${books.length} posted books`);
        } catch (error) {
            console.error("Error fetching posted books:", error);
            setPostedBooks([]);
            setFilteredBooks([]);
        }
    };

    // Filter and search books
    useEffect(() => {
        let filtered = [...postedBooks];

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(book =>
                book.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter(book => book.status === filterStatus);
        }

        setFilteredBooks(filtered);
    }, [searchQuery, filterStatus, postedBooks]);

    const handleDeleteBook = async () => {
        if (!selectedBook) return;

        try {
            setDeleting(true);
            await deleteDoc(doc(db, "advertMyBook", selectedBook.id));

            // Update local state
            setPostedBooks(prev => prev.filter(book => book.id !== selectedBook.id));
            setFilteredBooks(prev => prev.filter(book => book.id !== selectedBook.id));

            setShowDeleteModal(false);
            setSelectedBook(null);
            alert("Book deleted successfully!");
        } catch (error) {
            console.error("Error deleting book:", error);
            alert("Failed to delete book. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const getThumbnailUrl = (book) => {
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
        return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Approved</span>;
            case 'pending':
                return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">Pending</span>;
            case 'rejected':
                return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">Rejected</span>;
            default:
                return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">Active</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your books...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-950">My Posted Books</h1>
                            <p className="text-gray-600 mt-1">Manage all your uploaded documents</p>
                        </div>
                        <Link href="/advertise">
                            <button className="bg-blue-950 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-900 transition-colors">
                                <Plus size={20} />
                                Upload New Document
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
                                <Book className="text-blue-950" size={20} />
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-600">Total Books</p>
                                <p className="text-lg lg:text-2xl font-bold text-blue-950">{postedBooks.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                                <CheckCircle className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-600">Approved</p>
                                <p className="text-lg lg:text-2xl font-bold text-green-600">
                                    {postedBooks.filter(b => b.status === 'approved').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="bg-yellow-100 p-2 lg:p-3 rounded-lg">
                                <AlertCircle className="text-yellow-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-600">Pending</p>
                                <p className="text-lg lg:text-2xl font-bold text-yellow-600">
                                    {postedBooks.filter(b => b.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="bg-purple-100 p-2 lg:p-3 rounded-lg">
                                <TrendingUp className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-600">Total Sales</p>
                                <p className="text-lg lg:text-2xl font-bold text-purple-600">
                                    ₦{postedBooks.reduce((sum, book) => sum + (book.totalSales || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Search and Filter */}
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title, author, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-950"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gray-600" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-950 bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Books Grid/List */}
                {filteredBooks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Book size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {postedBooks.length === 0 ? "No Books Posted Yet" : "No Books Found"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {postedBooks.length === 0
                                ? "Start uploading your documents to reach more readers!"
                                : "Try adjusting your search or filters"
                            }
                        </p>
                        {postedBooks.length === 0 && (
                            <Link href="/advertise">
                                <button className="bg-blue-950 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-blue-900">
                                    <Upload size={20} />
                                    Upload Your First document
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Book</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uploaded</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getThumbnailUrl(book)}
                                                        alt={book.bookTitle}
                                                        className="w-12 h-16 object-cover rounded border border-gray-200"
                                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-blue-950">{book.bookTitle}</p>
                                                        <p className="text-sm text-gray-600">{book.author}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700 capitalize">{book.category}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-950">₦{Number(book.price).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(book.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {book.uploadedAt?.toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBook(book);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} className="text-blue-950" />
                                                    </button>
                                                    <Link href={`/book/preview?id=${book.id}`}>
                                                        <button className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Open Book">
                                                            <BookOpen size={18} className="text-green-600" />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBook(book);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-4">
                            {filteredBooks.map((book) => (
                                <div key={book.id} className="bg-white rounded-xl shadow-sm p-4">
                                    <div className="flex gap-3 mb-3">
                                        <img
                                            src={getThumbnailUrl(book)}
                                            alt={book.bookTitle}
                                            className="w-20 h-28 object-cover rounded border border-gray-200"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-950 mb-1">{book.bookTitle}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-blue-950">₦{Number(book.price).toLocaleString()}</span>
                                                {getStatusBadge(book.status)}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Uploaded: {book.uploadedAt?.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setShowDetailsModal(true);
                                            }}
                                            className="flex-1 bg-blue-50 text-blue-950 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-100"
                                        >
                                            <Eye size={18} />
                                            View
                                        </button>
                                        <Link href={`/book/preview?id=${book.id}`} className="flex-1">
                                            <button className="w-full bg-green-50 text-green-600 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-100">
                                                <BookOpen size={18} />
                                                Open
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setShowDeleteModal(true);
                                            }}
                                            className="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="text-center mb-6">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Book?</h3>
                            <p className="text-gray-600">
                                Are you sure you want to delete "{selectedBook?.bookTitle}"? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedBook(null);
                                }}
                                disabled={deleting}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteBook}
                                disabled={deleting}
                                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Book Details Modal */}
            {showDetailsModal && selectedBook && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
                        <div className="bg-blue-950 text-white p-6 rounded-t-2xl flex items-center justify-between">
                            <h3 className="text-2xl font-bold">Book Details</h3>
                            <button onClick={() => setShowDetailsModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-6 mb-6">
                                <img
                                    src={getThumbnailUrl(selectedBook)}
                                    alt={selectedBook.bookTitle}
                                    className="w-32 h-44 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                />
                                <div className="flex-1">
                                    <h4 className="text-2xl font-bold text-blue-950 mb-2">{selectedBook.bookTitle}</h4>
                                    <p className="text-gray-600 mb-4">by {selectedBook.author}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Category:</span>
                                            <span className="text-sm font-semibold text-blue-950 capitalize">{selectedBook.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Price:</span>
                                            <span className="text-xl font-bold text-blue-950">₦{Number(selectedBook.price).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            {getStatusBadge(selectedBook.status)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Pages:</span>
                                            <span className="text-sm font-semibold text-blue-950">{selectedBook.pages || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {selectedBook.description && (
                                <div className="mb-6">
                                    <h5 className="font-bold text-gray-900 mb-2">Description</h5>
                                    <p className="text-gray-600 text-sm">{selectedBook.description}</p>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-bold text-gray-900 mb-3">Additional Information</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Uploaded:</span>
                                        <span className="font-semibold text-gray-900">
                                            {selectedBook.uploadedAt?.toLocaleDateString()} at {selectedBook.uploadedAt?.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Sales:</span>
                                        <span className="font-semibold text-gray-900">₦{(selectedBook.totalSales || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Copies Sold:</span>
                                        <span className="font-semibold text-gray-900">{selectedBook.copiesSold || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <Link href={`/book/preview?id=${selectedBook.id}`} className="flex-1">
                                    <button className="w-full bg-blue-950 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-900">
                                        <BookOpen size={18} />
                                        Open Book
                                    </button>
                                </Link>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Padding */}
            <div className="h-20"></div>
        </div>
    );
}