import { getAdminDb, admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const WITHDRAWAL_THRESHOLD = 5000;
const MIN_WITHDRAWAL = 1000;

export async function POST(request) {
    try {
        const adminDb = getAdminDb();

        const idToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        let userId;
        try {
            ({ uid: userId } = await admin.auth().verifyIdToken(idToken));
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount: rawAmount, pin, otp } = await request.json();

        if (!rawAmount || !pin) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const amount = Math.floor(Number(rawAmount));
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
        }
        if (amount < MIN_WITHDRAWAL) {
            return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 });
        }

        const sellerRef = adminDb.collection('sellers').doc(userId);

        const result = await adminDb.runTransaction(async (transaction) => {
            const sellerSnap = await transaction.get(sellerRef);
            if (!sellerSnap.exists) {
                throw new Error('Seller profile record not found.');
            }

            const sellerData = sellerSnap.data();
            const storedPin = sellerData.transactionPin || sellerData.transferPin;

            if (!storedPin) {
                throw new Error('PIN_NOT_SET');
            }
            if (pin.toString().trim() !== storedPin.toString().trim()) {
                throw new Error('Incorrect PIN.');
            }

            // OTP generation check for high-value operations
            if (amount > WITHDRAWAL_THRESHOLD && !otp) {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

                transaction.update(sellerRef, {
                    withdrawalOtp: generatedOtp,
                    otpExpiry: Date.now() + 600000,
                });

                return { status: 'OTP_SENT', generatedOtp, sellerEmail: sellerData.sellerEmail };
            }

            if (otp) {
                if (otp !== sellerData.withdrawalOtp || Date.now() > sellerData.otpExpiry) {
                    throw new Error('Invalid or expired OTP.');
                }
            }

            const currentBalance = sellerData.accountBalance || 0;
            if (currentBalance < amount) {
                throw new Error(`Insufficient funds. Your balance is ₦${currentBalance.toLocaleString()}`);
            }

            transaction.update(sellerRef, {
                accountBalance: admin.firestore.FieldValue.increment(-amount),
                withdrawalOtp: null,
                otpExpiry: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const withdrawalDocRef = adminDb.collection('withdrawals').doc();
            transaction.set(withdrawalDocRef, {
                withdrawalId: withdrawalDocRef.id,
                sellerId: userId,
                userId: userId,
                amount,
                bankDetails: sellerData.bankDetails || null,
                status: 'pending',
                type: 'withdrawal',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { status: 'COMPLETED' };
        });

        // 🔒 RESPONSE ALIGNMENT FIX: Handled with status mapping to interact seamlessly with frontend try-catch loops
        if (result.status === 'OTP_SENT') {
            if (result.sellerEmail) {
                sendServerNotification({
                    type: 'withdrawal_otp',
                    to: result.sellerEmail,
                    userId,
                    data: { otp: result.generatedOtp, amount },
                }).catch(e => console.error('Withdrawal OTP email failed:', e.message));
            }
            return NextResponse.json({ status: 'OTP_SENT' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('WITHDRAWAL FAILURE EXCEPTION:', error);

        const userFacing = [
            'PIN_NOT_SET',
            'Incorrect PIN',
            'Insufficient funds',
            'Invalid or expired OTP',
            'Seller profile record',
        ].some(msg => error.message?.includes(msg));

        return NextResponse.json(
            { error: userFacing ? error.message : 'Withdrawal transaction halted.' },
            { status: 400 }
        );
    }
}