"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Search, GraduationCap, BookMarked, CheckCircle2, UserPlus, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    collection, getDocs, query, where, deleteDoc,
    setDoc, doc, getDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore';
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
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Professor', 'Dr.', 'Lecturer', 'Mrs', 'Mr'];

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

    const handleFollow = async (e, lecturerId, lecturerName) => {
        e.preventDefault();
        if (!user) return;

        const followId = `${user.uid}_${lecturerId}`;
        const followRef = doc(db, "follows", followId);
        const sellerRef = doc(db, "sellers", lecturerId);

        try {
            if (followingIds.has(lecturerId)) {
                await deleteDoc(followRef);
                try { await updateDoc(sellerRef, { followersCount: increment(-1) }); } catch (e) { }
                followingIds.delete(lecturerId);
            } else {
                await setDoc(followRef, {
                    followerId: user.uid,
                    lecturerId,
                    lecturerName: lecturerName || '',
                    createdAt: serverTimestamp()
                });
                try {
                    await updateDoc(sellerRef, { followersCount: increment(1) });
                } catch (e) {
                    await setDoc(sellerRef, { followersCount: 1 }, { merge: true });
                }
                followingIds.add(lecturerId);
            }
            setFollowingIds(new Set(followingIds));
        } catch (err) {
            console.error("Follow error:", err);
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
                        // ✅ Fetch user doc to get photoBase64
                        let photoBase64 = null;
                        let photoURL = null;
                        try {
                            const userDoc = await getDoc(doc(db, 'users', docSnap.id));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                photoBase64 = userData.photoBase64 || null;
                                photoURL = userData.photoURL || userData.profilePicture || null;
                            }
                        } catch (e) { }

                        lecturerList.push({
                            sellerId: docSnap.id,
                            sellerName: data.sellerName || data.displayName || 'Unknown Lecturer',
                            title: data.title || 'Lecturer',
                            department: data.department || 'General Studies',
                            university: data.university || 'University Member',
                            isVerified: data.verifiedSchool || false,
                            uploadedBooks: 0,
                            // ✅ Use photoBase64 first, fallback to photoURL
                            photo: photoBase64 || photoURL || null,
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

    useEffect(() => {
        const q = searchTerm.toLowerCase();
        let results = lecturers.filter(l =>
            l.sellerName?.toLowerCase().includes(q) ||
            l.department?.toLowerCase().includes(q) ||
            l.university?.toLowerCase().includes(q)
        );
        if (activeFilter !== 'All') {
            results = results.filter(l =>
                l.title?.toLowerCase().includes(activeFilter.toLowerCase())
            );
        }
        setFilteredLecturers(results);
    }, [searchTerm, lecturers, activeFilter]);

    const getInitials = (name) => {
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const avatarColors = [
        'from-blue-900 to-blue-700',
        'from-amber-700 to-amber-500',
        'from-emerald-800 to-emerald-600',
        'from-rose-800 to-rose-600',
        'from-indigo-800 to-indigo-600',
        'from-teal-800 to-teal-600',
    ];
    const getAvatarGradient = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="text-center">
                <GraduationCap className="w-12 h-12 text-blue-950 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading faculty...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            <Navbar />

            {/* ── HERO ── */}
            <div className="bg-blue-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute bottom-0 right-0 w-80 h-80 opacity-5">
                    <GraduationCap className="w-full h-full" />
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-300 hover:text-white mb-8 transition-colors text-sm">
                        <ArrowLeft size={16} /> Return to Library
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <p className="text-blue-400 text-xs uppercase tracking-[0.2em] font-semibold mb-2">Academic Directory</p>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Our Faculty</h1>
                            <p className="text-blue-200 text-base max-w-xl leading-relaxed">
                                Connect with distinguished educators and access verified course materials, lecture notes, and academic publications.
                            </p>
                        </div>
                        <div className="flex gap-8 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-3xl font-bold">{lecturers.length}</p>
                                <p className="text-blue-400 text-xs uppercase tracking-widest mt-1">Faculty</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">{lecturers.reduce((s, l) => s + l.uploadedBooks, 0)}</p>
                                <p className="text-blue-400 text-xs uppercase tracking-widest mt-1">Publications</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEARCH + FILTERS ── */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 -mt-6 relative z-10 mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, department, or university..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-950 focus:bg-white text-sm transition-colors"
                        />
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === f
                                        ? 'bg-blue-950 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-gray-400 self-center">
                            {filteredLecturers.length} result{filteredLecturers.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* ── GRID: 2 cols mobile, 3 tablet, 4 desktop ── */}
                {filteredLecturers.length === 0 ? (
                    <div className="text-center py-20">
                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No faculty members found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
                        {filteredLecturers.map((lecturer) => {
                            const isFollowing = followingIds.has(lecturer.sellerId);
                            const initials = getInitials(lecturer.sellerName);
                            const avatarGradient = getAvatarGradient(lecturer.sellerName);

                            return (
                                <div
                                    key={lecturer.sellerId}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                >
                                    {/* Photo / Avatar */}
                                    <div className="relative">
                                        {lecturer.photo ? (
                                            <img
                                                src={lecturer.photo}
                                                alt={lecturer.sellerName}
                                                className="w-full aspect-[4/3] object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className={`w-full aspect-[4/3] bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}>
                                                <span className="text-white text-4xl md:text-5xl font-bold">
                                                    {initials}
                                                </span>
                                            </div>
                                        )}

                                        {/* Follow button overlay */}
                                        <button
                                            onClick={(e) => handleFollow(e, lecturer.sellerId, lecturer.sellerName)}
                                            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all ${isFollowing
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white text-gray-500 hover:bg-blue-950 hover:text-white'
                                                }`}
                                            title={isFollowing ? 'Unfollow' : 'Follow'}
                                        >
                                            {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                        </button>

                                        {/* Verified badge */}
                                        {lecturer.isVerified && (
                                            <div className="absolute top-2 left-2 bg-blue-950 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                                <CheckCircle2 size={10} /> Verified
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 md:p-4">
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight mb-0.5 line-clamp-2">
                                            {lecturer.sellerName}
                                        </h3>
                                        <p className="text-blue-700 text-xs font-semibold mb-2">{lecturer.title}</p>

                                        <div className="space-y-1 mb-3">
                                            <p className="text-gray-500 text-xs flex items-center gap-1.5 line-clamp-1">
                                                <BookMarked size={11} className="flex-shrink-0 text-gray-400" />
                                                {lecturer.department}
                                            </p>
                                            <p className="text-gray-500 text-xs flex items-center gap-1.5 line-clamp-1">
                                                <GraduationCap size={11} className="flex-shrink-0 text-gray-400" />
                                                {lecturer.university}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <BookOpen size={11} className="text-blue-900" />
                                                <strong className="text-gray-800">{lecturer.uploadedBooks}</strong> files
                                            </span>
                                            <Link
                                                href={`/seller-profile?sellerId=${lecturer.sellerId}`}
                                                className="text-blue-950 text-xs font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all"
                                            >
                                                Profile <ChevronRight size={13} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}