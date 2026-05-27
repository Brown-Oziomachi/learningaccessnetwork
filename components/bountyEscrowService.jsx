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
  const sellerRef = doc(db, "sellers", userId);
  const escrowRef = doc(db, "platform_escrow", "main");
  const newBountyRef = doc(collection(db, "bounties"));

  await runTransaction(db, async (tx) => {
    /* ── read phase ── */
    const [userSnap, sellerSnap, escrowSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(sellerRef),
      tx.get(escrowRef),
    ]);

    if (!userSnap.exists()) throw new Error("USER_NOT_FOUND");

    const userData = userSnap.data();
    const walletBalance = userData.walletBalance ?? 0;
    const currentEscrow = escrowSnap.exists()
      ? (escrowSnap.data().totalHeld ?? 0)
      : 0;

    if (walletBalance < bountyAmount) throw new Error("INSUFFICIENT_FUNDS");

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

    // 1. Deduct from users/walletBalance
    tx.update(userRef, {
      walletBalance: walletBalance - bountyAmount,
      updatedAt: serverTimestamp(),
    });

    // 2. Also deduct from sellers/accountBalance (keeps dashboard in sync)
    if (sellerSnap.exists()) {
      const sellerBal = sellerSnap.data().accountBalance ?? 0;
      tx.update(sellerRef, {
        accountBalance: Math.max(0, sellerBal - bountyAmount),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Create the bounty document (status: open)
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

    // 4. Increment platform escrow balance
    tx.set(
      escrowRef,
      { totalHeld: currentEscrow + bountyAmount, updatedAt: serverTimestamp() },
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
    if (bountyData.claimedByUid && bountyData.claimedByUid !== claimantUid)
      throw new Error("ALREADY_CLAIMED_BY_OTHER");

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
   5.  Fetch all bounties claimed by a specific user
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
   6.  Link a newly uploaded book to a bounty
   ───────────────────────────────────────────────────────────── */
export async function linkBookToBounty(bookData, bountyId, user) {
  if (!bountyId || !user?.uid) throw new Error("bountyId and user required");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const displayName =
    userData.displayName ||
    userData.firstName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Author";

  const bookRef = await addDoc(collection(db, "advertMyBook"), {
    ...bookData,
    userId: user.uid,
    sellerId: user.uid,
    uploadedByUid: user.uid,
    sellerEmail: user.email,
    sellerName: displayName,
    bookTitle: bookData.bookTitle || bookData.title,
    bountyId,
    isBountyFulfillment: true,
    status: "pending",
    views: 0,
    purchases: 0,
    isGloballyFrozen: false,
    isPrintLicensingEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "bounties", bountyId), {
    [`bidderBooks.${user.uid}`]: bookRef.id,
    status: "pending_approval",
    fulfilledAt: serverTimestamp(),
    fulfilledByUid: user.uid,
    fulfilledByName: displayName,
    updatedAt: serverTimestamp(),
  });

  return bookRef.id;
}

/* ─────────────────────────────────────────────────────────────
   7.  ADMIN APPROVES bounty fulfillment
       ★ Now also:
         - Updates sellers/accountBalance so the payout appears in
           the seller dashboard balance card immediately.
         - Writes a `transactions` doc so the payout row shows in
           fetchSellerTransactions without any extra queries.
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

    const sellerUid = bounty.fulfilledByUid;
    if (!sellerUid) throw new Error("NO_FULFILLER_FOUND");

    const sellerUserRef = doc(db, "users", sellerUid);
    const sellerAccRef = doc(db, "sellers", sellerUid);

    const [sellerUserSnap, sellerAccSnap] = await Promise.all([
      tx.get(sellerUserRef),
      tx.get(sellerAccRef),
    ]);

    // Approve the book
    const bookId = bounty.linkedBookId || bounty.bidderBooks?.[sellerUid];
    if (bookId) {
      const bookRef = doc(db, "advertMyBook", bookId);
      const bookSnap = await tx.get(bookRef);
      if (bookSnap.exists()) {
        tx.update(bookRef, {
          status: "approved",
          updatedAt: serverTimestamp(),
        });
      }
    }

    const escrowAmount = bounty.escrowAmount ?? bounty.reward ?? 0;
    const authorPayout = Math.round(escrowAmount * AUTHOR_PCT);
    const platformFee = escrowAmount - authorPayout;

    /* ── write phase ── */

    // 1. Credit users/walletBalance
    if (sellerUserSnap.exists()) {
      tx.update(sellerUserRef, {
        walletBalance:
          (sellerUserSnap.data().walletBalance ?? 0) + authorPayout,
        totalEarned: increment(authorPayout),
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(sellerUserRef, {
        userId: sellerUid,
        walletBalance: authorPayout,
        totalEarned: authorPayout,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. ★ Credit sellers/accountBalance (dashboard balance card)
    if (sellerAccSnap.exists()) {
      tx.update(sellerAccRef, {
        accountBalance:
          (sellerAccSnap.data().accountBalance ?? 0) + authorPayout,
        totalEarnings: increment(authorPayout),
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(sellerAccRef, {
        sellerId: sellerUid,
        accountBalance: authorPayout,
        totalEarnings: authorPayout,
        booksSold: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Mark bounty fulfilled
    tx.update(bountyRef, {
      status: "fulfilled",
      escrowLocked: false,
      authorPayout,
      platformFee,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. Update escrow ledger
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

    // 5. ★ Write a `transactions` doc so fetchSellerTransactions picks it up
    //    even on accounts that existed before this fix.
    const txRef = doc(collection(db, "transactions"));
    tx.set(txRef, {
      sellerId: sellerUid,
      type: "bounty_payout",
      bookTitle: `🎯 Bounty Reward — ${bounty.title || "Bounty"}`,
      buyerName: bounty.postedBy || "Student",
      amount: escrowAmount,
      sellerAmount: authorPayout,
      sellerPayout: authorPayout,
      platformFee,
      salePrice: escrowAmount,
      bountyId,
      status: "completed",
      source: "bounty_escrow",
      createdAt: serverTimestamp(),
    });

    // 6. Notify seller (in-app)
    if (sellerUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: sellerUid,
        type: "bounty_approved",
        title: "Your Bounty Fulfillment Approved! 🎉",
        message: `₦${authorPayout.toLocaleString("en-NG")} has been credited to your wallet for "${bounty.title}".`,
        bountyId,
        link: `/academic/bounty/board?highlight=${bountyId}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    // 7. Notify poster (in-app)
    if (bounty.postedByUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: bounty.postedByUid,
        type: "bounty_fulfilled",
        title: "Your Bounty Has Been Fulfilled! 📚",
        message: `"${bounty.title}" is now available for download.${bounty.reward ? ` You paid ₦${bounty.reward.toLocaleString("en-NG")}.` : ""}`,
        bountyId,
        link: `/academic/bounty/board?highlight=${bountyId}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   8.  ADMIN REJECTS bounty fulfillment
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

    tx.update(bountyRef, {
      status: "claimed",
      linkedBookId: null,
      fulfilledByUid: null,
      fulfilledByName: null,
      fulfilledAt: null,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    });

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
   9.  Refund bounty escrow
   ───────────────────────────────────────────────────────────── */
export async function refundBountyEscrow(
  bountyId,
  reason = "Refunded by admin",
  refundedBy = "admin",
) {
  const bountyRef = doc(db, "bounties", bountyId);
  const escrowRef = doc(db, "platform_escrow", "main");

  await runTransaction(db, async (tx) => {
    const bountySnap = await tx.get(bountyRef);
    if (!bountySnap.exists()) throw new Error("BOUNTY_NOT_FOUND");

    const bounty = bountySnap.data();

    const refundableStatuses = ["open", "claimed", "pending_approval"];
    if (!refundableStatuses.includes(bounty.status))
      throw new Error(
        `BOUNTY_NOT_REFUNDABLE: current status is "${bounty.status}"`,
      );
    if (!bounty.escrowLocked) throw new Error("ESCROW_ALREADY_RELEASED");

    const escrowSnap = await tx.get(escrowRef);
    const currentHeld = escrowSnap.exists()
      ? (escrowSnap.data().totalHeld ?? 0)
      : 0;

    const posterUid = bounty.postedByUid;
    const posterRef = posterUid ? doc(db, "users", posterUid) : null;
    const posterSnap = posterRef ? await tx.get(posterRef) : null;

    const escrowAmount = bounty.escrowAmount ?? bounty.reward ?? 0;

    tx.update(bountyRef, {
      status: "refunded",
      escrowLocked: false,
      escrowStatus: "refunded",
      escrowRefundedAt: serverTimestamp(),
      escrowRefundedBy: refundedBy,
      refundReason: reason,
      updatedAt: serverTimestamp(),
    });

    if (posterSnap?.exists()) {
      tx.update(posterRef, {
        walletBalance: (posterSnap.data().walletBalance ?? 0) + escrowAmount,
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(
      escrowRef,
      {
        totalHeld: Math.max(0, currentHeld - escrowAmount),
        totalRefunded: increment(escrowAmount),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (posterUid) {
      const notifRef = doc(collection(db, "notifications"));
      tx.set(notifRef, {
        userId: posterUid,
        type: "bounty_refunded",
        title: "Bounty Refunded",
        message: `₦${escrowAmount.toLocaleString("en-NG")} has been returned to your wallet. Reason: ${reason}`,
        bountyId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

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
