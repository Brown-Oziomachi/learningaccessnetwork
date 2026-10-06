// lib/verification/eligibility.js
// Single source of truth for verification rules. Safe to import on client AND server.
// The client uses it to show progress. The server re-computes from Firestore and decides.
// Never trust a client-computed result.

export const VERIFY_RULES = {
    identity: true, // required on BOTH routes
    paid: {
        priceNGN: 2000,        // per month, charged ONLY after admin approval
        minApprovedBooks: 10,
        minAccountAgeDays: 14,
        noStrikeDays: 30,
    },
    free: {
        minRealFollowers: 1000,
        minApprovedBooks: 30,
        minTotalSalesNGN: 50000,
        minAccountAgeDays: 14,
        noStrikeDays: 60,
        // a follower only counts if their account is at least this old and phone/email verified
        followerMinAccountAgeDays: 14,
    },
};

/**
 * stats = {
 *   fullName, phoneVerified, idSubmitted, hasRealPhoto,   // identity
 *   approvedBooks, accountAgeDays, daysSinceLastStrike,   // quality (daysSinceLastStrike = Infinity if none)
 *   realFollowers, totalSalesNGN                          // free route only
 * }
 * Returns { checks: [{id, group, label, have, need, ok}], identityOk, qualityOk, eligible }
 */
export function evaluateVerification(route, stats) {
    const r = VERIFY_RULES[route];
    if (!r) throw new Error("Unknown verification route");

    const identity = [
        { id: "name", label: "Full legal name", ok: !!stats.fullName },
        { id: "phone", label: "Phone number verified by OTP", ok: !!stats.phoneVerified },
        { id: "id", label: "NIN or student ID card photo (kept private)", ok: !!stats.idSubmitted },
        { id: "photo", label: "Clear profile photo of you (no cartoons or logos)", ok: !!stats.hasRealPhoto },
    ].map((c) => ({ ...c, group: "identity" }));

    const quality = [
        {
            id: "books", label: `${r.minApprovedBooks} approved books`,
            have: stats.approvedBooks, need: r.minApprovedBooks,
            ok: stats.approvedBooks >= r.minApprovedBooks,
        },
        {
            id: "age", label: `Account older than ${r.minAccountAgeDays} days`,
            have: stats.accountAgeDays, need: r.minAccountAgeDays,
            ok: stats.accountAgeDays >= r.minAccountAgeDays,
        },
        {
            id: "strikes", label: `No copyright strike in the last ${r.noStrikeDays} days`,
            have: stats.daysSinceLastStrike === Infinity ? null : stats.daysSinceLastStrike,
            need: r.noStrikeDays,
            ok: stats.daysSinceLastStrike >= r.noStrikeDays,
        },
    ].map((c) => ({ ...c, group: "quality" }));

    if (route === "free") {
        quality.push(
            {
                id: "followers", group: "quality", label: `${r.minRealFollowers.toLocaleString()} real followers`,
                have: stats.realFollowers, need: r.minRealFollowers, ok: stats.realFollowers >= r.minRealFollowers,
            },
            {
                id: "sales", group: "quality", label: `₦${r.minTotalSalesNGN.toLocaleString()} total sales`,
                have: stats.totalSalesNGN, need: r.minTotalSalesNGN, ok: stats.totalSalesNGN >= r.minTotalSalesNGN,
            }
        );
    }

    const identityOk = identity.every((c) => c.ok);
    const qualityOk = quality.every((c) => c.ok);
    return { checks: [...identity, ...quality], identityOk, qualityOk, eligible: identityOk && qualityOk };
}

/**
 * Public badge test. Reads ONLY fields the server wrote.
 * Replace every `seller.paidVerified || followerCount >= FREE_VERIFY_FOLLOWERS` with this.
 */
export function isSellerVerified(seller) {
    // Same semantics as your existing paidVerificationActive(): no expiry = free route / admin-granted.
    if (!seller || seller.isVerifiedSeller !== true) return false;
    const u = seller.verifiedUntil;
    const until = u?.toMillis?.() ?? (u?.seconds ? u.seconds * 1000 : u ? new Date(u).getTime() : 0);
    return !until || until > Date.now();
}

// Application lifecycle stored at sellers/{uid}.verificationStatus (server-written only)
// none -> pending_review -> approved_awaiting_payment (paid route) -> verified
//                        -> verified                  (free route, admin approves)
//                        -> rejected (with reason)