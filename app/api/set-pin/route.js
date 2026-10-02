// app/api/set-pin/route.js
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { uid } = await adminAuth.verifyIdToken(token);

        const { pin, currentPin } = await req.json();
        if (!/^\d{4}$/.test(String(pin))) {
            return NextResponse.json({ success: false, error: "PIN must be 4 digits." }, { status: 400 });
        }

        const sellerRef = adminDb.doc(`sellers/${uid}`);
        const privRef = adminDb.doc(`sellerPrivate/${uid}`);
        const [seller, priv] = await Promise.all([sellerRef.get(), privRef.get()]);
        if (!seller.exists) {
            return NextResponse.json({ success: false, error: "Seller account not found." }, { status: 404 });
        }

        // Changing an existing PIN requires the current one
        const existing = priv.data() || {};
        if (existing.pinHash) {
            if ((existing.pinAttempts || 0) >= 5) {
                return NextResponse.json({ success: false, error: "PIN locked. Contact support." }, { status: 429 });
            }
            const ok = currentPin && (await bcrypt.compare(String(currentPin), existing.pinHash));
            if (!ok) {
                await privRef.set({ pinAttempts: FieldValue.increment(1) }, { merge: true });
                return NextResponse.json({ success: false, error: "Current PIN is incorrect." }, { status: 400 });
            }
        }

        const pinHash = await bcrypt.hash(String(pin), 10);
        await privRef.set({ pinHash, pinAttempts: 0, pinUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });

        // Public flag only; the client reads this to know whether to show "create PIN"
        await sellerRef.set({ hasPin: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("set-pin error:", e);
        return NextResponse.json({ success: false, error: "Could not save PIN." }, { status: 500 });
    }
}