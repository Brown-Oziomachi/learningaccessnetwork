// app/api/lan-bank/bank-transfer/route.js
import { NextResponse } from "next/server";
import https from "https";
import { getV3SecretKey } from "@/lib/flutterwaveToken";
import { getAdminDb, admin } from "@/lib/firebase-admin";

const OWNER_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",").map(e => e.trim());

// Reuse the same Node https helper pattern from your existing route
function flwRequest(method, path, secretKey, bodyObj = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = bodyObj ? JSON.stringify(bodyObj) : null;
        const options = {
            hostname: "api.flutterwave.com",
            path,
            method,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
            },
        };
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { reject(new Error(`Non-JSON response (${res.statusCode}): ${data.slice(0, 300)}`)); }
            });
        });
        req.on("error", reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

export async function POST(request) {
    try {
        // 1. Verify admin token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Missing admin credentials." }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);

        if (!OWNER_EMAILS.includes(decoded.email)) {
            return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
        }

        // 2. Parse body — all bank details come from the client (admin-only UI)
        const { sellerId, amount, narration, recipientBank } = await request.json();

        if (!recipientBank?.accountNumber || !recipientBank?.bankCode || !recipientBank?.accountName) {
            return NextResponse.json({ success: false, error: "Incomplete bank details." }, { status: 400 });
        }
        if (!amount || amount < 100) {
            return NextResponse.json({ success: false, error: "Minimum ₦100." }, { status: 400 });
        }

        const key = getV3SecretKey();
        const reference = `LAN-DIRECT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        // 3. Fire Flutterwave transfer
        const { data } = await flwRequest("POST", "/v3/transfers", key, {
            account_bank: recipientBank.bankCode,
            account_number: recipientBank.accountNumber,
            amount,
            narration: narration || "LAN Bank Direct Transfer",
            currency: "NGN",
            reference,
            debit_currency: "NGN",
            beneficiary_name: recipientBank.accountName,
        });

        if (data.status !== "success") {
            const msg = data.message?.toLowerCase() || "";
            const help = msg.includes("insufficient")
                ? "Fund your Flutterwave wallet at dashboard.flutterwave.com"
                : msg.includes("bank code") ? `Verify bank code: ${recipientBank.bankCode}`
                    : msg.includes("account") ? "Verify account number matches the selected bank"
                        : "";
            return NextResponse.json(
                { success: false, error: data.message || "Transfer failed", help },
                { status: 400 }
            );
        }

        const transferInfo = data.data;
        const db = getAdminDb();

        // 4. Log via Admin SDK — bypasses Firestore rules entirely
        await db.collection("adminBankTransfers").add({
            sellerId: sellerId || "admin",
            recipientBank,
            amount,
            narration: narration || "",
            reference: transferInfo.reference || reference,
            flutterwaveId: transferInfo.id || "",
            adminEmail: decoded.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "sent",
        });

        return NextResponse.json({
            success: true,
            reference: transferInfo.reference || reference,
            transferId: transferInfo.id,
            status: transferInfo.status,
        });

    } catch (err) {
        console.error("LAN Bank Direct Transfer Error:", err);
        return NextResponse.json({ success: false, error: err.message || "Internal error." }, { status: 500 });
    }
}