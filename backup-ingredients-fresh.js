/**
 * Fresh backup of /ingredients collection before EN translation.
 * Reads credentials from .env.local (same as the Next.js admin app).
 *
 * Usage:
 *   node backup-ingredients-fresh.js
 *
 * Output:
 *   ingredients-backup-pre-en-<timestamp>.json
 */
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase env vars in .env.local');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

async function backup() {
  console.log('🔍 Fetching all ingredients from /ingredients...');
  const snapshot = await db.collection('ingredients').get();
  console.log(`📦 Total ingredients: ${snapshot.size}`);

  const backup = [];
  snapshot.forEach((doc) => {
    backup.push({ id: doc.id, data: doc.data() });
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ingredients-backup-pre-en-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  const sizeMB = (fs.statSync(filename).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Backup saved: ${filename} (${sizeMB} MB)`);
  console.log(`📊 Documents: ${backup.length}`);
  process.exit(0);
}

backup().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
