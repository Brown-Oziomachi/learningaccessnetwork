import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildOrderReceipt } from "@/lib/emailTemplates";
import { adminDb, admin } from "@/lib/firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "LAN Library <noreply@lanlibrary.com>";

export async function POST(request) {
    try {
        /* ── 1. Auth Guard: Verify Firebase ID Token via Admin App ── */
        const authHeader = request.headers.get("Authorization") || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!idToken) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        let decodedToken;
        try {
            // Evaluates using the active admin SDK instance seamlessly
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (authError) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const requestingUid = decodedToken.uid;

        /* ── 2. Parse Payload Body ── */
        const { orderId } = await request.json();
        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        /* ── 3. Load Transaction via Pure Server-Side Engine ── */
        const txDocRef = adminDb.collection("transactions").doc(orderId);
        const txSnap = await txDocRef.get();

        if (!txSnap.exists) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        const tx = txSnap.data();

        /* ── 4. Ownership Boundary Isolation Check ── */
        if (tx.userId !== requestingUid && tx.buyerId !== requestingUid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        /* ── 5. Server-Side Rate-Limit Matrix Check ── */
        const resendCount = tx.resendCount ?? 0;
        if (resendCount >= 3) {
            return NextResponse.json(
                { error: "Receipt already resent 3 times. Contact support if you need further help." },
                { status: 429 }
            );
        }

        /* ── 6. Assemble Email Template Payload Structures ── */
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
            console.error("❌ [resend-receipt] Email delivery engine failure:", resendError);
            return NextResponse.json({ error: resendError.message }, { status: 500 });
        }

        /* ── 7. Atomic Counter Update (Non-Blocking) ── */
        txDocRef.update({
            resendCount: admin.firestore.FieldValue.increment(1),
            lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((updateErr) => {
            console.warn("⚠️ [resend-receipt] Failed to update resend counters:", updateErr.message);
        });

        /* ── 8. Commit System Audit Logs (Non-Blocking) ── */
        adminDb.collection("mail").add({
            to: buyerEmail,
            type: "order_receipt",
            orderId,
            buyerId: requestingUid,
            retry: true,
            resendEmailId: resendData?.id,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((auditErr) => {
            console.warn("⚠️ [resend-receipt] Audit log entry write failed:", auditErr.message);
        });

        console.log(`✅ [resend-receipt] Receipt dispatched for order ${orderId} → ${buyerEmail}`);
        return NextResponse.json({ success: true, id: resendData?.id });

    } catch (err) {
        console.error("❌ [resend-receipt] Fatal operational process failure:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}