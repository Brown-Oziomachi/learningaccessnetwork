// lib/verification/adminGuard.js
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function requireAdmin(req) {
    const h = req.headers.get("authorization") || "";
    if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
    let dec;
    try { dec = await adminAuth.verifyIdToken(h.slice(7), true); } // true = reject revoked tokens
    catch { throw new Error("unauthorized"); }
        const snap = await adminDb.doc(`users/${dec.uid}`).get();
    if (snap.data()?.isAdmin !== true) throw new Error("forbidden");
    return { uid: dec.uid, email: dec.email || "admin" };
}

export const httpStatus = (e) => (e.message === "unauthorized" ? 401 : e.message === "forbidden" ? 403 : 500);

/** Timestamps -> ISO strings, Infinity -> null, so the result is JSON-safe. */
export function plain(v) {
    if (v === Infinity || v === -Infinity) return null;
    if (v?.toDate) return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(plain);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
    return v;
}