import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs"; // use "bcrypt" instead if that's what npm ls showed

const pepper = () => {
    if (!process.env.PIN_PEPPER) throw new Error("PIN_PEPPER is not set");
    return process.env.PIN_PEPPER;
};

export const hashPin = (uid, pin) =>
    crypto.createHmac("sha256", pepper()).update(`${uid}:${String(pin).trim()}`).digest("hex");

export const hashOtp = (uid, otp) =>
    crypto.createHmac("sha256", pepper()).update(`otp:${uid}:${String(otp).trim()}`).digest("hex");

export const safeEq = (a, b) => {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const hasAnyPin = ({ seller, priv }) =>
    !!(priv?.pinHash || seller?.transactionPin || seller?.transferPin);

export function checkPin({ uid, pin, seller, priv }) {
    const p = String(pin ?? "").trim();

    if (typeof priv?.pinHash === "string" && /^\$2[aby]\$/.test(priv.pinHash)) {
        let ok = false;
        try { ok = bcrypt.compareSync(p, priv.pinHash); } catch { ok = false; }
        return { ok, legacy: false };
    }

    if (priv?.pinHash) return { ok: safeEq(hashPin(uid, p), priv.pinHash), legacy: false };
    const legacy = seller?.transactionPin || seller?.transferPin;
    if (legacy) return { ok: safeEq(p, String(legacy).trim()), legacy: true };
    return { ok: false, legacy: false };
}