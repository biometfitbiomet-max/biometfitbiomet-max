require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

async function backup() {
  const collections = ['user_recipes', 'user_ingredients', 'ingredients'];
  const backup = {};
  for (const col of collections) {
    const snap = await db.collection(col).get();
    backup[col] = {};
    snap.docs.forEach(doc => { backup[col][doc.id] = doc.data(); });
    console.log(col + ': ' + snap.size + ' documents');
  }
  const filename = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  console.log('Backup saved: ' + filename);
  process.exit(0);
}

backup().catch(e => { console.error(e); process.exit(1); });
