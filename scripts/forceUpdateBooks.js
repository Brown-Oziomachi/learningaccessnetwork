// scripts/forceUpdateBooks.js
// ─────────────────────────────────────────────────────────────────────────────
// Run with:  node --env-file=.env scripts/forceUpdateBooks.js
// ─────────────────────────────────────────────────────────────────────────────

import admin from "firebase-admin";

const formatKey = (key) => {
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    return decoded.trim().replace(/^"+|"+$/g, "").replace(/\\n/g, "\n");
};

const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formatKey(base64Key),
        }),
    });
}

const db = admin.firestore();
console.log("✅ Firebase Admin connected. Scanning all documents...");

async function forceUpdateAllBooks() {
    try {
        // Fetch absolutely every document originating from OpenStax
        const snapshot = await db
            .collection("advertMyBook")
            .where("source", "==", "openstax")
            .get();

        if (snapshot.empty) {
            console.warn("⚠️ No OpenStax books found in your collection.");
            return;
        }

        console.log(`🔍 Found ${snapshot.size} total documents. Executing forced database sync...`);

        const BATCH_SIZE = 450;
        let batch = db.batch();
        let counter = 0;
        let batchCount = 0;

        // Realistic textbook page lengths
        const pagePool = [320, 440, 510, 285, 630, 375, 415, 290];

        for (const doc of snapshot.docs) {
            const docRef = db.collection("advertMyBook").doc(doc.id);

            // Generate a stable page number unique to this book title string
            const title = doc.data().bookTitle || "";
            const stringHash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const finalPages = pagePool[stringHash % pagePool.length];

            // Force update fields without touching titles, categories, or PDFs
            batch.update(docRef, {
                uploadedBy: "LAN Library",
                pages: finalPages,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            counter++;

            if (counter % BATCH_SIZE === 0) {
                await batch.commit();
                batchCount++;
                console.log(`✅ Batch ${batchCount} committed (${counter} documents updated)...`);
                batch = db.batch();
            }
        }

        // Final flush for remaining documents
        if (counter % BATCH_SIZE !== 0) {
            await batch.commit();
            batchCount++;
            console.log(`✅ Batch ${batchCount} committed — final flush complete.`);
        }

        console.log(`\n🎉 Success! Forced update complete.`);
        console.log(`   Total updated documents: ${counter}`);
        console.log(`   All books are now securely branded under 'LAN Library' with realistic page numbers!`);

    } catch (error) {
        console.error("❌ Operational update failed:", error.message);
    }
}

forceUpdateAllBooks();