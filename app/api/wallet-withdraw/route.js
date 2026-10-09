import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminDb, admin } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notificationEngine';
import { checkPin, hasAnyPin, hashPin } from '@/lib/pinStore';

const WITHDRAWAL_THRESHOLD = 5000;
const MIN_WITHDRAWAL = 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

class UserError extends Error { }

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const safeEq = (a, b) => {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export async function POST(request) {
    try {
        const adminDb = getAdminDb();

        const idToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        let userId;
        try { ({ uid: userId } = await admin.auth().verifyIdToken(idToken)); }
        catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const { amount: rawAmount, pin, otp } = await request.json();
        const amount = Math.floor(Number(rawAmount));
        if (!Number.isFinite(amount) || amount <= 0) throw new UserError('Invalid withdrawal amount');
        if (amount < MIN_WITHDRAWAL) throw new UserError('Minimum withdrawal is ₦1,000');
        if (!/^\d{4}$/.test(String(pin ?? '').trim())) throw new UserError('Enter your 4-digit PIN.');

        const sellerRef = adminDb.collection('sellers').doc(userId);
        const userRef = adminDb.collection('users').doc(userId);
        const privateRef = adminDb.collection('sellerPrivate').doc(userId);

        const result = await adminDb.runTransaction(async (tx) => {
            let migrateLegacy = false;
            const [sellerSnap, userSnap, privSnap] = await Promise.all([
                tx.get(sellerRef), tx.get(userRef), tx.get(privateRef),
            ]);
            if (!sellerSnap.exists) throw new UserError('Seller profile not found.');

            const seller = sellerSnap.data();
            const user = userSnap.exists ? userSnap.data() : {};
            const priv = privSnap.exists ? privSnap.data() : {};
            const now = Date.now();

            if (user.isDeactivated || seller.isDeactivated) throw new UserError('This account is deactivated.');
            if (['pending', 'rejected'].includes(user.lecturerVerificationStatus)) {
                throw new UserError('Withdrawals unlock after verification.');
            }
            if (!seller.bankDetails?.accountNumber) throw new UserError('Add your bank details first.');
            if (priv.lockedUntil && now < priv.lockedUntil) {
                throw new UserError('Too many wrong attempts. Try again later.');
            }

            if (!hasAnyPin({ seller, priv })) throw new UserError('Set your transfer PIN first.');

            // Wrong PIN/OTP must RETURN (not throw) so the attempt counter is saved.
            const fail = (message) => {
                const attempts = (priv.attempts || 0) + 1;
                const lock = attempts >= MAX_ATTEMPTS;
                tx.set(privateRef, {
                    attempts: lock ? 0 : attempts,
                    lockedUntil: lock ? now + LOCK_MS : null,
                }, { merge: true });
                return { error: message };
            };

            const pinCheck = checkPin({ uid: userId, pin, seller, priv });
            if (!pinCheck.ok) return fail('Incorrect PIN.');
            migrateLegacy = pinCheck.legacy;

            if (amount > WITHDRAWAL_THRESHOLD) {
                if (!otp) {
                    const code = String(crypto.randomInt(100000, 1000000));
                    tx.set(privateRef, {
                        otpHash: sha(code),
                        otpAmount: amount,
                        otpExpiry: now + OTP_TTL_MS,
                    }, { merge: true });
                    return {
                        status: 'OTP_SENT',
                        code,
                        email: seller.sellerEmail || user.email || null,
                        name: seller.sellerName || user.firstName || 'Seller',
                    };
                }
                if (
                    !priv.otpHash ||
                    now > priv.otpExpiry ||
                    priv.otpAmount !== amount ||
                    !safeEq(sha(String(otp).trim()), priv.otpHash)
                ) {
                    return fail('Invalid or expired OTP.');
                }
            }

            const balance = seller.accountBalance || 0;
            if (balance < amount) {
                throw new UserError(`Insufficient funds. Your balance is ₦${balance.toLocaleString()}`);
            }

            tx.update(sellerRef, {
                accountBalance: admin.firestore.FieldValue.increment(-amount),
                // clean up legacy public OTP fields
                withdrawalOtp: admin.firestore.FieldValue.delete(),
                otpExpiry: admin.firestore.FieldValue.delete(),
                ...(migrateLegacy ? {
                    transactionPin: admin.firestore.FieldValue.delete(),
                    transferPin: admin.firestore.FieldValue.delete(),
                    hasPin: true,
                } : {}),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            tx.set(privateRef, {
                attempts: 0, lockedUntil: null, otpHash: null, otpAmount: null, otpExpiry: null,
                ...(migrateLegacy ? { pinHash: hashPin(userId, pin) } : {}),
            }, { merge: true });

            const withdrawalRef = adminDb.collection('withdrawals').doc();
            tx.set(withdrawalRef, {
                withdrawalId: withdrawalRef.id,
                sellerId: userId,
                userId,
                amount,
                bankDetails: seller.bankDetails,
                status: 'pending',
                type: 'withdrawal',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { status: 'COMPLETED', withdrawalId: withdrawalRef.id };
        });

        if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

        if (result.status === 'OTP_SENT') {
            if (!result.email) {
                return NextResponse.json({ error: 'No email on file for verification.' }, { status: 400 });
            }
            try {
                const res = await notifyUser({
                    userId,
                    to: result.email,
                    type: 'withdrawal_otp',
                    data: { name: result.name, otp: result.code, amount },
                    inApp: {
                        type: 'security_otp',
                        title: 'Your withdrawal code',
                        message: `Your code is ${result.code}. It expires in 10 minutes. Never share it.`,
                        extra: { sensitive: true, expiresAt: Date.now() + OTP_TTL_MS },
                    },
                });
                if (res.every((r) => r.status === 'rejected')) {
                    return NextResponse.json({ error: 'Could not send the verification code. Try again.' }, { status: 500 });
                }
            } catch (e) {
                console.error('Withdrawal OTP email failed:', e.message);
                return NextResponse.json({ error: 'Could not send the verification code. Try again.' }, { status: 500 });
            }
            return NextResponse.json({ status: 'OTP_SENT' }, { status: 400 }); // dashboard expects this shape
        }
        const old = await adminDb.collection('notifications')
            .where('userId', '==', userId).where('type', '==', 'security_otp').get();
        await Promise.all(old.docs.map((d) => d.ref.delete()));

        return NextResponse.json({ success: true, txRef: result.withdrawalId }, { status: 200 });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('WITHDRAWAL FAILURE:', error);
        return NextResponse.json({ error: 'Withdrawal could not be processed.' }, { status: 500 });
    }
}