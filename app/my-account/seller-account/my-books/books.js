"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Book, Trash2, Eye, Plus, Search, Filter, TrendingUp, AlertCircle,
    CheckCircle, X, Upload, BookOpen, ChevronRight, ShoppingBag, DollarSign,
    Globe, Edit3, EyeOff, Save, RotateCcw, Check, Pencil
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import {
    collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import { useCurrency } from "@/app/context/CurrencyContext";

/* ─── colour tokens ───────────────────── */
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [bookSalesCount, setBookSalesCount] = useState({});
    const { fmt } = useCurrency();
    /* inline price edit */
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [priceInputVal, setPriceInputVal] = useState("");
    const priceRef = useRef(null);

    /* edit-modal form state */
    const [editForm, setEditForm] = useState({
        bookTitle: "", author: "", category: "", price: "",
        description: "", message: "", driveFileId: ""
    });
    const [editSaveMsg, setEditSaveMsg] = useState("");

    const router = useRouter();

    /* ── fetch sales counts ── */
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
                    const books = emailSnapshot.docs.map(d => ({
                        id: d.id, firestoreId: d.id, ...d.data(),
                        uploadedAt: d.data().createdAt?.toDate?.() || new Date()
                    }));
                    setPostedBooks(books); setFilteredBooks(books); return;
                }
            }
            const books = snapshot.docs.map(d => ({
                id: d.id, firestoreId: d.id, ...d.data(),
                uploadedAt: d.data().createdAt?.toDate?.() || new Date()
            }));
            setPostedBooks(books); setFilteredBooks(books);
        } catch (error) {
            console.error("Error fetching posted books:", error);
            setPostedBooks([]); setFilteredBooks([]);
        }
    };

    const getBookSalesCount = (book) =>
        bookSalesCount[book.id] || bookSalesCount[book.firestoreId] ||
        bookSalesCount[`firestore-${book.id}`] || bookSalesCount[`firestore-${book.firestoreId}`] || 0;
    const getBookTotalSales = (book) =>
        fmt(getBookSalesCount(book) * (Number(book.price) || 0));

    const calculateStats = () => ({
        totalRevenue: fmt(postedBooks.reduce((sum, b) => sum + getBookTotalSales(b), 0)),
        totalCopiesSold: postedBooks.reduce((sum, b) => sum + getBookSalesCount(b), 0),
        approved: postedBooks.filter(b => b.status === 'approved').length,
        pending: postedBooks.filter(b => b.status === 'pending').length,
    });
    const stats = calculateStats();

    useEffect(() => {
        let filtered = [...postedBooks];
        if (searchQuery.trim())
            filtered = filtered.filter(b =>
                b.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.category?.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterStatus !== "all")
            filtered = filtered.filter(b =>
                filterStatus === "unpublished" ? b.unpublished : b.status === filterStatus);
        setFilteredBooks(filtered);
    }, [searchQuery, filterStatus, postedBooks]);

    /* ── helpers ── */
    const patchBook = (id, changes) => {
        setPostedBooks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
        setFilteredBooks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
        if (selectedBook?.id === id) setSelectedBook(prev => ({ ...prev, ...changes }));
    };

    /* ── inline price save ── */
    const saveInlinePrice = async (book) => {
        const trimmed = priceInputVal.replace(/[^0-9.]/g, "");
        if (!trimmed || isNaN(Number(trimmed))) { setEditingPriceId(null); return; }
        try {
            await updateDoc(doc(db, "advertMyBook", book.id), { price: trimmed });
            patchBook(book.id, { price: trimmed });
        } catch (err) { console.error("Price update failed:", err); }
        setEditingPriceId(null);
    };

    /* ── unpublish / republish ── */
    const toggleUnpublish = async (book) => {
        const next = !book.unpublished;
        try {
            await updateDoc(doc(db, "advertMyBook", book.id), { unpublished: next });
            patchBook(book.id, { unpublished: next });
        } catch (err) { console.error("Toggle failed:", err); }
    };

    /* ── edit modal open ── */
    const openEditModal = (book) => {
        setSelectedBook(book);
        setEditForm({
            bookTitle: book.bookTitle || "",
            author: book.author || "",
            category: book.category || "",
            price: book.price || "",
            description: book.description || "",
            message: book.message || "",
            driveFileId: book.driveFileId || "",
        });
        setEditSaveMsg("");
        setShowEditModal(true);
    };

    /* ── edit modal save ── */
    const saveEditForm = async () => {
        if (!selectedBook) return;
        setSaving(true);
        try {
            const updates = {
                bookTitle: editForm.bookTitle.trim(),
                author: editForm.author.trim(),
                category: editForm.category.trim(),
                price: editForm.price.replace(/[^0-9.]/g, ""),
                description: editForm.description.trim(),
                message: editForm.message.trim(),
                ...(editForm.driveFileId.trim() && { driveFileId: editForm.driveFileId.trim() }),
            };
            await updateDoc(doc(db, "advertMyBook", selectedBook.id), updates);
            patchBook(selectedBook.id, updates);
            setEditSaveMsg("Changes saved successfully!");
            setTimeout(() => setEditSaveMsg(""), 3000);
        } catch (err) {
            console.error("Save failed:", err);
            setEditSaveMsg("Failed to save. Please try again.");
        } finally { setSaving(false); }
    };

    /* ── delete ── */
    const handleDeleteBook = async () => {
        if (!selectedBook) return;
        try {
            setDeleting(true);
            await deleteDoc(doc(db, "advertMyBook", selectedBook.id));
            setPostedBooks(prev => prev.filter(b => b.id !== selectedBook.id));
            setFilteredBooks(prev => prev.filter(b => b.id !== selectedBook.id));
            setShowDeleteModal(false); setSelectedBook(null);
            alert("Book deleted successfully!");
        } catch (error) {
            console.error("Error deleting book:", error);
            alert("Failed to delete book. Please try again.");
        } finally { setDeleting(false); }
    };

    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) { const fid = match[1] || match[2] || match[3]; if (fid) return `https://drive.google.com/thumbnail?id=${fid}&sz=w400`; }
        }
        if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
        }
        return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const getStatusConfig = (book) => {
        if (book.unpublished) return { label: 'Unpublished', bg: '#f8f8f8', color: '#6b7280', border: '#d1d5db' };
        switch (book.status) {
            case 'approved': return { label: 'Approved', bg: '#f0fdf4', color: '#16a34a', border: '#86efac' };
            case 'pending': return { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            case 'rejected': return { label: 'Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            default: return { label: 'Active', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
        }
    };

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY }}>Loading your documents…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    /* ════════════════════════════════════════ RENDER ════════════════════════════════════════ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root{font-family:'Lato',sans-serif;background:${BG};}
        .lan-serif{font-family:'Playfair Display',Georgia,serif;}
        .book-row{display:flex;align-items:center;justify-content:space-between;padding:16px;border:0.5px solid #e5ddd0;background:#fff;margin-bottom:6px;transition:background 0.15s,border-color 0.15s;cursor:pointer;}
        .book-row:hover{background:${CREAM};border-color:${GOLD};}
        .action-btn{width:34px;height:34px;border:0.5px solid #e5ddd0;display:flex;align-items:center;justify-content:center;background:${CREAM};cursor:pointer;transition:all 0.15s;}
        .action-btn:hover{border-color:${GOLD};}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:50;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;}
        .modal-inner{background:#fff;width:100%;min-height:100vh;max-width:640px;margin:0 auto;}
        @media(min-width:640px){.modal-inner{min-height:auto;margin:40px auto;}}
        .gold-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(184,150,62,0.12);border:0.5px solid rgba(184,150,62,0.3);padding:5px 12px;border-radius:999px;}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .anim-up{animation:slideUp 0.45s cubic-bezier(0.4,0,0.2,1) both;}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:0.4}}
        .pulse-dot{animation:pulse2 2s infinite;}
        .sbar-none{scrollbar-width:none;-ms-overflow-style:none;}
        .sbar-none::-webkit-scrollbar{display:none;}
        .lg-hide{display:flex;}
        @media(min-width:1024px){.lg-hide{display:none !important;}}
        .price-edit-input{border:0.5px solid ${GOLD};background:${CREAM};padding:4px 8px;font-size:13px;font-weight:700;color:${NAVY};font-family:'Lato',sans-serif;outline:none;width:100px;}
        .form-input{width:100%;border:0.5px solid #e5ddd0;padding:10px 12px;font-size:13px;color:${NAVY};outline:none;font-family:'Lato',sans-serif;background:${CREAM};box-sizing:border-box;transition:border-color 0.15s;}
        .form-input:focus{border-color:${GOLD};}
        .form-label{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin:0 0 5px;font-family:'Lato',sans-serif;display:block;}
        .unpub-row{opacity:0.6;}
        .tooltip{position:relative;}
        .tooltip:hover .tip{display:block;}
        .tip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:${NAVY};color:#fff;font-size:10px;white-space:nowrap;padding:4px 8px;pointer-events:none;z-index:99;font-family:'Lato',sans-serif;}
      `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>

                    {/* ── Header ── */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Seller Dashboard</p>
                            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(22px,4vw,30px)', fontWeight: 700, color: NAVY, margin: 0 }}>My Posted Documents</h1>
                        </div>
                        <Link href="/upload-document">
                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '12px 20px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1a3a6e'}
                                onMouseLeave={e => e.currentTarget.style.background = NAVY}>
                                <Plus size={16} /> Upload New Document
                            </button>
                        </Link>
                    </div>

                    {/* ── Info Banner ── */}
                    <div style={{ background: `rgba(184,150,62,0.07)`, border: `0.5px solid rgba(184,150,62,0.3)`, padding: '14px 18px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {[
                            { icon: <DollarSign size={13} style={{ color: GOLD }} />, text: "Set your own price — no minimum or maximum. Change it anytime, no re-review needed." },
                            { icon: <Edit3 size={13} style={{ color: GOLD }} />, text: "Edit title, description, price, or cover image anytime — no review process required." },
                            { icon: <EyeOff size={13} style={{ color: GOLD }} />, text: "Unpublish a document to hide it from search & purchase without deleting it." },
                        ].map(({ icon, text }, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: '1 1 220px' }}>
                                <div style={{ marginTop: '1px', flexShrink: 0 }}>{icon}</div>
                                <p style={{ fontSize: '11px', color: '#666', fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>{text}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Stats ── */}
                    <div className="anim-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
                        <style>{`@media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr) !important;}}`}</style>
                        {[
                            { label: 'Total Documents', val: postedBooks.length, icon: <Book size={18} style={{ color: GOLD }} /> },
                            { label: 'Approved', val: stats.approved, icon: <CheckCircle size={18} style={{ color: GOLD }} /> },
                            { label: 'Copies Sold', val: stats.totalCopiesSold, icon: <ShoppingBag size={18} style={{ color: GOLD }} /> },
                            { label: 'Total Revenue', val: stats.totalRevenue, icon: <TrendingUp size={18} style={{ color: GOLD }} /> },
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
                                <option value="unpublished">Unpublished</option>
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
                                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '12px 24px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
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
                                    <div style={{ background: NAVY, display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1fr 1fr 1.4fr', gap: 0 }}>
                                        {['Document', 'Category', 'Price', 'Sold', 'Revenue', 'Status', 'Actions'].map(h => (
                                            <div key={h} style={{ padding: '14px 16px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>{h}</div>
                                        ))}
                                    </div>

                                    {filteredBooks.map((book) => {
                                        const salesCount = getBookSalesCount(book);
                                        const totalSales = getBookTotalSales(book);
                                        const statusCfg = getStatusConfig(book);
                                        const isEditingPrice = editingPriceId === book.id;
                                        return (
                                            <div key={book.id}
                                                className={book.unpublished ? 'unpub-row' : ''}
                                                style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1fr 1fr 1.4fr', borderBottom: '0.5px solid #f0ebe0', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>

                                                {/* Title */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={getThumbnailUrl(book)} alt={book.bookTitle}
                                                        style={{ width: '40px', height: '54px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                                    <div>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{book.bookTitle}</p>
                                                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    </div>
                                                </div>

                                                {/* Category */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: '#888', fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{book.category}</span>
                                                </div>

                                                {/* Price — inline edit */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    {isEditingPrice ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>₦</span>
                                                            <input ref={priceRef} className="price-edit-input" type="text" value={priceInputVal}
                                                                onChange={e => setPriceInputVal(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(book); if (e.key === 'Escape') setEditingPriceId(null); }}
                                                                autoFocus />
                                                            <button onClick={() => saveInlinePrice(book)}
                                                                style={{ width: '26px', height: '26px', background: '#f0fdf4', border: '0.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <Check size={12} style={{ color: '#16a34a' }} />
                                                            </button>
                                                            <button onClick={() => setEditingPriceId(null)}
                                                                style={{ width: '26px', height: '26px', background: '#fef2f2', border: '0.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <X size={12} style={{ color: '#dc2626' }} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                            onClick={() => { setEditingPriceId(book.id); setPriceInputVal(book.price); }}
                                                            title="Click to edit price">
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{fmt(Number(book.price) || 0)}</span>
                                                            <Pencil size={11} style={{ color: GOLD, opacity: 0.7 }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sold */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{salesCount}</span>
                                                </div>

                                                {/* Revenue */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>{fmt(totalSales)}</span>
                                                </div>

                                                {/* Status */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', background: statusCfg.bg, color: statusCfg.color, border: `0.5px solid ${statusCfg.border}`, fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>{statusCfg.label}</span>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                                    {/* View Details */}
                                                    <div className="tooltip">
                                                        <button className="action-btn" onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}>
                                                            <Eye size={15} style={{ color: NAVY }} />
                                                        </button>
                                                        <span className="tip">Details</span>
                                                    </div>
                                                    {/* Edit */}
                                                    <div className="tooltip">
                                                        <button className="action-btn" onClick={() => openEditModal(book)}>
                                                            <Edit3 size={15} style={{ color: GOLD }} />
                                                        </button>
                                                        <span className="tip">Edit</span>
                                                    </div>
                                                    {/* Open */}
                                                    <Link href={`/book/preview?id=${book.id}`}>
                                                        <div className="tooltip">
                                                            <button className="action-btn">
                                                                <BookOpen size={15} style={{ color: '#16a34a' }} />
                                                            </button>
                                                            <span className="tip">Open</span>
                                                        </div>
                                                    </Link>
                                                    {/* Unpublish / Republish */}
                                                    <div className="tooltip">
                                                        <button className="action-btn"
                                                            style={{ borderColor: book.unpublished ? '#86efac' : '#fde68a', background: book.unpublished ? '#f0fdf4' : '#fffbeb' }}
                                                            onClick={() => toggleUnpublish(book)}>
                                                            {book.unpublished
                                                                ? <RotateCcw size={15} style={{ color: '#16a34a' }} />
                                                                : <EyeOff size={15} style={{ color: '#d97706' }} />}
                                                        </button>
                                                        <span className="tip">{book.unpublished ? 'Republish' : 'Unpublish'}</span>
                                                    </div>
                                                    {/* Delete */}
                                                    <div className="tooltip">
                                                        <button className="action-btn"
                                                            style={{ borderColor: '#fecaca', background: '#fef2f2' }}
                                                            onClick={() => { setSelectedBook(book); setShowDeleteModal(true); }}>
                                                            <Trash2 size={15} style={{ color: '#dc2626' }} />
                                                        </button>
                                                        <span className="tip">Delete</span>
                                                    </div>
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
                                    const statusCfg = getStatusConfig(book);
                                    return (
                                        <div key={book.id} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px', marginBottom: '8px', opacity: book.unpublished ? 0.65 : 1 }}>
                                            <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                                                <img src={getThumbnailUrl(book)} alt={book.bookTitle}
                                                    style={{ width: '64px', height: '88px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '15px', fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.3 }}>{book.bookTitle}</p>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', background: statusCfg.bg, color: statusCfg.color, border: `0.5px solid ${statusCfg.border}`, fontFamily: "'Lato',sans-serif", flexShrink: 0 }}>{statusCfg.label}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 10px', fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                        {[['Price', fmt(Number(book.price) || 0)], ['Category', book.category], ['Copies Sold', salesCount], ['Revenue', fmt(totalSales)]].map(([k, v]) => (
                                                            <div key={k}>
                                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 1px', fontFamily: "'Lato',sans-serif" }}>{k}</p>
                                                                <p style={{ fontSize: '12px', fontWeight: 700, color: k === 'Revenue' ? GOLD : NAVY, margin: 0, fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{v}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Action Row */}
                                            <div style={{ display: 'flex', gap: '6px', paddingTop: '12px', borderTop: '0.5px solid #f0ebe0', flexWrap: 'wrap' }}>
                                                <button onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                                                    style={{ flex: 1, minWidth: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', border: '0.5px solid #e5ddd0', background: CREAM, fontSize: '11px', fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                                    <Eye size={13} /> View
                                                </button>
                                                <button onClick={() => openEditModal(book)}
                                                    style={{ flex: 1, minWidth: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', border: `0.5px solid rgba(184,150,62,0.4)`, background: `rgba(184,150,62,0.08)`, fontSize: '11px', fontWeight: 700, color: GOLD, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                                    <Edit3 size={13} /> Edit
                                                </button>
                                                <Link href={`/book/preview?id=${book.id}`} style={{ flex: 1 }}>
                                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', border: '0.5px solid #86efac', background: '#f0fdf4', fontSize: '11px', fontWeight: 700, color: '#16a34a', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                                        <BookOpen size={13} /> Open
                                                    </button>
                                                </Link>
                                                <button onClick={() => toggleUnpublish(book)}
                                                    style={{ padding: '9px 12px', border: `0.5px solid ${book.unpublished ? '#86efac' : '#fde68a'}`, background: book.unpublished ? '#f0fdf4' : '#fffbeb', fontSize: '11px', fontWeight: 700, color: book.unpublished ? '#16a34a' : '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {book.unpublished ? <RotateCcw size={13} /> : <EyeOff size={13} />}
                                                </button>
                                                <button onClick={() => { setSelectedBook(book); setShowDeleteModal(true); }}
                                                    style={{ padding: '9px 12px', border: '0.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 size={13} style={{ color: '#dc2626' }} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Mobile Bottom Nav ── */}
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

                {/* ════════════════ EDIT MODAL ════════════════ */}
                {showEditModal && selectedBook && (
                    <div className="modal-overlay">
                        <div className="modal-inner">
                            {/* Header */}
                            <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)', backgroundSize: '24px 24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, marginTop: '60px' }}>
                                <div>
                                    <p style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>No Review Required</p>
                                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Edit Document</h2>
                                </div>
                                <button onClick={() => setShowEditModal(false)} style={{ width: '36px', height: '36px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div style={{ padding: '24px', background: BG, overflowY: 'auto' }}>

                                {/* Price — highlighted */}
                                <div style={{ background: `rgba(184,150,62,0.07)`, border: `0.5px solid rgba(184,150,62,0.3)`, padding: '18px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <DollarSign size={15} style={{ color: GOLD }} />
                                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>Your Price — Full Control</p>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#666', fontFamily: "'Lato',sans-serif", margin: '0 0 12px', lineHeight: 1.6 }}>
                                        LAN imposes no minimum or maximum. Set any amount you want — changes apply instantly with no re-review.
                                    </p>
                                    <label className="form-label">Price (₦)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>₦</span>
                                        <input className="form-input" type="text" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                                            style={{ paddingLeft: '26px' }} placeholder="0" />
                                    </div>
                                </div>

                                {/* Core fields */}
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>Document Details</p>
                                    <div>
                                        <label className="form-label">Title</label>
                                        <input className="form-input" type="text" value={editForm.bookTitle} onChange={e => setEditForm(f => ({ ...f, bookTitle: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="form-label">Author</label>
                                        <input className="form-input" type="text" value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="form-label">Category</label>
                                        <input className="form-input" type="text" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="form-label">Description</label>
                                        <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                            style={{ resize: 'vertical', fontFamily: "'Lato',sans-serif" }} />
                                    </div>
                                    <div>
                                        <label className="form-label">Summary / Message</label>
                                        <textarea className="form-input" rows={4} value={editForm.tableOfContents} onChange={e => setEditForm(f => ({ ...f, tableOfContents: e.target.value }))}
                                            style={{ resize: 'vertical', fontFamily: "'Lato',sans-serif" }} />
                                    </div>
                                </div>

                                {/* Cover image */}
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '20px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 12px', fontFamily: "'Lato',sans-serif" }}>Cover Image</p>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <img src={getThumbnailUrl({ ...selectedBook, driveFileId: editForm.driveFileId || selectedBook.driveFileId })}
                                            alt="preview"
                                            style={{ width: '56px', height: '76px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                        <div style={{ flex: 1 }}>
                                            <label className="form-label">Google Drive File ID</label>
                                            <input className="form-input" type="text" value={editForm.driveFileId} onChange={e => setEditForm(f => ({ ...f, driveFileId: e.target.value }))} placeholder="e.g. 1BxiMV…" />
                                            <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0', fontFamily: "'Lato',sans-serif", lineHeight: 1.5 }}>Paste a new Drive file ID to update the cover. The preview updates live.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Unpublish toggle */}
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>
                                            {selectedBook.unpublished ? 'Document is Unpublished' : 'Document is Published'}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.5 }}>
                                            {selectedBook.unpublished
                                                ? 'This document is hidden from search and cannot be purchased. Republish to make it available again.'
                                                : 'Unpublish to temporarily remove from search & purchase without deleting. Great for seasonal or revision content.'}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleUnpublish(selectedBook)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `0.5px solid ${selectedBook.unpublished ? '#86efac' : '#fde68a'}`, background: selectedBook.unpublished ? '#f0fdf4' : '#fffbeb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", color: selectedBook.unpublished ? '#16a34a' : '#d97706', flexShrink: 0, transition: 'all 0.15s' }}>
                                        {selectedBook.unpublished ? <><RotateCcw size={14} /> Republish</> : <><EyeOff size={14} /> Unpublish</>}
                                    </button>
                                </div>

                                {/* Save / feedback */}
                                {editSaveMsg && (
                                    <div style={{ padding: '12px 16px', background: editSaveMsg.includes('Failed') ? '#fef2f2' : '#f0fdf4', border: `0.5px solid ${editSaveMsg.includes('Failed') ? '#fecaca' : '#86efac'}`, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editSaveMsg.includes('Failed')
                                            ? <AlertCircle size={14} style={{ color: '#dc2626' }} />
                                            : <CheckCircle size={14} style={{ color: '#16a34a' }} />}
                                        <p style={{ fontSize: '13px', fontFamily: "'Lato',sans-serif", margin: 0, color: editSaveMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{editSaveMsg}</p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={saveEditForm} disabled={saving}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '14px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Lato',sans-serif", opacity: saving ? 0.7 : 1, letterSpacing: '0.05em', transition: 'background 0.15s' }}
                                        onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#1a3a6e'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = NAVY; }}>
                                        {saving
                                            ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Saving…</>
                                            : <><Save size={15} /> Save Changes</>}
                                    </button>
                                    <button onClick={() => setShowEditModal(false)} disabled={saving}
                                        style={{ flex: 1, padding: '14px', fontSize: '13px', fontWeight: 700, color: '#666', background: '#f5f5f5', border: '0.5px solid #e5ddd0', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════ DELETE MODAL ════════════════ */}
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

                            {/* Unpublish suggestion */}
                            {!selectedBook?.unpublished && (
                                <div style={{ background: '#fffbeb', border: '0', borderBottom: '0.5px solid #fde68a', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 6px', fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Consider unpublishing instead</p>
                                        <p style={{ fontSize: '11px', color: '#92400e', margin: '0 0 8px', fontFamily: "'Lato',sans-serif", lineHeight: 1.5 }}>You can hide this document from search & purchase without permanently deleting it.</p>
                                        <button onClick={() => { toggleUnpublish(selectedBook); setShowDeleteModal(false); }}
                                            style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', background: 'none', border: '0.5px solid #fbbf24', padding: '5px 12px', cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <EyeOff size={12} /> Unpublish instead
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '16px 20px 0' }}>
                                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', padding: '14px' }}>
                                    <p style={{ fontSize: '12px', color: '#791F1F', margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
                                        You are about to permanently delete <strong>"{selectedBook?.bookTitle}"</strong>. Buyers who already purchased this document will retain access.
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '14px 20px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={handleDeleteBook} disabled={deleting}
                                    style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif", border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', background: '#A32D2D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: deleting ? 0.7 : 1 }}>
                                    {deleting
                                        ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Deleting…</>
                                        : <><Trash2 size={15} /> Yes, permanently delete</>}
                                </button>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedBook(null); }} disabled={deleting}
                                    style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#6b7280', background: 'transparent', border: '0.5px solid #e5e7eb', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                    Cancel, keep this document
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════ DETAILS MODAL ════════════════ */}
                {showDetailsModal && selectedBook && (
                    <div className="modal-overlay">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)', backgroundSize: '24px 24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
                                <div>
                                    <p style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Document Details</p>
                                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Book Overview</h2>
                                </div>
                                <button onClick={() => setShowDetailsModal(false)} style={{ width: '36px', height: '36px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: BG }}>
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px', marginBottom: '16px', display: 'flex', gap: '16px' }}>
                                    <img src={getThumbnailUrl(selectedBook)} alt={selectedBook.bookTitle}
                                        style={{ width: '100px', height: '140px', objectFit: 'cover', border: '0.5px solid #e5ddd0', flexShrink: 0 }}
                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.3 }}>{selectedBook.bookTitle}</p>
                                        <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 14px', fontFamily: "'Lato',sans-serif" }}>by {selectedBook.author}</p>
                                        {(() => { const cfg = getStatusConfig(selectedBook); return <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 12px', background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}`, fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>{cfg.label}</span>; })()}
                                        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {[['Price', fmt(Number(selectedBook.price) || 0)], ['Category', selectedBook.category], ['Pages', selectedBook.pages || 'N/A'], ['Uploaded', selectedBook.uploadedAt?.toLocaleDateString()]].map(([k, v]) => (
                                                <div key={k}>
                                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{k}</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif", textTransform: 'capitalize' }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

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
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, color: GOLDD, margin: 0 }}>{fmt(getBookTotalSales(selectedBook))}</p>
                                        </div>
                                    </div>
                                </div>

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

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setShowDetailsModal(false); openEditModal(selectedBook); }}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: `rgba(184,150,62,0.1)`, color: GOLD, padding: '14px', border: `0.5px solid rgba(184,150,62,0.4)`, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                        <Edit3 size={15} /> Edit Document
                                    </button>
                                    <Link href={`/book/preview?id=${selectedBook.id}`} style={{ flex: 1 }}>
                                        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '14px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                            <BookOpen size={16} /> Open Document
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}