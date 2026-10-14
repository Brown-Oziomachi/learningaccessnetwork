// app/api/seller/verification/apply/route.js
// GET  ?route=paid|free  -> live checklist (server-computed)
// POST { route }         -> submits for ADMIN REVIEW only if the checklist passes.
// Neither endpoint ever sets the badge. The badge is set by the admin approve route
// (free) or by the payment webhook after approval (paid).

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { evaluateVerification, VERIFY_RULES } from "@/lib/verification/eligibility";
import { collectStats } from "@/lib/verification/collectStats";

async function authUid(req) {
    const h = req.headers.get("authorization") || "";
    if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
    try { return (await adminAuth.verifyIdToken(h.slice(7))).uid; }
    catch { throw new Error("unauthorized"); }
}

export async function GET(req) {
    try {
        const uid = await authUid(req);
        const route = new URL(req.url).searchParams.get("route") === "free" ? "free" : "paid";
        const db = adminDb;
        const { stats, seller } = await collectStats(db, uid, route);
        return NextResponse.json({
            success: true, route,
            status: seller.verificationStatus || "none",
            rejectedReason: seller.verificationRejectedReason || null,
            priceNGN: VERIFY_RULES.paid.priceNGN,
            ...evaluateVerification(route, stats),
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.message === "unauthorized" ? 401 : 500 });
    }
}

export async function POST(req) {
    try {
        const uid = await authUid(req);
        const { route } = await req.json();
        if (!["paid", "free"].includes(route)) return NextResponse.json({ success: false, error: "Invalid route" }, { status: 400 });

        const db = adminDb;
        const { stats, seller } = await collectStats(db, uid, route);
        if (["pending_review", "approved_awaiting_payment", "verified"].includes(seller.verificationStatus)) {
            return NextResponse.json({ success: false, error: "You already have an application in progress." }, { status: 409 });
        }

        const result = evaluateVerification(route, stats);
        if (!result.eligible) {
            return NextResponse.json({ success: false, error: "You don't meet every requirement yet.", ...result }, { status: 422 });
        }

        await Promise.all([
            db.doc(`sellers/${uid}`).set({
                verificationStatus: "pending_review",
                verificationRoute: route,
                verificationAppliedAt: FieldValue.serverTimestamp(),
            }, { merge: true }),
            // private: sellers/* is publicly readable and the snapshot holds the KYC legal name
            db.doc(`verificationApplications/${uid}`).set({
                uid, route, stats, appliedAt: FieldValue.serverTimestamp(),
            }),
        ]);

        return NextResponse.json({ success: true, status: "pending_review" });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.message === "unauthorized" ? 401 : 500 });
    }
}

/* ── Still needed server-side ────────────────────────────────────────────────
 * 1. /api/admin/verification/decide  (admin only)
 *      approve + route=free  -> sellers/{uid}: isVerifiedSeller:true, verifiedRoute:"free", verificationStatus:"verified"
 *      approve + route=paid  -> verificationStatus:"approved_awaiting_payment"   (NO badge yet)
 *      reject                -> verificationStatus:"rejected", verificationRejectedReason
 *    Re-run evaluateVerification here too, ids can change between apply and approve.
 * 2. Payment route/webhook: create the ₦2,000 checkout ONLY if verificationStatus === "approved_awaiting_payment";
 *    on success set isVerifiedSeller:true, verifiedRoute:"paid", verifiedUntil:+30 days, verificationStatus:"verified".
 * 3. Daily scheduled function: if paid and verifiedUntil < now, or a new strike appears -> isVerifiedSeller:false.
 * 4. /api/seller/kyc  (OTP verify + ID upload to PRIVATE Storage path; write sellerKyc/{uid}).
 */