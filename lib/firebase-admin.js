// lib/firebase-admin.js
import admin from "firebase-admin";

const formatKey = (key) => {
    if (!key) return "";
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    return decoded.trim().replace(/^"+|"+$/g, "").replace(/\\n/g, "\n");
};

export function getAdminDb() {
    if (admin.apps.length === 0) {
        try {
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

            const dbInstance = admin.firestore();
            dbInstance.settings({
                host: "firestore.googleapis.com",
                ssl: true,
                preferRest: true,
                ignoreUndefinedProperties: true,
            });

            console.log("🛡️ [Firebase Admin]: Authorized cleanly for:", projectId);
        } catch (error) {
            console.error("❌ [Firebase Admin]: Initialization Error:", error.message);
            throw error;
        }
    }

    return admin.firestore();
}

const adminDb = getAdminDb();

// Export both the core admin SDK and the ready-to-use Firestore instance
export { admin, adminDb };