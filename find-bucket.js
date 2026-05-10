const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.storage().getBuckets().then(x => {
  console.log("ACTUAL BUCKET NAMES FOUND:");
  x[0].forEach(b => console.log("👉 " + b.name));
}).catch(err => console.error(err));