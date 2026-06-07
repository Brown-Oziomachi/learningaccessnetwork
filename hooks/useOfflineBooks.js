// hooks/useOfflineBooks.js
// Encapsulates every piece of offline logic so MyBooksClient stays clean.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    saveBookOffline,
    getOfflineBook,
    getAllOfflineBooks,
    getOfflineBookIds,
    deleteOfflineBook,
    getTotalStorageBytes,
} from '@/lib/offlineDB';

const CRYPTO_KEY = 0x5A;

/**
 * @typedef {Object} DownloadState
 * @property {'idle'|'downloading'|'saving'|'done'|'error'} status
 * @property {number} progress   0–100
 * @property {string} [error]
 */

function getPdfProxyUrl(book) {
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
        return imageUrl;
    }
}

export function useOfflineBooks() {
    const [isOnline, setIsOnline] = useState(true);
    const [offlineIds, setOfflineIds] = useState(new Set());
    const [offlineBooks, setOfflineBooks] = useState([]);
    const [downloadStates, setDownloadStates] = useState({});
    const [totalStorageBytes, setTotalStorageBytes] = useState(0);
    const objectUrlsRef = useRef([]);

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

    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
        };
    }, []);

    const refreshOfflineData = useCallback(async () => {
        try {
            const [ids, books, bytes] = await Promise.all([
                getOfflineBookIds(),
                getAllOfflineBooks(),
                getTotalStorageBytes(),
            ]);
            setOfflineIds(ids);
            setOfflineBooks(books.map(({ pdfBlob, ...meta }) => meta));
            setTotalStorageBytes(bytes);
        } catch (err) {
            console.error('[useOfflineBooks] refreshOfflineData error', err);
        }
    }, []);

    useEffect(() => {
        refreshOfflineData();
    }, [refreshOfflineData]);

    // ── Save a book offline (With Direct Uint8Array Storage) ─────────────────
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
                    const progress = Math.round((receivedBytes / totalBytes) * 85);
                    setDownloadStates(prev => ({
                        ...prev,
                        [bookId]: { status: 'downloading', progress },
                    }));
                }
            }

            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'saving', progress: 88 },
            }));

            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const completeUint8Array = new Uint8Array(totalLength);

            let offset = 0;
            for (const chunk of chunks) {
                completeUint8Array.set(chunk, offset);
                offset += chunk.length;
            }

            // XOR Cryptography: Scramble array contents
            for (let i = 0; i < completeUint8Array.length; i++) {
                completeUint8Array[i] = completeUint8Array[i] ^ CRYPTO_KEY;
            }

            const coverDataUrl = await fetchCoverAsDataUrl(book.image || book.coverImage);

            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'saving', progress: 95 },
            }));

            // FIXED: Pass the completeUint8Array directly instead of .buffer reference.
            // This guarantees Dexie clones the exact byte values without memory drops.
            await saveBookOffline({
                id: bookId,
                title: book.title,
                author: book.author,
                category: book.category,
                format: book.format || 'PDF',
                pages: book.pages,
                coverImage: coverDataUrl,
                pdfBlob: completeUint8Array,
                sizeBytes: completeUint8Array.byteLength,
                purchaseDate: book.purchaseDate,
                transactionId: book.transactionId,
                amount: book.amount,
            });

            setDownloadStates(prev => ({
                ...prev,
                [bookId]: { status: 'done', progress: 100 },
            }));

            await refreshOfflineData();

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

    const removeOfflineBook = useCallback(async (bookId) => {
        await deleteOfflineBook(String(bookId));
        await refreshOfflineData();
    }, [refreshOfflineData]);

    // ── Load a PDF buffer from IndexedDB and Decrypt It on the Fly ───────────
    const getOfflinePdfUrl = useCallback(async (bookId) => {
        const record = await getOfflineBook(String(bookId));
        if (!record?.pdfBlob) return null;

        // FIXED: Since it's stored directly as a Uint8Array, we instantiate a clean copy 
        // to operate on so we don't mutate the database record cache directly.
        const targetBytes = new Uint8Array(record.pdfBlob);

        // Reverse the XOR encryption operation directly inside temporary execution RAM
        for (let i = 0; i < targetBytes.length; i++) {
            targetBytes[i] = targetBytes[i] ^ CRYPTO_KEY;
        }

        const decryptedBlob = new Blob([targetBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(decryptedBlob);
        objectUrlsRef.current.push(url);
        return url;
    }, []);

    const isBookOffline = useCallback(
        (bookId) => offlineIds.has(String(bookId)),
        [offlineIds]
    );

    const getDownloadState = useCallback(
        (bookId) => downloadStates[String(bookId)] ?? { status: 'idle', progress: 0 },
        [downloadStates]
    );

    const formattedStorageSize = (() => {
        if (totalStorageBytes < 1024) return `${totalStorageBytes} B`;
        if (totalStorageBytes < 1024 * 1024) return `${(totalStorageBytes / 1024).toFixed(1)} KB`;
        return `${(totalStorageBytes / (1024 * 1024)).toFixed(1)} MB`;
    })();

    return {
        isOnline,
        offlineIds,
        offlineBooks,
        formattedStorageSize,
        downloadForOffline,
        removeOfflineBook,
        getOfflinePdfUrl,
        isBookOffline,
        getDownloadState,
        refreshOfflineData,
    };
}