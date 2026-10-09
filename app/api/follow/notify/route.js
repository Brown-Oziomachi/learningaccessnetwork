import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";
import { notifyUser } from "@/lib/notificationEngine";

export async function POST(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let followerId;
    try { ({ uid: followerId } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const { lecturerId } = await req.json().catch(() => ({}));
    if (!lecturerId || lecturerId === followerId) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const followId = `${followerId}_${lecturerId}`;
    const followSnap = await adminDb.collection("follows").doc(followId).get();
    if (!followSnap.exists) return NextResponse.json({ error: "Not following" }, { status: 400 });

    // Once per follower/lecturer pair, ever (unfollow + refollow won't re-notify).
    try {
        await adminDb.collection("followNotifications").doc(followId).create({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
        if (e.code === 6) return NextResponse.json({ skipped: true });   // ALREADY_EXISTS
        throw e;
    }

    const [followerSnap, lecturerSnap, countSnap] = await Promise.all([
        adminDb.collection("users").doc(followerId).get(),
        adminDb.collection("users").doc(lecturerId).get(),
        adminDb.collection("follows").where("lecturerId", "==", lecturerId).count().get(),
    ]);
    if (!lecturerSnap.exists) return NextResponse.json({ skipped: true });

    const f = followerSnap.exists ? followerSnap.data() : {};
    const l = lecturerSnap.data();
    const followerName =
        f.displayName || `${f.firstName || ""} ${f.surname || ""}`.trim() || "A student";
    const followerCount = countSnap.data().count;

    await notifyUser({
        userId: lecturerId,
        to: l.email || null,
        type: "new_follower",
        data: {
            name: l.firstName || l.displayName || "there",
            followerName,
            followerCount,
        },
        inApp: {
            title: "New follower 🎉",
            message: `${followerName} started following you. You now have ${followerCount} follower${followerCount === 1 ? "" : "s"}.`,
            link: "/my-account/seller-account",
            extra: { followerId },
        },
    });

    return NextResponse.json({ success: true });
}