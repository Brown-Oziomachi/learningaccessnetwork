// lib/firebase-admin.js
import admin from "firebase-admin";

const formatKey = (key) => {
    if (!key) return "";

    const decoded = Buffer.from(key, "base64").toString("utf-8");

    return decoded
        .trim()
        .replace(/^"+|"+$/g, "")
        .replace(/\\n/g, "\n");
};

if (admin.apps.length === 0) {
    const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!base64Key || !projectId || !clientEmail) {
        throw new Error("Missing Firebase environment variables.");
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formatKey(base64Key),
        }),
    });

    console.log(
        "🛡️ [Firebase Admin]: Authorized cleanly for:",
        projectId
    );
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

// Used by routes that call getAdminDb()
const getAdminDb = () => adminDb;
const getAdminAuth = () => adminAuth;

export { admin, adminDb, adminAuth, getAdminDb, getAdminAuth };