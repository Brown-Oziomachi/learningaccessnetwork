// /utils/bookUtils.js
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { booksData } from "@/lib/booksData";

/**
 * Fetch book details from either booksData or Firestore
 * @param {string|number} bookId - The book ID to fetch
 * @returns {Object|null} - Book data or null if not found
 */
export async function fetchBookDetails(bookId) {
    try {
        console.log('Fetching book with ID:', bookId, 'Type:', typeof bookId);

        // Clean the bookId - remove 'firestore-' prefix if present for local search
        let cleanId = bookId;
        if (String(bookId).startsWith('firestore-')) {
            cleanId = String(bookId).replace('firestore-', '');
            console.log('Cleaned ID from firestore prefix:', cleanId);
        }

        // First, check local booksData array with both original and cleaned ID
        const localBook = booksData.find(b =>
            b.id === bookId ||
            b.id === parseInt(bookId) ||
            b.id === String(bookId) ||
            b.id === cleanId ||
            b.id === parseInt(cleanId) ||
            b.id === String(cleanId)
        );

        if (localBook) {
            console.log('Found book in booksData:', localBook.title);
            return {
                ...localBook,
                source: 'platform',
                // Ensure all required fields are present
                image: localBook.image || localBook.coverImage,
                coverImage: localBook.coverImage || localBook.image,
            };
        }

        // If not found locally, check Firestore
        // Handle Firestore IDs (both with and without 'firestore-' prefix)
        let firestoreId = bookId;
        if (String(bookId).startsWith('firestore-')) {
            firestoreId = String(bookId).replace('firestore-', '');
        }

        console.log('Checking Firestore with ID:', firestoreId);
        const bookDocRef = doc(db, 'advertMyBook', firestoreId);
        const bookDoc = await getDoc(bookDocRef);

        if (bookDoc.exists()) {
            const data = bookDoc.data();
            console.log('Found book in Firestore:', data.bookTitle);

            return {
                id: `firestore-${firestoreId}`,
                firestoreId: firestoreId,
                title: data.bookTitle,
                author: data.author || data.name,
                category: data.category,
                price: data.price,
                pages: data.pages,
                format: data.format || 'PDF',
                image: data.coverImage,
                coverImage: data.coverImage,
                description: data.description,
                message: data.message,
                pdfUrl: data.pdfLink,
                driveFileId: data.driveFileId,
                sellerId: data.sellerId || data.userId,
                sellerName: data.sellerName,
                sellerEmail: data.sellerEmail,
                oldPrice: data.oldPrice || null,
                discount: data.discount || null,
                source: 'firestore'
            };
        }

        console.error('Book not found in booksData or Firestore');
        return null;

    } catch (error) {
        console.error('Error in fetchBookDetails:', error);
        return null;
    }
}

/**
 * Validate that a book has all required information for purchase
 * @param {Object} bookData - The book data to validate
 * @returns {Object} - {valid: boolean, error: string|null}
 */
export function validateBookForPurchase(bookData) {
    if (!bookData) {
        return { valid: false, error: 'Book data is missing' };
    }

    // Check required fields
    const requiredFields = ['title', 'author', 'price'];
    for (const field of requiredFields) {
        if (!bookData[field]) {
            return { valid: false, error: `Missing required field: ${field}` };
        }
    }

    // Validate price
    if (typeof bookData.price !== 'number' || bookData.price <= 0) {
        return { valid: false, error: 'Invalid price' };
    }

    // Check seller information (optional but recommended)
    if (!bookData.sellerId) {
        console.warn('Warning: Book has no seller ID');
        // Don't fail validation, but log warning
    }

    return { valid: true, error: null };
}

/**
 * Get book by ID (alias for fetchBookDetails for backwards compatibility)
 */
export function getBookById(bookId) {
    return fetchBookDetails(bookId);
}

/**
 * Check if a book exists
 */
export async function bookExists(bookId) {
    const book = await fetchBookDetails(bookId);
    return book !== null;
}