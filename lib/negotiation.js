"use client";
/* ─────────────────────────────────────────────────────────────────────────
   LAN Library — price negotiation / student discount engine

   One doc per (book, buyer):  negotiations/{bookId}_{buyerId}

   status flow
   ───────────
   awaiting_seller ──accept──▶ agreed ──(payment)──▶ purchased
        │  │  └─decline──▶ declined
        │  └─counter──▶ awaiting_buyer ──accept──▶ agreed
        │                     └─decline──▶ buyer_declined
        └─withdraw──▶ withdrawn
   (any active status turns into "expired" on its own once expiresAtMs passes)
───────────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
    doc, collection, runTransaction, addDoc, updateDoc,
    onSnapshot, query, where, serverTimestamp,
} from "firebase/firestore";

/* ── timing rules ─────────────────────────────────────────────────────── */
const HOUR = 60 * 60 * 1000;
export const SELLER_WINDOW_MS = 48 * HOUR; // seller has 48h to answer a request
export const BUYER_WINDOW_MS = 24 * HOUR;  // buyer has 24h to answer a final price
export const LOCK_MS = 24 * HOUR;          // agreed price stays locked to that buyer
export const COOLDOWN_MS = 24 * HOUR;      // wait after a decline before asking again
export const PLATFORM_SHARE = 0.8;         // seller keeps 80%

export const ACTIVE = ["awaiting_seller", "awaiting_buyer", "agreed"];
const COOLDOWN_STATUSES = ["declined", "buyer_declined"];
const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

/* ── small helpers ────────────────────────────────────────────────────── */
export const naira = n => `₦${Math.round(Number(n) || 0).toLocaleString()}`;
export const negId = (bookId, buyerId) => `${String(bookId).replace("firestore-", "")}_${buyerId}`;
export const pctOff = (list, price) => (list > 0 ? Math.round((1 - price / list) * 100) : 0);
export const floorPriceOf = (list, maxPct) => Math.ceil(list * (1 - maxPct / 100));
const roundUp10 = n => Math.ceil(n / 10) * 10;

export function timeLeft(ms) {
    if (ms <= 0) return "expired";
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    if (h >= 1) return `${h}h ${m % 60}m`;
    if (m >= 1) return `${m}m`;
    return "under a minute";
}

/** Wording changes by mode so lecturers never look like they are haggling. */
export function wordsFor(mode) {
    return mode === "discount"
        ? { sellerThe: "The lecturer", buyerThe: "The student", sellerLc: "the lecturer", buyerLc: "the student" }
        : { sellerThe: "The seller", buyerThe: "The buyer", sellerLc: "the seller", buyerLc: "the buyer" };
}

export function effectiveStatus(n, now = Date.now()) {
    if (!n) return null;
    if (ACTIVE.includes(n.status) && n.expiresAtMs && now > n.expiresAtMs) return "expired";
    return n.status;
}

/** Can this buyer start a fresh request? */
export function reopenState(n, now = Date.now()) {
    if (!n) return { ok: true, waitMs: 0 };
    const st = effectiveStatus(n, now);
    if (ACTIVE.includes(st) || st === "purchased") return { ok: false, waitMs: 0, reason: st };
    if (COOLDOWN_STATUSES.includes(st)) {
        const wait = (n.closedAtMs || 0) + COOLDOWN_MS - now;
        if (wait > 0) return { ok: false, waitMs: wait, reason: "cooldown" };
    }
    return { ok: true, waitMs: 0 };
}

/** Who needs to act next? */
export function needsReply(n, uid, now = Date.now()) {
    const st = effectiveStatus(n, now);
    if (st === "awaiting_seller" && n.sellerId === uid) return true;
    if (st === "awaiting_buyer" && n.buyerId === uid) return true;
    return false;
}

