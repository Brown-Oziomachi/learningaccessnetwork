import crypto from "crypto";
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { hashOtp } from "@/lib/pinStore";
import { sendServerNotification } from "@/lib/notificationEngine";

const COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const privRef = adminDb.collection("sellerPrivate").doc(uid);
    const [sellerSnap, userSnap, privSnap] = await Promise.all([
        adminDb.collection("sellers").doc(uid).get(),
        adminDb.collection("users").doc(uid).get(),
        privRef.get(),
    ]);
    if (!sellerSnap.exists) return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });

    const priv = privSnap.exists ? privSnap.data() : {};
    const now = Date.now();
    if (priv.resetRequestedAt && now - priv.resetRequestedAt < COOLDOWN_MS) {
        return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
    }

    const email = userSnap.data()?.email || sellerSnap.data().sellerEmail;
    if (!email) return NextResponse.json({ error: "No email on file." }, { status: 400 });

    const code = String(crypto.randomInt(100000, 1000000));
    await privRef.set({
        resetOtpHash: hashOtp(uid, code),
        resetOtpExpiry: now + OTP_TTL_MS,
        resetAttempts: 0,
        resetRequestedAt: now,
    }, { merge: true });

    try {
        await sendServerNotification({
            type: "pin_reset_otp",
            to: email,
            userId: uid,
            data: { name: userSnap.data()?.firstName || sellerSnap.data().sellerName || "Seller", otp: code },
        });
    } catch (e) {
        console.error("PIN reset email failed:", e.message);
        return NextResponse.json({ error: "Could not send the code. Try again." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}