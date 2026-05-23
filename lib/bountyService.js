// lib/bountyService.js
// All Firebase operations for the Bounty Board

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    increment,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const BOUNTIES_COL = "bounties";

/* ─── CREATE ─────────────────────────────────────────────────── */
/**
 * Post a new bounty request.
 * @param {object} data  - form fields from <CreateModal>
 * @param {object} user  - Firebase Auth user object
 * @returns {Promise<string>} - new document ID
 */
export async function createBounty(data, user) {
    const ref = await addDoc(collection(db, BOUNTIES_COL), {
        title: data.title.trim(),
        university: data.university.trim().toUpperCase(),
        department: data.department.trim(),
        reward: Number(data.reward),
        rewardFmt: `₦${Number(data.reward).toLocaleString("en-NG")}`,
        deadline: data.deadline || null,       // ISO date string
        status: "open",
        postedBy: user.displayName || "Anonymous",
        postedById: user.uid,
        postedByEmail: user.email,
        tags: data.tags || [],
        proposals: 0,
        maxProposals: data.maxProposals || 10,
        createdAt: serverTimestamp(),
        fulfilledAt: null,
        fulfilledBy: null,
    });
    return ref.id;
}

/* ─── READ (one-time) ─────────────────────────────────────────── */
export async function fetchBounties({ status = null, limitN = 50 } = {}) {
    let q = collection(db, BOUNTIES_COL);
    const constraints = [orderBy("createdAt", "desc"), limit(limitN)];
    if (status) constraints.unshift(where("status", "==", status));
    q = query(q, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ─── READ (real-time) ───────────────────────────────────────── */
/**
 * Subscribe to live bounty updates.
 * @param {function} callback  - called with array of bounties on every change
 * @param {string|null} status - filter by status, or null for all
 * @returns unsubscribe function
 */
export function subscribeToBounties(callback, status = null) {
    const constraints = [orderBy("createdAt", "desc")];
    if (status) constraints.unshift(where("status", "==", status));
    const q = query(collection(db, BOUNTIES_COL), ...constraints);
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                // Derive a human-readable deadline label
                deadlineLabel: deriveDDLabel(data.deadline, data.status),
            };
        });
        callback(list);
    });
}

/* ─── READ (latest N open — for home page popup) ─────────────── */
export function subscribeToLatestOpenBounties(callback, n = 5) {
    const q = query(
        collection(db, BOUNTIES_COL),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(n)
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

/* ─── UPDATE — mark fulfilled ─────────────────────────────────── */
export async function fulfillBounty(bountyId, fulfilledByUser) {
    await updateDoc(doc(db, BOUNTIES_COL, bountyId), {
        status: "fulfilled",
        fulfilledAt: serverTimestamp(),
        fulfilledBy: fulfilledByUser.uid,
        fulfilledByName: fulfilledByUser.displayName || "Anonymous",
    });
}

/* ─── UPDATE — increment proposals ───────────────────────────── */
export async function incrementProposals(bountyId) {
    await updateDoc(doc(db, BOUNTIES_COL, bountyId), {
        proposals: increment(1),
    });
}

/* ─── HELPERS ─────────────────────────────────────────────────── */
function deriveDDLabel(deadline, status) {
    if (status === "fulfilled") return "Completed";
    if (!deadline) return "No deadline";
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / 86_400_000);
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
}