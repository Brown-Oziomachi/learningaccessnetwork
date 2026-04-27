"use client"
// MyBooksClient.jsx — Full offline reading support + LAN design system

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Globe, LogOut, User, ChevronDown, Download, Menu, FileText,
    Calendar, CreditCard, X, ExternalLink, ThumbsUp, Search, Lock,
    ArrowLeft, ZoomIn, ZoomOut, Maximize, WifiOff, Wifi, BookOpen,
    HardDrive, Trash2, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { booksData } from '@/lib/booksData';
import Navbar from '@/components/NavBar';
import { saveReadProgress, getReadProgress } from '@/lib/offlineDB';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';

/* ─── LAN design tokens ─────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

const eyebrow = {
    fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em",
    textTransform: "uppercase", color: GOLD, marginBottom: "4px",
    fontFamily: "'Lato', sans-serif",
};

const navyBtn = (disabled) => ({
    background: disabled ? "#aaa" : NAVY, color: "#fff",
    padding: "11px 20px", border: "none", fontSize: "12px", fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Lato', sans-serif",
    letterSpacing: "0.06em", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "8px", opacity: disabled ? 0.5 : 1,
    transition: "background 0.18s", borderRadius: 0,
});

const sectionCard = {
    background: "#fff", border: `0.5px solid #e5ddd0`, padding: "22px", marginBottom: "16px",
};

/* ─── Offline PDF Reader ─────────────────────────────────── */
function OfflinePdfReader({ pdfObjectUrl, book, onClose }) {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.4);
    const [rendering, setRendering] = useState(false);
    const renderTaskRef = useRef(null);

    useEffect(() => {
        if (!pdfObjectUrl || typeof window === 'undefined') return;
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) { console.error('pdf.js not loaded'); return; }
        const load = async () => {
            try {
                const pdf = await pdfjsLib.getDocument(pdfObjectUrl).promise;
                setPdfDoc(pdf); setTotalPages(pdf.numPages);
                const saved = await getReadProgress(String(book.id));
                setCurrentPage(Math.min(saved, pdf.numPages));
            } catch (err) { console.error(err); }
        };
        load();
    }, [pdfObjectUrl, book.id]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        const render = async () => {
            if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch { } }
            setRendering(true);
            try {
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width = viewport.width; canvas.height = viewport.height;
                renderTaskRef.current = page.render({ canvasContext: canvas.getContext('2d'), viewport });
                await renderTaskRef.current.promise;
            } catch (err) { if (err?.name !== 'RenderingCancelledException') console.error(err); }
            finally { setRendering(false); }
        };
        render();
    }, [pdfDoc, currentPage, scale]);

    useEffect(() => {
        if (currentPage > 0 && book?.id) saveReadProgress(String(book.id), currentPage);
    }, [currentPage, book?.id]);

    const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const zoomIn = () => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)));
    const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)));

    useEffect(() => {
        const h = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [totalPages]);

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ minHeight: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column", fontFamily: "'Lato', sans-serif" }}>
                <Navbar />
                {/* Toolbar */}
                <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid rgba(184,150,62,0.2)`, position: "sticky", top: 0, zIndex: 30 }}>
                    <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontFamily: "'Lato', sans-serif", fontSize: "12px" }}>
                        <ArrowLeft size={16} /> Back to Library
                    </button>
                    <div style={{ flex: 1, textAlign: "center", padding: "0 20px" }}>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>{book.title}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginTop: "2px" }}>
                            <WifiOff size={10} style={{ color: GOLD }} />
                            <span style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Reading offline</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={zoomOut} style={{ background: "rgba(255,255,255,0.08)", border: `0.5px solid rgba(255,255,255,0.15)`, padding: "6px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}><ZoomOut size={14} /></button>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", width: "40px", textAlign: "center" }}>{Math.round(scale * 100)}%</span>
                        <button onClick={zoomIn} style={{ background: "rgba(255,255,255,0.08)", border: `0.5px solid rgba(255,255,255,0.15)`, padding: "6px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}><ZoomIn size={14} /></button>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, overflowY: "auto", background: "#2a2a2a", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
                    {!pdfDoc && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" }}>
                            <div style={{ width: "36px", height: "36px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }} />
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Loading offline document…</p>
                        </div>
                    )}
                    <div style={{ position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", background: "#fff" }}>
                        {rendering && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                                <div style={{ width: "24px", height: "24px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            </div>
                        )}
                        <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
                    </div>
                </div>

                {/* Nav bar */}
                <div style={{ background: NAVY, borderTop: `0.5px solid rgba(184,150,62,0.2)`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", bottom: 0, zIndex: 20 }}>
                    <button onClick={goToPrev} disabled={currentPage <= 1} style={{ ...navyBtn(currentPage <= 1), background: currentPage <= 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)", border: `0.5px solid rgba(255,255,255,0.15)`, width: "auto", padding: "8px 16px", fontSize: "11px" }}>
                        <ChevronLeft size={14} /> Previous
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>{currentPage} / {totalPages}</span>
                        <div style={{ width: "120px", height: "2px", background: "rgba(255,255,255,0.1)" }}>
                            <div style={{ height: "100%", background: GOLD, width: totalPages ? `${(currentPage / totalPages) * 100}%` : "0%", transition: "width 0.3s" }} />
                        </div>
                    </div>
                    <button onClick={goToNext} disabled={currentPage >= totalPages} style={{ ...navyBtn(currentPage >= totalPages), background: currentPage >= totalPages ? "rgba(255,255,255,0.05)" : GOLD, color: currentPage >= totalPages ? "rgba(255,255,255,0.3)" : NAVY, border: "none", width: "auto", padding: "8px 16px", fontSize: "11px" }}>
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </>
    );
}

/* ─── Save Offline Button ────────────────────────────────── */
function SaveOfflineButton({ book, isOffline: alreadySaved, downloadState, onSave, onRemove, isOnline }) {
    const { status, progress, error } = downloadState;

    if (alreadySaved) return (
        <button onClick={(e) => { e.stopPropagation(); onRemove(book.id); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,0.06)", border: `0.5px solid rgba(22,163,74,0.3)`, padding: "5px 10px", cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: "0.05em" }}
            className="lan-offline-btn"
            title="Remove from offline storage">
            <HardDrive size={11} />
            Saved Offline
        </button>
    );

    if (status === 'downloading' || status === 'saving') return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: NAVY }}>
                <div style={{ width: "12px", height: "12px", border: `1.5px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                {status === 'saving' ? 'Saving…' : `${progress}%`}
            </div>
            <div style={{ height: "2px", background: "#e5ddd0" }}>
                <div style={{ height: "100%", background: GOLD, width: `${progress}%`, transition: "width 0.2s" }} />
            </div>
        </div>
    );

    if (status === 'done') return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, color: "#16a34a" }}>
            <ThumbsUp size={11} /> Saved!
        </span>
    );

    if (status === 'error') return (
        <button onClick={(e) => { e.stopPropagation(); onSave(book); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#dc2626", border: `0.5px solid #fca5a5`, background: "#fff1f2", padding: "5px 10px", cursor: "pointer", fontFamily: "'Lato', sans-serif" }}
            title={error}>
            <Download size={11} /> Retry
        </button>
    );

    if (!isOnline) return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#aaa" }}>
            <WifiOff size={11} /> Need internet
        </span>
    );

    return (
        <button onClick={(e) => { e.stopPropagation(); onSave(book); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, color: NAVY, border: `0.5px solid rgba(184,150,62,0.3)`, background: CREAM, padding: "5px 10px", cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: "0.04em" }}>
            <Download size={11} /> Save offline
        </button>
    );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function MyBooksClient() {
    const router = useRouter();
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showOverview, setShowOverview] = useState(false);
    const [showRelatedModal, setShowRelatedModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [activeTab, setActiveTab] = useState('library');
    const [offlinePdfObjectUrl, setOfflinePdfObjectUrl] = useState(null);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const [focusSearch, setFocusSearch] = useState(false);

    const { isOnline, offlineIds, offlineBooks, formattedStorageSize, downloadForOffline, removeOfflineBook, getOfflinePdfUrl, isBookOffline, getDownloadState } = useOfflineBooks();

    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) { const m = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/); if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`; }
        const pdf = book.pdfUrl || book.pdfLink;
        if (pdf?.includes('drive.google.com')) { const m = pdf.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/); if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`; }
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const extractFileId = (url) => {
        if (!url) return null;
        const m = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([^\&]+)/);
        return m ? (m[1] || m[2] || m[3]) : null;
    };

    const handleOpenBook = async (book) => {
        setLoadingPdf(true); setSelectedBook(book);
        if (!isOnline || isBookOffline(book.id)) {
            if (isBookOffline(book.id)) {
                const url = await getOfflinePdfUrl(book.id);
                if (url) { setOfflinePdfObjectUrl(url); setLoadingPdf(false); return; }
            }
            if (!isOnline) { setLoadingPdf(false); setPdfUrl(null); setOfflinePdfObjectUrl(null); return; }
        }
        setOfflinePdfObjectUrl(null);
        let url = null;
        if (book.embedUrl) url = book.embedUrl;
        else if (book.driveFileId) url = `https://drive.google.com/file/d/${book.driveFileId}/preview`;
        else if (book.pdfUrl) { const id = extractFileId(book.pdfUrl); url = id ? `https://drive.google.com/file/d/${id}/preview` : book.pdfUrl; }
        else if (book.pdfLink) { const id = extractFileId(book.pdfLink); if (id) url = `https://drive.google.com/file/d/${id}/preview`; }
        else if (book.previewUrl) { const id = extractFileId(book.previewUrl); if (id) url = `https://drive.google.com/file/d/${id}/preview`; }
        setPdfUrl(url); setLoadingPdf(false); setShowOverview(false); setShowRelatedModal(false);
    };

    const handleCloseReader = () => { setSelectedBook(null); setPdfUrl(null); setOfflinePdfObjectUrl(null); };

    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const purchasedBooksArray = Object.values(userData.purchasedBooks || {});
                const seenTransactions = new Set();
                const deduplicated = purchasedBooksArray.filter(book => {
                    if (book.transactionId) {
                        if (seenTransactions.has(book.transactionId)) return false;
                        seenTransactions.add(book.transactionId); return true;
                    }
                    const cleanId = (book.bookId || book.firestoreId || book.id)?.toString().replace('firestore-', '');
                    if (seenTransactions.has(cleanId)) return false;
                    seenTransactions.add(cleanId); return true;
                });
                const bookIds = new Set();
                deduplicated.forEach(b => { if (b.id) bookIds.add(b.id); if (b.bookId) bookIds.add(b.bookId); if (b.firestoreId) bookIds.add(b.firestoreId); });
                setPurchasedBookIds(bookIds);
                const enriched = await Promise.all(deduplicated.map(async (pb) => {
                    const bookId = pb.bookId || pb.firestoreId || pb.id;
                    let bookData = booksData.find(b => b.id === bookId || b.id === parseInt(bookId) || b.id === bookId?.toString().replace('firestore-', ''));
                    if (!bookData && bookId) {
                        try {
                            const cleanId = bookId.toString().replace('firestore-', '');
                            const fbDoc = await getDoc(doc(db, 'advertMyBook', cleanId));
                            if (fbDoc.exists()) {
                                const fb = fbDoc.data();
                                bookData = { id: bookId, title: fb.bookTitle || fb.title, author: fb.author, pages: fb.pages, format: fb.format || 'PDF', category: fb.category, description: fb.description, pdfUrl: fb.pdfUrl || fb.pdfLink, driveFileId: fb.driveFileId, embedUrl: fb.embedUrl, previewUrl: fb.previewUrl, coverImage: fb.coverImage };
                            }
                        } catch (e) { }
                    }
                    if (bookData) return { ...bookData, image: getThumbnailUrl(bookData), purchaseDate: pb.purchaseDate, transactionId: pb.transactionId, amount: pb.amount || bookData.price, sellerId: pb.sellerId, sellerName: pb.sellerName };
                    return { id: bookId, title: pb.title, author: pb.author, image: getThumbnailUrl(pb), pdfUrl: pb.pdfUrl, embedUrl: pb.embedUrl, driveFileId: pb.driveFileId, purchaseDate: pb.purchaseDate, transactionId: pb.transactionId, amount: pb.amount, format: 'PDF', sellerId: pb.sellerId, sellerName: pb.sellerName };
                }));
                setPurchasedBooks(enriched);
            } else { setPurchasedBooks([]); }
        } catch (e) { console.error(e); setPurchasedBooks([]); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) { setUser(u); await fetchPurchasedBooks(u.uid); }
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const filteredBooks = purchasedBooks.filter(b => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
    });

    const getRelatedBooks = (book) => booksData.filter(b => b.category === book.category && b.id !== book.id).slice(0, 10);
    const isPurchased = (id) => purchasedBookIds.has(id) || purchasedBookIds.has(id.toString()) || purchasedBookIds.has(`firestore-${id}`);
    const handleDownload = (book) => {
        const fileId = book.driveFileId || extractFileId(book.pdfUrl) || extractFileId(book.pdfLink);
        if (fileId) window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
        else if (book.pdfUrl) window.open(book.pdfUrl, '_blank');
        else alert(`Download link for ${book.title} will be sent to ${user?.email}`);
    };
    const formatDate = (d) => { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };

    /* ─── Loading ─────────────────────────────────────────── */
    if (loading) return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lato', sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "40px", height: "40px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: NAVY }}>Loading your library…</p>
                </div>
            </div>
        </>
    );

    /* ─── Offline reader ──────────────────────────────────── */
    if (selectedBook && offlinePdfObjectUrl) return <OfflinePdfReader pdfObjectUrl={offlinePdfObjectUrl} book={selectedBook} onClose={handleCloseReader} />;

    /* ─── Online iframe reader ────────────────────────────── */
    if (selectedBook) return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ minHeight: "100vh", background: "#f5f1ea", display: "flex", flexDirection: "column", fontFamily: "'Lato', sans-serif" }}>
                <Navbar />
                {/* Reader top bar */}
                <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
                    <button onClick={handleCloseReader} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontFamily: "'Lato', sans-serif", fontSize: "12px", letterSpacing: "0.04em" }}>
                        <ArrowLeft size={16} /> Back to Library
                    </button>
                    {isOnline && (
                        <SaveOfflineButton book={selectedBook} isOffline={isBookOffline(selectedBook.id)} downloadState={getDownloadState(selectedBook.id)} onSave={downloadForOffline} onRemove={removeOfflineBook} isOnline={isOnline} />
                    )}
                </div>

                <div style={{ flex: 1, background: "#fff", position: "relative" }}>
                    {loadingPdf ? (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ width: "36px", height: "36px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                <p style={{ fontFamily: "'Playfair Display', serif", color: NAVY, fontSize: "13px" }}>Loading document…</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
                            <iframe src={pdfUrl} style={{ width: "100%", minHeight: "calc(100vh - 200px)", border: "none", background: "#fff" }} title={selectedBook.title} allow="autoplay" />
                            <div style={{ position: "absolute", top: 0, right: 0, height: "56px", background: "#323639", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 20px", gap: "10px", width: "220px", userSelect: "none" }} onContextMenu={(e) => e.preventDefault()}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span style={{ color: GOLD, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>LAN Library</span>
                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "8px", fontFamily: "monospace" }}>ID: {user?.uid?.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <Lock size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                            </div>
                            <div style={{ position: "absolute", bottom: 0, right: 0, height: "32px", background: "#323639", zIndex: 10, width: "96px" }} />
                        </div>
                    ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
                            <div style={{ ...sectionCard, textAlign: "center", maxWidth: "420px", padding: "40px 32px" }}>
                                {!isOnline ? (
                                    <>
                                        <WifiOff size={40} style={{ color: GOLD, margin: "0 auto 16px" }} />
                                        <p style={{ ...eyebrow, textAlign: "center" }}>Offline</p>
                                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "10px" }}>You are offline</h3>
                                        <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px", lineHeight: 1.7 }}>This book is not saved for offline reading. Connect to the internet to read it.</p>
                                        <button onClick={handleCloseReader} style={{ ...navyBtn(false), width: "100%" }}><ArrowLeft size={14} /> Back to Library</button>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={40} style={{ color: "#ccc", margin: "0 auto 16px" }} />
                                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "10px" }}>{selectedBook.title}</h3>
                                        <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Document preview not available</p>
                                        <button onClick={() => handleDownload(selectedBook)} style={{ ...navyBtn(false), width: "100%" }}><Download size={14} /> Download PDF</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom toolbar */}
                <div style={{ background: "#fff", borderTop: `0.5px solid #e5ddd0`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <button onClick={() => setShowOverview(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: NAVY, fontSize: "12px", fontWeight: 700, fontFamily: "'Lato', sans-serif", letterSpacing: "0.05em" }}>
                            <FileText size={16} style={{ color: GOLD }} /> Overview
                        </button>
                        <button onClick={() => setShowRelatedModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: NAVY, fontSize: "12px", fontWeight: 700, fontFamily: "'Lato', sans-serif", letterSpacing: "0.05em" }}>
                            <BookOpen size={16} style={{ color: GOLD }} /> Related
                        </button>
                    </div>
                    <p style={{ fontSize: "11px", color: "#aaa" }}>{selectedBook.pages || 'N/A'} pages · {selectedBook.format || 'PDF'}</p>
                </div>

                {/* Overview panel */}
                {showOverview && (
                    <>
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40,  }} onClick={() => setShowOverview(false)} />
                        <div style={{ position: "fixed", inset: "0 0 0 auto", width: "380px", background: "#fff", zIndex: 50, overflowY: "auto", borderLeft: `0.5px solid #e5ddd0` }}>
                            <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
                                <div className="mt-40">
                                    <p style={{ ...eyebrow, marginBottom: "2px" }}>Book Info</p>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Overview</p>
                                </div>
                                <button onClick={() => setShowOverview(false)} style={{ background: "none", border: `0.5px solid rgba(255,255,255,0.2)`, padding: "6px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}><X size={15} /></button>
                            </div>
                            <div style={{ padding: "24px" }}>
                                <img src={selectedBook.image || selectedBook.coverImage} alt={selectedBook.title} style={{ width: "100%", height: "240px", objectFit: "cover", marginBottom: "16px", border: `0.5px solid #e5ddd0` }} />
                                <p style={eyebrow}>Title</p>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{selectedBook.title}</h3>
                                <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>By {selectedBook.author}</p>
                                {selectedBook.description && (
                                    <>
                                        <p style={eyebrow}>Description</p>
                                        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7, marginBottom: "16px" }}>{selectedBook.description}</p>
                                    </>
                                )}
                                <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.18)`, padding: "16px" }}>
                                    {[["Purchase Date", formatDate(selectedBook.purchaseDate)], ["Amount", `₦${selectedBook.amount?.toLocaleString() || 'N/A'}`], ["Transaction", selectedBook.transactionId || 'N/A'], ["Category", selectedBook.category || 'General'], ["Format", `${selectedBook.format || 'PDF'} · ${selectedBook.pages || 'N/A'} pages`]].map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                                            <span style={{ color: "#aaa" }}>{k}</span>
                                            <span style={{ fontWeight: 700, color: NAVY, textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Related modal */}
                {showRelatedModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
                        <div style={{ background: "#fff", width: "100%", maxWidth: "700px", maxHeight: "85vh", overflow: "hidden", border: `0.5px solid #e5ddd0` }}>
                            <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
                                <div>
                                    <p style={{ ...eyebrow, marginBottom: "2px" }}>Explore</p>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Related Documents</p>
                                </div>
                                <button onClick={() => setShowRelatedModal(false)} style={{ background: "none", border: `0.5px solid rgba(255,255,255,0.2)`, padding: "6px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}><X size={15} /></button>
                            </div>
                            <div style={{ overflowY: "auto", maxHeight: "calc(85vh - 70px)", padding: "20px" }}>
                                {getRelatedBooks(selectedBook).map(rb => (
                                    <div key={rb.id} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: "0.5px solid #f0ebe0" }}>
                                        <img src={rb.image} alt={rb.title} style={{ width: "80px", height: "110px", objectFit: "cover", flexShrink: 0, border: `0.5px solid #e5ddd0` }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{rb.title}</h4>
                                            <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>By {rb.author}</p>
                                            {isPurchased(rb.id) ? (
                                                <button onClick={() => { setShowRelatedModal(false); handleOpenBook(rb); }} style={{ ...navyBtn(false), width: "auto", padding: "8px 16px" }}><ExternalLink size={12} /> Open Book</button>
                                            ) : (
                                                <button onClick={() => router.push(`/payment?bookId=${rb.id}`)} style={{ ...navyBtn(false), width: "auto", padding: "8px 16px", background: GOLD, color: NAVY }}>Purchase · ₦{rb.price?.toLocaleString()}</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    /* ─── Library view ────────────────────────────────────── */
    const displayBooks = activeTab === 'offline' ? offlineBooks : filteredBooks;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-lib-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
                .book-card-hover { transition:box-shadow 0.2s; }
                .book-card-hover:hover { box-shadow:0 8px 32px rgba(13,34,68,0.12); }
                .lan-offline-btn:hover { background:#fff1f2 !important; color:#dc2626 !important; border-color:#fca5a5 !important; }
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
                .anim{animation:slideUp 0.4s cubic-bezier(.4,0,.2,1) both}
            `}</style>
            <div className="lan-lib-root">
                <Navbar />

                {/* Offline banner */}
                {!isOnline && !bannerDismissed && (
                    <div style={{ background: CREAM, borderBottom: `0.5px solid rgba(184,150,62,0.3)`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <WifiOff size={14} style={{ color: GOLD }} />
                            <span style={{ fontSize: "12px", color: NAVY, fontWeight: 700 }}>You are offline — only books saved to your device are available</span>
                        </div>
                        <button onClick={() => setBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}><X size={14} /></button>
                    </div>
                )}

                <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0" }}>

                    {/* Hero */}
                    <section style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "28px 28px,14px 14px", backgroundPosition: "0 0,7px 7px", padding: "40px 24px 0" }}>
                        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
                            <p style={{ ...eyebrow, color: GOLDD }}>LAN Library</p>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,5vw,46px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "6px 0 10px" }}>
                                My Books.<br /><em style={{ color: GOLD, fontStyle: "italic" }}>Your collection.</em>
                            </h1>
                            <p style={{ fontSize: "14px", color: "rgba(245,240,232,0.65)", maxWidth: "440px", lineHeight: 1.75, fontWeight: 300 }}>
                                Access all your purchased books. Save them offline for uninterrupted reading anywhere.
                            </p>
                            {/* Stat strip */}
                            <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)", marginTop: "28px", display: "flex", flexWrap: "wrap" }}>
                                {[[String(purchasedBooks.length), "Books Owned"], [String(offlineIds.size), "Saved Offline"], [isOnline ? "Online" : "Offline", "Status"], [formattedStorageSize || "0 KB", "Storage Used"]].map(([val, lbl]) => (
                                    <div key={lbl} style={{ flex: "1 1 100px", padding: "18px 16px", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#fff" }}>{val}</div>
                                        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: "3px" }}>{lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div style={{ padding: "28px 24px" }}>
                        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>

                            {/* Tab bar + online pill */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ display: "flex", background: "#fff", border: `0.5px solid #e5ddd0`, overflow: "hidden" }}>
                                    {[{ id: 'library', label: 'My Library', count: purchasedBooks.length, icon: <BookOpen size={12} /> }, { id: 'offline', label: 'Saved Offline', count: offlineIds.size, icon: <HardDrive size={12} /> }].map(t => (
                                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "11px 18px", border: "none", borderBottom: activeTab === t.id ? `2px solid ${NAVY}` : "2px solid transparent", background: activeTab === t.id ? CREAM : "transparent", color: activeTab === t.id ? NAVY : "#aaa", fontFamily: "'Lato', sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}>
                                            <span style={{ color: activeTab === t.id ? GOLD : "#ccc" }}>{t.icon}</span>
                                            {t.label}
                                            {t.count > 0 && <span style={{ background: activeTab === t.id ? NAVY : "#e5ddd0", color: activeTab === t.id ? "#fff" : "#888", fontSize: "9px", fontWeight: 700, padding: "1px 6px", minWidth: "20px", textAlign: "center" }}>{t.count}</span>}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, padding: "6px 12px", letterSpacing: "0.08em", textTransform: "uppercase", background: isOnline ? "rgba(22,163,74,0.06)" : "#fff1f2", color: isOnline ? "#16a34a" : "#dc2626", border: `0.5px solid ${isOnline ? "rgba(22,163,74,0.3)" : "#fca5a5"}` }}>
                                    {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                                    {isOnline ? "Online" : "Offline"}
                                </div>
                            </div>

                            {/* Search (library only) */}
                            {activeTab === 'library' && purchasedBooks.length > 0 && (
                                <div style={{ marginBottom: "20px", position: "relative" }}>
                                    <Search size={14} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                                    <input type="text" placeholder="Search by title, author or category…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        onFocus={() => setFocusSearch(true)} onBlur={() => setFocusSearch(false)}
                                        style={{ width: "100%", padding: "11px 13px 11px 36px", border: `0.5px solid ${focusSearch ? GOLD : "#e5ddd0"}`, background: "#fff", fontSize: "13px", color: NAVY, fontFamily: "'Lato', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s" }} />
                                    {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}><X size={14} /></button>}
                                </div>
                            )}

                            {/* Offline empty state */}
                            {activeTab === 'offline' && offlineBooks.length === 0 && (
                                <div style={{ ...sectionCard, textAlign: "center", padding: "60px 40px" }} className="anim">
                                    <div style={{ width: "56px", height: "56px", border: `0.5px solid #e5ddd0`, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                        <HardDrive size={24} style={{ color: "#ccc" }} />
                                    </div>
                                    <p style={eyebrow}>Offline Storage</p>
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, marginBottom: "10px" }}>No books saved offline</h3>
                                    <p style={{ fontSize: "13px", color: "#888", maxWidth: "360px", margin: "0 auto 20px", lineHeight: 1.7 }}>Tap "Save offline" on any book in your library to read without an internet connection.</p>
                                    <button onClick={() => setActiveTab('library')} style={{ ...navyBtn(false), width: "auto", margin: "0 auto" }}><BookOpen size={13} /> Go to My Library</button>
                                </div>
                            )}

                            {/* Library empty state */}
                            {activeTab === 'library' && purchasedBooks.length === 0 && (
                                <div style={{ ...sectionCard, textAlign: "center", padding: "60px 40px" }} className="anim">
                                    <div style={{ width: "56px", height: "56px", border: `0.5px solid #e5ddd0`, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                        <FileText size={24} style={{ color: "#ccc" }} />
                                    </div>
                                    <p style={eyebrow}>Empty Library</p>
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, marginBottom: "10px" }}>No books yet</h3>
                                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Browse our library to find your first book.</p>
                                    <Link href="/documents" style={{ ...navyBtn(false), width: "auto", margin: "0 auto", textDecoration: "none" }}>Browse Books <ArrowRight size={13} /></Link>
                                </div>
                            )}

                            {/* Book grid */}
                            {displayBooks.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }} className="anim">
                                    {displayBooks.map((book, idx) => {
                                        const saved = isBookOffline(book.id);
                                        const dlState = getDownloadState(book.id);
                                        return (
                                            <div key={book.id || book.transactionId || idx} style={{ background: "#fff", border: `0.5px solid #e5ddd0` }} className="book-card-hover">
                                                <div style={{ position: "relative" }}>
                                                    <img src={book.coverImage || book.image} alt={book.title} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block", borderBottom: `0.5px solid #e5ddd0` }}
                                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                                                    {/* Purchased badge */}
                                                    <div style={{ position: "absolute", top: "10px", right: "10px", background: NAVY, color: "#fff", fontSize: "8px", fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Purchased</div>
                                                    {/* Offline badge */}
                                                    {saved && (
                                                        <div style={{ position: "absolute", top: "10px", left: "10px", background: GOLD, color: NAVY, fontSize: "8px", fontWeight: 700, padding: "3px 8px", display: "flex", alignItems: "center", gap: "4px", letterSpacing: "0.08em" }}>
                                                            <HardDrive size={9} /> Offline
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ padding: "16px" }}>
                                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: 700, color: NAVY, marginBottom: "4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.title}</h3>
                                                    <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px" }}>{book.author}</p>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px", fontSize: "11px", color: "#666" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={11} style={{ color: GOLD }} /> {formatDate(book.purchaseDate)}</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><CreditCard size={11} style={{ color: GOLD }} /> ₦{book.amount?.toLocaleString() || book.price?.toLocaleString() || 'N/A'}</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FileText size={11} style={{ color: GOLD }} /> {book.pages || 'N/A'} pages · {book.format || 'PDF'}</div>
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <SaveOfflineButton book={book} isOffline={saved} downloadState={dlState} onSave={downloadForOffline} onRemove={removeOfflineBook} isOnline={isOnline} />
                                                    </div>
                                                    <button onClick={() => handleOpenBook(book)} style={{ ...navyBtn(false), width: "100%", background: saved && !isOnline ? GOLD : NAVY, color: saved && !isOnline ? NAVY : "#fff" }}>
                                                        <ExternalLink size={13} />
                                                        {saved && !isOnline ? 'Read Offline' : 'Read Book'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}