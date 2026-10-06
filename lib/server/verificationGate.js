// lib/server/verificationGate.js  (server only)
// One rule, used by the initialize route (before taking money), the wallet transaction,
// and confirmFlutterwavePayment (before granting the badge).

/** @returns {{ok:true}|{ok:false,status:number,error:string}} */
export function canPay(seller) {
    const status = seller?.verificationStatus;
    const route = seller?.verificationRoute;
    if (route === "free" && status === "verified") {
        return { ok: false, status: 400, error: "Your verification is free. There is nothing to pay." };
    }
    const approved = status === "approved_awaiting_payment" && route === "paid";
    const renewal = status === "verified" && route === "paid"; // revoked / rejected / none are blocked
    if (!approved && !renewal) {
        return { ok: false, status: 403, error: "Finish the verification checklist and get approved before paying." };
    }
    return { ok: true };
}