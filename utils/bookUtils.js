// app/utils/bookUtils.js
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { booksData } from '@/lib/booksData';

/**
 * Fetch book details from both Firestore and static data
 */
export const fetchBookDetails = async (bookId) => {
    console.log('fetchBookDetails called with:', bookId, typeof bookId);

    try {
        // Try Firestore first (advertMyBook collection)
        const booksRef = collection(db, 'advertMyBook');
        const snapshot = await getDocs(booksRef);

        const firestoreBook = snapshot.docs.find(doc => {
            const data = doc.data();
            return doc.id === bookId ||
                doc.id === String(bookId) ||
                data.id === bookId ||
                data.id === String(bookId) ||
                data.id === parseInt(bookId);
        });

        if (firestoreBook) {
            const data = firestoreBook.data();
            console.log('Found in Firestore:', data.title);
            return {
                ...data,
                id: data.id || firestoreBook.id,
                firestoreId: firestoreBook.id,
                source: 'firestore'
            };
        }

        // Try static booksData
        const staticBook = booksData.find(b =>
            b.id === bookId ||
            b.id === parseInt(bookId) ||
            b.id === String(bookId)
        );

        if (staticBook) {
            console.log('Found in static data:', staticBook.title);
            return {
                ...staticBook,
                source: 'platform'
            };
        }

        console.error('Book not found in Firestore or static data');
        return null;

    } catch (error) {
        console.error('Error in fetchBookDetails:', error);

        // Fallback to static data on error
        const staticBook = booksData.find(b =>
            b.id === bookId ||
            b.id === parseInt(bookId) ||
            b.id === String(bookId)
        );

        if (staticBook) {
            console.log('Fallback: Found in static data');
            return {
                ...staticBook,
                source: 'platform'
            };
        }

        return null;
    }
};

/**
 * Validate book has all required fields for purchase
 */
export const validateBookForPurchase = (book) => {
    if (!book) {
        return { valid: false, error: 'Book not found' };
    }

    if (!book.price || book.price <= 0) {
        return { valid: false, error: 'Invalid book price' };
    }

    if (!book.sellerId) {
        return { valid: false, error: 'Seller information missing' };
    }

    if (!book.title) {
        return { valid: false, error: 'Book title missing' };
    }

    return { valid: true };
};

/**
 * Fetch seller details with fallback strategy
 * CRITICAL FIX: Ensures seller is always found
 */
export const fetchSellerDetails = async (book) => {
    const sellerId = book.sellerId;

    if (!sellerId) {
        console.error('No sellerId provided');
        return null;
    }

    console.log('Fetching seller details for:', sellerId);

    try {
        // STRATEGY 1: Try users collection first
        const userDocRef = doc(db, 'users', sellerId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ Found seller in users collection');
            return {
                id: sellerId,
                name: userData.displayName || userData.name || book.sellerName || 'Unknown Seller',
                email: userData.email || book.sellerEmail,
                phone: userData.phone || userData.phoneNumber || book.sellerPhone,
                accountDetails: userData.accountDetails || null,
                walletId: userData.walletId,
                bankAccount: userData.bankAccount
            };
        }

        // STRATEGY 2: Try sellers collection
        const sellerDocRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerDocRef);

        if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data();
            console.log('✅ Found seller in sellers collection');
            return {
                id: sellerId,
                name: sellerData.sellerName || book.sellerName || 'Unknown Seller',
                email: sellerData.sellerEmail || book.sellerEmail,
                phone: sellerData.sellerPhone || book.sellerPhone,
                accountDetails: null,
                walletId: null,
                bankAccount: null
            };
        }

        // STRATEGY 3: Use book data as fallback (CRITICAL FOR STATIC BOOKS)
        console.warn('⚠️ Seller not found in Firestore, using book data');
        return {
            id: sellerId,
            name: book.sellerName || 'Unknown Seller',
            email: book.sellerEmail,
            phone: book.sellerPhone,
            accountDetails: null,
            walletId: null,
            bankAccount: null
        };

    } catch (error) {
        console.error('❌ Error fetching seller:', error);

        // Final fallback: Always return seller info from book
        return {
            id: sellerId,
            name: book.sellerName || 'Unknown Seller',
            email: book.sellerEmail,
            phone: book.sellerPhone,
            accountDetails: null,
            walletId: null,
            bankAccount: null
        };
    }
};