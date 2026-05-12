/**
 * lib/adsCache.js
 *
 * Module-level singleton — the first FeaturedAdsCarousel that mounts
 * fires ONE Firestore query. Every other instance on the same page
 * waits for that same promise, so you never make duplicate network calls.
 *
 * Cache resets after 2 minutes so fresh data arrives on long sessions.
 */

import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

let _promise = null;
let _resolvedAt = null;

export async function fetchActiveAds() {
    const now = Date.now();

    // Return cached promise if it's still fresh
    if (_promise && _resolvedAt && now - _resolvedAt < CACHE_TTL_MS) {
        return _promise;
    }

    // Fetch ALL promotions — filter status + expiry in JS
    // (avoids needing a composite Firestore index, and handles
    //  both "active" and "approved" status values)
    _promise = getDocs(query(collection(db, "promotions"))).then((snap) => {
        _resolvedAt = Date.now();
        const nowDate = new Date();

        return snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((ad) => {
                // Accept both "active" and "approved"
                if (!["active", "approved"].includes(ad.status)) return false;

                // If no expiryDate set, treat ad as valid indefinitely
                if (!ad.expiryDate) return true;

                const exp = ad.expiryDate?.toDate
                    ? ad.expiryDate.toDate()
                    : new Date(ad.expiryDate);

                return exp > nowDate;
            });
    });

    return _promise;
}

/** Call this if you need to force a refresh (e.g. admin just approved an ad) */
export function bustAdsCache() {
    _promise = null;
    _resolvedAt = null;
}