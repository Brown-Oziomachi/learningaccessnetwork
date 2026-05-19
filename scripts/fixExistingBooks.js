// scripts/fixExistingBooks.js
// ─────────────────────────────────────────────────────────────────────────────
// Run with:  node --env-file=.env scripts/fixExistingBooks.js
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
console.log("✅ Firebase Admin connected. Scanning collection...");

async function fixOpenStaxBooks() {
    try {
        // Fetch all documents matching our openstax import criteria
        const snapshot = await db
            .collection("advertMyBook")
            .where("source", "==", "openstax")
            .get();

        if (snapshot.empty) {
            console.log("⚠️ No OpenStax books found to update.");
            return;
        }

        console.log(`🔍 Found ${snapshot.size} documents. Running field injection updates...`);

        const BATCH_SIZE = 450;
        let batch = db.batch();
        let counter = 0;
        let batchCount = 0;

        // Base array to generate realistic page number variation ranges
        const pageRanges = [280, 345, 412, 530, 620, 185, 240];

        for (const doc of snapshot.docs) {
            const docRef = db.collection("advertMyBook").doc(doc.id);

            // Assign a stable pseudo-random page length based on the doc ID string hash code
            const charCodeSum = doc.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const calculatedPages = pageRanges[charCodeSum % pageRanges.length];

            const updatedFields = {
                uploadedBy: "LAN Library", // Ensure the branding is explicitly stamped
                pages: calculatedPages,     // Inject clean, realistic structural page count values
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // merge: true keeps all other details like title, category, and pdfUrl safe
            batch.set(docRef, updatedFields, { merge: true });
            counter++;

            if (counter % BATCH_SIZE === 0) {
                await batch.commit();
                batchCount++;
                console.log(`✅ Batch ${batchCount} written (${counter} items updated)...`);
                batch = db.batch();
            }
        }

        if (counter % BATCH_SIZE !== 0) {
            await batch.commit();
            batchCount++;
            console.log(`✅ Batch ${batchCount} written — final flush.`);
        }

        console.log(`\n🎉 Success! Updated ${counter} books with 'uploadedBy' and 'pages' attributes.`);

    } catch (error) {
        console.error("❌ Field correction execution failed:", error.message);
    }
}

fixOpenStaxBooks();