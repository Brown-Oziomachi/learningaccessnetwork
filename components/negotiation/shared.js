// Save as: components/negotiation/shared.js
import { auth } from "@/lib/firebaseConfig";

export const NAVY = "#0d2244";
export const GOLD = "#b8963e";
export const CREAM = "#f5f0e8";
export const ACTIVE = ["pending", "countered", "accepted"];

export const ms = (t) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);
export const isLive = (n) => ACTIVE.includes(n.status) && ms(n.expiresAt) > Date.now();
export const when = (t) =>
    new Date(ms(t)).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// POSTs to our own API with the user's Firebase ID token
export async function negotiationCall(path, body) {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in first.");
    const token = await user.getIdToken();
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
}

export const pill = (bg, color) => ({
    display: "inline-flex", alignItems: "center", gap: 6, background: bg, color,
    padding: "4px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
    fontFamily: "'Lato',sans-serif",
});

export const btn = (primary, disabled) => ({
    padding: "11px 16px",
    border: primary ? "none" : `1px solid ${NAVY}`,
    background: primary ? NAVY : "#fff",
    color: primary ? "#fff" : NAVY,
    fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "'Lato',sans-serif",
});