// app/api/verification/verify/route.js  — called after Flutterwave redirects back with ?vf=1&tx_ref=...
import { NextResponse } from "next/server";
import { confirmFlutterwavePayment } from "@/lib/server/grantSellerVerification";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req) {
    try {
        const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
        const { uid } = await adminAuth.verifyIdToken(token);
        const { tx_ref } = await req.json();
        if (!tx_ref) return NextResponse.json({ error: "Missing reference." }, { status: 400 });
        const r = await confirmFlutterwavePayment(tx_ref, uid);
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
        return NextResponse.json({ success: true, verifiedUntil: r.verifiedUntil });
    } catch {
        return NextResponse.json({ error: "Could not confirm the payment." }, { status: 401 });
    }
}