import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const userSnap = await adminDb.collection("users").doc(uid).get();
    const u = userSnap.data();
    if (!userSnap.exists || !(u.isSeller || u.lecturerVerificationStatus)) {
        return NextResponse.json({ error: "Not a seller" }, { status: 403 });
    }

    const ref = adminDb.collection("sellers").doc(uid);
    await adminDb.runTransaction(async (t) => {
        if ((await t.get(ref)).exists) return;
        t.set(ref, {
            sellerId: uid,
            sellerEmail: u.email || null,
            sellerName: u.displayName || `${u.firstName || ""} ${u.surname || ""}`.trim(),
            accountBalance: 0, totalEarnings: 0, booksSold: 0, totalWithdrawn: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return NextResponse.json({ success: true });
}