export function statusLabel(n, uid, now = Date.now()) {
    const st = effectiveStatus(n, now);
    const isSeller = n.sellerId === uid;
    const w = wordsFor(n.mode);
    switch (st) {
        case "awaiting_seller": return isSeller
            ? { text: n.mode === "discount" ? "Review request" : "Offer received", tone: "action" }
            : { text: `Waiting for ${w.sellerLc}`, tone: "wait" };
        case "awaiting_buyer": return isSeller
            ? { text: `Waiting for ${w.buyerLc}`, tone: "wait" }
            : { text: n.mode === "discount" ? "Discount reply" : "Final price sent", tone: "action" };
        case "agreed": return { text: "Price locked", tone: "good" };
        case "purchased": return { text: "Purchased", tone: "good" };
        case "declined": case "buyer_declined": return { text: "Declined", tone: "closed" };
        case "withdrawn": return { text: "Withdrawn", tone: "closed" };
        default: return { text: "Expired", tone: "closed" };
    }
}

/* ── settings read from advertMyBook ──────────────────────────────────── */
export function getNegotiationSettings(raw, ownerTitle = "") {
    if (!raw) return { enabled: false };
    const price = Number(raw.price) || 0;
    const maxPct = Number(raw.maxDiscountPercent) || 0;
    const free = raw.isFree === true || raw.accessType === "free" || price === 0;
    const faculty = raw.intent
        ? raw.intent === "academic"
        : FACULTY_TITLES.some(t => String(ownerTitle || "").includes(t));
    return {
        enabled: raw.isNegotiable === true && maxPct > 0 && !free,
        maxPct,
        listPrice: price,
        mode: faculty ? "discount" : "negotiate",
        sellerId: raw.sellerId || raw.userId || null,
    };
}

/* ── option builders (this is what replaces free-text chat) ───────────── */
export function discountTiers(list, maxPct) {
    const base = [5, 10, 15, 20, 25, 30, 40, 50];
    const pcts = [...new Set([...base.filter(p => p < maxPct), maxPct])].sort((a, b) => a - b);
    return pcts.map(p => ({ pct: p, price: Math.ceil(list * (1 - p / 100)) }));
}

export function counterChoices({ mode, list, offered }) {
    let out = [];
    if (mode === "discount") {
        const req = pctOff(list, offered);
        const pcts = [...new Set([0.75, 0.5, 0.25].map(f => Math.floor(req * f)))].filter(p => p >= 1 && p < req);
        out = pcts.map(p => ({ pct: p, price: Math.ceil(list * (1 - p / 100)) }));
    } else {
        const gap = list - offered;
        const prices = [...new Set([0.25, 0.5, 0.75].map(f => Math.min(list, roundUp10(offered + gap * f))))];
        out = prices.map(p => ({ price: p, pct: pctOff(list, p) }));
    }
    return out.filter(o => o.price > offered && o.price < list).sort((a, b) => a.price - b.price);
}

/* ── notifications (shape assumed: adjust field names to your NotificationBell) ── */
async function notify(userId, { title, message, negotiationId, bookId, forRole }) {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            type: "negotiation",
            title,
            message,
            negotiationId,
            bookId,
            link: forRole === "seller"
                ? `/my-account/seller-account?negotiation=${negotiationId}`
                : `/book/preview?id=${bookId}&negotiation=${negotiationId}`,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (e) { console.warn("[negotiation] notify failed", e?.message); }
}

