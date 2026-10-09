import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";
import { hashPin, hasAnyPin } from "@/lib/pinStore";

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const { pin } = await req.json().catch(() => ({}));
    const p = String(pin ?? "").trim();
    if (!/^\d{4}$/.test(p)) return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
    if (/^(\d)\1{3}$/.test(p) || ["1234", "4321", "0123", "3210"].includes(p)) {
        return NextResponse.json({ error: "Choose a less obvious PIN." }, { status: 400 });
    }

    const sellerRef = adminDb.collection("sellers").doc(uid);
    const privRef = adminDb.collection("sellerPrivate").doc(uid);
    const [sellerSnap, privSnap] = await Promise.all([sellerRef.get(), privRef.get()]);
    if (!sellerSnap.exists) return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    if (hasAnyPin({ seller: sellerSnap.data(), priv: privSnap.exists ? privSnap.data() : {} })) {
        return NextResponse.json({ error: "A PIN is already set. Use Reset PIN." }, { status: 409 });
    }

    const ts = admin.firestore.FieldValue.serverTimestamp();
    const batch = adminDb.batch();
    batch.set(privRef, { pinHash: hashPin(uid, p), pinSetAt: ts, attempts: 0, lockedUntil: null }, { merge: true });
    batch.update(sellerRef, { hasPin: true, updatedAt: ts });
    await batch.commit();
    return NextResponse.json({ success: true });
}