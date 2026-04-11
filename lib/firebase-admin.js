import admin from "firebase-admin";

let adminDb;

if (!admin.apps.length) {
    try {
        const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;

        if (!base64Key) {
            throw new Error("Missing FIREBASE_PRIVATE_KEY_BASE64");
        }

        let decodedKey = Buffer.from(base64Key, "base64").toString("utf-8");
        decodedKey = decodedKey.trim().replace(/^"+|"+$/g, '');
        const privateKey = decodedKey.replace(/\\n/g, "\n");

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!projectId || !clientEmail) {
            throw new Error("Missing Firebase env variables");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        // ── STABILIZATION FOR NIGERIAN NETWORKS (MiFi/Mobile) ──
        admin.firestore().settings({
            host: "firestore.googleapis.com",
            ssl: true,
            // Forces standard HTTPS polling instead of heavy gRPC sockets
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
        });

        console.log("✅ Firebase Admin connected (MiFi Optimized)");

    } catch (error) {
        console.error("❌ Firebase Admin Init Error:", error.message);
    }
}

if (admin.apps.length) {
    adminDb = admin.firestore();
} else {
    throw new Error("Firebase Admin not initialized");
}

export { adminDb };