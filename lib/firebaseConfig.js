import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length) {
  console.error("❌ Missing Firebase env vars:", missingKeys);
}

const isBrowser = typeof window !== "undefined";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);


let db;
try {
  db = initializeFirestore(app, isBrowser
    ? {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalAutoDetectLongPolling: true,
    }
    : {} 
  );
} catch {

  db = getFirestore(app);
}

export { app, auth, db };