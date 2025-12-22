// This function should be called AFTER payment is successful
// Add this to your payment success handler (likely in a checkout page or payment callback)

import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/**
 * Creates a transaction record and updates seller's balance
 * Call this IMMEDIATELY after successful payment
 */
export async function recordPurchaseTransaction({
    bookId,
    bookTitle,
    bookAuthor,
    bookCategory,
    bookPrice,
    sellerId,
    sellerName,
    sellerEmail,
    buyerId,
    buyerName,
    buyerEmail,
    buyerPhone,
    paymentMethod = "flutterwave",
    paymentGateway = "flutterwave",
    transactionId,
    flutterwaveRef = null,
    firestoreId = null,
    currency = "NGN"
}) {
    try {
        console.log("📝 Recording transaction for book:", bookTitle);

        // Calculate amounts
        const platformFee = Math.round(bookPrice * 0.15); // 15% platform fee
        const sellerAmount = bookPrice - platformFee; // 85% goes to seller

        // Create transaction reference
        const txnRef = transactionId || `TXN-${Date.now()}-${bookId}`;
        const purchaseDate = new Date().toISOString();

        // Transaction data
        const transactionData = {
            // Book details
            bookId: bookId,
            bookTitle: bookTitle,
            bookAuthor: bookAuthor,
            bookCategory: bookCategory || "Uncategorized",
            bookPrice: bookPrice,
            firestoreId: firestoreId,

            // Buyer details
            buyerId: buyerId,
            buyerName: buyerName,
            buyerEmail: buyerEmail,
            buyerPhone: buyerPhone || "",

            // Seller details
            sellerId: sellerId,
            sellerName: sellerName,
            sellerEmail: sellerEmail,
            sellerPhone: null,
            sellerWalletId: null,
            sellerAccountDetails: null,

            // Financial details
            amount: bookPrice,
            sellerAmount: sellerAmount,
            platformFee: platformFee,
            currency: currency,

            // Transaction details
            transactionId: txnRef,
            transactionRef: txnRef,
            flutterwaveRef: flutterwaveRef,
            status: "completed",
            purchaseDate: purchaseDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            // Metadata
            metadata: {
                paymentGateway: paymentGateway,
                paymentMethod: paymentMethod,
                customerIp: null,
                deviceFingerprint: null,
            }
        };

        // 1. Create transaction document
        console.log("💾 Creating transaction document...");
        await addDoc(collection(db, "transactions"), transactionData);
        console.log("✅ Transaction document created");

        // 2. Update seller's document
        console.log("💰 Updating seller balance...");
        const sellerDocRef = doc(db, "sellers", sellerId);
        const sellerDoc = await getDoc(sellerDocRef);

        if (sellerDoc.exists()) {
            // Seller document exists - update it
            await updateDoc(sellerDocRef, {
                accountBalance: increment(sellerAmount),
                totalEarnings: increment(sellerAmount),
                booksSold: increment(1),
                lastSaleDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`✅ Seller balance updated: +₦${sellerAmount}`);
        } else {
            // Seller document doesn't exist - create it
            console.log("📝 Creating new seller document...");
            await setDoc(sellerDocRef, {
                sellerId: sellerId,
                sellerEmail: sellerEmail,
                sellerName: sellerName,
                accountBalance: sellerAmount,
                totalEarnings: sellerAmount,
                booksSold: 1,
                totalWithdrawn: 0,
                lastSaleDate: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log("✅ New seller document created");
        }

        // 3. Add to buyer's purchasedBooks
        console.log("📚 Updating buyer's purchased books...");
        const userDocRef = doc(db, "users", buyerId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const purchasedBooks = userData.purchasedBooks || {};

            // Create purchase record
            const purchaseKey = firestoreId ? `firestore-${firestoreId}` : bookId.toString();
            purchasedBooks[purchaseKey] = {
                bookId: firestoreId ? `firestore-${firestoreId}` : bookId,
                firestoreId: firestoreId,
                id: firestoreId ? `firestore-${firestoreId}` : bookId,
                title: bookTitle,
                author: bookAuthor,
                amount: bookPrice,
                sellerId: sellerId,
                sellerName: sellerName,
                transactionId: txnRef,
                purchaseDate: purchaseDate,
                pdfUrl: null, // Will be updated separately if needed
            };

            await updateDoc(userDocRef, {
                purchasedBooks: purchasedBooks,
                updatedAt: serverTimestamp()
            });
            console.log("✅ Buyer's purchased books updated");
        }

        console.log("🎉 Transaction recorded successfully!");
        console.log({
            transactionId: txnRef,
            bookTitle: bookTitle,
            bookPrice: bookPrice,
            sellerAmount: sellerAmount,
            platformFee: platformFee
        });

        return {
            success: true,
            transactionId: txnRef,
            sellerAmount: sellerAmount
        };

    } catch (error) {
        console.error("❌ Error recording transaction:", error);
        console.error("Error details:", error.message);
        throw error;
    }
}

/**
 * EXAMPLE USAGE in your payment success callback:
 * 
 * // After Flutterwave payment succeeds
 * const book = booksData.find(b => b.id === bookId);
 * 
 * await recordPurchaseTransaction({
 *     bookId: book.id,
 *     bookTitle: book.title,
 *     bookAuthor: book.author,
 *     bookCategory: book.category,
 *     bookPrice: book.price,
 *     sellerId: book.sellerId || "Z9kGq0DehgdWCn6ucgXbHhH4xCe2",
 *     sellerName: book.sellerName || "Brown C Emmanuel",
 *     sellerEmail: book.sellerEmail || "browncemmanuel@gmail.com",
 *     buyerId: auth.currentUser.uid,
 *     buyerName: auth.currentUser.displayName,
 *     buyerEmail: auth.currentUser.email,
 *     buyerPhone: userData.phoneNumber,
 *     paymentMethod: "paypal", // or "card", "bank_transfer", etc.
 *     transactionId: response.transaction_id,
 *     flutterwaveRef: response.flw_ref
 * });
 */