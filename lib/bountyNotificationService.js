/**
 * bountyNotificationService.js  — LAN Library
 * ─────────────────────────────────────────────────────────────────
 * Quota-safe version:
 *
 *  notifyAllUsersNewBounty(bounty, posterName)
 *    → Writes ONE global broadcast doc to "globalNotifications".
 *    → Sends ONE admin email (no per-user blast).
 *    → Cost: 2 ops per bounty post.
 *
 *  notifyPosterBountyBid(bounty, bidderName)
 *    → Writes one notification doc for the poster only.
 *    → Sends one email to the poster only.
 *    → Cost: 2 reads + 1 write per bid.
 *
 * Notification schemas:
 *
 *  globalNotifications (collection) — for new bounty broadcasts:
 *  {
 *    type, title, message, link, bountyId,
 *    reward, posterName, university, department,
 *    read: false, createdAt
 *  }
 *
 *  notifications (collection) — per-user, for bids only:
 *  {
 *    userId, type, title, message, link,
 *    bountyId, read: false, createdAt
 *  }
 *
 * The link field is always /academic/bounty/board?highlight=<bountyId>
 * so clicking the notification bell takes the user straight to the card.
 */

import {
    collection,
    addDoc,
    serverTimestamp,
    getDoc,
    doc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const BASE_URL =
    typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://learningaccessnetwork.vercel.app";

/* ─── helpers ────────────────────────────────────────────────── */
function bountyLink(bountyId) {
    return `/academic/bounty/board?highlight=${bountyId}`;
}

/**
 * Fire-and-forget email via /api/send-seller-notification.
 * Never throws — just logs on failure so it never blocks the UI.
 */
async function sendBountyEmail(to, type, payload) {
    try {
        await fetch(`${BASE_URL}/api/send-seller-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, to, ...payload }),
        });
    } catch (e) {
        console.warn("[BountyNotify] email send failed:", e?.message);
    }
}

/* ─────────────────────────────────────────────────────────────
   notifyAllUsersNewBounty
   Called immediately after a bounty is created.
   Writes one global broadcast doc + sends one admin email.
   ───────────────────────────────────────────────────────────── */
export async function notifyAllUsersNewBounty(bounty, posterName) {
    if (!bounty?.id) return;

    const link = bountyLink(bounty.id);
    const rewardFmt = `₦${Number(bounty.reward).toLocaleString("en-NG")}`;

    /* ── 1 write: global broadcast doc ── */
    try {
        await addDoc(collection(db, "globalNotifications"), {
            type: "new_bounty",
            title: "New Bounty Posted on the Board 💰",
            message: `${posterName || "A student"} posted a ${rewardFmt} bounty: "${bounty.title}". Be the first to claim it!`,
            link,
            bountyId: bounty.id,
            reward: bounty.reward,
            posterName: posterName || "A student",
            university: bounty.university || "",
            department: bounty.department || "",
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("[BountyNotify] global notification failed:", e?.message);
    }

    /* ── 1 email: admin alert only (no per-user blast) ── */
    try {
        const ctaUrl = `${BASE_URL}${link}`;
        await sendBountyEmail("lanlibrarydocs@gmail.com", "new_bounty", {
            posterName,
            bountyTitle: bounty.title,
            reward: bounty.reward,
            university: bounty.university,
            department: bounty.department,
            ctaUrl,
        });
    } catch (e) {
        console.warn("[BountyNotify] admin email failed:", e?.message);
    }
}

/* ─────────────────────────────────────────────────────────────
   notifyPosterBountyBid
   Called when a seller claims / bids on a bounty.
   Writes one in-app notification to the poster + emails them.
   ───────────────────────────────────────────────────────────── */
export async function notifyPosterBountyBid(bounty, bidderName) {
    if (!bounty?.postedByUid) return;

    const link = bountyLink(bounty.id);
    const title = `Someone bid on your bounty! 🎯`;
    const message = `${bidderName || "An author"} has claimed your bounty: "${bounty.title}" and will upload the requested material. You'll be notified once it's ready.`;

    /* ── 1 write: per-user dashboard notification for poster ── */
    try {
        await addDoc(collection(db, "notifications"), {
            userId: bounty.postedByUid,
            type: "bounty_bid",
            title,
            message,
            link,
            bountyId: bounty.id,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("[BountyNotify] poster notification failed:", e?.message);
    }

    /* ── 1 email: poster only ── */
    try {
        const posterSnap = await getDoc(doc(db, "users", bounty.postedByUid));
        const posterData = posterSnap.exists() ? posterSnap.data() : {};
        const posterEmail = posterData.email;
        const posterName =
            posterData.displayName ||
            posterData.firstName ||
            "Student";

        if (posterEmail) {
            await sendBountyEmail(posterEmail, "bounty_bid", {
                posterName,
                bidderName,
                bountyTitle: bounty.title,
                reward: bounty.reward,
                university: bounty.university,
                department: bounty.department,
                ctaUrl: `${BASE_URL}${link}`,
            });
        }
    } catch (e) {
        console.warn("[BountyNotify] poster email failed:", e?.message);
    }
}