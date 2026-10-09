import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const ts = admin.firestore.FieldValue.serverTimestamp();
    const batch = adminDb.batch();
    batch.set(adminDb.collection("users").doc(uid), { isDeactivated: true, deactivatedAt: ts }, { merge: true });
    batch.set(adminDb.collection("sellers").doc(uid), { isDeactivated: true, deactivatedAt: ts }, { merge: true });
    await batch.commit();
    await adminAuth.revokeRefreshTokens(uid);
    return NextResponse.json({ success: true });
}