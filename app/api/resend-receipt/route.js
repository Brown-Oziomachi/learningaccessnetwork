// app/api/resend-receipt/route.js
// ─────────────────────────────────────────────────────────────────
// Called from the "Resend Receipt" button in Transaction History.
// Validates the requesting user owns the transaction, then fires
// a receipt email via Resend.
//
// POST body: { orderId: string }
// Auth:      Bearer token in Authorization header (Firebase ID token)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { buildOrderReceipt } from "@/lib/emailTemplates";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

/* ── Firebase Admin init (server-only) ── */
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "LAN Library <noreply@lanlibrary.com>";

/* ─────────────────────────────────────────────────────────────────
   POST /api/resend-receipt
───────────────────────────────────────────────────────────────── */
export async function POST(request) {
    try {
        /* ── 1. Auth guard: verify Firebase ID token ── */
        const authHeader = request.headers.get("Authorization") || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!idToken) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const requestingUid = decodedToken.uid;

        /* ── 2. Parse body ── */
        const { orderId } = await request.json();
        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        /* ── 3. Load transaction from Firestore ── */
        const txSnap = await getDoc(doc(db, "transactions", orderId));
        if (!txSnap.exists()) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        const tx = txSnap.data();

        /* ── 4. Ownership check: only the buyer can resend their own receipt ── */
        if (tx.buyerId !== requestingUid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        /* ── 5. Rate-limit: max 3 resends per order (stored in the tx doc) ── */
        const resendCount = tx.resendCount ?? 0;
        if (resendCount >= 3) {
            return NextResponse.json(
                { error: "Receipt already resent 3 times. Contact support if you need further help." },
                { status: 429 }
            );
        }

        /* ── 6. Build & send email ── */
        const buyerEmail = tx.buyerEmail || decodedToken.email;
        const html = buildOrderReceipt({
            name: tx.buyerName || "Reader",
            bookTitle: tx.bookTitle || "Document",
            amount: Number(tx.amount || 0).toLocaleString(),
            sellerName: tx.sellerName || "LAN Library",
            orderId,
        });

        const { data: resendData, error: resendError } = await resend.emails.send({
            from: FROM,
            to: [buyerEmail],
            subject: `Your Receipt — "${tx.bookTitle || "Document"}"`,
            html,
            tags: [{ name: "type", value: "receipt_resend" }],
        });

        if (resendError) {
            console.error("[resend-receipt] Resend error:", resendError);
            return NextResponse.json({ error: resendError.message }, { status: 500 });
        }

        /* ── 7. Increment resend counter on the transaction doc ── */
        try {
            const { updateDoc, increment } = await import("firebase/firestore");
            await updateDoc(doc(db, "transactions", orderId), {
                resendCount: increment(1),
                lastResentAt: serverTimestamp(),
            });
        } catch (updateErr) {
            // Non-blocking — email was sent, don't fail the response
            console.warn("[resend-receipt] Failed to update resend counter:", updateErr.message);
        }

        /* ── 8. Also write to mail collection as an audit log ── */
        try {
            await addDoc(collection(db, "mail"), {
                to: buyerEmail,
                type: "order_receipt",
                orderId,
                buyerId: requestingUid,
                retry: true,
                resendEmailId: resendData?.id,
                sentAt: serverTimestamp(),
            });
        } catch { /* non-blocking */ }

        console.log(`[resend-receipt] ✓ Receipt resent for order ${orderId} → ${buyerEmail}`);
        return NextResponse.json({ success: true, id: resendData?.id });

    } catch (err) {
        console.error("[resend-receipt] Unexpected error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}