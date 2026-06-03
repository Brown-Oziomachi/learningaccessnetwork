import admin from "firebase-admin";

// Safe helper to reliably decode your base64 private key string
const formatKey = (key) => {
    if (!key) return "";
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    return decoded.trim().replace(/^"+|"+$/g, '').replace(/\\n/g, "\n");
};

const initializeAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    try {
        const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!base64Key || !projectId || !clientEmail) {
            throw new Error("Missing critical Firebase environment parameters configuration.");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formatKey(base64Key),
            }),
        });

        const dbInstance = admin.firestore();

        // Safe operational Firestore tuning flags
        dbInstance.settings({
            host: "firestore.googleapis.com",
            ssl: true,
            experimentalForceLongPolling: true, // Prevents gRPC connection drops in serverless webhooks
            ignoreUndefinedProperties: true,    // Saves database writes from throwing crashes on empty fields
        });

        console.log("🛡️ [Firebase Admin]: Authorized and connected seamlessly");
        return dbInstance;

    } catch (error) {
        console.error("❌ [Firebase Admin]: System failed to authorize:", error.message);
        // Throwing the error here prevents the application from failing silently in production
        throw error;
    }
};

// Authoritative dynamic database reference export
export const adminDb = initializeAdmin();
export { admin };