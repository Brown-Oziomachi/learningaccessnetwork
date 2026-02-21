"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, MessageCircle, User } from "lucide-react";
import Link from "next/link";

export default function BookFeedbacksClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("bookId");

  const [feedbacks, setFeedbacks] = useState([]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/auth/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookId) return;
      try {
        setLoading(true);

        // Fetch book title
        const cleanId = bookId.replace("firestore-", "");
        const bookDoc = await getDoc(doc(db, "advertMyBook", cleanId));
        if (bookDoc.exists()) {
          const data = bookDoc.data();
          setBook({ title: data.bookTitle || data.title, author: data.author });
        } else {
          // fallback: try booksData
          const { booksData } = await import("@/lib/booksData");
          const found = booksData.find(
            (b) => String(b.id) === String(bookId) || String(b.id) === cleanId
          );
          if (found) setBook({ title: found.title, author: found.author });
        }

        // Fetch feedbacks
        const q = query(
          collection(db, "bookFeedbacks"),
          where("bookId", "==", bookId),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }));
        setFeedbacks(list);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId]);

  const formatTimeAgo = (date) => {
    if (!date) return "Just now";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-blue-950 text-white sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-blue-900 rounded-lg">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Feedback</h1>
            <p className="text-blue-300 text-xs truncate max-w-[260px]">
              {book?.title || "Book"}
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle size={18} className="text-blue-950" />
          <span className="text-sm font-semibold text-gray-700">
            {feedbacks.length} {feedbacks.length === 1 ? "feedback" : "feedbacks"}
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No feedback yet</h3>
            <p className="text-gray-500 text-sm">Be the first to leave feedback on this book.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-blue-950 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900"
            >
              Go back & add feedback
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {fb.userName || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTimeAgo(fb.createdAt)}
                      </span>
                    </div>

                    {fb.feedback ? (
                      <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                        {fb.feedback}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm mt-1 italic">
                        (No details provided)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}