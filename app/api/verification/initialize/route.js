// app/api/verification/initialize/route.js
// POST { method: "flutterwave" | "wallet", returnPath?, pin? }  — only these two payment methods.
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { VERIFY_PRICE_NGN, VERIFY_DAYS, verificationUpdate } from "@/lib/server/grantSellerVerification";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

/** TODO: use the SAME transfer-PIN check your /api/wallet-withdraw route uses. Throws if wrong. */
async function checkTransferPin(uid, pin) {
    if (!/^\d{4}$/.test(pin)) throw new HttpError(400, "Enter your 4-digit PIN.");
    throw new HttpError(501, "Wallet PIN check is not connected yet.");
}

export async function POST(req) {
    try {
        const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
        if (!token) throw new HttpError(401, "Please sign in again.");
        const { uid, email } = await adminAuth.verifyIdToken(token);
        const body = await req.json();

        const [uSnap, sSnap] = await Promise.all([
            adminDb.collection("users").doc(uid).get(),
            adminDb.collection("sellers").doc(uid).get(),
        ]);
        const user = uSnap.data() || {};
        const seller = sSnap.data() || {};

        if (user.isSeller !== true) throw new HttpError(403, "Only sellers can get verified.");
        const isFaculty = user.isLecturer === true || ["lecturer", "faculty"].includes(user.role) || !!user.lecturerVerificationStatus;
        if (isFaculty) throw new HttpError(403, "Faculty are verified through the account process.");

        const txRef = `LANVER-${uid.slice(0, 6)}-${Date.now()}`;
        const payRef = adminDb.collection("verificationPayments").doc(txRef);
        const base = { uid, amount: VERIFY_PRICE_NGN, currency: "NGN", days: VERIFY_DAYS, method: body.method, createdAt: FieldValue.serverTimestamp() };

        if (body.method === "flutterwave") {
            const rp = typeof body.returnPath === "string" && body.returnPath.startsWith("/") && !body.returnPath.startsWith("//")
                ? body.returnPath.split("?")[0] : "/my-account/seller-account";
            await payRef.set({ ...base, status: "pending" });
            const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
            const res = await fetch("https://api.flutterwave.com/v3/payments", {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    tx_ref: txRef, amount: VERIFY_PRICE_NGN, currency: "NGN",
                    redirect_url: `${origin}${rp}?vf=1`,
                    customer: { email: email || user.email, name: seller.sellerName || user.displayName || "LAN Seller", phonenumber: user.phoneNumber || user.phone || undefined },
                    customizations: { title: "LAN Library", description: "Verified seller, 30 days" },
                    meta: { purpose: "seller_verification", uid },
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.data?.link) throw new HttpError(502, "Could not open Flutterwave. Try again.");
            return NextResponse.json({ link: json.data.link });
        }

        if (body.method === "wallet") {
            await checkTransferPin(uid, String(body.pin || ""));
            const sellerRef = adminDb.collection("sellers").doc(uid);
            let upd;
            await adminDb.runTransaction(async (tx) => {
                const s = await tx.get(sellerRef);
                if ((Number(s.data()?.accountBalance) || 0) < VERIFY_PRICE_NGN) throw new HttpError(402, "Your wallet balance is too low. Fund it or pay with Flutterwave.");
                upd = verificationUpdate(s.data()?.verifiedUntil);
                tx.update(sellerRef, { accountBalance: FieldValue.increment(-VERIFY_PRICE_NGN), ...upd });
                tx.set(payRef, { ...base, status: "completed", completedAt: FieldValue.serverTimestamp() });
            });
            return NextResponse.json({ success: true, verifiedUntil: upd.verifiedUntil.toMillis() });
        }

        throw new HttpError(400, "Choose Flutterwave or Wallet.");
    } catch (e) {
        return NextResponse.json({ error: e.status ? e.message : "Something went wrong. Try again." }, { status: e.status || 500 });
    }
}