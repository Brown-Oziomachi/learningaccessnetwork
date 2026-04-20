"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Clock, CheckCircle, BookOpen, X } from "lucide-react";

export default function MySubmissions() {
    const [myBooks, setMyBooks] = useState([]);
    const [publicBooks, setPublicBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    useEffect(() => {
        // Check for success message from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'submitted') {
            setShowSuccessMessage(true);
            // Clean up URL
            window.history.replaceState({}, '', '/advertise/my-submissions');
        }
    }, []);

    useEffect(() => {
        const fetchData = async (user) => {
            try {
                // 1. Fetch User's Specific Books
                const myQuery = query(
                    collection(db, "advertMyBook"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const mySnapshot = await getDocs(myQuery);
                setMyBooks(mySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 2. Fetch Other Approved Books for Inspiration
                const publicQuery = query(
                    collection(db, "advertMyBook"),
                    where("status", "==", "approved"),
                    limit(6)
                );
                const publicSnapshot = await getDocs(publicQuery);
                setPublicBooks(publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) fetchData(user);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-12">

            {/* SUCCESS MESSAGE BANNER */}
            {showSuccessMessage && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 flex items-start gap-4 shadow-sm animate-slideDown">
                    <div className="flex-shrink-0">
                        <CheckCircle className="text-green-600 w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-green-900 text-lg mb-1">
                            🎉 Book Submitted Successfully!
                        </h3>
                        <p className="text-sm text-green-700 mb-2">
                            Your book is now pending review. We'll review your submission within 24-48 hours and notify you via email.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-green-600">
                            <Clock size={14} />
                            <span>Average review time: 1-2 business days</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccessMessage(false)}
                        className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* SECTION 1: USER'S SUBMISSIONS */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="text-blue-900" />
                    <h1 className="text-2xl font-bold text-blue-950">My Submissions</h1>
                </div>

                {/* Stats Summary */}
                {myBooks.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-700">
                                {myBooks.filter(b => b.status === 'pending' || !b.status).length}
                            </p>
                            <p className="text-sm text-yellow-600">Pending</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">
                                {myBooks.filter(b => b.status === 'approved').length}
                            </p>
                            <p className="text-sm text-green-600">Approved</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">
                                {myBooks.length}
                            </p>
                            <p className="text-sm text-blue-600">Total Submissions</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4">
                    {myBooks.length === 0 ? (
                        <div className="p-8 border-2 border-dashed rounded-xl text-center text-gray-500">
                            You haven't submitted any books yet.
                        </div>
                    ) : (
                        myBooks.map((book) => (
                            <div key={book.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div>
                                    <h3 className="font-bold text-lg text-blue-950">{book.bookTitle}</h3>
                                    <p className="text-sm text-gray-600 mt-1">by {book.author}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Submitted: {book.createdAt?.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    {book.courseCode && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            📚 Course: {book.courseCode}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${book.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : book.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {book.status === 'approved' ? (
                                            <>
                                                <CheckCircle size={16} />
                                                Approved
                                            </>
                                        ) : book.status === 'rejected' ? (
                                            <>
                                                <X size={16} />
                                                Rejected
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={16} />
                                                Pending Review
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

              
            </section>

            <hr className="border-gray-200" />

            {/* SECTION 2: APPROVED BOOKS (COMMUNITY) */}
            <section>
                <h2 className="text-xl font-bold mb-6 text-gray-800">Approved in the Library</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publicBooks.filter(b => b.userId !== auth.currentUser?.uid).length === 0 ? (
                        <div className="col-span-full p-8 border-2 border-dashed rounded-xl text-center text-gray-500">
                            No approved books from other users yet.
                        </div>
                    ) : (
                        publicBooks.filter(b => b.userId !== auth.currentUser?.uid).map((book) => (
                            <div key={book.id} className="group bg-gray-50 rounded-xl p-4 border hover:border-blue-300 hover:shadow-md transition-all">
                                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                    {/* If you have thumbnails, put them here */}
                                    <BookOpen size={48} className="text-gray-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h4 className="font-bold truncate">{book.bookTitle}</h4>
                                <p className="text-sm text-gray-600 truncate">{book.author}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="font-bold text-blue-900">₦{book.price?.toLocaleString()}</p>
                                    {book.courseCode && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {book.courseCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Animation Styles */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}