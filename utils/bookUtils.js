// app/utils/bookUtils.js
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { booksData } from '@/lib/booksData';
import { PLATFORM_OWNER } from '@/lib/booksData';

/**
 * Fetch book details by ID
 * Handles both Firestore books and lib/booksData books
 */
export const fetchBookDetails = async (bookId) => {
    try {
        console.log('=== FETCHING BOOK DETAILS ===');
        console.log('Book ID:', bookId, 'Type:', typeof bookId);

        // Clean the bookId - remove firestore- prefix if present
        const cleanId = String(bookId).replace('firestore-', '');
        console.log('Clean ID:', cleanId);

        // Try Firestore first (advertMyBook collection)
        // Only if the ID looks like a Firestore ID (long string, not a number)
        if (isNaN(parseInt(cleanId)) || cleanId.length > 15) {
            try {
                console.log('Attempting Firestore lookup with ID:', cleanId);
                const bookRef = doc(db, 'advertMyBook', cleanId);
                const bookSnap = await getDoc(bookRef);

                if (bookSnap.exists()) {
                    const bookData = bookSnap.data();
                    console.log('✅ Found in Firestore:', bookData.bookTitle || bookData.title);

                    // Convert pdfLink to embedUrl
                    let embedUrl = bookData.embedUrl;
                    let pdfUrl = bookData.pdfUrl || bookData.pdfLink;

                    // If pdfLink exists but embedUrl doesn't, convert it
                    if (!embedUrl && pdfUrl) {
                        embedUrl = pdfUrl.replace('/view?usp=sharing', '/preview')
                            .replace('/view', '/preview');
                    }

                    console.log('🔍 Converted URLs:', {
                        original: bookData.pdfLink,
                        embedUrl: embedUrl,
                        pdfUrl: pdfUrl
                    });

                    return {
                        id: `firestore-${cleanId}`,
                        firestoreId: cleanId,
                        title: bookData.bookTitle || bookData.title,
                        author: bookData.author,
                        category: bookData.category,
                        price: bookData.price,
                        pages: bookData.pages,
                        format: bookData.format || 'PDF',
                        description: bookData.description,
                        message: bookData.message,
                        introduction: bookData.introduction,
                        previewText: bookData.previewText,
                        image: bookData.image || bookData.coverImage,
                        source: 'firestore',

                        // PDF FIELDS
                        embedUrl: embedUrl,
                        pdfUrl: pdfUrl,
                        driveFileId: bookData.driveFileId,
                        previewUrl: bookData.previewUrl,

                        // Seller info
                        sellerId: bookData.userId || bookData.sellerId,
                        sellerName: bookData.userName || bookData.sellerName,
                        sellerEmail: bookData.userEmail || bookData.sellerEmail,
                    };
                } else {
                    console.log('Not found in Firestore with ID:', cleanId);
                }
            } catch (firestoreError) {
                console.log('Firestore lookup failed:', firestoreError.message);
            }
        }

        // Try lib/booksData (platform books)
        const numericId = parseInt(cleanId);
        if (!isNaN(numericId)) {
            const platformBook = booksData.find(b => b.id === numericId);

            if (platformBook) {
                console.log('✅ Found in lib/booksData:', platformBook.title);

                return {
                    ...platformBook,
                    source: 'platform',
                    isPlatformBook: true, // Make sure this is set
                    sellerId: platformBook.sellerId,
                    sellerName: platformBook.sellerName,
                    sellerEmail: platformBook.sellerEmail,
                    sellerPhone: platformBook.sellerPhone,
                };
            }
        }

        console.error('❌ Book not found in Firestore or lib/booksData');
        return null;

    } catch (error) {
        console.error('❌ Error fetching book details:', error);
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
 * Fetch seller details
 * For platform books: use seller info from book data
 * For Firestore books: fetch from Firebase
 */
export const fetchSellerDetails = async (book) => {
    try {
        console.log('=== FETCHING SELLER DETAILS ===');
        console.log('Book source:', book.source);
        console.log('Is platform book:', book.isPlatformBook);
        console.log('Seller ID:', book.sellerId);

        // For platform books, use the seller info from the book data directly
        if (book.source === 'platform' || book.isPlatformBook) {
            console.log('📘 Platform book - using seller info from book data');
            return {
                id: book.sellerId,
                name: book.sellerName,
                email: book.sellerEmail,
                phone: book.sellerPhone,
                accountType: 'platform_owner'
            };
        }

        // For Firestore books, fetch from Firebase
        if (!book.sellerId) {
            console.error('❌ No seller ID provided');
            return null;
        }

        // Try users collection first
        const userDocRef = doc(db, 'users', book.sellerId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ Found seller in users collection');
            return {
                id: book.sellerId,
                name: userData.displayName || userData.name || book.sellerName || 'Unknown Seller',
                email: userData.email || book.sellerEmail,
                phone: userData.phone || userData.phoneNumber || book.sellerPhone,
                accountDetails: userData.accountDetails || null,
                walletId: userData.walletId || null,
                bankAccount: userData.bankAccount || null
            };
        }

        // Try sellers collection
        const sellerDocRef = doc(db, 'sellers', book.sellerId);
        const sellerDoc = await getDoc(sellerDocRef);

        if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data();
            console.log('✅ Found seller in sellers collection');
            return {
                id: book.sellerId,
                name: sellerData.sellerName || book.sellerName || 'Unknown Seller',
                email: sellerData.sellerEmail || book.sellerEmail,
                phone: sellerData.sellerPhone || book.sellerPhone,
                accountDetails: null,
                walletId: null,
                bankAccount: null
            };
        }

        // Fallback: Use book data
        console.warn('⚠️ Seller not found in Firestore, using book data as fallback');
        return {
            id: book.sellerId,
            name: book.sellerName || 'Unknown Seller',
            email: book.sellerEmail,
            phone: book.sellerPhone,
            accountDetails: null,
            walletId: null,
            bankAccount: null
        };

    } catch (error) {
        console.error('❌ Error fetching seller details:', error);

        // Final fallback: Always return seller info from book
        return {
            id: book.sellerId,
            name: book.sellerName || 'Unknown Seller',
            email: book.sellerEmail,
            phone: book.sellerPhone,
            accountDetails: null,
            walletId: null,
            bankAccount: null
        };
    }
};