/* ── buyer opens a request ────────────────────────────────────────────── */
export async function submitOffer({ draft, buyer, price }) {
    const id = negId(draft.bookId, buyer.uid);
    const list = Number(draft.listPrice);
    const max = Number(draft.maxPct);
    const floor = floorPriceOf(list, max);
    const offer = Math.round(Number(price));

    if (buyer.uid === draft.sellerId) throw new Error("You cannot negotiate on your own document.");
    if (!Number.isFinite(offer) || offer < floor || offer >= list) {
        throw new Error(`Choose an amount between ${naira(floor)} and ${naira(list - 1)}.`);
    }

    const ref = doc(db, "negotiations", id);
    const now = Date.now();
    await runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        if (snap.exists()) {
            const r = reopenState(snap.data(), now);
            if (!r.ok) {
                if (r.reason === "cooldown") throw new Error(`You can ask again in ${timeLeft(r.waitMs)}.`);
                if (r.reason === "purchased") throw new Error("You already bought this document.");
                throw new Error("You already have an open request for this document.");
            }
        }
        tx.set(ref, {
            bookId: String(draft.bookId).replace("firestore-", ""),
            bookTitle: draft.bookTitle || "Document",
            bookCover: draft.cover || null,
            sellerId: draft.sellerId,
            sellerName: draft.sellerName || "Seller",
            buyerId: buyer.uid,
            buyerName: buyer.name || "Student",
            mode: draft.mode,
            listPrice: list,
            maxDiscountPercent: max,
            floorPrice: floor,
            status: "awaiting_seller",
            offeredPrice: offer,
            counterPrice: null,
            agreedPrice: null,
            expiresAtMs: now + SELLER_WINDOW_MS,
            closedAtMs: null,
            events: [{ by: "buyer", type: "offer", price: offer, at: now }],
            unread: { buyer: false, seller: true },
            presence: { buyer: now, seller: 0 },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });

    const isDisc = draft.mode === "discount";
    await notify(draft.sellerId, {
        title: isDisc ? "New discount request" : "New offer on your document",
        message: isDisc
            ? `${buyer.name || "A student"} asked for ${pctOff(list, offer)}% off "${draft.bookTitle}".`
            : `${buyer.name || "A buyer"} offered ${naira(offer)} for "${draft.bookTitle}".`,
        negotiationId: id, bookId: String(draft.bookId).replace("firestore-", ""), forRole: "seller",
    });
    return id;
}

/* ── one guarded transition (runs in a transaction so two people online
      at once can never both win) ─────────────────────────────────────── */
function need(cond, msg) { if (!cond) throw new Error(msg); }

async function mutate({ id, uid, role, fn }) {
    const ref = doc(db, "negotiations", id);
    const other = role === "seller" ? "buyer" : "seller";
    let note = null;

    await runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        need(snap.exists(), "This request no longer exists.");
        const n = snap.data();
        need((role === "seller" ? n.sellerId : n.buyerId) === uid, "You are not part of this negotiation.");
        const now = Date.now();
        const st = effectiveStatus(n, now);
        need(st !== "expired", "This request has expired.");
        const out = fn(n, st, now);
        tx.update(ref, {
            ...out.fields,
            events: [...(n.events || []), { by: role, at: now, ...out.event }],
            updatedAt: serverTimestamp(),
            [`unread.${other}`]: true,
            [`unread.${role}`]: false,
        });
        note = { to: other === "buyer" ? n.buyerId : n.sellerId, bookId: n.bookId, ...out.note };
    });

    if (note) await notify(note.to, { ...note, negotiationId: id, forRole: other });
}

export const sellerAccept = ({ id, uid }) => mutate({
    id, uid, role: "seller",
    fn: (n, st, now) => {
        need(st === "awaiting_seller", "This request has already been answered.");
        const disc = n.mode === "discount";
        return {
            fields: { status: "agreed", agreedPrice: n.offeredPrice, expiresAtMs: now + LOCK_MS },
            event: { type: "accepted", price: n.offeredPrice },
            note: {
                title: disc ? "Discount approved 🎉" : "Offer accepted 🎉",
                message: `"${n.bookTitle}" is yours for ${naira(n.offeredPrice)}. Complete payment within 24 hours.`,
            },
        };
    },
});

export const sellerCounter = ({ id, uid, price }) => mutate({
    id, uid, role: "seller",
    fn: (n, st, now) => {
        need(st === "awaiting_seller", "This request has already been answered.");
        const p = Math.round(Number(price));
        need(Number.isFinite(p) && p > n.offeredPrice && p <= n.listPrice,
            `Final price must be above ${naira(n.offeredPrice)} and at most ${naira(n.listPrice)}.`);
        const disc = n.mode === "discount";
        return {
            fields: { status: "awaiting_buyer", counterPrice: p, expiresAtMs: now + BUYER_WINDOW_MS },
            event: { type: "counter", price: p },
            note: {
                title: disc ? "Your discount request has a reply" : "Final price from the seller",
                message: disc
                    ? `${pctOff(n.listPrice, p)}% off "${n.bookTitle}" (${naira(p)}). Reply within 24 hours.`
                    : `${naira(p)} for "${n.bookTitle}". Reply within 24 hours.`,
            },
        };
    },
});

