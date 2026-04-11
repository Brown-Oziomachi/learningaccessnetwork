// lib/firebaseStorage.js
import { getApps, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// App is already initialized by firebaseConfig.js at this point
const app = getApps()[0];
export const storage = getStorage(app);