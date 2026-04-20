// hooks/useOfflineBooks.js
// Encapsulates every piece of offline logic so MyBooksClient stays clean.
//
// Responsibilities:
//  1. Track which books are saved offline (offlineIds Set)
//  2. Download a PDF through the proxy and save it to IndexedDB
//  3. Load a saved PDF blob and build an object URL for pdf.js
//  4. Delete a book from offline storage
//  5. Track online/offline state reactively
//  6. Report storage usage

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    saveBookOffline,
    getOfflineBook,
    getAllOfflineBooks,
    getOfflineBookIds,
    deleteOfflineBook,
    getTotalStorageBytes,
} from '@/lib/offlineDB';

/**
 * @typedef {Object} DownloadState
 * @property {'idle'|'downloading'|'saving'|'done'|'error'} status
 * @property {number} progress   0–100
 * @property {string} [error]
 */

/**
 * Convert a Google Drive or Firebase Storage URL into a URL that can be
 * fetched from the browser without CORS issues, via our /api/fetch-pdf proxy.
 *
 * @param {Object} book
 * @returns {string|null}
 */
function getPdfProxyUrl(book) {
    // Prefer embedUrl or driveFileId (Google Drive)
    let originalUrl = null;

    if (book.driveFileId) {
        originalUrl = `https://drive.google.com/uc?export=download&id=${book.driveFileId}&confirm=1`;
    } else if (book.embedUrl) {
        originalUrl = book.embedUrl;
    } else if (book.pdfUrl) {
        originalUrl = book.pdfUrl;
    } else if (book.pdfLink) {
        originalUrl = book.pdfLink;
    }

    if (!originalUrl) return null;
    return `/api/fetch-pdf?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Fetch the cover image and return it as a base64 data URL so it works offline.
 * Falls back gracefully if the image is unavailable.
 * @param {string} imageUrl
 * @returns {Promise<string>}
 */
async function fetchCoverAsDataUrl(imageUrl) {
    if (!imageUrl) return '';
    try {
        const res = await fetch(`/api/fetch-pdf?url=${encodeURIComponent(imageUrl)}`);
        if (!res.ok) throw new Error('cover fetch failed');
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return imageUrl; // fall back to the original URL
    }
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useOfflineBooks() {
    const [isOnline, setIsOnline] = useState(true);
    const [offlineIds, setOfflineIds] = useState(new Set());
    const [offlineBooks, setOfflineBooks] = useState([]);
    const [downloadStates, setDownloadStates] = useState({});  // bookId → DownloadState
    const [totalStorageBytes, setTotalStorageBytes] = useState(0);

    // Track active object URLs so we can revoke them on unmount (memory leak prevention)
    const objectUrlsRef = useRef([]);

    // ── Online/offline detection ───────────────────────────────────────────
    useEffect(() => {
        setIsOnline(navigator.onLine);

        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // ── Revoke object URLs on unmount ────────────────────────────────────────
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
        };
    }, []);

    // ── Initial load from IndexedDB ──────────────────────────────────────────
    const refreshOfflineData = useCallback(async () => {
        try {
            const [ids, books, bytes] = await Promise.all([
                getOfflineBookIds(),
                getAllOfflineBooks(),
                getTotalStorageBytes(),
            ]);
            setOfflineIds(ids);
            // Strip the heavy pdfBlob from the list view records
            setOfflineBooks(books.map(({ pdfBlob, ...meta }) => meta));
            setTotalStorageBytes(bytes);
        } catch (err) {
            console.error('[useOfflineBooks] refreshOfflineData error', err);
        }
    }, []);

    useEffect(() => {
        refreshOfflineData();
    }, [refreshOfflineData]);

    // ── Save a book offline ──────────────────────────────────────────────────
    const downloadForOffline = useCallback(async (book) => {
        const bookId = String(book.id);
        const proxyUrl = getPdfProxyUrl(book);

        if (!proxyUrl) {
            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'error', progress: 0, error: 'No PDF source found for this book.' },
            }));
            return;
        }

        setDownloadStates(prev => ({
            ...prev,
            [bookId]: { status: 'downloading', progress: 0 },
        }));

        try {
            // ── Step 1: Fetch PDF via proxy with progress tracking ────────────
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('Content-Length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
            const reader = response.body.getReader();
            const chunks = [];
            let receivedBytes = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedBytes += value.length;

                if (totalBytes) {
                    const progress = Math.round((receivedBytes / totalBytes) * 85); // cap at 85 — saving takes last 15
                    setDownloadStates(prev => ({
                        ...prev,
                        [bookId]: { status: 'downloading', progress },
                    }));
                }
            }

            // ── Step 2: Assemble the Uint8Array into a Blob ───────────────────
            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'saving', progress: 88 },
            }));

            const pdfBlob = new Blob(chunks, { type: 'application/pdf' });

            // ── Step 3: Fetch the cover as a data URL ─────────────────────────
            const coverDataUrl = await fetchCoverAsDataUrl(book.image || book.coverImage);

            // ── Step 4: Write to IndexedDB ────────────────────────────────────
            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'saving', progress: 95 },
            }));

            await saveBookOffline({
                id: bookId,
                title: book.title,
                author: book.author,
                category: book.category,
                format: book.format || 'PDF',
                pages: book.pages,
                coverImage: coverDataUrl,
                pdfBlob,
                sizeBytes: pdfBlob.size,
                purchaseDate: book.purchaseDate,
                transactionId: book.transactionId,
                amount: book.amount,
            });

            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'done', progress: 100 },
            }));

            await refreshOfflineData();

            // Auto-reset the done state after 3 seconds
            setTimeout(() => {
                setDownloadStates(prev => ({
                    ...prev,
                    [bookId]: { status: 'idle', progress: 0 },
                }));
            }, 3000);

        } catch (err) {
            console.error(`[useOfflineBooks] downloadForOffline error for ${bookId}:`, err);
            setDownloadStates(prev => ({
                ...prev,
                [bookId]: {
                    status: 'error',
                    progress: 0,
                    error: err.message || 'Download failed. Please try again.',
                },
            }));
        }
    }, [refreshOfflineData]);

    // ── Remove a book from offline storage ───────────────────────────────────
    const removeOfflineBook = useCallback(async (bookId) => {
        await deleteOfflineBook(String(bookId));
        await refreshOfflineData();
    }, [refreshOfflineData]);

    // ── Load a PDF blob from IndexedDB and return an object URL ──────────────
    // Returns null if the book is not saved offline.
    const getOfflinePdfUrl = useCallback(async (bookId) => {
        const record = await getOfflineBook(String(bookId));
        if (!record?.pdfBlob) return null;

        const url = URL.createObjectURL(record.pdfBlob);
        objectUrlsRef.current.push(url); // track for cleanup
        return url;
    }, []);

    // ── Convenience checkers ──────────────────────────────────────────────────
    const isBookOffline = useCallback(
        (bookId) => offlineIds.has(String(bookId)),
        [offlineIds]
    );

    const getDownloadState = useCallback(
        (bookId) => downloadStates[String(bookId)] ?? { status: 'idle', progress: 0 },
        [downloadStates]
    );

    // ── Formatted storage size ────────────────────────────────────────────────
    const formattedStorageSize = (() => {
        if (totalStorageBytes < 1024) return `${totalStorageBytes} B`;
        if (totalStorageBytes < 1024 * 1024) return `${(totalStorageBytes / 1024).toFixed(1)} KB`;
        return `${(totalStorageBytes / (1024 * 1024)).toFixed(1)} MB`;
    })();

    return {
        // State
        isOnline,
        offlineIds,
        offlineBooks,           // metadata only (no blob) — for the Offline tab grid
        formattedStorageSize,

        // Actions
        downloadForOffline,
        removeOfflineBook,
        getOfflinePdfUrl,       // async — call when opening a book

        // Per-book helpers
        isBookOffline,
        getDownloadState,

        // Refresh (call after any external data change)
        refreshOfflineData,
    };
}