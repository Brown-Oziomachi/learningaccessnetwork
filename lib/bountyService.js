/**
 * bountyService.js  — LAN Library
 * -----------------------------------------------------------------
 * Fixes:
 *  1. createBounty  → resolves real name from Firestore (never "Anonymous")
 *                   → fires notifyAllUsersNewBounty after creation
 *  2. claimBountyWithNotification → notifies poster on bid
 *  3. getClaimedBounties → array-contains + scalar fallback
 */

// Update the existing import line in bountyService.js
import {
    collection, addDoc, serverTimestamp, onSnapshot,
    query, orderBy, doc, updateDoc, increment,
    where, getDocs, getDoc, arrayUnion, limit, 
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
    notifyAllUsersNewBounty,
    notifyPosterBountyBid,
} from "@/lib/bountyNotificationService";

/* helpers */
const fmt = (n) => `₦${Number(n).toLocaleString("en-NG")}`;

const deadlineLabel = (dateStr) => {
    if (!dateStr) return "Open deadline";
    const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
    if (diff < 0) return "Expired";
    if (diff === 0) return "Closes today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
};

// Add this to bountyService.js

export function subscribeToLatestOpenBounties(callback, limitCount = 4) {
  return onSnapshot(
    query(
      collection(db, "bounties"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
    ),
    (snap) => {
      const all = snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        rewardFmt: fmt(d.data().reward || 0),
        deadlineLabel: deadlineLabel(d.data().deadline),
      }));
      const open = all.filter(
        (b) => (b.proposals || 0) < (b.maxProposals || 10)
      );
      callback(open);
    }
  );
}


async function resolveDisplayName(userId, authUser) {
    let name = authUser?.displayName?.trim();
    try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
            const p = snap.data();
            const fromProfile =
                p.displayName?.trim() ||
                [p.firstName?.trim(), (p.surname || p.lastName)?.trim()]
                    .filter(Boolean).join(" ");
            if (fromProfile) name = fromProfile;
        }
    } catch { }
    return name || authUser?.email?.split("@")[0] || "Student";
}

/* createBounty */
export async function createBounty(formData, authUser) {
    if (!authUser) throw new Error("Not authenticated");
    const postedBy = await resolveDisplayName(authUser.uid, authUser);
    const tags = Array.isArray(formData.tags)
        ? formData.tags
        : (formData.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const reward = Number(formData.reward) || 0;

    const payload = {
        title: formData.title?.trim() || "",
        university: formData.university?.trim() || "",
        department: formData.department?.trim() || "",
        reward, rewardFmt: fmt(reward),
        deadline: formData.deadline || null,
        deadlineLabel: deadlineLabel(formData.deadline),
        tags,
        postedBy, postedByUid: authUser.uid,
        paymentRef: formData.paymentRef || null,
        paymentMethod: formData.paymentMethod || "flutterwave",
        contactEmail: formData.contactEmail || authUser.email || null,
        contactPhone: formData.contactPhone || null,
        escrowAmount: reward, escrowLocked: true, escrowStatus: "locked",
        status: "open", proposals: 0, maxProposals: 10,
        claimedBy: [], claimedByUid: null, claimedByName: null, linkedBookId: null,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "bounties"), payload);
    notifyAllUsersNewBounty({ ...payload, id: ref.id }, postedBy)
        .catch((e) => console.warn("[bountyService] notify failed:", e?.message));
    return ref.id;
}

/* subscribeToBounties */
export function subscribeToBounties(callback) {
    return onSnapshot(
        query(collection(db, "bounties"), orderBy("createdAt", "desc")),
        (snap) => callback(snap.docs.map((d) => ({
            id: d.id, ...d.data(),
            rewardFmt: fmt(d.data().reward || 0),
            deadlineLabel: deadlineLabel(d.data().deadline),
        })))
    );
}

/* incrementProposals */
export async function incrementProposals(bountyId) {
    await updateDoc(doc(db, "bounties", bountyId), {
        proposals: increment(1), updatedAt: serverTimestamp(),
    });
}

export async function claimBountyWithNotification(bountyId, userId, authUser) {
    if (!bountyId || !userId) throw new Error("bountyId and userId required");
    const claimerName = await resolveDisplayName(userId, authUser);
    const bountyRef = doc(db, "bounties", bountyId);
    const bountySnap = await getDoc(bountyRef);
    if (!bountySnap.exists()) throw new Error("BOUNTY_NOT_FOUND");
    const bountyData = bountySnap.data();

    if (bountyData.status === "fulfilled") throw new Error("BOUNTY_FULFILLED");
    if (!["open", "claimed", "pending_approval"].includes(bountyData.status)) throw new Error("BOUNTY_NOT_OPEN");

    const alreadyBid = (bountyData.claimedBy || []).includes(userId);
    if (alreadyBid) throw new Error("ALREADY_BID");

    await updateDoc(bountyRef, {
        claimedBy: arrayUnion(userId),
        bidderNames: { ...(bountyData.bidderNames || {}), [userId]: claimerName },
        updatedAt: serverTimestamp(),
    });

    notifyPosterBountyBid({ ...bountyData, id: bountyId }, claimerName)
        .catch((e) => console.warn("[bountyService] bid notify failed:", e?.message));
    return claimerName;
}

/* getClaimedBounties */
export async function getClaimedBounties(userId) {
    if (!userId) return [];
    try {
        // Only query by claimedBy array — covers all bidders regardless of who bid first
        const snap = await getDocs(
            query(
                collection(db, "bounties"),
                where("claimedBy", "array-contains", userId)
            )
        );

        return snap.docs
            .map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    rewardFmt: fmt(data.reward || 0),
                    deadlineLabel: deadlineLabel(data.deadline),
                };
            })
            // Show all bounties the user has bid on that aren't yet fulfilled
            .filter((b) => ["open", "claimed", "pending_approval"].includes(b.status));
    } catch (err) {
        console.error("getClaimedBounties error:", err);
        return [];
    }
}