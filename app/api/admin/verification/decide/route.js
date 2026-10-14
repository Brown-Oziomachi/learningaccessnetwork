// POST { uid, action: "approve" | "reject" | "revoke", reason }  (admin only)
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, httpStatus, plain } from "@/lib/verification/adminGuard";
import { collectStats } from "@/lib/verification/collectStats";
import { evaluateVerification } from "@/lib/verification/eligibility";

const fail = (error, status, extra = {}) => NextResponse.json({ success: false, error, ...extra }, { status });

export async function POST(req) {
    try {
        const admin = await requireAdmin(req);
        const { uid, action, reason } = await req.json();
        if (!uid || !["approve", "reject", "revoke"].includes(action)) return fail("Invalid request", 400);

        const ref = adminDb.doc(`sellers/${uid}`);
        const snap = await ref.get();
        if (!snap.exists) return fail("Seller not found", 404);
        const s = snap.data();
        const note = String(reason || "").trim();
        const now = FieldValue.serverTimestamp();
        let notice;

        if (action === "approve") {
            if (s.verificationStatus !== "pending_review") return fail("No application awaiting review.", 409);
            const route = s.verificationRoute === "free" ? "free" : "paid";
            // re-check: things can change between apply and approve
            const { stats } = await collectStats(adminDb, uid, route);
            const result = evaluateVerification(route, stats);
            if (!result.eligible) return fail("Seller no longer meets every requirement.", 422, { checks: plain(result.checks) });

            if (route === "free") {
                await ref.update({
                    isVerifiedSeller: true, verifiedRoute: "free", verifiedUntil: FieldValue.delete(),
                    verificationStatus: "verified", verifiedAt: now, verifiedBy: admin.email,
                    verificationRejectedReason: FieldValue.delete(),
                });
                notice = { type: "verification_granted", title: "You're verified ✅", message: "Your seller account now has the blue check." };
            } else {
                await ref.update({
                    verificationStatus: "approved_awaiting_payment",
                    verificationApprovedAt: now, verificationApprovedBy: admin.email,
                    verificationRejectedReason: FieldValue.delete(),
                });
                notice = { type: "verification_approved", title: "Application approved ✅", message: "Pay the monthly fee from your dashboard to get your blue check." };
            }
        }

        if (action === "reject") {
            if (!note) return fail("A reason is required.", 400);
            if (!["pending_review", "approved_awaiting_payment"].includes(s.verificationStatus)) return fail("Nothing to reject.", 409);
            await ref.update({
                verificationStatus: "rejected", verificationRejectedReason: note,
                verificationRejectedAt: now, verificationRejectedBy: admin.email,
            });
            notice = { type: "verification_rejected", title: "Verification not approved", message: `Reason: ${note}` };
        }

        if (action === "revoke") {
            if (!note) return fail("A reason is required.", 400);
            if (s.isVerifiedSeller !== true) return fail("This seller has no blue check.", 409);
            await ref.update({
                isVerifiedSeller: false, verifiedUntil: FieldValue.delete(),
                verificationStatus: "none", // lets them apply again
                verifiedRevokedAt: now, verifiedRevokedBy: admin.email, verifiedRevokeReason: note,
            });
            notice = { type: "verification_revoked", title: "Verification removed", message: `Reason: ${note}` };
        }

        await Promise.all([
            adminDb.collection("notifications").add({ userId: uid, read: false, createdAt: now, ...notice }),
            adminDb.collection("admin_audit_logs").add({ action: `verification_${action}`, targetUid: uid, by: admin.email, reason: note || null, createdAt: now }),
        ]);
        return NextResponse.json({ success: true });
    } catch (e) {
        return fail(e.message, httpStatus(e));
    }
}