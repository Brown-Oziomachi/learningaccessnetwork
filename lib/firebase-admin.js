import admin from "firebase-admin";

let adminDb;

// Helper to clean the key
const formatKey = (key) => {
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    return decoded.trim().replace(/^"+|"+$/g, '').replace(/\\n/g, "\n");
};

try {
    if (!admin.apps.length) {
        const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!base64Key || !projectId || !clientEmail) {
            console.error("❌ Missing Firebase Environment Variables");
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: formatKey(base64Key),
                }),
            });

            admin.firestore().settings({
                host: "firestore.googleapis.com",
                ssl: true,
                experimentalForceLongPolling: true,
                ignoreUndefinedProperties: true,
            });

            console.log("✅ Firebase Admin connected");
        }
    }
} catch (error) {
    console.error("❌ Firebase Admin Init Error:", error.message);
}

// Always export the instance if it exists
adminDb = admin.apps.length ? admin.firestore() : null;

export { adminDb };