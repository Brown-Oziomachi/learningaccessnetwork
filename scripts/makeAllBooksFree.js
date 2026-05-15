// scripts/makeAllBooksFree.js
// ─────────────────────────────────────────────────────────────────────────────
// Run with:  node --env-file=.env scripts/makeAllBooksFree.js
// ─────────────────────────────────────────────────────────────────────────────

import admin from "firebase-admin";

// ── Same key formatter from your existing Firebase Admin setup ────────────────
const formatKey = (key) => {
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    return decoded.trim().replace(/^"+|"+$/g, "").replace(/\\n/g, "\n");
};

// ── Initialize Firebase Admin ─────────────────────────────────────────────────
const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!base64Key || !projectId || !clientEmail) {
    console.error("❌ Missing env variables. Check your .env file:");
    console.error("   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY_BASE64");
    process.exit(1);
}

if (!admin.apps.length) {
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
}

const db = admin.firestore();
console.log("✅ Firebase Admin connected");

// ── Main batch update function ────────────────────────────────────────────────
async function makeAllBooksFree() {
    const collectionRef = db.collection("advertMyBook");
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log("⚠️  No documents found in advertMyBook.");
        return;
    }

    console.log(`📚 Found ${snapshot.size} document(s). Starting update...`);

    let batch = db.batch();
    let counter = 0;
    let batches = 0;

    for (const doc of snapshot.docs) {
        batch.update(db.collection("advertMyBook").doc(doc.id), {
            price: 0,
            isFree: true,
            accessType: "free",
        });

        counter++;

        if (counter % 500 === 0) {
            await batch.commit();
            batches++;
            console.log(`✅ Batch ${batches} committed — ${counter} books done...`);
            batch = db.batch();
        }
    }

    // Commit the remaining documents
    if (counter % 500 !== 0) {
        await batch.commit();
    }

    console.log(`\n🎉 Done! ${counter} book(s) → price: 0 | isFree: true | accessType: "free"`);
}

makeAllBooksFree().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});