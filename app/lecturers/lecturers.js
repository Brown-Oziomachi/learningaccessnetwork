"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, BookOpen, ChevronRight, Search, X, GraduationCap, BookMarked, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
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

    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Fetch lecturers from sellers collection
    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                setLoading(true);

                // Fetch all sellers — filter by title === 'Lecturer' (case-insensitive)
                const sellersSnapshot = await getDocs(collection(db, 'sellers'));
                const lecturerList = [];

                sellersSnapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const title = (data.title || '').toLowerCase();
                    if (title === 'lecturer' || title === 'dr.' || title === 'prof.' || title === 'professor') {
                        lecturerList.push({
                            sellerId: docSnap.id,
                            sellerName: data.sellerName || data.displayName || 'Unknown Lecturer',
                            title: data.title || 'Lecturer',
                            department: data.department || '',
                            university: data.university || '',
                            totalBooks: data.booksSold || 0,
                            accountBalance: data.accountBalance || 0,
                            totalEarnings: data.totalEarnings || 0,
                        });
                    }
                });

                // For each lecturer, count their uploaded books from advertMyBook
                const advertSnapshot = await getDocs(collection(db, 'advertMyBook'));
                const bookCountMap = {};
                advertSnapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const sid = data.userId || data.sellerId;
                    if (sid && data.status === 'approved') {
                        bookCountMap[sid] = (bookCountMap[sid] || 0) + 1;
                    }
                });

                // Attach book count
                lecturerList.forEach((l) => {
                    l.uploadedBooks = bookCountMap[l.sellerId] || 0;
                });

                // Sort by most books uploaded
                lecturerList.sort((a, b) => b.uploadedBooks - a.uploadedBooks);

                setLecturers(lecturerList);
                setFilteredLecturers(lecturerList);
            } catch (error) {
                console.error('Error fetching lecturers:', error);
                setLecturers([]);
                setFilteredLecturers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLecturers();
    }, []);

    // Search filter
    useEffect(() => {
        const q = searchTerm.toLowerCase();
        if (!q) {
            setFilteredLecturers(lecturers);
            return;
        }
        setFilteredLecturers(
            lecturers.filter((l) =>
                l.sellerName?.toLowerCase().includes(q) ||
                l.department?.toLowerCase().includes(q) ||
                l.university?.toLowerCase().includes(q)
            )
        );
    }, [searchTerm, lecturers]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-blue-950 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                        Loading Lecturers...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Header */}
            <div className="border-b-4 border-blue-950">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-950 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <GraduationCap className="w-8 h-8 text-blue-950" />
                                <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                                    LAN Library
                                </span>
                            </div>
                            <h1
                                className="text-4xl md:text-5xl font-bold text-blue-950 mb-2"
                                style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.02em' }}
                            >
                                University Lecturers
                            </h1>
                            <p className="text-gray-500 text-base" style={{ fontFamily: 'Georgia, serif' }}>
                                Browse academic materials from verified university lecturers.
                            </p>
                        </div>

                        {/* Stats pill */}
                        <div className="flex gap-4">
                            <div className="bg-blue-950 text-white rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-bold">{lecturers.length}</p>
                                <p className="text-xs text-blue-300 uppercase tracking-wide">Lecturers</p>
                            </div>
                            <div className="bg-gray-100 text-blue-950 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-bold">
                                    {lecturers.reduce((sum, l) => sum + l.uploadedBooks, 0)}
                                </p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Materials</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, department or university..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl text-blue-950 focus:outline-none focus:border-blue-950 transition-colors bg-gray-50"
                        style={{ fontFamily: 'Georgia, serif' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        {filteredLecturers.length} result{filteredLecturers.length !== 1 ? 's' : ''} for "{searchTerm}"
                    </p>
                )}
            </div>

            {/* Lecturers Grid */}
            <main className="max-w-7xl mx-auto px-4 pb-16">
                {filteredLecturers.length === 0 ? (
                    <div className="text-center py-24 border-t border-gray-200">
                        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3
                            className="text-2xl font-bold text-gray-900 mb-2"
                            style={{ fontFamily: 'Georgia, serif' }}
                        >
                            {searchTerm ? 'No lecturers found' : 'No Lecturers Yet'}
                        </h3>
                        <p className="text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                            {searchTerm
                                ? 'Try a different search term.'
                                : 'Lecturers who register on the platform will appear here.'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 bg-blue-950 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-900"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLecturers.map((lecturer, index) => (
                            <Link
                                key={lecturer.sellerId}
                                href={`/seller-profile?sellerId=${lecturer.sellerId}`}
                                className="group bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-blue-950 hover:shadow-xl transition-all duration-300"
                            >
                                {/* Top color bar */}
                                <div className="h-2 bg-gradient-to-r from-blue-950 to-blue-700" />

                                <div className="p-6">
                                    {/* Rank + Avatar */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-blue-950 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                <span className="text-2xl font-black text-white">
                                                    {lecturer.sellerName?.charAt(0)?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                            {/* Rank badge */}
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Title badge */}
                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                                                {lecturer.title}
                                            </span>
                                            <h3
                                                className="font-bold text-base text-gray-900 leading-tight truncate group-hover:text-blue-950"
                                                style={{ fontFamily: 'Georgia, serif' }}
                                            >
                                                {lecturer.sellerName}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Department / University */}
                                    {(lecturer.department || lecturer.university) && (
                                        <div className="mb-4 bg-gray-50 rounded-xl p-3 space-y-1">
                                            {lecturer.department && (
                                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <BookMarked size={12} className="text-blue-950 flex-shrink-0" />
                                                    <span className="truncate">{lecturer.department}</span>
                                                </p>
                                            )}
                                            {lecturer.university && (
                                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <GraduationCap size={12} className="text-blue-950 flex-shrink-0" />
                                                    <span className="truncate">{lecturer.university}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <BookOpen size={14} />
                                            <span className="text-sm font-semibold text-gray-900">
                                                {lecturer.uploadedBooks}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {lecturer.uploadedBooks === 1 ? 'material' : 'materials'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button className="w-full flex items-center justify-center gap-2 bg-blue-950 text-white py-2.5 rounded-xl text-sm font-bold group-hover:bg-blue-800 transition-colors">
                                        View documents
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}