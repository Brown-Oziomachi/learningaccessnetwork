"use client";
import React, { useState, useEffect } from "react";
import { Book, Trash2, Eye, Plus, Search, Filter, TrendingUp, AlertCircle, CheckCircle, X, Upload, BookOpen, ChevronRight, ShoppingBag, DollarSign, Globe } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

/* ─── colour tokens (matches seller page) ───────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

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
    const [bookSalesCount, setBookSalesCount] = useState({});
    const router = useRouter();

    useEffect(() => {
        const fetchBookSales = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                const salesMap = {};
                usersSnapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    const purchasedBooks = userData.purchasedBooks || {};
                    Object.values(purchasedBooks).forEach(purchase => {
                        const bookId = purchase.bookId || purchase.id || purchase.firestoreId;
                        if (bookId) {
                            salesMap[bookId] = (salesMap[bookId] || 0) + 1;
                            salesMap[`firestore-${bookId}`] = (salesMap[`firestore-${bookId}`] || 0) + 1;
                        }
                    });
                });
                setBookSalesCount(salesMap);
            } catch (error) { console.error("Error fetching sales count:", error); }
        };
        fetchBookSales();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) { await fetchUserAndBooks(currentUser.uid); }
            else { router.push('/auth/signin'); }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchUserAndBooks = async (uid) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (!userData.isSeller) { router.push('/my-account'); return; }
                setUser({ uid, ...userData });
                await fetchPostedBooks(uid, userData.email);
            }
        } catch (error) { console.error("Error fetching user data:", error); }
        finally { setLoading(false); }
    };

    const fetchPostedBooks = async (uid, email) => {
        try {
            const advertBooksRef = collection(db, "advertMyBook");
            const q = query(advertBooksRef, where("userId", "==", uid));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                const emailQuery = query(advertBooksRef, where("userEmail", "==", email));
                const emailSnapshot = await getDocs(emailQuery);
                if (!emailSnapshot.empty) {
                    const books = emailSnapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data(), uploadedAt: d.data().createdAt?.toDate?.() || new Date() }));
                    setPostedBooks(books); setFilteredBooks(books); return;
                }
            }
            const books = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data(), uploadedAt: d.data().createdAt?.toDate?.() || new Date() }));
            setPostedBooks(books); setFilteredBooks(books);
        } catch (error) { console.error("Error fetching posted books:", error); setPostedBooks([]); setFilteredBooks([]); }
    };

    const getBookSalesCount = (book) => bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || bookSalesCount[`firestore-${book.id}`] || bookSalesCount[`firestore-${book.firestoreId}`] || 0;
    const getBookTotalSales = (book) => getBookSalesCount(book) * (Number(book.price) || 0);

    const calculateStats = () => ({
        totalRevenue: postedBooks.reduce((sum, b) => sum + getBookTotalSales(b), 0),
        totalCopiesSold: postedBooks.reduce((sum, b) => sum + getBookSalesCount(b), 0),
        approved: postedBooks.filter(b => b.status === 'approved').length,
        pending: postedBooks.filter(b => b.status === 'pending').length,
    });
    const stats = calculateStats();

    useEffect(() => {
        let filtered = [...postedBooks];
        if (searchQuery.trim()) filtered = filtered.filter(b => b.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || b.author?.toLowerCase().includes(searchQuery.toLowerCase()) || b.category?.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterStatus !== "all") filtered = filtered.filter(b => b.status === filterStatus);
        setFilteredBooks(filtered);
    }, [searchQuery, filterStatus, postedBooks]);

    const handleDeleteBook = async () => {
        if (!selectedBook) return;
        try {
            setDeleting(true);
            await deleteDoc(doc(db, "advertMyBook", selectedBook.id));
            setPostedBooks(prev => prev.filter(b => b.id !== selectedBook.id));
            setFilteredBooks(prev => prev.filter(b => b.id !== selectedBook.id));
            setShowDeleteModal(false); setSelectedBook(null);
            alert("Book deleted successfully!");
        } catch (error) { console.error("Error deleting book:", error); alert("Failed to delete book. Please try again."); }
        finally { setDeleting(false); }
    };

    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) { const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/); if (match) { const fileId = match[1] || match[2] || match[3]; if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`; } }
        if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) { const match = book.pdfUrl.match(/[-\w]{25,}/); if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`; }
        return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved': return { label: 'Approved', bg: '#f0fdf4', color: '#16a34a', border: '#86efac' };
            case 'pending': return { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            case 'rejected': return { label: 'Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            default: return { label: 'Active', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
        }
    };

    /* ── Loading state (matches seller page) ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY }}>Loading your documents…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
                .book-row { display:flex; align-items:center; justify-content:space-between; padding:16px; border:0.5px solid #e5ddd0; background:#fff; margin-bottom:6px; transition:background 0.15s,border-color 0.15s; cursor:pointer; }
                .book-row:hover { background:${CREAM}; border-color:${GOLD}; }
                .action-btn { width:34px; height:34px; border:0.5px solid #e5ddd0; display:flex; align-items:center; justify-content:center; background:${CREAM}; cursor:pointer; transition:all 0.15s; }
                .action-btn:hover { border-color:${GOLD}; }
                .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:50; display:flex; align-items:center; justify-flex-start; flex-direction:column; overflow-y:auto; }
                .modal-inner { background:#fff; width:100%; min-height:100vh; max-width:640px; margin:0 auto; }
                @media(min-width:640px){ .modal-inner { min-height:auto; margin:40px auto; } }
                .gold-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(184,150,62,0.12); border:0.5px solid rgba(184,150,62,0.3); padding:5px 12px; border-radius:999px; }
                @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
                @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .pulse-dot { animation:pulse2 2s infinite; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }
                .lg-hide { display:flex; }
                @media(min-width:1024px){ .lg-hide { display:none !important; } }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>

                    {/* ── Header Bar ── */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Seller Dashboard</p>
                            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(22px,4vw,30px)', fontWeight: 700, color: NAVY, margin: 0 }}>My Posted Documents</h1>
                        </div>
                        <Link href="/upload-document">
                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '12px 20px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', transition: 'background 0.18s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1a3a6e'}
                                onMouseLeave={e => e.currentTarget.style.background = NAVY}>
                                <Plus size={16} /> Upload New Document
                            </button>
                        </Link>
                    </div>

                    {/* ── Stats Cards ── */}
                    <div className="anim-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
                        <style>{`@media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr) !important;}}`}</style>
                        {[
                            { label: 'Total Documents', val: postedBooks.length, icon: <Book size={18} style={{ color: GOLD }} /> },
                            { label: 'Approved', val: stats.approved, icon: <CheckCircle size={18} style={{ color: GOLD }} /> },
                            { label: 'Copies Sold', val: stats.totalCopiesSold, icon: <ShoppingBag size={18} style={{ color: GOLD }} /> },
                            { label: 'Total Revenue', val: `₦${stats.totalRevenue.toLocaleString()}`, icon: <TrendingUp size={18} style={{ color: GOLD }} /> },
                        ].map(({ label, val, icon }, i) => (
                            <div key={i} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px' }}>
                                <div style={{ width: '40px', height: '40px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', background: CREAM }}>{icon}</div>
                                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>{label}</p>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '24px', fontWeight: 700, color: NAVY, margin: 0 }}>{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Search & Filter ── */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px 24px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input type="text" placeholder="Search by title, author or category…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px 11px 36px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box', background: CREAM }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={14} style={{ color: '#aaa' }} />
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                style={{ border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", background: '#fff', cursor: 'pointer' }}>
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '8px 14px' }}>
                            <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                            <span style={{ fontSize: '11px', color: NAVY, fontWeight: 600, fontFamily: "'Lato',sans-serif" }}>{filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* ── Books List ── */}
                    {filteredBooks.length === 0 ? (
                        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '64px 24px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: CREAM }}>
                                <Book size={36} style={{ color: '#ccc' }} />
                            </div>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>{postedBooks.length === 0 ? "No Documents Yet" : "No Results Found"}</p>
                            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px', fontFamily: "'Lato',sans-serif" }}>
                                {postedBooks.length === 0 ? "Start uploading your documents to reach more readers." : "Try adjusting your search or filters."}
                            </p>
                            {postedBooks.length === 0 && (
                                <Link href="/advertise">
                                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '12px 24px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif', letterSpacing: '0.05em" }}>
                                        <Upload size={16} /> Upload Your First Document
                                    </button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div style={{ display: 'none' }} className="desktop-table">
                                <style>{`@media(min-width:768px){.desktop-table{display:block !important;}.mobile-cards{display:none !important;}}`}</style>
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', overflow: 'hidden' }}>
                                    {/* Table Header */}
                                    <div style={{ background: NAVY, display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0 }}>
                                        {['Document', 'Category', 'Price', 'Sold', 'Revenue', 'Status', 'Actions'].map(h => (
                                            <div key={h} style={{ padding: '14px 16px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>{h}</div>
                                        ))}
                                    </div>
                                    {filteredBooks.map((book, i) => {
                                        const salesCount = getBookSalesCount(book);
                                        const totalSales = getBookTotalSales(book);
                                        const statusCfg = getStatusConfig(book.status);
                                        return (
                                            <div key={book.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr 1fr', borderBottom: '0.5px solid #f0ebe0', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={getThumbnailUrl(book)} alt={book.bookTitle} style={{ width: '40px', height: '54px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                                    <div>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{book.bookTitle}</p>
                                                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: '#888', fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{book.category}</span>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>₦{Number(book.price).toLocaleString()}</span>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{salesCount}</span>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>₦{totalSales.toLocaleString()}</span>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', background: statusCfg.bg, color: statusCfg.color, border: `0.5px solid ${statusCfg.border}`, fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>{statusCfg.label}</span>
                                                </div>
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <button className="action-btn" onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }} title="View Details">
                                                        <Eye size={15} style={{ color: NAVY }} />
                                                    </button>
                                                    <Link href={`/book/preview?id=${book.id}`}>
                                                        <button className="action-btn" title="Open Book">
                                                            <BookOpen size={15} style={{ color: '#16a34a' }} />
                                                        </button>
                                                    </Link>
                                                    <button className="action-btn" style={{ borderColor: '#fecaca', background: '#fef2f2' }}
                                                        onClick={() => { setSelectedBook(book); setShowDeleteModal(true); }} title="Delete">
                                                        <Trash2 size={15} style={{ color: '#dc2626' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile Cards */}
                            <div className="mobile-cards" style={{ display: 'block' }}>
                                <style>{`@media(min-width:768px){.mobile-cards{display:none !important;}}`}</style>
                                {filteredBooks.map(book => {
                                    const salesCount = getBookSalesCount(book);
                                    const totalSales = getBookTotalSales(book);
                                    const statusCfg = getStatusConfig(book.status);
                                    return (
                                        <div key={book.id} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                                                <img src={getThumbnailUrl(book)} alt={book.bookTitle} style={{ width: '64px', height: '88px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '15px', fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.3 }}>{book.bookTitle}</p>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', background: statusCfg.bg, color: statusCfg.color, border: `0.5px solid ${statusCfg.border}`, fontFamily: "'Lato',sans-serif", flexShrink: 0 }}>{statusCfg.label}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 10px', fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                        {[['Price', `₦${Number(book.price).toLocaleString()}`], ['Category', book.category], ['Copies Sold', salesCount], ['Revenue', `₦${totalSales.toLocaleString()}`]].map(([k, v]) => (
                                                            <div key={k}>
                                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 1px', fontFamily: "'Lato',sans-serif" }}>{k}</p>
                                                                <p style={{ fontSize: '12px', fontWeight: 700, color: k === 'Revenue' ? GOLD : NAVY, margin: 0, fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{v}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '0.5px solid #f0ebe0' }}>
                                                <button onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: '0.5px solid #e5ddd0', background: CREAM, fontSize: '12px', fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: "'Lato',sans-serif", transition: 'all 0.15s' }}>
                                                    <Eye size={14} /> Details
                                                </button>
                                                <Link href={`/book/preview?id=${book.id}`} style={{ flex: 1 }}>
                                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: '0.5px solid #86efac', background: '#f0fdf4', fontSize: '12px', fontWeight: 700, color: '#16a34a', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                                        <BookOpen size={14} /> Open
                                                    </button>
                                                </Link>
                                                <button onClick={() => { setSelectedBook(book); setShowDeleteModal(true); }}
                                                    style={{ padding: '10px 14px', border: '0.5px solid #fecaca', background: '#fef2f2', fontSize: '12px', fontWeight: 700, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Mobile Bottom Nav (matches seller page) ── */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: NAVY, borderTop: `0.5px solid rgba(184,150,62,0.2)`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px', zIndex: 40 }} className="lg-hide">
                    {[
                        { href: "/my-account/seller-account", icon: <DollarSign size={20} />, label: 'Account' },
                        { href: "/my-account/seller-account/my-books", icon: <Book size={20} />, label: 'My Books' },
                        { href: "/documents", icon: <Globe size={20} />, label: 'Browse' },
                        { href: "/upload-document", icon: <TrendingUp size={20} />, label: 'Upload' },
                    ].map(({ href, icon, label }) => (
                        <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: href.includes('my-books') ? GOLD : 'rgba(255,255,255,0.55)', fontFamily: "'Lato',sans-serif" }}>
                            {icon}
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</span>
                        </Link>
                    ))}
                </div>
                <div className="lg-hide" style={{ height: '72px' }} />

                {/* ══ DELETE MODAL ══ */}
                {showDeleteModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '440px', overflow: 'hidden' }}>
                            <div style={{ background: '#A32D2D', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedBook(null); }}
                                    style={{ position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}><X size={15} /></button>
                                <div style={{ width: '64px', height: '64px', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <Trash2 size={28} style={{ color: '#fff' }} />
                                </div>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Delete Document?</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Lato',sans-serif", margin: 0 }}>This action is permanent and cannot be undone</p>
                            </div>
                            <div style={{ padding: '24px 20px 0' }}>
                                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', padding: '14px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', color: '#791F1F', margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
                                        You are about to permanently delete <strong>"{selectedBook?.bookTitle}"</strong>. Buyers who already purchased this document will retain access.
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '10px 20px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={handleDeleteBook} disabled={deleting}
                                    style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif", border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', background: '#A32D2D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: deleting ? 0.7 : 1 }}>
                                    {deleting ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Deleting…</> : <><Trash2 size={15} /> Yes, delete this document</>}
                                </button>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedBook(null); }} disabled={deleting}
                                    style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#6b7280', background: 'transparent', border: '0.5px solid #e5e7eb', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                    Cancel, keep this document
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ DETAILS MODAL ══ */}
                {showDetailsModal && selectedBook && (
                    <div className="modal-overlay " style={{ marginTop: '0' }}>
                        <div className="modal-inner">
                            {/* Header */}
                            <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)', backgroundSize: '24px 24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, }}>
                                <div className="mt-15">
                                    <p style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Document Details</p>
                                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Book Overview</h2>
                                </div>
                                <button onClick={() => setShowDetailsModal(false)} style={{ width: '36px', height: '36px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: BG }}>
                                {/* Book Hero */}
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '16px', display: 'flex', gap: '16px' }}>
                                    <img src={getThumbnailUrl(selectedBook)} alt={selectedBook.bookTitle} style={{ width: '100px', height: '140px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.3 }}>{selectedBook.bookTitle}</p>
                                        <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 14px', fontFamily: "'Lato',sans-serif" }}>by {selectedBook.author}</p>
                                        {(() => { const cfg = getStatusConfig(selectedBook.status); return <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 12px', background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}`, fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>{cfg.label}</span>; })()}
                                        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {[['Price', `₦${Number(selectedBook.price).toLocaleString()}`], ['Category', selectedBook.category], ['Pages', selectedBook.pages || 'N/A'], ['Uploaded', selectedBook.uploadedAt?.toLocaleDateString()]].map(([k, v]) => (
                                                <div key={k}>
                                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{k}</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Performance */}
                                <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)', backgroundSize: '20px 20px', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,0.2)', transform: 'rotate(45deg)' }} />
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '14px', fontFamily: "'Lato',sans-serif" }}>Sales & Performance</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>Copies Sold</p>
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>{getBookSalesCount(selectedBook)}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>Total Revenue</p>
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, color: GOLDD, margin: 0 }}>₦{getBookTotalSales(selectedBook).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedBook.description && (
                                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '16px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: '10px', fontFamily: "'Lato',sans-serif" }}>Description</p>
                                        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, margin: 0, fontFamily: "'Lato',sans-serif" }}>{selectedBook.description}</p>
                                    </div>
                                )}
                                {selectedBook.message && (
                                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '20px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: '10px', fontFamily: "'Lato',sans-serif" }}>Summary</p>
                                        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, margin: 0, fontFamily: "'Lato',sans-serif", whiteSpace: 'pre-line' }}>{selectedBook.message}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Link href={`/book/preview?id=${selectedBook.id}`} style={{ flex: 1 }}>
                                        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '14px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em' }}>
                                            <BookOpen size={16} /> Open Document
                                        </button>
                                    </Link>
                                    <button onClick={() => setShowDetailsModal(false)}
                                        style={{ flex: 1, padding: '14px', fontSize: '13px', fontWeight: 700, color: '#666', background: '#f5f5f5', border: '0.5px solid #e5ddd0', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}