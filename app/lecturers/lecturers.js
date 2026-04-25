"use client";
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BookOpen, ChevronRight, Search, GraduationCap,
    BookMarked, CheckCircle2, UserPlus, UserCheck, Users, X, SlidersHorizontal
} from 'lucide-react';
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

// ─── AVATAR COLORS ────────────────────────────────────────
const avatarPalettes = [
    { bg: "bg-blue-900", text: "text-blue-100" },
    { bg: "bg-emerald-800", text: "text-emerald-100" },
    { bg: "bg-amber-800", text: "text-amber-100" },
    { bg: "bg-rose-800", text: "text-rose-100" },
    { bg: "bg-indigo-800", text: "text-indigo-100" },
    { bg: "bg-teal-800", text: "text-teal-100" },
    { bg: "bg-violet-800", text: "text-violet-100" },
    { bg: "bg-cyan-800", text: "text-cyan-100" },
];
const getPalette = (name) => avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];

const getInitials = (name) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── LECTURER CARD ────────────────────────────────────────
function LecturerCard({ lecturer, isFollowing, onFollow, user }) {
    const palette = getPalette(lecturer.sellerName || "?");
    const initials = getInitials(lecturer.sellerName || "?");
    const titleDisplay = lecturer.title?.toLowerCase().includes("lecturer")
        ? "Lecturer" : lecturer.title;
    const profileHref = `/seller-profile?sellerId=${lecturer.sellerId}`;
    const displayName = lecturer.title ? `${lecturer.title} ${lecturer.sellerName}` : lecturer.sellerName;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
            {/* Photo / avatar */}
            <div className="relative">
                {lecturer.photo ? (
                    <img src={lecturer.photo} alt={lecturer.sellerName}
                        className="w-full aspect-[4/3] object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className={`w-full aspect-[4/3] ${palette.bg} flex items-center justify-center`}>
                        <span className={`${palette.text} text-4xl font-black`}>{initials}</span>
                    </div>
                )}

                {/* Dark scrim at bottom of photo */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                {/* Title badge */}
                {lecturer.title && (
                    <div className="absolute bottom-2 left-2 bg-blue-950/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                        <GraduationCap size={10} />
                        {titleDisplay}
                    </div>
                )}

                {/* Verified badge */}
                {lecturer.isVerified && (
                    <div className="absolute top-2 left-2 bg-white text-blue-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-blue-100">
                        <CheckCircle2 size={9} className="text-blue-600" /> Verified
                    </div>
                )}

                {/* Follow button */}
                <button
                    onClick={(e) => { e.preventDefault(); onFollow(e, lecturer.sellerId, lecturer.sellerName); }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isFollowing
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-500 hover:bg-blue-950 hover:text-white"
                        }`}
                    title={isFollowing ? "Unfollow" : "Follow"}
                >
                    {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                </button>
            </div>

            {/* Card body */}
            <div className="p-3 sm:p-4">
                <Link href={profileHref} className="block">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-0.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {displayName}
                    </h3>
                </Link>

                <div className="space-y-1 mt-2 mb-3">
                    {lecturer.department && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 line-clamp-1">
                            <BookMarked size={10} className="text-gray-400 flex-shrink-0" />
                            {lecturer.department}
                        </p>
                    )}
                    {lecturer.university && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 line-clamp-1">
                            <GraduationCap size={10} className="text-gray-400 flex-shrink-0" />
                            {lecturer.university}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <BookOpen size={11} className="text-blue-900" />
                        <strong className="text-gray-800">{lecturer.uploadedBooks}</strong> files
                    </span>
                    <Link
                        href={profileHref}
                        className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5 hover:gap-1.5 transition-all hover:text-blue-800"
                    >
                        View Profile <ChevronRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function LecturersClient() {
    const router = useRouter();
    const [lecturers, setLecturers] = useState([]);
    const [filteredLecturers, setFilteredLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [followingIds, setFollowingIds] = useState(new Set());
    const [activeFilter, setActiveFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const filters = ['All', 'Professor', 'Dr.', 'Lecturer', 'Mrs', 'Mr'];

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); fetchFollowing(u.uid); }
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchFollowing = async (userId) => {
        const q = query(collection(db, "follows"), where("followerId", "==", userId));
        const snap = await getDocs(q);
        setFollowingIds(new Set(snap.docs.map(d => d.data().lecturerId)));
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
                await setDoc(followRef, { followerId: user.uid, lecturerId, lecturerName: lecturerName || '', createdAt: serverTimestamp() });
                try { await updateDoc(sellerRef, { followersCount: increment(1) }); }
                catch (e) { await setDoc(sellerRef, { followersCount: 1 }, { merge: true }); }
                followingIds.add(lecturerId);
            }
            setFollowingIds(new Set(followingIds));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                setLoading(true);
                const sellersSnap = await getDocs(collection(db, 'sellers'));
                const list = [];

                for (const ds of sellersSnap.docs) {
                    const data = ds.data();
                    const title = (data.title || '').toLowerCase();
                    if (!['lecturer', 'dr.', 'prof.', 'professor', 'mrs', 'mr'].some(t => title.includes(t))) continue;

                    let photo = null;
                    try {
                        const ud = await getDoc(doc(db, 'users', ds.id));
                        if (ud.exists()) {
                            const udata = ud.data();
                            photo = udata.photoBase64 || udata.photoURL || udata.profilePicture || null;
                        }
                    } catch (e) { }

                    list.push({
                        sellerId: ds.id,
                        sellerName: data.sellerName || data.displayName || 'Unknown',
                        title: data.title || 'Lecturer',
                        department: data.department || '',
                        university: data.university || '',
                        isVerified: data.verifiedSchool || false,
                        uploadedBooks: 0,
                        photo,
                    });
                }

                await Promise.all(list.map(async (l) => {
                    const bq = query(collection(db, 'advertMyBook'), where('userId', '==', l.sellerId), where('status', '==', 'approved'));
                    const bs = await getDocs(bq);
                    l.uploadedBooks = bs.size;
                }));

                list.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
                setLecturers(list);
                setFilteredLecturers(list);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchLecturers();
    }, []);

    useEffect(() => {
        const q = searchTerm.toLowerCase();
        let res = lecturers.filter(l =>
            l.sellerName?.toLowerCase().includes(q) ||
            l.department?.toLowerCase().includes(q) ||
            l.university?.toLowerCase().includes(q)
        );
        if (activeFilter !== 'All') {
            res = res.filter(l => l.title?.toLowerCase().includes(activeFilter.toLowerCase()));
        }
        setFilteredLecturers(res);
    }, [searchTerm, lecturers, activeFilter]);

    // ─── LOADING ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5]">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── RENDER ───────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <Navbar />

            {/* ── PAGE HEADER ── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-3 h-14">
                        <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-950 transition-colors flex-shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-[15px] font-bold text-gray-900">Our Faculty</h1>
                            <p className="text-[11px] text-gray-400">{lecturers.length} educators · {lecturers.reduce((s, l) => s + l.uploadedBooks, 0)} publications</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-4 pb-20">

                {/* ── SEARCH BAR ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, department, or university..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFilters(p => !p)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${showFilters ? "bg-blue-950 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        <SlidersHorizontal size={15} />
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                </div>

                {/* Filter pills */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Title</span>
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === f
                                    ? "bg-blue-950 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-gray-400">{filteredLecturers.length} result{filteredLecturers.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* ── FOLLOWING section ── */}
                {followingIds.size > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <UserCheck size={15} className="text-green-600" />
                            Following ({followingIds.size})
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredLecturers
                                .filter(l => followingIds.has(l.sellerId))
                                .map(lecturer => (
                                    <LecturerCard
                                        key={lecturer.sellerId}
                                        lecturer={lecturer}
                                        isFollowing={followingIds.has(lecturer.sellerId)}
                                        onFollow={handleFollow}
                                        user={user}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                {/* ── ALL / OTHER LECTURERS ── */}
                <div>
                    {followingIds.size > 0 && filteredLecturers.some(l => !followingIds.has(l.sellerId)) && (
                        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Users size={15} className="text-blue-700" />
                            All Faculty
                        </h2>
                    )}

                    {filteredLecturers.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                            <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium text-sm">No faculty members found</p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 text-sm font-bold">Clear search</button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredLecturers
                                .filter(l => followingIds.size === 0 || !followingIds.has(l.sellerId))
                                .map(lecturer => (
                                    <LecturerCard
                                        key={lecturer.sellerId}
                                        lecturer={lecturer}
                                        isFollowing={followingIds.has(lecturer.sellerId)}
                                        onFollow={handleFollow}
                                        user={user}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}