export const sellerDecline = ({ id, uid }) => mutate({
    id, uid, role: "seller",
    fn: (n, st, now) => {
        need(st === "awaiting_seller", "This request has already been answered.");
        return {
            fields: { status: "declined", closedAtMs: now },
            event: { type: "declined" },
            note: {
                title: n.mode === "discount" ? "Discount not available" : "Offer declined",
                message: `"${n.bookTitle}" stays at ${naira(n.listPrice)} for now.`,
            },
        };
    },
});

export const buyerAccept = ({ id, uid }) => mutate({
    id, uid, role: "buyer",
    fn: (n, st, now) => {
        need(st === "awaiting_buyer", "There is no price waiting for your answer.");
        return {
            fields: { status: "agreed", agreedPrice: n.counterPrice, expiresAtMs: now + LOCK_MS },
            event: { type: "accepted", price: n.counterPrice },
            note: {
                title: "Buyer accepted your price",
                message: `${n.buyerName} accepted ${naira(n.counterPrice)} for "${n.bookTitle}". Waiting for payment.`,
            },
        };
    },
});

export const buyerDecline = ({ id, uid }) => mutate({
    id, uid, role: "buyer",
    fn: (n, st, now) => {
        need(st === "awaiting_buyer", "There is no price waiting for your answer.");
        return {
            fields: { status: "buyer_declined", closedAtMs: now },
            event: { type: "declined" },
            note: { title: "Final price declined", message: `${n.buyerName} passed on ${naira(n.counterPrice)} for "${n.bookTitle}".` },
        };
    },
});

export const buyerWithdraw = ({ id, uid }) => mutate({
    id, uid, role: "buyer",
    fn: (n, st, now) => {
        need(st === "awaiting_seller", "You can only withdraw while waiting for a reply.");
        return {
            fields: { status: "withdrawn", closedAtMs: now },
            event: { type: "withdrawn" },
            note: { title: "Request withdrawn", message: `${n.buyerName} withdrew their request for "${n.bookTitle}".` },
        };
    },
});

/* ── presence + read receipts ─────────────────────────────────────────── */
export async function touchPresence(id, role) {
    try { await updateDoc(doc(db, "negotiations", id), { [`presence.${role}`]: Date.now() }); } catch { }
}
export async function markRead(id, role) {
    try { await updateDoc(doc(db, "negotiations", id), { [`unread.${role}`]: false }); } catch { }
}

/* ── hooks ────────────────────────────────────────────────────────────── */
export function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}

export function useNegotiation(id) {
    const [state, setState] = useState({ neg: null, loading: !!id });
    useEffect(() => {
        if (!id) { setState({ neg: null, loading: false }); return; }
        setState(s => ({ ...s, loading: true }));
        return onSnapshot(
            doc(db, "negotiations", id),
            snap => setState({ neg: snap.exists() ? { id: snap.id, ...snap.data() } : null, loading: false }),
            () => setState({ neg: null, loading: false })
        );
    }, [id]);
    return state;
}

/** Every negotiation the user is part of (as seller or as buyer), newest first. */
export function useMyNegotiations(uid) {
    const [asSeller, setAsSeller] = useState([]);
    const [asBuyer, setAsBuyer] = useState([]);
    useEffect(() => {
        if (!uid) { setAsSeller([]); setAsBuyer([]); return; }
        const map = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const u1 = onSnapshot(query(collection(db, "negotiations"), where("sellerId", "==", uid)), s => setAsSeller(map(s)), () => { });
        const u2 = onSnapshot(query(collection(db, "negotiations"), where("buyerId", "==", uid)), s => setAsBuyer(map(s)), () => { });
        return () => { u1(); u2(); };
    }, [uid]);
    const ms = n => n.updatedAt?.toMillis?.() ?? Date.now();
    const items = [...asSeller, ...asBuyer]
        .filter((n, i, a) => a.findIndex(x => x.id === n.id) === i)
        .sort((a, b) => ms(b) - ms(a));
    return { items };
}

/** Number of negotiations waiting on this user (use for a badge). */
export function useNegotiationBadge(uid) {
    const { items } = useMyNegotiations(uid);
    const now = useNow(30000);
    return items.filter(n => needsReply(n, uid, now)).length;
}