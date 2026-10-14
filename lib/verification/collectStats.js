// lib/verification/collectStats.js
import { VERIFY_RULES } from "@/lib/verification/eligibility";
import { adminAuth } from "@/lib/firebase-admin";

const DAY = 86400000;
const TRUST_KYC_PHONE = true; // set false once you build a real phone OTP route
const toMs = (t) => t?.toMillis?.() ?? (t ? new Date(t).getTime() : 0);

export async function collectStats(db, uid, route) {
    const [userSnap, sellerSnap, kycSnap, subSnap] = await Promise.all([
        db.doc(`users/${uid}`).get(),
        db.doc(`sellers/${uid}`).get(),
        db.doc(`sellerKyc/${uid}`).get(),
        db.doc(`kycSubmissions/${uid}`).get(),
    ]);
    const u = userSnap.data() || {};
    const kyc = kycSnap.data() || {};
    const sub = subSnap.data() || {};
    const now = Date.now();

    const kycApproved = String(sub.status ?? "").trim().toLowerCase() === "approved";
    const photo = u.photoURL || u.photoBase64 || "";
    const hasProfilePhoto = !!photo && !photo.includes("lan-logo");

    const [a, b] = await Promise.all([
        db.collection("advertMyBook").where("sellerId", "==", uid).where("status", "==", "approved").get(),
        db.collection("advertMyBook").where("userId", "==", uid).where("status", "==", "approved").get(),
    ]);
    const approvedIds = new Set([...a.docs, ...b.docs].map((d) => d.id));

    const strikes = await db.collection("copyrightStrikes").where("sellerId", "==", uid).get();
    const lastStrike = strikes.docs.reduce((m, d) => Math.max(m, toMs(d.data().createdAt)), 0);

    const authCreated = Date.parse((await adminAuth.getUser(uid)).metadata.creationTime) || 0;
    const stats = {
                fullName: kyc.fullName || (kycApproved ? sub.fullName : "") || "",
        phoneVerified: kyc.phoneVerified === true || (TRUST_KYC_PHONE && kycApproved && !!sub.phone),
        idSubmitted: !!kyc.idImagePath || (kycApproved && !!sub.frontUrl),
        hasRealPhoto: kyc.photoApproved === true || (kycApproved && hasProfilePhoto),
        approvedBooks: approvedIds.size,
        accountAgeDays: authCreated ? Math.floor((now - authCreated) / DAY) : 0,
                        daysSinceLastStrike: lastStrike ? Math.floor((now - lastStrike) / DAY) : Infinity,
        realFollowers: 0,
        totalSalesNGN: 0,
    };

    if (route === "free") {
        const f = await db.collection("follows").where("lecturerId", "==", uid).limit(5000).get();
        const followerIds = [...new Set(f.docs.map((d) => d.data().followerId).filter((id) => id && id !== uid))];
        const minAge = VERIFY_RULES.free.followerMinAccountAgeDays * DAY;
        let real = 0;
              for (let i = 0; i < followerIds.length; i += 100) { // getUsers max is 100
            const res = await adminAuth.getUsers(followerIds.slice(i, i + 100).map((id) => ({ uid: id })));
            res.users.forEach((x) => {
                const old = now - Date.parse(x.metadata.creationTime) >= minAge;
                if (old && x.emailVerified && !x.disabled) real++;
            });
        }
        stats.realFollowers = real;

        const tx = await db.collection("transactions").where("sellerId", "==", uid).get();
        const PAID = ["completed", "success", "successful", "paid"]; // match what your webhook writes
        stats.totalSalesNGN = tx.docs.reduce((s, d) => {
            const x = d.data();
            if (!PAID.includes(String(x.status).toLowerCase()) || x.buyerId === uid) return s;
            return s + (Number(x.amount) || 0);
        }, 0);
        }

    return { stats, seller: sellerSnap.data() || {} };
}