"use client"
// MyBooksClient.jsx — Updated with full offline reading support.
//
// New features layered on top of the original:
//  • "Save Offline" button on every book card (with download progress bar)
//  • "Offline" tab showing only saved books
//  • Online/offline status banner
//  • When offline: opens books from IndexedDB via pdf.js canvas renderer
//  • When online:  opens books from Google Drive/Firebase via iframe (unchanged)
//  • pdf.js reader: page navigation, zoom, resume from last page

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Globe, LogOut, User, ChevronDown, Download, Menu, FileText,
    Calendar, CreditCard, X, ExternalLink, ThumbsUp, Search, Lock,
    ArrowLeft, ZoomIn, ZoomOut, Maximize, WifiOff, Wifi, BookOpen,
    HardDrive, Trash2, ChevronLeft, ChevronRight
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

// ─── pdf.js is loaded dynamically to avoid SSR issues ────────────────────────
// We use the CDN build. Add to your _document.js or layout.jsx:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
// <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>

// ─── Offline PDF Reader Component ────────────────────────────────────────────

function OfflinePdfReader({ pdfObjectUrl, book, onClose }) {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.4);
    const [rendering, setRendering] = useState(false);
    const renderTaskRef = useRef(null);

    // ── Load PDF on mount ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!pdfObjectUrl || typeof window === 'undefined') return;

        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
            console.error('pdf.js not loaded. Add the CDN script to your layout.');
            return;
        }

        const loadPdf = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument(pdfObjectUrl);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);

                // Resume from last saved page
                const savedPage = await getReadProgress(String(book.id));
                setCurrentPage(Math.min(savedPage, pdf.numPages));
            } catch (err) {
                console.error('[OfflinePdfReader] Failed to load PDF:', err);
            }
        };

        loadPdf();
    }, [pdfObjectUrl, book.id]);

    // ── Render current page whenever page or scale changes ───────────────────
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderPage = async () => {
            // Cancel any in-flight render
            if (renderTaskRef.current) {
                try { await renderTaskRef.current.cancel(); } catch { }
            }

            setRendering(true);
            try {
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                if (!canvas) return;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const ctx = canvas.getContext('2d');
                const renderContext = { canvasContext: ctx, viewport };
                renderTaskRef.current = page.render(renderContext);
                await renderTaskRef.current.promise;
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('[OfflinePdfReader] Render error:', err);
                }
            } finally {
                setRendering(false);
            }
        };

        renderPage();
    }, [pdfDoc, currentPage, scale]);

    // ── Persist read progress whenever page changes ───────────────────────────
    useEffect(() => {
        if (currentPage > 0 && book?.id) {
            saveReadProgress(String(book.id), currentPage);
        }
    }, [currentPage, book?.id]);

    const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const zoomIn = () => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)));
    const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)));

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [totalPages]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />

            {/* ── Reader toolbar ───────────────────────────────────────────── */}
            <div className="bg-[#323639] text-white px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-30">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Back to Library</span>
                </button>

                <div className="flex-1 text-center px-4">
                    <p className="text-sm font-semibold truncate text-white">{book.title}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                        <WifiOff size={11} className="text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-medium">Reading offline</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded" title="Zoom out">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-gray-400 w-10 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded" title="Zoom in">
                        <ZoomIn size={16} />
                    </button>
                </div>
            </div>

            {/* ── Canvas area ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto bg-gray-200 flex flex-col items-center py-4 px-2">
                {!pdfDoc && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-950 mx-auto mb-3" />
                            <p className="text-gray-600 text-sm">Loading offline document...</p>
                        </div>
                    </div>
                )}

                <div className="relative shadow-2xl bg-white">
                    {rendering && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-950" />
                        </div>
                    )}
                    <canvas ref={canvasRef} className="block max-w-full" />
                </div>
            </div>

            {/* ── Page navigation bar ──────────────────────────────────────── */}
            <div className="bg-white border-t shadow-lg sticky bottom-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <button
                        onClick={goToPrev}
                        disabled={currentPage <= 1}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>

                    {/* Page progress indicator */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-gray-700 font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-950 rounded-full transition-all duration-300"
                                style={{ width: totalPages ? `${(currentPage / totalPages) * 100}%` : '0%' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={goToNext}
                        disabled={currentPage >= totalPages}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Save Offline Button ──────────────────────────────────────────────────────

function SaveOfflineButton({ book, isOffline: alreadySaved, downloadState, onSave, onRemove, isOnline }) {
    const { status, progress, error } = downloadState;

    if (alreadySaved) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(book.id); }}
                className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
                title="Remove from offline storage"
            >
                <HardDrive size={13} className="group-hover:hidden" />
                <Trash2 size={13} className="hidden group-hover:block" />
                <span className="group-hover:hidden">Saved offline</span>
                <span className="hidden group-hover:block">Remove</span>
            </button>
        );
    }

    if (status === 'downloading' || status === 'saving') {
        return (
            <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-1.5 text-xs text-blue-700">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-700 border-t-transparent" />
                    <span>{status === 'saving' ? 'Saving...' : `${progress}%`}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden w-full">
                    <div
                        className="h-full bg-blue-950 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    }

    if (status === 'done') {
        return (
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                <ThumbsUp size={13} />
                Saved!
            </span>
        );
    }

    if (status === 'error') {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onSave(book); }}
                className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title={error}
            >
                <Download size={13} />
                Retry
            </button>
        );
    }

    if (!isOnline) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <WifiOff size={13} />
                Need internet
            </span>
        );
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onSave(book); }}
            className="flex items-center gap-1.5 text-xs text-blue-800 border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
            <Download size={13} />
            Save offline
        </button>
    );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function MyBooksClient() {
    const router = useRouter();

    // ── Core state (unchanged from original) ──────────────────────────────────
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

    // ── New: offline state ─────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'offline'
    const [offlinePdfObjectUrl, setOfflinePdfObjectUrl] = useState(null); // blob: URL for pdf.js

    const {
        isOnline,
        offlineIds,
        offlineBooks,
        formattedStorageSize,
        downloadForOffline,
        removeOfflineBook,
        getOfflinePdfUrl,
        isBookOffline,
        getDownloadState,
    } = useOfflineBooks();

    // ── Offline banner dismissed state ────────────────────────────────────────
    const [bannerDismissed, setBannerDismissed] = useState(false);

    // ─── Helpers (unchanged) ──────────────────────────────────────────────────

    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[1] || match[2]}&sz=w400`;
        }
        const pdfSource = book.pdfUrl || book.pdfLink;
        if (pdfSource?.includes('drive.google.com')) {
            const match = pdfSource.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[1] || match[2]}&sz=w400`;
        }
        if (book.previewUrl) {
            const match = book.previewUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[1] || match[2]}&sz=w400`;
        }
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const extractFileId = (url) => {
        if (!url) return null;
        const match = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([^\&]+)/);
        return match ? (match[1] || match[2] || match[3]) : null;
    };

    // ─── Open book: smart routing between online iframe and offline pdf.js ────
    const handleOpenBook = async (book) => {
        setLoadingPdf(true);
        setSelectedBook(book);

        // ── OFFLINE PATH: load from IndexedDB → pdf.js ────────────────────────
        if (!isOnline || isBookOffline(book.id)) {
            if (isBookOffline(book.id)) {
                const objectUrl = await getOfflinePdfUrl(book.id);
                if (objectUrl) {
                    setOfflinePdfObjectUrl(objectUrl);
                    setLoadingPdf(false);
                    return;
                }
            }
            // Book not saved offline and we're offline
            if (!isOnline) {
                setLoadingPdf(false);
                setPdfUrl(null);
                setOfflinePdfObjectUrl(null);
                return;
            }
        }

        // ── ONLINE PATH: iframe (original behaviour) ──────────────────────────
        setOfflinePdfObjectUrl(null);

        let url = null;
        if (book.embedUrl) {
            url = book.embedUrl;
        } else if (book.driveFileId) {
            url = `https://drive.google.com/file/d/${book.driveFileId}/preview`;
        } else if (book.pdfUrl) {
            const fileId = extractFileId(book.pdfUrl);
            url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : book.pdfUrl;
        } else if (book.pdfLink) {
            const fileId = extractFileId(book.pdfLink);
            if (fileId) url = `https://drive.google.com/file/d/${fileId}/preview`;
        } else if (book.previewUrl) {
            const fileId = extractFileId(book.previewUrl);
            if (fileId) url = `https://drive.google.com/file/d/${fileId}/preview`;
        }

        setPdfUrl(url);
        setLoadingPdf(false);
        setShowOverview(false);
        setShowRelatedModal(false);
    };

    const handleCloseReader = () => {
        setSelectedBook(null);
        setPdfUrl(null);
        setOfflinePdfObjectUrl(null);
    };

    // ─── Fetch purchased books (unchanged) ────────────────────────────────────
    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const purchasedBooksMap = userData.purchasedBooks || {};
                const purchasedBooksArray = Object.values(purchasedBooksMap);

                const seenTransactions = new Set();
                const purchasedBooksFromDB = purchasedBooksArray.filter(book => {
                    if (book.transactionId) {
                        if (seenTransactions.has(book.transactionId)) return false;
                        seenTransactions.add(book.transactionId);
                        return true;
                    }
                    const bookId = book.bookId || book.firestoreId || book.id;
                    const cleanId = bookId?.toString().replace('firestore-', '');
                    if (seenTransactions.has(cleanId)) return false;
                    seenTransactions.add(cleanId);
                    return true;
                });

                const bookIds = new Set();
                purchasedBooksFromDB.forEach(book => {
                    if (book.id) bookIds.add(book.id);
                    if (book.bookId) bookIds.add(book.bookId);
                    if (book.firestoreId) bookIds.add(book.firestoreId);
                });
                setPurchasedBookIds(bookIds);

                const enrichedBooks = await Promise.all(purchasedBooksFromDB.map(async (purchasedBook) => {
                    const bookId = purchasedBook.bookId || purchasedBook.firestoreId || purchasedBook.id;
                    let bookData = booksData.find(b =>
                        b.id === bookId ||
                        b.id === parseInt(bookId) ||
                        b.id === bookId?.toString().replace('firestore-', '')
                    );

                    if (!bookData && bookId) {
                        try {
                            const cleanId = bookId.toString().replace('firestore-', '');
                            const bookDocRef = doc(db, 'advertMyBook', cleanId);
                            const bookDoc = await getDoc(bookDocRef);
                            if (bookDoc.exists()) {
                                const fbBook = bookDoc.data();
                                bookData = {
                                    id: bookId,
                                    title: fbBook.bookTitle || fbBook.title,
                                    author: fbBook.author,
                                    pages: fbBook.pages,
                                    format: fbBook.format || 'PDF',
                                    category: fbBook.category,
                                    description: fbBook.description,
                                    pdfUrl: fbBook.pdfUrl || fbBook.pdfLink,
                                    driveFileId: fbBook.driveFileId,
                                    embedUrl: fbBook.embedUrl,
                                    previewUrl: fbBook.previewUrl,
                                    coverImage: fbBook.coverImage,
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching book from Firebase:', error);
                        }
                    }

                    if (bookData) {
                        return {
                            ...bookData,
                            image: getThumbnailUrl(bookData),
                            purchaseDate: purchasedBook.purchaseDate,
                            transactionId: purchasedBook.transactionId,
                            amount: purchasedBook.amount || bookData.price,
                            sellerId: purchasedBook.sellerId,
                            sellerName: purchasedBook.sellerName,
                        };
                    }

                    return {
                        id: bookId,
                        title: purchasedBook.title,
                        author: purchasedBook.author,
                        image: getThumbnailUrl(purchasedBook),
                        pdfUrl: purchasedBook.pdfUrl,
                        embedUrl: purchasedBook.embedUrl,
                        driveFileId: purchasedBook.driveFileId,
                        purchaseDate: purchasedBook.purchaseDate,
                        transactionId: purchasedBook.transactionId,
                        amount: purchasedBook.amount,
                        format: 'PDF',
                        sellerId: purchasedBook.sellerId,
                        sellerName: purchasedBook.sellerName,
                    };
                }));

                setPurchasedBooks(enrichedBooks);
            } else {
                setPurchasedBooks([]);
            }
        } catch (error) {
            console.error('Error fetching purchased books:', error);
            setPurchasedBooks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchPurchasedBooks(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const filteredBooks = purchasedBooks.filter(book => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            book.title?.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q) ||
            book.category?.toLowerCase().includes(q) ||
            book.description?.toLowerCase().includes(q)
        );
    });

    const getRelatedBooks = (book) =>
        booksData.filter(b => b.category === book.category && b.id !== book.id).slice(0, 10);

    const isPurchased = (bookId) =>
        purchasedBookIds.has(bookId) ||
        purchasedBookIds.has(bookId.toString()) ||
        purchasedBookIds.has(`firestore-${bookId}`);

    const handlePurchaseRelatedBook = (book) => router.push(`/payment?bookId=${book.id}`);

    const handleDownload = (book) => {
        let fileId = book.driveFileId || extractFileId(book.pdfUrl) || extractFileId(book.pdfLink);
        if (fileId) {
            window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
        } else if (book.pdfUrl) {
            window.open(book.pdfUrl, '_blank');
        } else {
            alert(`Download link for ${book.title} will be sent to ${user?.email}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // ─── Loading state (unchanged) ────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="relative w-20 h-24 perspective-1000">
                    <div className="book-flip-container">
                        <div className="book-face book-front">
                            <div className="w-full h-full bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 rounded-r-lg shadow-2xl relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30"></div>
                                <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-white/20"></div>
                                <div className="absolute right-1 top-2 bottom-2 w-0.5 bg-white/15"></div>
                                <div className="absolute right-2 top-3 bottom-3 w-0.5 bg-white/10"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
                            </div>
                        </div>
                        <div className="book-face book-back">
                            <div className="w-full h-full bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden">
                                <div className="flex gap-0.5 text-white font-black text-2xl">
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0s' }}>L</span>
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0.15s' }}>A</span>
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0.3s' }}>N</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent"></div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-950 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-800 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <style jsx>{`
                        .perspective-1000 { perspective: 1000px; }
                        .book-flip-container { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; animation: bookFlip 3s ease-in-out infinite; }
                        .book-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                        .book-front { z-index: 2; }
                        .book-back { transform: rotateY(180deg); }
                        @keyframes bookFlip { 0%, 100% { transform: rotateY(0deg); } 25%, 75% { transform: rotateY(180deg); } }
                        @keyframes lan-letter { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.1); } }
                        .lan-letter { animation: lan-letter 0.6s ease-in-out infinite; }
                    `}</style>
                </div>
            </div>
        );
    }

    // ─── Offline PDF Reader ───────────────────────────────────────────────────
    if (selectedBook && offlinePdfObjectUrl) {
        return (
            <OfflinePdfReader
                pdfObjectUrl={offlinePdfObjectUrl}
                book={selectedBook}
                onClose={handleCloseReader}
            />
        );
    }

    // ─── Online iframe Reader (original, unchanged) ───────────────────────────
    if (selectedBook) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Navbar />
                <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={handleCloseReader}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Library</span>
                    </button>
                    {/* Save offline button in reader bar */}
                    {isOnline && (
                        <div className="flex items-center gap-3">
                            <SaveOfflineButton
                                book={selectedBook}
                                isOffline={isBookOffline(selectedBook.id)}
                                downloadState={getDownloadState(selectedBook.id)}
                                onSave={downloadForOffline}
                                onRemove={removeOfflineBook}
                                isOnline={isOnline}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-white relative">
                    {loadingPdf ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading document...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <div className="w-full h-full relative overflow-hidden">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full border-0"
                                title={selectedBook.title}
                                style={{ minHeight: 'calc(100vh - 200px)', backgroundColor: 'white' }}
                                allow="autoplay"
                            />
                            <div
                                className="absolute top-0 right-0 h-[56px] bg-[#323639] z-10 hidden md:flex items-center justify-end px-5 gap-3 select-none border-b border-white/5"
                                style={{ width: '220px' }}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <div className="flex flex-col items-end leading-tight">
                                    <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">LAN Library</span>
                                    <span className="text-gray-400 text-[9px] font-mono">
                                        ID: {user?.uid?.substring(0, 8).toUpperCase() || 'USER-AUTH'}
                                    </span>
                                </div>
                                <div className="h-6 w-[1px] bg-gray-600/50 mx-1" />
                                <Lock size={16} className="text-gray-400" />
                            </div>
                            <div
                                className="absolute top-0 right-0 h-15 bg-[#323639] z-10 md:hidden flex items-center justify-end px-4 select-none"
                                style={{ width: '120px' }}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <span className="text-gray-400 text-[9px] mr-2 font-bold uppercase">LAN Lib's</span>
                            </div>
                            <div className="absolute bottom-0 right-0 h-8 bg-[#323639] z-10 w-24 hidden md:block" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                                {!isOnline ? (
                                    <>
                                        <WifiOff className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">You are offline</h3>
                                        <p className="text-gray-600 mb-4">
                                            This book is not saved for offline reading.<br />
                                            Connect to the internet and tap "Save offline" to read it anywhere.
                                        </p>
                                        <button
                                            onClick={handleCloseReader}
                                            className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={20} />
                                            Back to Library
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                        <p className="text-gray-600 mb-4">Document preview not available</p>
                                        <button
                                            onClick={() => handleDownload(selectedBook)}
                                            className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2"
                                        >
                                            <Download size={20} />
                                            Download PDF
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white border-t shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setShowOverview(true)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                                <FileText size={20} />
                                <span className="font-medium hidden md:inline">Overview</span>
                            </button>
                            <button onClick={() => setShowRelatedModal(true)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                                <FileText size={20} />
                                <span className="font-medium hidden md:inline">Related documents</span>
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{selectedBook.pages || 'N/A'}</span> pages • {selectedBook.format || 'PDF'}
                        </div>
                    </div>
                </div>

                {/* Overview panel (unchanged) */}
                {showOverview && (
                    <>
                        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOverview(false)} />
                        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                                    <button onClick={() => setShowOverview(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                                </div>
                                <img src={selectedBook.image || selectedBook.coverImage} alt={selectedBook.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">By <span className="underline">{selectedBook.author}</span></p>
                                {selectedBook.description && (
                                    <><h3 className="font-bold mb-2 text-gray-900">Description</h3><p className="text-sm text-gray-600 mb-6">{selectedBook.description}</p></>
                                )}
                                <h3 className="font-bold mb-2 text-gray-900">Purchase Details</h3>
                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <p>Date: {formatDate(selectedBook.purchaseDate)}</p>
                                    <p>Amount: ₦ {selectedBook.amount?.toLocaleString() || 'N/A'}</p>
                                    <p>Transaction: {selectedBook.transactionId || 'N/A'}</p>
                                </div>
                                <h3 className="font-bold mb-2 text-gray-900">Category</h3>
                                <p className="text-sm text-gray-600 mb-6">{selectedBook.category || 'General'}</p>
                                <h3 className="font-bold mb-2 text-gray-900">Format</h3>
                                <p className="text-sm text-gray-600">{selectedBook.format || 'PDF'} • {selectedBook.pages || 'N/A'} pages</p>
                            </div>
                        </div>
                    </>
                )}

                {/* Related modal (unchanged) */}
                {showRelatedModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Related Documents</h2>
                                <button onClick={() => setShowRelatedModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                <div className="space-y-4">
                                    {getRelatedBooks(selectedBook).length > 0 ? getRelatedBooks(selectedBook).map((relatedBook) => (
                                        <div key={relatedBook.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="relative flex-shrink-0">
                                                <img src={relatedBook.image} alt={relatedBook.title} className="w-24 h-32 object-cover rounded shadow-md" />
                                                {isPurchased(relatedBook.id) && (
                                                    <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">Owned</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-base mb-2 text-gray-900">{relatedBook.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">By {relatedBook.author}</p>
                                                {isPurchased(relatedBook.id) ? (
                                                    <button onClick={() => { setShowRelatedModal(false); handleOpenBook(relatedBook); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold">
                                                        <ExternalLink size={16} className="inline mr-2" />Open Book
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handlePurchaseRelatedBook(relatedBook)} className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 text-sm font-semibold">
                                                        Purchase - ₦{relatedBook.price?.toLocaleString()}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                            <p>No related documents found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Library / Offline tab view ───────────────────────────────────────────
    const displayBooks = activeTab === 'offline' ? offlineBooks : filteredBooks;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── Offline banner ─────────────────────────────────────────────── */}
            {!isOnline && !bannerDismissed && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 text-sm">
                        <WifiOff size={16} className="flex-shrink-0" />
                        <span>You are offline — only books saved to your device are available</span>
                    </div>
                    <button onClick={() => setBannerDismissed(true)} className="text-amber-600 hover:text-amber-800">
                        <X size={16} />
                    </button>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-8">

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-3xl font-bold text-gray-900">My Books</h2>
                        {/* Online/offline pill */}
                        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <p className="text-gray-600">
                        {purchasedBooks.length} {purchasedBooks.length === 1 ? 'book' : 'books'} purchased
                        {offlineIds.size > 0 && (
                            <span className="ml-2 text-green-700">• {offlineIds.size} saved offline ({formattedStorageSize})</span>
                        )}
                    </p>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────────── */}
                <div className="flex gap-0 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'library' ? 'border-blue-950 text-blue-950' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2">
                            <BookOpen size={16} />
                            My Library
                            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{purchasedBooks.length}</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('offline')}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'offline' ? 'border-blue-950 text-blue-950' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2">
                            <HardDrive size={16} />
                            Saved Offline
                            {offlineIds.size > 0 && (
                                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{offlineIds.size}</span>
                            )}
                        </span>
                    </button>
                </div>

                {/* ── Search (library tab only) ────────────────────────────────── */}
                {activeTab === 'library' && purchasedBooks.length > 0 && (
                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by title, author, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-blue-950 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Offline tab empty state ──────────────────────────────────── */}
                {activeTab === 'offline' && offlineBooks.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                        <HardDrive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No books saved offline</h3>
                        <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                            Tap "Save offline" on any book in your library to read it without an internet connection — perfect for low-data situations.
                        </p>
                        <button
                            onClick={() => setActiveTab('library')}
                            className="inline-flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-lg hover:bg-blue-900 transition-colors text-sm font-medium"
                        >
                            <BookOpen size={16} />
                            Go to My Library
                        </button>
                    </div>
                )}

                {/* ── Library empty state ──────────────────────────────────────── */}
                {activeTab === 'library' && purchasedBooks.length === 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Books Yet</h3>
                        <p className="text-gray-600 mb-6">
                            You haven't purchased any books yet. Browse our library to get started!
                        </p>
                        <Link href="/documents" className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors">
                            Browse Books
                        </Link>
                    </div>
                )}

                {/* ── Book grid ────────────────────────────────────────────────── */}
                {displayBooks.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {displayBooks.map((book, index) => {
                            const saved = isBookOffline(book.id);
                            const dlState = getDownloadState(book.id);

                            return (
                                <div
                                    key={book.id || book.transactionId || index}
                                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                    <div className="relative">
                                        <img
                                            src={book.coverImage || book.image}
                                            alt={book.title}
                                            className="w-full h-40 md:h-64 object-cover"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                        />
                                        <span className="absolute top-3 right-3 bg-blue-950 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            Purchased
                                        </span>
                                        {saved && (
                                            <span className="absolute top-3 left-3 bg-green-700 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                <HardDrive size={10} />
                                                Offline
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-3 md:p-6">
                                        <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">{book.author}</p>

                                        <div className="hidden md:block space-y-2 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar size={16} />
                                                <span>Purchased: {formatDate(book.purchaseDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CreditCard size={16} />
                                                <span>₦ {book.amount?.toLocaleString() || book.price?.toLocaleString() || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FileText size={16} />
                                                <span>{book.pages || 'N/A'} pages • {book.format || 'PDF'}</span>
                                            </div>
                                        </div>

                                        {/* Save offline button */}
                                        <div className="mb-3">
                                            <SaveOfflineButton
                                                book={book}
                                                isOffline={saved}
                                                downloadState={dlState}
                                                onSave={downloadForOffline}
                                                onRemove={removeOfflineBook}
                                                isOnline={isOnline}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleOpenBook(book)}
                                            className="w-full bg-blue-950 text-white py-2 md:py-3 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-semibold text-xs md:text-base"
                                        >
                                            <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                                            <span className="hidden md:inline">
                                                {saved && !isOnline ? 'Read Offline' : 'Read Book'}
                                            </span>
                                            <span className="md:hidden">Read</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}