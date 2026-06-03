import { adminDb } from "./firebase-admin";

/**
 * Fetches authoritative book details from Firestore by bookId.
 * Handles both plain IDs and "firestore-" prefixed IDs.
 *
 * @param {string} bookId
 * @returns {Promise<object|null>} book data or null if not found
 */
export async function serverFetchBookDetails(bookId) {
    if (!bookId) return null;

    // Strip "firestore-" prefix if present
    const cleanId = bookId.startsWith('firestore-')
        ? bookId.replace('firestore-', '')
        : bookId;

    try {
        const docSnap = await adminDb.collection('books').doc(cleanId).get();

        if (!docSnap.exists) {
            console.error(`serverFetchBookDetails: No book found for ID "${cleanId}"`);
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('serverFetchBookDetails: Firestore read failed:', error.message);
        return null;
    }
}