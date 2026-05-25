/**
 * bountyEscrowService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all Firestore operations related to bounty escrow, wallet deduction,
 * and payout splitting. Every mutation that touches money is wrapped in a
 * runTransaction so failures roll back atomically.
 */

import {
  doc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  increment,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/* ─── Constants ─────────────────────────────────────────────── */
export const PLATFORM_FEE_PCT = 0.2; // 20% platform fee
export const AUTHOR_PCT = 0.8; // 80% to fulfilling author

/* ─────────────────────────────────────────────────────────────
   1.  Read a user's current wallet balance
   ───────────────────────────────────────────────────────────── */
export async function getWalletBalance(userId) {
  if (!userId) return 0;
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return 0;
  return snap.data().walletBalance ?? 0;
}

/* ─────────────────────────────────────────────────────────────
   2.  Subscribe to real-time wallet balance changes
       Returns an unsubscribe function.
   ───────────────────────────────────────────────────────────── */
export function subscribeToWalletBalance(userId, onChange) {
  if (!userId) {
    onChange(0);
    return () => {};
  }
  const ref = doc(db, "users", userId);
  return onSnapshot(ref, (snap) => {
    onChange(snap.exists() ? (snap.data().walletBalance ?? 0) : 0);
  });
}

/* ─────────────────────────────────────────────────────────────
   3.  Create a bounty with atomic wallet deduction + escrow lock
       Throws "INSUFFICIENT_FUNDS" if the wallet cannot cover it.
   ───────────────────────────────────────────────────────────── */
export async function createBountyWithEscrow({
  formData,
  userId,
  displayName,
}) {
  const bountyAmount = Number(formData.reward);
  if (!bountyAmount || bountyAmount <= 0)
    throw new Error("Invalid bounty amount");

  const userRef = doc(db, "users", userId);
  const escrowRef = doc(db, "platform_escrow", "main");
  const newBountyRef = doc(collection(db, "bounties"));

  await runTransaction(db, async (tx) => {
    /* ── read phase ── */
    const [userSnap, escrowSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(escrowRef),
    ]);

    if (!userSnap.exists()) throw new Error("USER_NOT_FOUND");

    const userData = userSnap.data();
    const walletBalance = userData.walletBalance ?? 0;
    const currentEscrow = escrowSnap.exists()
      ? (escrowSnap.data().totalHeld ?? 0)
      : 0;

    if (walletBalance < bountyAmount) throw new Error("INSUFFICIENT_FUNDS");

    // Resolve the poster's display name from Firestore
    const resolvedName =
      displayName?.trim() ||
      userData.displayName?.trim() ||
      userData.firstName?.trim() ||
      userData.name?.trim() ||
      userData.email?.split("@")[0] ||
      "Anonymous";

    const tags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    /* ── write phase ── */

    // 1. Deduct bounty amount from student wallet
    tx.update(userRef, {
      walletBalance: walletBalance - bountyAmount,
      updatedAt: serverTimestamp(),
    });

    // 2. Create the bounty document (status: open)
    tx.set(newBountyRef, {
      title: formData.title,
      university: formData.university || "",
      department: formData.department || "",
      reward: bountyAmount,
      rewardFmt: `₦${bountyAmount.toLocaleString("en-NG")}`,
      deadline: formData.deadline || "",
      deadlineLabel: formData.deadline
        ? `Closes ${new Date(formData.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
        : "Open",
      tags,
      status: "open",
      proposals: 0,
      maxProposals: 10,
      postedByUid: userId,
      postedBy: resolvedName,
      escrowAmount: bountyAmount,
      escrowLocked: true,
      claimedByUid: null,
      claimedBy: null,
      fulfilledByBookId: null,
      fulfilledByUid: null,
      fulfilledByName: null,
      linkedBookId: null,
      createdAt: serverTimestamp(),
    });

    // 3. Increment platform escrow balance
    tx.set(
      escrowRef,
      {
        totalHeld: currentEscrow + bountyAmount,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  return newBountyRef.id;
}

/* ─────────────────────────────────────────────────────────────
   4.  Claim a bounty (author/lecturer locks it to themselves)
   ───────────────────────────────────────────────────────────── */
export async function claimBounty(bountyId, claimantUid, claimantName) {
  const bountyRef = doc(db, "bounties", bountyId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(bountyRef);
    if (!snap.exists()) throw new Error("BOUNTY_NOT_FOUND");
    const bountyData = snap.data();
    if (!["open", "claimed"].includes(bountyData.status))
      throw new Error("BOUNTY_NOT_OPEN");

    // If already claimed by someone else, throw error
    if (bountyData.claimedByUid && bountyData.claimedByUid !== claimantUid) {
      throw new Error("ALREADY_CLAIMED_BY_OTHER");
    }

    tx.update(bountyRef, {
      status: "claimed",
      claimedByUid: claimantUid,
      claimedBy: claimantName,
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   5.  Fetch all bounties claimed by a specific user (lecturer/author)
       Used to populate the publishing flow dropdown.
   ───────────────────────────────────────────────────────────── */
export async function getClaimedBounties(userId) {
  if (!userId) return [];
  const q = query(
    collection(db, "bounties"),
    where("claimedByUid", "==", userId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => ["open", "claimed", "pending_approval"].includes(b.status));
}

/* ─────────────────────────────────────────────────────────────
   6.  Link a newly uploaded book to a bounty (called after book upload)
       Creates the book with status: "pending" and marks bounty as "pending_approval"
   ───────────────────────────────────────────────────────────── */
export async function linkBookToBounty(bookData, bountyId, user) {
  if (!bountyId || !user?.uid) throw new Error("bountyId and user required");

  // Resolve display name
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const displayName =
    userData.displayName ||
    userData.firstName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Author";

  // Create advertMyBook doc — status: "pending" (admin must approve)
  const bookRef = await addDoc(collection(db, "advertMyBook"), {
    ...bookData,
    userId: user.uid,
    sellerId: user.uid,
    sellerEmail: user.email,
    sellerName: displayName,
    bookTitle: bookData.title,
    bountyId,
    isBountyFulfillment: true,
    status: "pending", // ← admin approves before it goes live
    views: 0,
    purchases: 0,
    isGloballyFrozen: false,
    isPrintLicensingEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update bounty — pending_approval + linkedBookId
  await updateDoc(doc(db, "bounties", bountyId), {
    status: "pending_approval",
    linkedBookId: bookRef.id,
    fulfilledByUid: user.uid,
    fulfilledByName: displayName,
    fulfilledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return bookRef.id;
}

/* ─────────────────────────────────────────────────────────────
   7.  ADMIN APPROVES bounty fulfillment
       - Changes book status from "pending" → "approved"
       - Changes bounty status from "pending_approval" → "fulfilled"
       - Releases 80% payout to seller's wallet
       - Keeps 20% as platform fee
   ───────────────────────────────────────────────────────────── */
export async function approveBountyFulfillment(bountyId) {
  const bountyRef = doc(db, "bounties", bountyId);
  const escrowRef = doc(db, "platform_escrow", "main");

  await runTransaction(db, async (tx) => {
    /* ── read phase ── */
    const bountySnap = await tx.get(bountyRef);
    if (!bountySnap.exists()) throw new Error("BOUNTY_NOT_FOUND");

    const bounty = bountySnap.data();
    if (bounty.status !== "pending_approval")
      throw new Error("NOT_PENDING_APPROVAL");

    const escrowSnap = await tx.get(escrowRef);
    const currentHeld = escrowSnap.exists()
      ? (escrowSnap.data().totalHeld ?? 0)
      : 0;

    // Get seller (fulfiller) reference
    const sellerUid = bounty.fulfilledByUid;
    if (!sellerUid) throw new Error("NO_FULFILLER_FOUND");

    const sellerRef = doc(db, "users", sellerUid);
    const sellerSnap = await tx.get(sellerRef);

    // Get book to update its status
    const bookRef = bounty.linkedBookId
      ? doc(db, "advertMyBook", bounty.linkedBookId)
      : null;
    if (bookRef) {
      const bookSnap = await tx.get(bookRef);
      if (bookSnap.exists()) {
        tx.update(bookRef, {
          status: "approved", // ← book is now live for purchase
          updatedAt: serverTimestamp(),
        });
      }
    }

    const escrowAmount = bounty.escrowAmount ?? bounty.reward ?? 0;
    const authorPayout = Math.round(escrowAmount * AUTHOR_PCT);
    const platformFee = escrowAmount - authorPayout;

    /* ── write phase ── */

    // 1. Release seller's 80% payout to their wallet
    if (sellerSnap.exists()) {
      const currentBalance = sellerSnap.data().walletBalance ?? 0;
      tx.update(sellerRef, {
        walletBalance: currentBalance + authorPayout,
        totalEarned: increment(authorPayout),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create seller record if doesn't exist
      tx.set(sellerRef, {
        userId: sellerUid,
        walletBalance: authorPayout,
        totalEarned: authorPayout,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Mark bounty as fulfilled and unlock escrow
    tx.update(bountyRef, {
      status: "fulfilled", // ← bounty is now fulfilled
      escrowLocked: false,
      authorPayout,
      platformFee,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Decrement escrow ledger; accumulate released + fee totals
    tx.set(
      escrowRef,
      {
        totalHeld: Math.max(0, currentHeld - escrowAmount),
        totalReleased: increment(authorPayout),
        totalFees: increment(platformFee),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 4. Notify seller
    if (sellerUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: sellerUid,
        type: "bounty_approved",
        title: "Your Bounty Fulfillment Approved! 🎉",
        message: `₦${authorPayout.toLocaleString(
          "en-NG",
        )} has been credited to your wallet for "${bounty.title}".`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    // 5. Notify poster (student)
    if (bounty.postedByUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: bounty.postedByUid,
        type: "bounty_fulfilled",
        title: "Your Bounty Has Been Fulfilled! 📚",
        message: `"${bounty.title}" is now available for download. ${
          bounty.reward
            ? `You paid ₦${bounty.reward.toLocaleString("en-NG")}.`
            : ""
        }`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   8.  ADMIN REJECTS bounty fulfillment
       - Deletes the book or marks it as "rejected"
       - Returns bounty to "claimed" state for other bidders
       - Money stays in escrow (no payout)
   ───────────────────────────────────────────────────────────── */
export async function rejectBountyFulfillment(
  bountyId,
  reason = "Does not meet requirements",
) {
  const bountyRef = doc(db, "bounties", bountyId);

  await runTransaction(db, async (tx) => {
    const bountySnap = await tx.get(bountyRef);
    if (!bountySnap.exists()) throw new Error("BOUNTY_NOT_FOUND");

    const bounty = bountySnap.data();
    if (bounty.status !== "pending_approval")
      throw new Error("NOT_PENDING_APPROVAL");

    // Mark book as rejected
    if (bounty.linkedBookId) {
      const bookRef = doc(db, "advertMyBook", bounty.linkedBookId);
      const bookSnap = await tx.get(bookRef);
      if (bookSnap.exists()) {
        tx.update(bookRef, {
          status: "rejected",
          rejectionReason: reason,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Reset bounty to claimed state — other bidders can still submit
    tx.update(bountyRef, {
      status: "claimed", // ← back to claimed, awaiting next submission
      linkedBookId: null,
      fulfilledByUid: null,
      fulfilledByName: null,
      fulfilledAt: null,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    });

    // Notify fulfiller (seller) — rejection
    if (bounty.fulfilledByUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: bounty.fulfilledByUid,
        type: "bounty_rejected",
        title: "Bounty Fulfillment Rejected",
        message: `Your submission for "${bounty.title}" was rejected. Reason: ${reason}. You may resubmit.`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   9.  Refund bounty escrow (if bounty expires or is cancelled)
       Returns money to student, resets bounty status
   ───────────────────────────────────────────────────────────── */
export async function refundBountyEscrow(
  bountyId,
  reason = "Refunded by admin",
  refundedBy = "admin",
) {
  const bountyRef = doc(db, "bounties", bountyId);
  const escrowRef = doc(db, "platform_escrow", "main");

  await runTransaction(db, async (tx) => {
    /* ── read phase ── */
    const bountySnap = await tx.get(bountyRef);
    if (!bountySnap.exists()) throw new Error("BOUNTY_NOT_FOUND");

    const bounty = bountySnap.data();

    // Guard: only refund if the bounty is still active and escrow is locked
    const refundableStatuses = ["open", "claimed", "pending_approval"];
    if (!refundableStatuses.includes(bounty.status)) {
      throw new Error(
        `BOUNTY_NOT_REFUNDABLE: current status is "${bounty.status}"`,
      );
    }
    if (!bounty.escrowLocked) {
      throw new Error("ESCROW_ALREADY_RELEASED");
    }

    const escrowSnap = await tx.get(escrowRef);
    const currentHeld = escrowSnap.exists()
      ? (escrowSnap.data().totalHeld ?? 0)
      : 0;

    // Get poster's wallet
    const posterUid = bounty.postedByUid;
    const posterRef = posterUid ? doc(db, "users", posterUid) : null;
    const posterSnap = posterRef ? await tx.get(posterRef) : null;

    const escrowAmount = bounty.escrowAmount ?? bounty.reward ?? 0;

    /* ── write phase ── */

    // 1. Mark bounty refunded and unlock escrow
    tx.update(bountyRef, {
      status: "refunded",
      escrowLocked: false,
      escrowStatus: "refunded",
      escrowRefundedAt: serverTimestamp(),
      escrowRefundedBy: refundedBy,
      refundReason: reason,
      updatedAt: serverTimestamp(),
    });

    // 2. Return escrowAmount to the poster's walletBalance
    if (posterSnap?.exists()) {
      const currentBalance = posterSnap.data().walletBalance ?? 0;
      tx.update(posterRef, {
        walletBalance: currentBalance + escrowAmount,
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Decrement escrow ledger and track total refunded
    tx.set(
      escrowRef,
      {
        totalHeld: Math.max(0, currentHeld - escrowAmount),
        totalRefunded: increment(escrowAmount),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 4. Notify poster (student gets their money back)
    if (posterUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: posterUid,
        type: "bounty_refunded",
        title: "Bounty Refunded",
        message: `₦${escrowAmount.toLocaleString(
          "en-NG",
        )} has been returned to your wallet. Reason: ${reason}`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    // 5. Notify claimant if someone had claimed it
    const claimantUid = bounty.claimedByUid;
    if (claimantUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: claimantUid,
        type: "bounty_closed",
        title: "Bounty Closed",
        message: `The bounty "${bounty.title}" has been closed and refunded. Reason: ${reason}`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}
