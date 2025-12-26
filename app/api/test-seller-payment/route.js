// app/api/test-seller-payment/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
    try {
        const { sellerId, amount } = await request.json();

        if (!sellerId || !amount) {
            return NextResponse.json({
                error: 'Missing required fields'
            }, { status: 400 });
        }

        const netEarning = Math.floor(amount * 0.80);
        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerRef);

        if (sellerDoc.exists()) {
            const beforeData = sellerDoc.data();

            await updateDoc(sellerRef, {
                accountBalance: increment(netEarning),
                totalEarnings: increment(netEarning),
                booksSold: increment(1),
                lastSaleAt: serverTimestamp()
            });

            const updatedDoc = await getDoc(sellerRef);
            const updatedData = updatedDoc.data();

            return NextResponse.json({
                success: true,
                message: 'Seller account updated successfully',
                data: {
                    sellerId,
                    previousBalance: beforeData.accountBalance || 0,
                    amountAdded: netEarning,
                    newBalance: updatedData.accountBalance,
                    totalEarnings: updatedData.totalEarnings,
                    booksSold: updatedData.booksSold
                }
            });
        } else {
            await setDoc(sellerRef, {
                sellerId: sellerId,
                accountBalance: netEarning,
                totalEarnings: netEarning,
                booksSold: 1,
                createdAt: serverTimestamp(),
                lastSaleAt: serverTimestamp()
            });

            return NextResponse.json({
                success: true,
                message: 'Seller account created successfully',
                data: {
                    sellerId,
                    initialBalance: netEarning,
                    totalEarnings: netEarning,
                    booksSold: 1
                }
            });
        }
    } catch (error) {
        console.error('Payment error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerId = searchParams.get('sellerId');

        if (!sellerId) {
            return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
        }

        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerRef);

        if (!sellerDoc.exists()) {
            return NextResponse.json({
                exists: false,
                message: 'Seller account not found'
            });
        }

        const data = sellerDoc.data();
        return NextResponse.json({
            exists: true,
            data: {
                sellerId,
                accountBalance: data.accountBalance || 0,
                totalEarnings: data.totalEarnings || 0,
                booksSold: data.booksSold || 0
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}