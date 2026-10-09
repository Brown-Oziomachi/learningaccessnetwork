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
import { db, auth } from "@/lib/firebaseConfig";

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

async function callAdminBounty(action, bountyId, reason) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  const res = await fetch("/api/admin/bounty", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, bountyId, reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "REQUEST_FAILED");
  return data;
}

export const approveBountyFulfillment = (bountyId) =>
  callAdminBounty("approve", bountyId);
export const rejectBountyFulfillment = (
  bountyId,
  reason = "Does not meet requirements",
) => callAdminBounty("reject", bountyId, reason);
export const refundBountyEscrow = (bountyId, reason = "Refunded by admin") =>
  callAdminBounty("refund", bountyId, reason);
