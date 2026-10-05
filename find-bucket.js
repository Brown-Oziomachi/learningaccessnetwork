import { initializeApp, credential as _credential, storage } from 'firebase-admin';
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: _credential.cert(serviceAccount)
});

storage().getBuckets().then(x => {
  console.log("ACTUAL BUCKET NAMES FOUND:");
  x[0].forEach(b => console.log("👉 " + b.name));
}).catch(err => console.error(err));