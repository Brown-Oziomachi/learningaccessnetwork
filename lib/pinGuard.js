import { adminDb } from "@/lib/firebase-admin";
import { checkPin, hasAnyPin } from "@/lib/pinStore";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30 * 60 * 1000;

export async function verifyPinWithLockout(uid, rawPin) {
    const pin = String(rawPin ?? "").trim();
    if (!/^\d{4}$/.test(pin)) return { ok: false, status: 400, error: "Enter your 4-digit PIN." };

    const sellerRef = adminDb.collection("sellers").doc(uid);
    const privRef = adminDb.collection("sellerPrivate").doc(uid);

    return adminDb.runTransaction(async (t) => {
        const [sellerSnap, privSnap] = await Promise.all([t.get(sellerRef), t.get(privRef)]);
        const seller = sellerSnap.data() || {};
        const priv = privSnap.exists ? privSnap.data() : {};
        const now = Date.now();

        if (priv.lockedUntil && now < priv.lockedUntil)
            return { ok: false, status: 429, error: "Too many wrong attempts. Try again later." };
        if (!hasAnyPin({ seller, priv }))
            return { ok: false, status: 400, error: "Set your transfer PIN first." };

        const result = checkPin({ uid, pin, seller, priv });
        if (!result.ok) {
            const attempts = (priv.attempts || 0) + 1;
            const lock = attempts >= MAX_ATTEMPTS;
            t.set(privRef, { attempts: lock ? 0 : attempts, lockedUntil: lock ? now + LOCK_MS : null }, { merge: true });
            return { ok: false, status: 400, error: `Incorrect PIN.${lock ? " Locked for 30 minutes." : ""}` };
        }
        t.set(privRef, { attempts: 0, lockedUntil: null }, { merge: true });
        return { ok: true };
    });
}