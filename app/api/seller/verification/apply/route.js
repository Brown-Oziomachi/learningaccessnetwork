// app/api/seller/verification/apply/route.js
// GET  ?route=paid|free  -> live checklist (server-computed)
// POST { route }         -> submits for ADMIN REVIEW only if the checklist passes.
// Neither endpoint ever sets the badge. The badge is set by the admin approve route
// (free) or by the payment webhook after approval (paid).

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { evaluateVerification, VERIFY_RULES } from "@/lib/verification/eligibility";

const DAY = 86400000;
const TRUST_KYC_PHONE = true; // set false once you build a real phone OTP route
const toMs = (t) => t?.toMillis?.() ?? (t ? new Date(t).getTime() : 0);

async function authUid(req) {
    const h = req.headers.get("authorization") || "";
    if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
    return (await adminAuth.verifyIdToken(h.slice(7))).uid;
}

async function collectStats(db, uid, route) {
    const [userSnap, sellerSnap, kycSnap, subSnap] = await Promise.all([
        db.doc(`users/${uid}`).get(),
        db.doc(`sellers/${uid}`).get(),
        db.doc(`sellerKyc/${uid}`).get(),        // private collection, admin-only reads
        db.doc(`kycSubmissions/${uid}`).get(),   // what the KYC form writes
    ]);
    const u = userSnap.data() || {};
    const kyc = kycSnap.data() || {};
    const sub = subSnap.data() || {};
    const now = Date.now();

    const kycApproved = String(sub.status ?? "").trim().toLowerCase() === "approved";
    const photo = u.photoURL || u.photoBase64 || "";
    const hasProfilePhoto = !!photo && !photo.includes("lan-logo");

    // Approved books only (pending/rejected do not count)
    const [a, b] = await Promise.all([
        db.collection("advertMyBook").where("sellerId", "==", uid).where("status", "==", "approved").get(),
        db.collection("advertMyBook").where("userId", "==", uid).where("status", "==", "approved").get(),
    ]);
    const approvedIds = new Set([...a.docs, ...b.docs].map((d) => d.id));

    // Latest copyright strike / takedown
    const strikes = await db.collection("copyrightStrikes").where("sellerId", "==", uid).get();
    const lastStrike = strikes.docs.reduce((m, d) => Math.max(m, toMs(d.data().createdAt)), 0);

    const stats = {
        fullName: kyc.fullName || (kycApproved ? sub.fullName : "") || "",
        phoneVerified: kyc.phoneVerified === true || (TRUST_KYC_PHONE && kycApproved && !!sub.phone),
        idSubmitted: !!kyc.idImagePath || (kycApproved && !!sub.frontUrl),
        hasRealPhoto: kyc.photoApproved === true || (kycApproved && hasProfilePhoto),
        approvedBooks: approvedIds.size,
        accountAgeDays: Math.floor((now - toMs(u.createdAt)) / DAY),
        daysSinceLastStrike: lastStrike ? Math.floor((now - lastStrike) / DAY) : Infinity,
        realFollowers: 0,
        totalSalesNGN: 0,
    };

    if (route === "free") {
        // Followers: only count accounts that are old enough and verified, so bought/bot followers don't count
        const f = await db.collection("follows").where("lecturerId", "==", uid).limit(5000).get();
        const followerIds = [...new Set(f.docs.map((d) => d.data().followerId).filter((id) => id && id !== uid))];
        const minAge = VERIFY_RULES.free.followerMinAccountAgeDays * DAY;
        let real = 0;
        for (let i = 0; i < followerIds.length; i += 300) {
            const refs = followerIds.slice(i, i + 300).map((id) => db.doc(`users/${id}`));
            const docs = await db.getAll(...refs);
            docs.forEach((d) => {
                const x = d.data();
                if (!x || x.isDeactivated) return;
                const old = now - toMs(x.createdAt) >= minAge;
                const verifiedContact = x.emailVerified === true || x.phoneVerified === true;
                if (old && verifiedContact) real++;
            });
        }
        stats.realFollowers = real;

        // Gross sales from the transactions ledger (not self-reported counters)
        const tx = await db.collection("transactions").where("sellerId", "==", uid).get();
        stats.totalSalesNGN = tx.docs.reduce((s, d) => s + (Number(d.data().amount) || 0), 0);
    }

    return { stats, seller: sellerSnap.data() || {} };
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

        await db.doc(`sellers/${uid}`).set({
            verificationStatus: "pending_review",
            verificationRoute: route,
            verificationAppliedAt: FieldValue.serverTimestamp(),
            verificationSnapshot: stats, // what the admin saw at submission time
        }, { merge: true });

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