// lib/server/resolveNegotiatedPrice.js
export async function resolveNegotiatedPrice(adminDb, { negotiationId, uid, bookId, listPrice }) {
    if (!negotiationId) return { price: listPrice, ref: null };
    const ref = adminDb.collection("negotiations").doc(negotiationId);
    const s = await ref.get();
    const n = s.data();
    const clean = (v) => String(v || "").replace("firestore-", "");
    const exp = n?.expiresAt?.toMillis?.() ?? 0;
    if (!n || n.status !== "accepted" || (n.buyerId || n.buyerUid || n.userId) !== uid
        || clean(n.bookId) !== clean(bookId) || (exp && exp < Date.now())) throw new Error("This offer is no longer valid.");
    const price = [n.agreedPrice, n.acceptedPrice, n.finalPrice, n.counterPrice, n.offerPrice, n.amount].map(Number).find((v) => v > 0);
    if (!price) throw new Error("Offer has no agreed price.");
    return { price: Math.min(price, listPrice), ref };
}