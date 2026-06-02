"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    collection, query, where, getDocs, doc, getDoc,
    updateDoc, addDoc, runTransaction, serverTimestamp, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useCurrency } from "@/app/context/CurrencyContext";

/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── Helpers ───────────────────────────────────────────────── */
function timeAgo(d) {
    if (!d) return "";
    const s = (Date.now() - (d instanceof Date ? d : new Date(d))) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

function Avatar({ name = "?", size = 32 }) {
    const initials = name.split(" ").map(n => n[0] || "").slice(0, 2).join("").toUpperCase() || "?";
    const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: `hsl(${hue},42%,22%)`, border: `1.5px solid hsl(${hue},50%,38%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.33, fontWeight: 900, color: `hsl(${hue},70%,80%)`,
            fontFamily: "'Lato',sans-serif", flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   RELEASE FUNDS MODAL
══════════════════════════════════════════════════════════ */
function ReleaseFundsModal({ bounty, bidder, user, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const payout = Math.round((bounty.reward || 0) * 0.8);
    const fee = Math.round((bounty.reward || 0) * 0.2);

    const handleRelease = async () => {
        if (!bidder?.uid) { setError("No bidder selected."); return; }
        setLoading(true); setError("");
        try {
            await runTransaction(db, async (txn) => {
                const authorRef = doc(db, "sellers", bidder.uid);
                const platformRef = doc(db, "sellers", "LAN_LIBRARY_PLATFORM");
                const bountyRef = doc(db, "bounties", bounty.id);

                const [authorSnap, platformSnap] = await Promise.all([
                    txn.get(authorRef),
                    txn.get(platformRef),
                ]);

                if (authorSnap.exists()) {
                    txn.update(authorRef, {
                        accountBalance: (authorSnap.data().accountBalance || 0) + payout,
                        totalEarnings: (authorSnap.data().totalEarnings || 0) + payout,
                        updatedAt: serverTimestamp(),
                    });
                }

                if (platformSnap.exists()) {
                    txn.update(platformRef, {
                        accountBalance: (platformSnap.data().accountBalance || 0) + fee,
                        totalFeesCollected: (platformSnap.data().totalFeesCollected || 0) + fee,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    txn.set(platformRef, {
                        accountBalance: fee, totalFeesCollected: fee,
                        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                    });
                }

                const feeRef = doc(collection(db, "platformFees"));
                txn.set(feeRef, {
                    source: "bounty_escrow",
                    bountyId: bounty.id,
                    bountyTitle: bounty.title,
                    sellerId: bidder.uid,
                    sellerName: bidder.name || "",
                    postedBy: bounty.postedBy || "",
                    postedById: bounty.postedByUid || user?.uid,
                    salePrice: bounty.reward,
                    fee,
                    sellerPayout: payout,
                    disbursedToFlutterwave: false,
                    createdAt: serverTimestamp(),
                });

                txn.update(bountyRef, {
                    status: "fulfilled",
                    escrowStatus: "released",
                    fulfilledByUid: bidder.uid,
                    fulfilledByName: bidder.name || "",
                    escrowReleasedAt: serverTimestamp(),
                    authorPayout: payout,
                    platformFee: fee,
                });

                const authorNotifRef = doc(collection(db, "notifications"));
                txn.set(authorNotifRef, {
                    userId: bidder.uid,
                    type: "bounty_paid",
                    title: `Bounty Approved — ${bounty.title}`,
                    message: `₦${payout.toLocaleString()} has been credited to your wallet. Great work!`,
                    createdAt: serverTimestamp(), read: false,
                });
            });

            onSuccess();
        } catch (e) {
            setError("Failed to release funds: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "rgba(7,19,31,.82)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, backdropFilter: "blur(4px)",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", maxWidth: 460, width: "100%",
                border: "0.5px solid #e5ddd0",
                animation: "fadeUp .28s cubic-bezier(.4,0,.2,1) both",
            }}>
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                    backgroundSize: "20px 20px",
                    padding: "20px 24px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                }}>
                    <div>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Escrow Release</p>
                        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>Approve &amp; Release Funds</h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", fontSize: 22, lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: CREAM, border: "0.5px solid rgba(184,150,62,.25)", marginBottom: 20 }}>
                        <Avatar name={bidder?.name || "?"} size={40} />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{bidder?.name || "Unknown Bidder"}</p>
                            <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                Bid {bidder?.bidAt ? timeAgo(bidder.bidAt?.toDate?.() || new Date(bidder.bidAt)) : "recently"}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, background: CREAM, border: `1.5px solid ${GOLD}44`, padding: "14px 16px" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Author Receives (80%)</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#16a34a", lineHeight: 1 }}>
                                <span style={{ fontSize: 13, color: GOLD }}>₦</span>{payout.toLocaleString("en-NG")}
                            </div>
                        </div>
                        <div style={{ flex: 1, background: "rgba(13,34,68,.04)", border: "0.5px solid #e5ddd0", padding: "14px 16px" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Platform Fee (20%)</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#ccc", lineHeight: 1 }}>
                                <span style={{ fontSize: 13, color: "#ddd" }}>₦</span>{fee.toLocaleString("en-NG")}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "12px 14px", background: "rgba(13,34,68,.04)", border: "0.5px solid rgba(13,34,68,.1)", marginBottom: 16 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>Bounty</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.4 }}>{bounty.title}</p>
                    </div>

                    <div style={{ padding: "10px 14px", background: "rgba(245,158,11,.06)", border: "0.5px solid rgba(245,158,11,.3)", marginBottom: 16, display: "flex", gap: 8 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p style={{ fontSize: 11, color: "#b45309", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.65 }}>
                            <strong>This action is irreversible.</strong> Once approved, funds are released immediately to the author's wallet.
                        </p>
                    </div>

                    {error && (
                        <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "0.5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: "12px", background: "#f5f5f5", color: "#666",
                            border: "0.5px solid #e5ddd0", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", fontFamily: "'Lato',sans-serif",
                        }}>Cancel</button>
                        <button
                            onClick={handleRelease}
                            disabled={loading}
                            style={{
                                flex: 2, padding: "12px 16px",
                                background: loading ? "#ccc" : "#16a34a",
                                color: "#fff", border: "none",
                                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "'Lato',sans-serif",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                                    Releasing…
                                </>
                            ) : (
                                <>✅ Approve &amp; Release ₦{payout.toLocaleString("en-NG")}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════════════════
   MY SUBMISSIONS PANEL
══════════════════════════════════════════════════════════ */
function MySubmissionsPanel({ user, onClose }) {
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        (async () => {
            try {
                const q = query(
                    collection(db, "bounties"),
                    where("claimedBy", "array-contains", user.uid)
                );
                const snap = await getDocs(q);
                const list = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const ta = a.createdAt?.toDate?.() || 0;
                        const tb = b.createdAt?.toDate?.() || 0;
                        return tb - ta;
                    });
                setBounties(list);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.uid]);

    const statusColor = (b) => {
        if (b.status === "fulfilled" && b.fulfilledByUid === user.uid) return "#16a34a";
        if (b.status === "fulfilled") return "#aaa";
        if (b.status === "pending_approval") return "#b45309";
        return GOLD;
    };

    const statusLabel = (b) => {
        if (b.status === "fulfilled" && b.fulfilledByUid === user.uid) return "✅ You won — Paid";
        if (b.status === "fulfilled") return "Fulfilled by someone else";
        if (b.status === "pending_approval") return "⏳ Under Review";
        return "🟢 Open — Upload to win";
    };

    return createPortal(
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "rgba(7,19,31,.72)",
            zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, backdropFilter: "blur(4px)",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", maxWidth: 520, width: "100%",
                border: "0.5px solid #e5ddd0", maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                animation: "fadeUp .28s both",
            }}>
                <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div>
                        <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Bounties</p>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>My Submissions</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "'Lato',sans-serif", margin: "3px 0 0" }}>Bounties you've claimed and bid on</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
                </div>

                <div style={{ overflowY: "auto", flex: 1, background: BG }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                            <div style={{ width: 32, height: 32, border: `2px solid rgba(184,150,62,.3)`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                        </div>
                    ) : bounties.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 24px" }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>No submissions yet</h3>
                            <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 24px" }}>
                                Bounties you claim will appear here. Go to the Bounty Board to find open requests.
                            </p>
                            <a href="/academic/bounty/board" onClick={onClose} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "12px 24px", background: GOLD, color: NAVY,
                                fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
                                textTransform: "uppercase", fontFamily: "'Lato',sans-serif",
                                textDecoration: "none",
                            }}>
                                Browse Bounty Board →
                            </a>
                        </div>
                    ) : (
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            {bounties.map(b => {
                                const payout = Math.round((b.reward || 0) * 0.8);
                                const isWinner = b.fulfilledByUid === user.uid;
                                return (
                                    <div key={b.id} style={{
                                        background: "#fff",
                                        border: `0.5px solid ${isWinner ? "rgba(22,163,74,.4)" : "#e5ddd0"}`,
                                        borderLeft: `3px solid ${statusColor(b)}`,
                                        padding: "16px",
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                                            <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.35, flex: 1 }}>{b.title}</h4>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(b), whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                                                {statusLabel(b)}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                            {b.university && (
                                                <span style={{ fontSize: 9, fontWeight: 700, background: NAVY, color: GOLDD, padding: "2px 8px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                                    {b.university}
                                                </span>
                                            )}
                                            <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                                Posted by {b.postedBy}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <span style={{ fontSize: 9, color: "#ccc", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
                                                    {isWinner ? "You earned" : "Potential earn"}
                                                </span>
                                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: isWinner ? "#16a34a" : NAVY }}>
                                                    ₦{payout.toLocaleString("en-NG")}
                                                </span>
                                            </div>

                                            {b.status === "fulfilled" && isWinner ? (
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,.1)", border: "0.5px solid rgba(22,163,74,.3)", padding: "6px 14px", fontFamily: "'Lato',sans-serif" }}>
                                                    ✅ Paid Out
                                                </span>
                                            ) : b.status !== "fulfilled" ? (
                                                <a href="/library/publish" onClick={onClose} style={{
                                                    display: "inline-flex", alignItems: "center", gap: 6,
                                                    padding: "8px 14px", background: NAVY, color: "#fff",
                                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                                                    textTransform: "uppercase", fontFamily: "'Lato',sans-serif",
                                                    textDecoration: "none",
                                                }}>
                                                    📤 Upload Now
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Closed</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ padding: "12px 16px", borderTop: "0.5px solid #f0ebe0", flexShrink: 0 }}>
                    <button onClick={onClose} style={{
                        width: "100%", padding: "11px", background: NAVY, color: "#fff",
                        border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Lato',sans-serif",
                    }}>Close</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════════════════
   FULFILLMENT REVIEW MODAL
══════════════════════════════════════════════════════════ */
function FulfillmentReviewModal({ bounty, bidder, user, onClose, onApproved, onDisputed }) {
    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("doc");
    const [disputeReason, setDisputeReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const payout = Math.round((bounty.reward || 0) * 0.8);

    useEffect(() => {
        if (!bidder?.linkedBookId) { setLoading(false); return; }
        (async () => {
            try {
                const cleanId = bidder.linkedBookId.replace("firestore-", "");
                const snap = await getDoc(doc(db, "advertMyBook", cleanId));
                if (snap.exists()) setBookData({ id: snap.id, ...snap.data() });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [bidder?.linkedBookId]);

    const docUrl = bookData?.pdfUrl || bookData?.pdfLink || bookData?.fileUrl || null;
    const isGoogleDrive = docUrl?.includes("drive.google.com");
    const embedUrl = docUrl
        ? isGoogleDrive
            ? docUrl.replace("/view", "/preview").replace("/edit", "/preview")
            : docUrl
        : null;

    const handleApprove = async () => {
        setSubmitting(true); setError("");
        try {
            await runTransaction(db, async (txn) => {
                const authorRef = doc(db, "sellers", bidder.uid);
                const platformRef = doc(db, "sellers", "LAN_LIBRARY_PLATFORM");
                const bountyRef = doc(db, "bounties", bounty.id);
                const [authorSnap, platformSnap] = await Promise.all([
                    txn.get(authorRef), txn.get(platformRef),
                ]);
                const fee = Math.round((bounty.reward || 0) * 0.2);

                if (authorSnap.exists()) {
                    txn.update(authorRef, {
                        accountBalance: (authorSnap.data().accountBalance || 0) + payout,
                        totalEarnings: (authorSnap.data().totalEarnings || 0) + payout,
                        updatedAt: serverTimestamp(),
                    });
                }
                if (platformSnap.exists()) {
                    txn.update(platformRef, {
                        accountBalance: (platformSnap.data().accountBalance || 0) + fee,
                        totalFeesCollected: (platformSnap.data().totalFeesCollected || 0) + fee,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    txn.set(platformRef, {
                        accountBalance: fee, totalFeesCollected: fee,
                        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                    });
                }
                txn.set(doc(collection(db, "platformFees")), {
                    source: "bounty_escrow",
                    bountyId: bounty.id, bountyTitle: bounty.title,
                    sellerId: bidder.uid, sellerName: bidder.name || "",
                    postedBy: bounty.postedBy || "", postedById: bounty.postedByUid || user?.uid,
                    salePrice: bounty.reward, fee, sellerPayout: payout,
                    disbursedToFlutterwave: false, createdAt: serverTimestamp(),
                });
                txn.update(bountyRef, {
                    status: "fulfilled", escrowStatus: "released",
                    fulfilledByUid: bidder.uid, fulfilledByName: bidder.name || "",
                    escrowReleasedAt: serverTimestamp(),
                    authorPayout: payout, platformFee: fee,
                });
                if (bidder.linkedBookId) {
                    const cleanId = bidder.linkedBookId.replace("firestore-", "");
                    txn.update(doc(db, "advertMyBook", cleanId), {
                        status: "approved", reviewedAt: serverTimestamp(),
                        reviewedBy: user?.uid || "owner",
                    });
                }
                txn.set(doc(collection(db, "notifications")), {
                    userId: bidder.uid, type: "bounty_paid",
                    title: `Bounty Approved — ${bounty.title}`,
                    message: `₦${payout.toLocaleString()} has been credited to your wallet. Great work!`,
                    createdAt: serverTimestamp(), read: false,
                });
            });
            try {
                const { doc: fd, getDoc: gd, updateDoc: ud, arrayUnion } = await import("firebase/firestore");
                if (bidder?.linkedBookId && user?.uid) {
                    const cleanId = bidder.linkedBookId.replace("firestore-", "");
                    // Fetch book details
                    const bookSnap = await gd(fd(db, "advertMyBook", cleanId));
                    if (bookSnap.exists()) {
                        const bk = bookSnap.data();
                        const userRef = fd(db, "users", user.uid);
                        const userSnap = await gd(userRef);
                        if (userSnap.exists()) {
                            const savedBooks = userSnap.data().savedBooks || [];
                            const alreadySaved = savedBooks.some(b => b.id === cleanId || b.id === `firestore-${cleanId}`);
                            if (!alreadySaved) {
                                await ud(userRef, {
                                    savedBooks: arrayUnion({
                                        id: `firestore-${cleanId}`,
                                        title: bk.bookTitle || bk.title || "Untitled",
                                        author: bk.author || bk.sellerName || "Unknown",
                                        price: bk.price || 0,
                                        savedAt: new Date().toISOString(),
                                        image: bk.coverImage || "",
                                    })
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("Save book failed:", e.message);
            }
            onApproved(); 
            // Redirect to saved books page
            if (typeof window !== "undefined") {
                window.location.href = "/my-book";
            }        } catch (e) {
            setError("Failed to release funds: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

   const handleDispute = async () => {
    if (!disputeReason.trim()) { setError("Please provide a reason."); return; }
    setSubmitting(true); setError("");
    try {
        await updateDoc(doc(db, "bounties", bounty.id), {
            [`disputes.${bidder.uid}`]: {
                reason: disputeReason.trim(),
                disputedAt: new Date().toISOString(),
                disputedByUid: user?.uid,
                bidderUid: bidder.uid,
                bidderName: bidder.name,
            },
            updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, "adminNotifications"), {
            type: "bounty_disputed",
            title: `Bounty Disputed: ${bounty.title}`,
            message: `Reason: ${disputeReason.trim()} · Poster: ${bounty.postedBy} · Author: ${bidder.name}`,
            bountyId: bounty.id, reward: bounty.reward,
            disputedByUid: user?.uid,
            createdAt: serverTimestamp(), read: false,
        });
        await addDoc(collection(db, "notifications"), {
            userId: bidder.uid, type: "bounty_disputed",
            title: `Submission Disputed — ${bounty.title}`,
            message: `The requester raised a dispute: "${disputeReason.trim()}". An admin will review.`,
            createdAt: serverTimestamp(), read: false,
        });
        onDisputed();
    } catch (e) {
        setError("Failed to submit dispute: " + e.message);
    } finally {
        setSubmitting(false);
    }
};

    return createPortal(
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "rgba(7,19,31,.88)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, backdropFilter: "blur(6px)",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", width: "100%", maxWidth: 680,
                maxHeight: "94vh", display: "flex", flexDirection: "column",
                border: "0.5px solid #e5ddd0",
                animation: "fadeUp .3s cubic-bezier(.4,0,.2,1) both",
            }}>
                {/* Header */}
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                    backgroundSize: "20px 20px",
                    padding: "18px 22px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexShrink: 0,
                }}>
                    <div>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>
                            Fulfillment Review
                        </p>
                        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3, maxWidth: 500 }}>
                            {bounty.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <Avatar name={bidder?.name || "?"} size={18} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontFamily: "'Lato',sans-serif" }}>
                                Submitted by <strong style={{ color: GOLDD }}>{bidder?.name}</strong>
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", fontSize: 24, lineHeight: 1, marginLeft: 12, flexShrink: 0 }}>×</button>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "0.5px solid #e5ddd0", flexShrink: 0, background: CREAM }}>
                    {[
                        { key: "doc", label: "📄 View Document" },
                        { key: "approve", label: "✅ Approve & Pay" },
                        { key: "dispute", label: "🚩 Dispute" },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => { setView(key); setError(""); }}
                            style={{
                                flex: 1, padding: "11px 8px", border: "none",
                                borderBottom: view === key ? `2.5px solid ${key === "dispute" ? "#ef4444" : GOLD}` : "2.5px solid transparent",
                                background: view === key ? "#fff" : "transparent",
                                fontSize: 11, fontWeight: 700, cursor: "pointer",
                                color: view === key ? (key === "dispute" ? "#dc2626" : NAVY) : "#aaa",
                                fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
                                transition: "all .15s",
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

                    {view === "doc" && (
                        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 420 }}>
                            {loading ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: 48 }}>
                                    <div style={{ width: 32, height: 32, border: `2px solid rgba(184,150,62,.3)`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                                </div>
                            ) : !bookData ? (
                                <div style={{ padding: 32, textAlign: "center" }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                                    <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>No document linked to this submission yet.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ padding: "14px 20px", background: CREAM, borderBottom: "0.5px solid #e5ddd0", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {bookData.bookTitle || bookData.title || "Untitled Document"}
                                            </p>
                                            <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                by {bookData.author || bookData.sellerName || "Unknown"} · {bookData.category || "Academic"}
                                            </p>
                                        </div>
                                    </div>

                                    {embedUrl ? (
                                        <div style={{ position: "relative" }}>
                                            {/* Page 1 */}
                                            <div style={{ height: 420, overflow: "hidden", position: "relative" }}>
                                                <iframe
                                                    src={`${embedUrl}&rm=minimal&toolbar=0`}
                                                    style={{ 
                                                        width: "100%", 
                                                        height: 420, 
                                                        border: "none",
                                                        pointerEvents: "none",
                                                    }}
                                                    title="Document Preview Page 1"
                                                    scrolling="no"
                                                />
                                            </div>

                                            {/* Page 2 */}
                                            <div style={{ height: 420, overflow: "hidden", position: "relative", borderTop: "0.5px solid #e5ddd0" }}>
                                                <iframe
                                                    src={`${embedUrl}&rm=minimal&toolbar=0#page=2`}
                                                    style={{ 
                                                        width: "100%", 
                                                        height: 420, 
                                                        border: "none",
                                                        pointerEvents: "none",
                                                        marginTop: "-420px",
                                                    }}
                                                    title="Document Preview Page 2"
                                                    scrolling="no"
                                                />
                                            </div>

                                            {/* Page 3 */}
                                            <div style={{ height: 420, overflow: "hidden", position: "relative", borderTop: "0.5px solid #e5ddd0" }}>
                                                <iframe
                                                    src={`${embedUrl}&rm=minimal&toolbar=0#page=3`}
                                                    style={{ 
                                                        width: "100%", 
                                                        height: 420, 
                                                        border: "none",
                                                        pointerEvents: "none",
                                                        marginTop: "-420px",
                                                    }}
                                                    title="Document Preview Page 3"
                                                    scrolling="no"
                                                />
                                            </div>

                                            {/* Fade overlay at the bottom */}
                                            <div style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: 100,
                                                background: "linear-gradient(to bottom, transparent, #fff)",
                                                pointerEvents: "none",
                                            }} />

                                            {/* "Preview only" notice */}
                                            <div style={{
                                                padding: "10px 16px",
                                                background: "rgba(184,150,62,0.07)",
                                                border: "0.5px solid rgba(184,150,62,0.25)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" style={{ flexShrink: 0 }}>
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                <p style={{ fontSize: 11, color: NAVY, fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                                    Showing <strong style={{ color: NAVY }}>pages 1–3</strong> preview only. Approve to unlock full access.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: 32, textAlign: "center" }}>
                                            <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
                                            <p style={{ fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif", marginBottom: 16 }}>
                                                No embeddable preview available.
                                            </p>
                                            {docUrl && (
                                                <a href={docUrl} target="_blank" rel="noreferrer"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 20px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                                                    Open Document →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {view === "approve" && (
                        <div style={{ padding: 24 }}>
                            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                <div style={{ flex: 1, background: CREAM, border: `1.5px solid ${GOLD}44`, padding: "14px 16px" }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Author Receives (80%)</div>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#16a34a", lineHeight: 1 }}>
                                        <span style={{ fontSize: 13, color: GOLD }}>₦</span>{payout.toLocaleString("en-NG")}
                                    </div>
                                </div>
                                <div style={{ flex: 1, background: "rgba(13,34,68,.04)", border: "0.5px solid #e5ddd0", padding: "14px 16px" }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Platform Fee (20%)</div>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#ccc", lineHeight: 1 }}>
                                        <span style={{ fontSize: 13, color: "#ddd" }}>₦</span>{Math.round((bounty.reward || 0) * 0.2).toLocaleString("en-NG")}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: CREAM, border: "0.5px solid rgba(184,150,62,.25)", marginBottom: 16 }}>
                                <Avatar name={bidder?.name || "?"} size={38} />
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{bidder?.name}</p>
                                    <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                        Bid {bidder?.bidAt ? timeAgo(bidder.bidAt?.toDate?.() || new Date(bidder.bidAt)) : "recently"}
                                        {bidder?.linkedBookId && " · 📎 Document uploaded"}
                                    </p>
                                </div>
                            </div>

                            <div style={{ padding: "10px 14px", background: "rgba(245,158,11,.06)", border: "0.5px solid rgba(245,158,11,.3)", marginBottom: 16, display: "flex", gap: 8 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p style={{ fontSize: 11, color: "#b45309", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.65 }}>
                                    <strong>Irreversible.</strong> Approving releases escrow immediately. Review the document first.
                                </p>
                            </div>

                            {error && (
                                <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "0.5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setView("doc")} style={{
                                    flex: 1, padding: "12px", background: "#f5f5f5", color: "#666",
                                    border: "0.5px solid #e5ddd0", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                }}>← View Doc First</button>
                                <button onClick={handleApprove} disabled={submitting} style={{
                                    flex: 2, padding: "12px 16px",
                                    background: submitting ? "#ccc" : "#16a34a",
                                    color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.08em", textTransform: "uppercase",
                                    cursor: submitting ? "not-allowed" : "pointer",
                                    fontFamily: "'Lato',sans-serif",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}>
                                    {submitting ? (
                                        <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Releasing…</>
                                    ) : (
                                        <>✅ Approve &amp; Release ₦{payout.toLocaleString("en-NG")}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {view === "dispute" && (
                        <div style={{ padding: 24 }}>
                            <div style={{ padding: "14px 16px", background: "rgba(220,38,38,.05)", border: "0.5px solid rgba(220,38,38,.2)", marginBottom: 20 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>Raise a Dispute</p>
                                <p style={{ fontSize: 11, color: "#666", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>
                                    If the submitted document doesn't meet your requirements, raise a dispute. An admin will review and resolve it. The escrow stays locked until resolved.
                                </p>
                            </div>

                            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", display: "block", marginBottom: 8 }}>
                                Reason for Dispute *
                            </label>
                            <textarea
                                value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                placeholder="e.g. File is corrupted, Incorrect course notes uploaded, Incomplete past questions, Wrong year..."
                                rows={4}
                                style={{
                                    width: "100%", padding: "11px 14px",
                                    border: "0.5px solid #e5ddd0", fontSize: 13,
                                    fontFamily: "'Lato',sans-serif", color: NAVY,
                                    background: CREAM, resize: "vertical", outline: "none",
                                    boxSizing: "border-box", marginBottom: 16,
                                    lineHeight: 1.65,
                                }}
                            />

                            <div style={{ padding: "10px 14px", background: "rgba(13,34,68,.04)", border: "0.5px solid rgba(13,34,68,.1)", marginBottom: 16, display: "flex", gap: 8 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p style={{ fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.65 }}>
                                    A LAN admin will be notified and will mediate. You'll receive a resolution within 48 hours.
                                </p>
                            </div>

                            {error && (
                                <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "0.5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => { setView("doc"); setError(""); }} style={{
                                    flex: 1, padding: "12px", background: "#f5f5f5", color: "#666",
                                    border: "0.5px solid #e5ddd0", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                }}>Cancel</button>
                                <button onClick={handleDispute} disabled={submitting || !disputeReason.trim()} style={{
                                    flex: 2, padding: "12px 16px",
                                    background: submitting || !disputeReason.trim() ? "#ccc" : "#dc2626",
                                    color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.08em", textTransform: "uppercase",
                                    cursor: submitting || !disputeReason.trim() ? "not-allowed" : "pointer",
                                    fontFamily: "'Lato',sans-serif",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}>
                                    {submitting ? (
                                        <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Submitting…</>
                                    ) : (
                                        <>🚩 Submit Dispute</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════════════════
   MY POSTED BOUNTIES PANEL
══════════════════════════════════════════════════════════ */
function MyPostedBountiesPanel({ user, onClose, onOpenReview, onOpenRelease, bounties, loading }) {
    const [expanded, setExpanded] = useState(null);

    const statusPill = (status) => {
        if (status === "fulfilled") return { bg: "rgba(22,163,74,.1)", color: "#16a34a", label: "✅ Fulfilled" };
        if (status === "pending_approval") return { bg: "rgba(245,158,11,.1)", color: "#b45309", label: "⏳ Under Review" };
        if (status === "refunded") return { bg: "rgba(220,38,38,.08)", color: "#dc2626", label: "↩ Refunded" };
        return { bg: "rgba(13,34,68,.06)", color: NAVY, label: "🟢 Open" };
    };

    return createPortal(
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.72)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 560, width: "100%", border: "0.5px solid #e5ddd0", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Bounties</p>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>My Posted Bounties</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", flex: 1, background: BG }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                            <div style={{ width: 32, height: 32, border: `2px solid rgba(184,150,62,.3)`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                        </div>
                    ) : bounties.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 24px" }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>📮</div>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>No bounties posted yet</h3>
                            <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 24px" }}>
                                Post a bounty on the board to request academic materials.
                            </p>
                            <a href="/academic/bounty/board" onClick={onClose} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "12px 24px", background: GOLD, color: NAVY,
                                fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
                                textTransform: "uppercase", fontFamily: "'Lato',sans-serif",
                                textDecoration: "none",
                            }}>
                                Post a Bounty →
                            </a>
                        </div>
                    ) : (
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            {bounties.map(b => {
                                const pill = statusPill(b.status);
                                const isExpanded = expanded === b.id;
                                const bidders = (b.claimedBy || []).map(uid => ({
                                    uid,
                                    name: b.bidderNames?.[uid] || "Unknown",
                                    linkedBookId: b.bidderBooks?.[uid] || (b.fulfilledByUid === uid ? b.linkedBookId : null),
                                    bidAt: b.updatedAt,
                                }));                              
                                const sortedBidders = [...bidders].sort((a, b) => (b.linkedBookId ? 1 : 0) - (a.linkedBookId ? 1 : 0));

                                return (
                                    <div key={b.id} style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                                        <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},transparent)` }} />

                                        <div
                                            onClick={() => setExpanded(isExpanded ? null : b.id)}
                                            style={{ padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                                                            padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase",
                                                            background: pill.bg, color: pill.color, border: `0.5px solid ${pill.color}44`,
                                                        }}>
                                                            {pill.label}
                                                        </span>
                                                        {b.university && (
                                                            <span style={{ fontSize: 9, fontWeight: 700, background: NAVY, color: GOLDD, padding: "2px 8px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                                                {b.university}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.35 }}>{b.title}</h4>
                                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                        <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                                                            ₦{Number(b.reward).toLocaleString("en-NG")} escrowed
                                                        </span>
                                                        <span style={{ fontSize: 10, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>·</span>
                                                        <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                                            {bidders.length}/{b.maxProposals || 10} bidder{bidders.length !== 1 ? "s" : ""}
                                                        </span>
                                                        {/* Show doc-ready count */}
                                                        {bidders.filter(bd => bd.linkedBookId).length > 0 && (
                                                            <>
                                                                <span style={{ fontSize: 10, color: "#bbb" }}>·</span>
                                                                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                                                                    {bidders.filter(bd => bd.linkedBookId).length} doc{bidders.filter(bd => bd.linkedBookId).length !== 1 ? "s" : ""} ready
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5"
                                                    style={{ flexShrink: 0, marginTop: 4, transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ borderTop: "0.5px solid #f0ebe0" }}>
                                                {sortedBidders.length === 0 ? (
                                                    <div style={{ padding: "20px 16px", textAlign: "center", color: "#aaa", fontSize: 12, fontFamily: "'Lato',sans-serif" }}>
                                                        No bidders yet — share the bounty to get submissions.
                                                    </div>
                                                ) : (
                                                    sortedBidders.map((bidder, i) => {
                                                        const isFulfiller = bidder.uid === b.fulfilledByUid && b.status === "fulfilled";
                                                        const payout = Math.round((b.reward || 0) * 0.8);
                                                        const hasDoc = !!bidder.linkedBookId;
                                                        return (
                                                            <div key={bidder.uid || i} style={{
                                                                display: "flex", alignItems: "center", gap: 12,
                                                                padding: "13px 16px",
                                                                borderBottom: i < sortedBidders.length - 1 ? "0.5px solid #f5f0e8" : "none",
                                                                background: isFulfiller ? "rgba(22,163,74,.03)" : hasDoc ? "rgba(184,150,62,.02)" : "#fff",
                                                            }}>
                                                                <div style={{ position: "relative" }}>
                                                                    <Avatar name={bidder.name || "?"} size={36} />
                                                                    {hasDoc && (
                                                                        <div style={{
                                                                            position: "absolute", bottom: -2, right: -2,
                                                                            width: 12, height: 12, borderRadius: "50%",
                                                                            background: "#16a34a", border: "1.5px solid #fff",
                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                            fontSize: 7, color: "#fff",
                                                                        }}>✓</div>
                                                                    )}
                                                                </div>

                                                                <div style={{ flex: 1 }}>
                                                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                                                                        {bidder.name || "Unknown"}
                                                                    </p>
                                                                    <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                                        Bid {bidder.bidAt ? timeAgo(bidder.bidAt?.toDate?.() || new Date(bidder.bidAt)) : "recently"}
                                                                        {hasDoc && <span style={{ color: "#16a34a", fontWeight: 700 }}> · 📎 Document ready</span>}
                                                                    </p>
                                                                </div>

                                                                {/* Action */}
                                                                {isFulfiller ? (
                                                                    <span style={{
                                                                        fontSize: 10, fontWeight: 700, padding: "4px 10px",
                                                                        fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
                                                                        background: "rgba(22,163,74,.1)", color: "#16a34a",
                                                                        border: "0.5px solid rgba(22,163,74,.3)",
                                                                    }}>
                                                                        ✅ Paid ₦{payout.toLocaleString("en-NG")}
                                                                    </span>
                                                                ) : b.status === "fulfilled" ? (
                                                                    <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Not selected</span>
                                                                ) : b.disputes?.[bidder.uid] ? (
                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", fontFamily: "'Lato',sans-serif" }}>🚩 Disputed</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onOpenReview({ bounty: b, bidder }); }}
                                                                        style={{
                                                                            padding: "7px 14px",
                                                                            background: GOLD, color: NAVY, border: "none",
                                                                            fontSize: 10, fontWeight: 700,
                                                                            letterSpacing: "0.07em", textTransform: "uppercase",
                                                                            cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                                                            display: "flex", alignItems: "center", gap: 5,
                                                                            transition: "background .15s",
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                                                        onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                                                    >
                                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
                                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                                        </svg>
                                                                        Review &amp; Pay
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}

                                                <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f0ebe0", background: CREAM }}>
                                                    <a
                                                        href={`/academic/bounty/board?highlight=${b.id}`}
                                                        onClick={onClose}
                                                        style={{ fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
                                                    >
                                                        View on Bounty Board
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
                                                            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 16px", borderTop: "0.5px solid #f0ebe0", flexShrink: 0 }}>
                    <button onClick={onClose} style={{
                        width: "100%", padding: "11px", background: NAVY, color: "#fff",
                        border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Lato',sans-serif",
                    }}>Close</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════════════════════
   BOUNTY DASHBOARD CARD  — main export
══════════════════════════════════════════════════════════════ */
export default function BountyDashboardCard({ user }) {
    const [panel, setPanel] = useState(null);
    const [releaseTarget, setReleaseTarget] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [stats, setStats] = useState({ submitted: 0, posted: 0, earned: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    // Posted bounties data lives here so it can be refreshed after modal actions
    const [postedBounties, setPostedBounties] = useState([]);
    const [loadingPosted, setLoadingPosted] = useState(false);
    const { fmt } = useCurrency();
    /* ── Refresh stats ── */
    const loadStats = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const [submittedSnap, postedSnap] = await Promise.all([
                getDocs(query(collection(db, "bounties"), where("claimedBy", "array-contains", user.uid))),
                getDocs(query(collection(db, "bounties"), where("postedByUid", "==", user.uid))),
            ]);
            const submitted = submittedSnap.docs.map(d => d.data());
            const earned = submitted
                .filter(b => b.fulfilledByUid === user.uid && b.status === "fulfilled")
                .reduce((s, b) => s + Math.round((b.reward || 0) * 0.8), 0);
            setStats({ submitted: submittedSnap.size, posted: postedSnap.size, earned });
        } catch (e) {
            console.error(e);
        }
    }, [user?.uid]);

    /* ── Refresh posted bounties ── */
    const loadPostedBounties = useCallback(async () => {
        if (!user?.uid) return;
        setLoadingPosted(true);
        try {
            const q = query(collection(db, "bounties"), where("postedByUid", "==", user.uid));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
            setPostedBounties(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPosted(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        (async () => {
            setLoadingStats(true);
            await loadStats();
            setLoadingStats(false);
        })();
    }, [loadStats]);

    /* Load posted bounties when panel opens */
    useEffect(() => {
        if (panel === "posted") {
            loadPostedBounties();
        }
    }, [panel, loadPostedBounties]);

    /* ── Open review modal — close panel first to avoid z-index layering ── */
    const handleOpenReview = useCallback((target) => {
        setPanel(null);          // close panel
        setReviewTarget(target); // open modal immediately
    }, []);

    const handleOpenRelease = useCallback((target) => {
        setPanel(null);
        setReleaseTarget(target);
    }, []);

    /* ── After modal success, refresh data and reopen panel ── */
    const handleReviewDone = useCallback(async () => {
        setReviewTarget(null);
        await Promise.all([loadStats(), loadPostedBounties()]);
        setPanel("posted");
    }, [loadStats, loadPostedBounties]);

    const handleReleaseDone = useCallback(async () => {
        setReleaseTarget(null);
        await Promise.all([loadStats(), loadPostedBounties()]);
        setPanel("posted");
    }, [loadStats, loadPostedBounties]);

    return (
        <>
            <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

            <div style={{
                background: "#fff",
                border: "0.5px solid #e5ddd0",
                overflow: "hidden",
            }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},transparent)` }} />

                <div style={{ padding: "20px 20px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 36, height: 36, background: "rgba(184,150,62,.1)",
                            border: `0.5px solid rgba(184,150,62,.3)`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Bounty Board</p>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>My Bounties</p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {loadingStats ? (
                            [0, 1, 2].map(i => (
                                <div key={i} style={{ background: CREAM, border: "0.5px solid #e8e0d0", padding: "10px 12px" }}>
                                    <div style={{ height: 8, background: "#e5ddd0", borderRadius: 3, marginBottom: 6, width: "60%" }} />
                                    <div style={{ height: 16, background: "#e5ddd0", borderRadius: 3, width: "80%" }} />
                                </div>
                            ))
                        ) : (
                            <>
                                <div style={{ background: CREAM, border: "0.5px solid #e8e0d0", padding: "10px 12px" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Submitted</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{stats.submitted}</p>
                                </div>
                                <div style={{ background: CREAM, border: "0.5px solid #e8e0d0", padding: "10px 12px" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Posted</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{stats.posted}</p>
                                </div>
                                <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,.25)`, padding: "10px 12px" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Earned</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: stats.earned > 0 ? 14 : 20, fontWeight: 700, color: stats.earned > 0 ? "#16a34a" : NAVY, margin: 0 }}>
                                        {stats.earned > 0 ? `₦${stats.earned.toLocaleString("en-NG")}` : "₦0"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ borderTop: "0.5px solid #f0ebe0" }}>
                    <button
                        onClick={() => setPanel("submissions")}
                        style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "13px 20px", border: "none", borderBottom: "0.5px solid #f5f0e8",
                            background: "#fff", cursor: "pointer", textAlign: "left",
                            transition: "background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = CREAM}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                        <div style={{
                            width: 32, height: 32, background: "rgba(13,34,68,.06)",
                            border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>My Submissions</p>
                            <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>Bounties you've bid on &amp; claimed</p>
                        </div>
                        {stats.submitted > 0 && (
                            <span style={{
                                background: NAVY, color: GOLD, fontSize: 10, fontWeight: 900,
                                padding: "2px 8px", borderRadius: 99, fontFamily: "'Lato',sans-serif",
                            }}>
                                {stats.submitted}
                            </span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    <button
                        onClick={() => setPanel("posted")}
                        style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "13px 20px", border: "none",
                            background: "#fff", cursor: "pointer", textAlign: "left",
                            transition: "background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = CREAM}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                        <div style={{
                            width: 32, height: 32, background: "rgba(184,150,62,.08)",
                            border: `0.5px solid rgba(184,150,62,.25)`, display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>My Posted Bounties</p>
                            <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>Review bidders &amp; release funds</p>
                        </div>
                        {stats.posted > 0 && (
                            <span style={{
                                background: GOLD, color: NAVY, fontSize: 10, fontWeight: 900,
                                padding: "2px 8px", borderRadius: 99, fontFamily: "'Lato',sans-serif",
                            }}>
                                {stats.posted}
                            </span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>

                {/* Footer CTA */}
                <div style={{ padding: "12px 20px", borderTop: "0.5px solid #f5f0e8", background: CREAM }}>
                    <a
                        href="/academic/bounty/board"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "9px 14px", background: NAVY, color: "#fff",
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
                            textTransform: "uppercase", fontFamily: "'Lato',sans-serif",
                            textDecoration: "none", transition: "background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1a3a6e"}
                        onMouseLeave={e => e.currentTarget.style.background = NAVY}
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                        Browse Bounty Board
                    </a>
                </div>
            </div>

            {/* ── Panels ── */}
            {panel === "submissions" && (
                <MySubmissionsPanel user={user} onClose={() => setPanel(null)} />
            )}
            {panel === "posted" && (
                <MyPostedBountiesPanel
                    user={user}
                    bounties={postedBounties}
                    loading={loadingPosted}
                    onClose={() => setPanel(null)}
                    onOpenReview={handleOpenReview}
                    onOpenRelease={handleOpenRelease}
                />
            )}

            {/* ── Modals (rendered at top level, no panel competing for z-index) ── */}
            {releaseTarget && (
                <ReleaseFundsModal
                    bounty={releaseTarget.bounty}
                    bidder={releaseTarget.bidder}
                    user={user}
                    onClose={() => {
                        setReleaseTarget(null);
                        setPanel("posted"); // reopen panel on cancel too
                    }}
                    onSuccess={handleReleaseDone}
                />
            )}
            {reviewTarget && (
                <FulfillmentReviewModal
                    bounty={reviewTarget.bounty}
                    bidder={reviewTarget.bidder}
                    user={user}
                    onClose={() => {
                        setReviewTarget(null);
                        setPanel("posted"); // reopen panel on cancel
                    }}
                    onApproved={handleReviewDone}
                    onDisputed={handleReviewDone}
                />
            )}
        </>
    );
}