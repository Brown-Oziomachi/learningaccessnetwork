import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { checkPin, hasAnyPin } from "@/lib/pinStore";

const MAX_ATTEMPTS = 5, LOCK_MS = 30 * 60 * 1000;

export async function POST(req) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        let uid;
        try { ({ uid } = await adminAuth.verifyIdToken(token)); }
        catch (e) {
            console.error("[pin/verify] token error:", e.message);
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { pin } = await req.json().catch(() => ({}));
        if (!/^\d{4}$/.test(String(pin ?? "").trim()))
            return NextResponse.json({ ok: false, error: "Enter your 4-digit PIN." }, { status: 400 });

        const sellerRef = adminDb.collection("sellers").doc(uid);
        const privRef = adminDb.collection("sellerPrivate").doc(uid);
        const [sellerSnap, privSnap] = await Promise.all([sellerRef.get(), privRef.get()]);
        const seller = sellerSnap.data() || {};
        const priv = privSnap.exists ? privSnap.data() : {};
        const now = Date.now();

        if (priv.lockedUntil && now < priv.lockedUntil)
            return NextResponse.json({ ok: false, error: "Too many wrong attempts. Try again later." }, { status: 429 });
        if (!hasAnyPin({ seller, priv }))
            return NextResponse.json({ ok: false, error: "Set your transfer PIN first." }, { status: 400 });

        const result = checkPin({ uid, pin: String(pin).trim(), seller, priv });
        if (!result.ok) {
            const attempts = (priv.attempts || 0) + 1;
            const lock = attempts >= MAX_ATTEMPTS;
            await privRef.set({ attempts: lock ? 0 : attempts, lockedUntil: lock ? now + LOCK_MS : null }, { merge: true });
            return NextResponse.json({ ok: false, error: `Incorrect PIN.${lock ? " Locked for 30 minutes." : ""}` }, { status: 400 });
        }

        await privRef.set({ attempts: 0, lockedUntil: null, pinVerifiedAt: now }, { merge: true });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[pin/verify] CRASH:", e);
        return NextResponse.json({ ok: false, error: "Server error. Try again." }, { status: 500 });
    }
}