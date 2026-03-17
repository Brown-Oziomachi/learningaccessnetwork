"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Search, X, GraduationCap, BookMarked, CheckCircle2, UserPlus, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, query, where, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { onAuthStateChanged } from "firebase/auth";

export default function LecturersClient() {
    const router = useRouter();
    const [lecturers, setLecturers] = useState([]);
    const [filteredLecturers, setFilteredLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchFollowing(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchFollowing = async (userId) => {
        const q = query(collection(db, "follows"), where("followerId", "==", userId));
        const snap = await getDocs(q);
        const ids = new Set(snap.docs.map(doc => doc.data().lecturerId));
        setFollowingIds(ids);
    };

    const handleFollow = async (e, lecturerId) => {
        e.preventDefault(); // Prevent navigation
        if (!user) return;

        try {
            if (followingIds.has(lecturerId)) {
                // Unfollow logic
                const q = query(collection(db, "follows"),
                    where("followerId", "==", user.uid),
                    where("lecturerId", "==", lecturerId));
                const snap = await getDocs(q);
                await deleteDoc(snap.docs[0].ref);
                followingIds.delete(lecturerId);
            } else {
                // Follow logic
                await addDoc(collection(db, "follows"), {
                    followerId: user.uid,
                    lecturerId: lecturerId,
                    createdAt: serverTimestamp()
                });
                followingIds.add(lecturerId);
            }
            setFollowingIds(new Set(followingIds));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                setLoading(true);
                const sellersSnapshot = await getDocs(collection(db, 'sellers'));
                const lecturerList = [];

                for (const docSnap of sellersSnapshot.docs) {
                    const data = docSnap.data();
                    const title = (data.title || '').toLowerCase();
                    const academicTitles = ['lecturer', 'dr.', 'prof.', 'professor', 'mrs', 'mr'];

                    if (academicTitles.some(t => title.includes(t))) {
                        lecturerList.push({
                            sellerId: docSnap.id,
                            sellerName: data.sellerName || data.displayName || 'Unknown Lecturer',
                            title: data.title || 'Lecturer',
                            department: data.department || 'General Studies',
                            university: data.university || 'University Member',
                            isVerified: data.verifiedSchool || false,
                            uploadedBooks: 0
                        });
                    }
                }

                await Promise.all(lecturerList.map(async (lecturer) => {
                    const booksQuery = query(
                        collection(db, 'advertMyBook'),
                        where('userId', '==', lecturer.sellerId),
                        where('status', '==', 'approved')
                    );
                    const bookSnap = await getDocs(booksQuery);
                    lecturer.uploadedBooks = bookSnap.size;
                }));

                lecturerList.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
                setLecturers(lecturerList);
                setFilteredLecturers(lecturerList);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLecturers();
    }, []);

    // Search logic remains same...
    useEffect(() => {
        const q = searchTerm.toLowerCase();
        setFilteredLecturers(lecturers.filter(l =>
            l.sellerName?.toLowerCase().includes(q) ||
            l.department?.toLowerCase().includes(q) ||
            l.university?.toLowerCase().includes(q)
        ));
    }, [searchTerm, lecturers]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Premium Header Section */}
            <div className="bg-blue-950 text-white py-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                    <GraduationCap size={400} />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-all">
                        <ArrowLeft size={18} /> <span>Return to Library</span>
                    </button>

                    <h1 className="text-5xl font-serif font-bold mb-4 tracking-tight">Academic Directory</h1>
                    <p className="text-blue-100 text-lg max-w-2xl font-light">
                        Connect with distinguished educators and access verified course materials,
                        lecture notes, and academic publications.
                    </p>

                    <div className="flex gap-6 mt-10">
                        <div className="border-l-2 border-blue-400 pl-4">
                            <p className="text-3xl font-bold">{lecturers.length}</p>
                            <p className="text-xs uppercase tracking-widest text-blue-300">Verified Faculty</p>
                        </div>
                        <div className="border-l-2 border-blue-400 pl-4">
                            <p className="text-3xl font-bold">{lecturers.reduce((s, l) => s + l.uploadedBooks, 0)}</p>
                            <p className="text-xs uppercase tracking-widest text-blue-300">Total Publications</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Results */}
            <div className="max-w-7xl mx-auto px-4 -mt-8">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find a lecturer, department, or university..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {filteredLecturers.map((lecturer) => (
                        <div key={lecturer.sellerId} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-950 text-3xl font-serif font-bold group-hover:bg-blue-950 group-hover:text-white transition-colors duration-300">
                                        {lecturer.sellerName.charAt(0)}
                                    </div>
                                    <button
                                        onClick={(e) => handleFollow(e, lecturer.sellerId)}
                                        className={`p-3 rounded-xl transition-all ${followingIds.has(lecturer.sellerId) ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                    >
                                        {followingIds.has(lecturer.sellerId) ? <UserCheck size={22} /> : <UserPlus size={22} />}
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 font-serif leading-tight">{lecturer.sellerName}</h3>
                                        {lecturer.isVerified && <CheckCircle2 size={18} className="text-blue-600" fill="currentColor" fillOpacity={0.1} />}
                                    </div>
                                    <p className="text-blue-700 font-medium text-sm">{lecturer.title}</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                                        <BookMarked size={16} className="text-gray-400" />
                                        <span>{lecturer.department}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                                        <GraduationCap size={16} className="text-gray-400" />
                                        <span>{lecturer.university}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <BookOpen size={16} className="text-blue-900" />
                                        <span className="font-bold">{lecturer.uploadedBooks}</span>
                                        <span className="text-sm text-gray-500">Files</span>
                                    </div>
                                    <Link
                                        href={`/seller-profile?sellerId=${lecturer.sellerId}`}
                                        className="text-blue-950 font-bold text-sm flex items-center gap-1 hover:gap-3 transition-all"
                                    >
                                        View Profile <ChevronRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}