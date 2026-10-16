import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";
import { hashPin, hashOtp, safeEq } from "@/lib/pinStore";

const MAX_ATTEMPTS = 5;

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const { otp, newPin } = await req.json().catch(() => ({}));
    const code = String(otp ?? "").trim();
    const pin = String(newPin ?? "").trim();
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
    if (/^(\d)\1{3}$/.test(pin) || ["1234", "4321", "0123", "3210"].includes(pin)) {
        return NextResponse.json({ error: "Choose a less obvious PIN." }, { status: 400 });
    }

       const sellerRef = adminDb.collection("sellers").doc(uid);
    const privRef = adminDb.collection("sellerPrivate").doc(uid);
    const FV = admin.firestore.FieldValue;

    try {
        const result = await adminDb.runTransaction(async (tx) => {
            const [sellerSnap, privSnap] = await Promise.all([tx.get(sellerRef), tx.get(privRef)]);
            if (!sellerSnap.exists) return { status: 404, error: "Seller profile not found." };
            const priv = privSnap.exists ? privSnap.data() : {};
            const now = Date.now();

            if (!priv.resetOtpHash || now > priv.resetOtpExpiry)
                return { status: 400, error: "Code expired. Request a new one." };

            if (!safeEq(hashOtp(uid, code), priv.resetOtpHash)) {
                const attempts = (priv.resetAttempts || 0) + 1;
                tx.set(privRef,
                    attempts >= MAX_ATTEMPTS
                        ? { resetOtpHash: null, resetOtpExpiry: null, resetAttempts: 0 }
                        : { resetAttempts: attempts },
                    { merge: true });
                return { status: 400, error: "Invalid code." };
            }

            tx.set(privRef, {
                pinHash: hashPin(uid, pin), pinSetAt: FV.serverTimestamp(),
                attempts: 0, lockedUntil: null, pinVerifiedAt: 0,
                resetOtpHash: null, resetOtpExpiry: null, resetAttempts: 0,
            }, { merge: true });
            tx.update(sellerRef, {
                hasPin: true,
                transactionPin: FV.delete(), transferPin: FV.delete(),
                resetOtp: FV.delete(), otpExpiry: FV.delete(), withdrawalOtp: FV.delete(),
                updatedAt: FV.serverTimestamp(),
            });
            return { ok: true };
        });

        if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[pin/reset/confirm]", e);
        return NextResponse.json({ error: "Could not reset PIN. Try again." }, { status: 500 });
    }
}