import "server-only";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function requireAdmin(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    try {
        const { uid } = await adminAuth.verifyIdToken(token);
        const snap = await adminDb.collection("users").doc(uid).get();
        return snap.exists && snap.data().isAdmin === true ? uid : null;
    } catch { return null; }
}