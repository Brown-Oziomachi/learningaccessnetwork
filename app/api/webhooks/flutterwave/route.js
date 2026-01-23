// app/api/webhooks/flutterwave/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, increment } from 'firebase/firestore';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const payload = await request.json();

        // Verify webhook signature
        const signature = request.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

        if (!signature || signature !== secretHash) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        console.log('Webhook received:', payload);

        // Only process successful payments
        if (payload.event !== 'charge.completed' || payload.data.status !== 'successful') {
            console.log('Not a successful payment, skipping');
            return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
        }

        const paymentData = payload.data;
        const { tx_ref, customer, amount, currency } = paymentData;

        // Extract metadata
        const metadata = paymentData.meta || paymentData.metadata || {};
        const { userId, bookId, bookTitle, bookPrice, sellerId, sellerEmail, sellerName } = metadata;

        if (!userId || !bookId || !sellerId) {
            console.error('Missing required metadata:', metadata);
            return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        console.log('Processing payment for:', { userId, bookId, sellerId, amount });

        // Calculate seller earnings (80% to seller, 20% platform fee)
        const netEarning = Math.floor(amount * 0.80);
        const platformFee = amount - netEarning;

        // 1. Update buyer's purchased books
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const existingPurchases = userDoc.data().purchasedBooks || [];
            const alreadyPurchased = existingPurchases.some(book => book.id === bookId);

            if (!alreadyPurchased) {
                await updateDoc(userRef, {
                    purchasedBooks: arrayUnion({
                        id: bookId,
                        title: bookTitle,
                        purchasedAt: new Date().toISOString(),
                        amount: amount,
                        transactionRef: tx_ref
                    })
                });
                console.log('✓ Added book to user purchases');
            } else {
                console.log('Book already in user purchases');
            }
        }

        // 2. Update or create seller account with earnings
        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerRef);

        if (sellerDoc.exists()) {
            // Update existing seller account
            await updateDoc(sellerRef, {
                accountBalance: increment(netEarning),
                totalEarnings: increment(netEarning),
                booksSold: increment(1),
                lastSaleAt: serverTimestamp()
            });
            console.log(`✓ Updated seller balance: +₦${netEarning}`);
        } else {
            // Create new seller account
            await setDoc(sellerRef, {
                sellerId: sellerId,
                sellerEmail: sellerEmail,
                sellerName: sellerName,
                accountBalance: netEarning,
                totalEarnings: netEarning,
                booksSold: 1,
                createdAt: serverTimestamp(),
                lastSaleAt: serverTimestamp()
            });
            console.log(`✓ Created seller account with ₦${netEarning}`);
        }

        // 3. Record transaction for tracking
        const transactionRef = doc(db, 'transactions', tx_ref);
        await setDoc(transactionRef, {
            transactionRef: tx_ref,
            userId: userId,
            buyerEmail: customer.email,
            buyerName: customer.name,
            sellerId: sellerId,
            sellerEmail: sellerEmail,
            sellerName: sellerName,
            bookId: bookId,
            bookTitle: bookTitle,
            amount: amount,
            netEarning: netEarning,
            platformFee: platformFee,
            currency: currency,
            status: 'completed',
            paymentMethod: paymentData.payment_type,
            date: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        console.log('✓ Transaction recorded');

        // 4. Update book purchase count (if book exists in advertMyBook)
        if (bookId.startsWith('firestore-')) {
            const firestoreBookId = bookId.replace('firestore-', '');
            const bookRef = doc(db, 'advertMyBook', firestoreBookId);
            const bookDoc = await getDoc(bookRef);

            if (bookDoc.exists()) {
                await updateDoc(bookRef, {
                    purchases: increment(1),
                    lastPurchaseAt: serverTimestamp()
                });
                console.log('✓ Updated book purchase count');
            }
        }

        // 5. Send notification to seller
        try {
            const sellerDocData = await getDoc(sellerRef);
            const currentBalance = sellerDocData.exists()
                ? sellerDocData.data().accountBalance
                : netEarning;

            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-seller-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId,
                    bookTitle,
                    amount,
                    netEarning,
                    buyerEmail: customer.email,
                    currentBalance
                })
            });
            console.log('✓ Seller notification sent');
        } catch (notifError) {
            console.error('Failed to send seller notification:', notifError);
            // Don't fail the webhook if notification fails
        }

        console.log('✅ Webhook processed successfully');

        return NextResponse.json({
            message: 'Webhook processed successfully',
            details: {
                buyer: userId,
                seller: sellerId,
                book: bookTitle,
                amount: amount,
                sellerEarning: netEarning
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error.message
        }, { status: 500 });
    }
}