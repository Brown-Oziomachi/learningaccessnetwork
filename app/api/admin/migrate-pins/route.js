import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { hashPin } from "@/lib/pinStore";

export async function POST(req) {
    if (!process.env.MIGRATE_KEY || req.headers.get("x-migrate-key") !== process.env.MIGRATE_KEY) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const FV = admin.firestore.FieldValue;
    let migrated = 0;
    let last = null;
    for (; ;) {
        let q = adminDb.collection("sellers").orderBy("__name__").limit(300);
        if (last) q = q.startAfter(last);
        const snap = await q.get();
        if (snap.empty) break;
        const batch = adminDb.batch();
        for (const d of snap.docs) {
            const s = d.data();
            const pin = s.transactionPin || s.transferPin;
            if (!pin) continue;
            batch.set(adminDb.collection("sellerPrivate").doc(d.id), {
                pinHash: hashPin(d.id, pin), pinSetAt: FV.serverTimestamp(), attempts: 0, lockedUntil: null,
            }, { merge: true });
            batch.update(d.ref, {
                hasPin: true,
                transactionPin: FV.delete(), transferPin: FV.delete(),
                resetOtp: FV.delete(), otpExpiry: FV.delete(), withdrawalOtp: FV.delete(),
            });
            migrated++;
        }
        await batch.commit();
        last = snap.docs[snap.docs.length - 1];
    }
    return NextResponse.json({ migrated });
}