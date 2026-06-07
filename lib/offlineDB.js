// lib/offlineDB.js
//   offlineBooks  — stores the raw encrypted PDF Uint8Array + book metadata
//   readProgress  — stores per-book page number so readers resume where they left off

import Dexie from 'dexie';

const db = new Dexie('LANLibraryDB');

db.version(1).stores({
    // Primary key: id (the book's Firestore / booksData id)
    // Indexed fields: savedAt (for sorting), title (for search)
    offlineBooks: 'id, savedAt, title',

    // Primary key: bookId
    readProgress: 'bookId',
});

// ─── Type Definitions (JSDoc) ────────────────────────────────────────────────

/**
 * @typedef {Object} OfflineBookRecord
 * @property {string}  id          - Unique book identifier
 * @property {string}  title
 * @property {string}  author
 * @property {string}  category
 * @property {string}  format
 * @property {number}  pages
 * @property {string}  coverImage  - Data URL or object URL of the cover thumbnail
 * @property {Uint8Array} pdfBlob  - The encrypted PDF bytes stored cleanly as a Uint8Array
 * @property {Date}    savedAt
 * @property {number}  sizeBytes   - Raw byte size for UI display
 */

/**
 * @typedef {Object} ReadProgressRecord
 * @property {string}  bookId
 * @property {number}  currentPage  - Last page the user was on (1-indexed)
 * @property {Date}    updatedAt
 */

// ─── offlineBooks helpers ────────────────────────────────────────────────────

/**
 * Save a book and its encrypted PDF Uint8Array to IndexedDB.
 * Overwrites any existing record with the same id.
 * @param {OfflineBookRecord} record
 */
export async function saveBookOffline(record) {
    await db.offlineBooks.put({
        ...record,
        savedAt: new Date(),
    });
}

/**
 * Load a single offline book record (including the encrypted PDF Uint8Array).
 * Returns null if not found.
 * @param {string} bookId
 * @returns {Promise<OfflineBookRecord|null>}
 */
export async function getOfflineBook(bookId) {
    return (await db.offlineBooks.get(bookId)) ?? null;
}

/**
 * Returns all saved offline books, sorted newest-first.
 * SURGICALLY excludes the heavy pdfBlob using a safe local array mapping filter 
 * to prevent browser UI freezing or lag.
 * @returns {Promise<Omit<OfflineBookRecord, 'pdfBlob'>[]>}
 */
export async function getAllOfflineBooks() {
    const records = await db.offlineBooks
        .orderBy('savedAt')
        .reverse()
        .toArray();

    return records.map(record => {
        const { pdfBlob, ...metaOnly } = record;
        return metaOnly;
    });
}

/**
 * Returns a Set of all saved book IDs — fast O(1) lookup for badge rendering.
 * @returns {Promise<Set<string>>}
 */
export async function getOfflineBookIds() {
    const keys = await db.offlineBooks.toCollection().primaryKeys();
    return new Set(keys.map(String));
}

/**
 * Remove a book from offline storage.
 * @param {string} bookId
 */
export async function deleteOfflineBook(bookId) {
    await db.offlineBooks.delete(bookId);
}

/**
 * Total bytes used by all stored PDFs — for the storage info panel.
 * @returns {Promise<number>}
 */
export async function getTotalStorageBytes() {
    const books = await db.offlineBooks.toArray();
    return books.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
}

// ─── readProgress helpers ────────────────────────────────────────────────────

/**
 * Persist the current page so the reader can resume on next open.
 * @param {string} bookId
 * @param {number} page  1-indexed
 */
export async function saveReadProgress(bookId, page) {
    await db.readProgress.put({ bookId, currentPage: page, updatedAt: new Date() });
}

/**
 * @param {string} bookId
 * @returns {Promise<number>} 1-indexed page number, defaults to 1
 */
export async function getReadProgress(bookId) {
    const record = await db.readProgress.get(bookId);
    return record?.currentPage ?? 1;
}

export default db;