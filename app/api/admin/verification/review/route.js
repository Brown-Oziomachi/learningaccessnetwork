// GET ?uid=  (admin only) -> live requirement checks + KYC + stats snapshot
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, httpStatus, plain } from "@/lib/verification/adminGuard";
import { collectStats } from "@/lib/verification/collectStats";
import { evaluateVerification } from "@/lib/verification/eligibility";

export async function GET(req) {
    try {
        await requireAdmin(req);
        const uid = new URL(req.url).searchParams.get("uid");
        if (!uid) return NextResponse.json({ success: false, error: "uid required" }, { status: 400 });

        const [sellerSnap, kycSnap] = await Promise.all([
            adminDb.doc(`sellers/${uid}`).get(),
            adminDb.doc(`kycSubmissions/${uid}`).get(),
        ]);
        if (!sellerSnap.exists) return NextResponse.json({ success: false, error: "Seller not found" }, { status: 404 });

        const seller = sellerSnap.data();
        const route = seller.verificationRoute === "free" ? "free" : "paid";
        const { stats } = await collectStats(adminDb, uid, route);
        const result = evaluateVerification(route, stats);

        return NextResponse.json(plain({
            success: true,
            route,
            status: seller.verificationStatus || "none",
            rejectedReason: seller.verificationRejectedReason || null,
            appliedAt: seller.verificationAppliedAt || null,
            snapshot: seller.verificationSnapshot || null,
            live: stats,
            eligible: !!result.eligible,
            checks: result.checks || [],
            kyc: kycSnap.exists ? kycSnap.data() : null,
        }));
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: httpStatus(e) });
    }
}