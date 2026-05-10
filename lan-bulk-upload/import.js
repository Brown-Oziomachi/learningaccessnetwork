const admin = require('firebase-admin');
const { getStorage, getDownloadURL } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const serviceAccount = require("./serviceAccountKey.json");

// 1. PROJECT DETAILS - DOUBLE CHECK THESE
const PROJECT_ID = "login-auth-27b23";
const BUCKET_NAME = `${PROJECT_ID}.firebasestorage.app`; // NO gs:// prefix

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET_NAME 
});

const db = admin.firestore();

async function uploadBooks() {
  try {
    // 2. MANUALLY DEFINE THE BUCKET OBJECT
    const storage = getStorage();
    const bucket = storage.bucket(BUCKET_NAME); // Pass the name directly here!

    const metadataPath = path.resolve(__dirname, 'metadata.json');
    const books = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    console.log(`🚀 Starting Abuja Registry Upload to: ${BUCKET_NAME}`);

    for (const book of books) {
      try {
        const fileName = book.fileName.trim();
        const filePath = path.join(__dirname, 'pdfs', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.error(`❌ File missing: ${filePath}`);
          continue;
        }

        console.log(`⏳ Uploading: ${book.title}...`);

        // A. Upload using the manual bucket reference
        const destination = `books/${fileName}`;
        await bucket.upload(filePath, {
          destination,
          public: true, // This can help bypass some 404 access issues
          metadata: { contentType: 'application/pdf' }
        });

        // B. Get the download URL
        const fileRef = bucket.file(destination);
        const downloadUrl = await getDownloadURL(fileRef);

        // C. Save to Firestore
        await db.collection('books').add({
          ...book,
          pdfUrl: downloadUrl,
          uploadDate: admin.firestore.FieldValue.serverTimestamp(),
          downloads: 0,
          status: "available"
        });

        console.log(`✅ Success: ${book.title}`);
      } catch (err) {
        console.error(`🔥 Error on ${book.title}:`, err.message);
      }
    }
    console.log("🏁 Registry Update Complete!");
  } catch (globalError) {
    console.error("🔥 Global Error:", globalError.message);
  }
}

uploadBooks();