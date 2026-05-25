// pages/api/admin/approve-bounty-fulfillment.js
import { adminDb } from "@/lib/firebaseAdmin";
import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp } from "firebase/firestore";

const db = adminDb;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { bountyId, adminToken } = req.body;

    // Verify admin token (you should implement proper auth)
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!bountyId) {
        return res.status(400).json({ error: "bountyId required" });
    }

    try {
        const bountyRef = doc(db, "bounties", bountyId);
        const bountySnap = await getDoc(bountyRef);

        if (!bountySnap.exists()) {
            return res.status(404).json({ error: "Bounty not found" });
        }

        const bountyData = bountySnap.data();
        const sellerId = bountyData.fulfilledByUid;
        const reward = bountyData.reward || 0;
        const sellerPayout = Math.round(reward * 0.8);
        const platformFee = reward - sellerPayout;

        if (!sellerId) {
            return res.status(400).json({ error: "No fulfiller found for this bounty" });
        }

        // 1. Update bounty status to "fulfilled"
        await updateDoc(bountyRef, {
            status: "fulfilled",
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 2. Release escrow: add payout to seller's wallet
        const sellerRef = doc(db, "sellers", sellerId);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
            await updateDoc(sellerRef, {
                accountBalance: increment(sellerPayout),
                totalEarnings: increment(sellerPayout),
                updatedAt: serverTimestamp(),
            });
        } else {
            // Create seller record
            await setDoc(sellerRef, {
                userId: sellerId,
                accountBalance: sellerPayout,
                totalEarnings: sellerPayout,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        // 3. Send notification to seller (optional)
        try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-seller-notification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "bounty_approved",
                    to: bountyData.contactEmail || "support@lanlibrary.com",
                    bountyTitle: bountyData.title,
                    reward: reward,
                    payout: sellerPayout,
                    sellerName: bountyData.fulfilledByName,
                }),
            });
        } catch (emailErr) {
            console.warn("Email notification failed:", emailErr);
        }

        res.status(200).json({
            success: true,
            message: "Bounty approved and payment released",
            sellerPayout,
            platformFee,
            bountyId,
        });
    } catch (error) {
        console.error("Approval error:", error);
        res.status(500).json({ error: error.message });
    }
}