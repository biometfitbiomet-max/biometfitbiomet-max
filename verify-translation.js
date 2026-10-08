require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
const db = admin.firestore();

async function verify() {
  const snap = await db.collection('ingredients').get();
  let total = 0, withEn = 0, empty = 0, same = 0, samples = [];
  snap.forEach((doc) => {
    const d = doc.data();
    total++;
    if (d.nameEn && d.nameEn.trim()) {
      withEn++;
      if (d.name === d.nameEn) same++;
    } else {
      empty++;
    }
  });
  // Random samples
  const docs = snap.docs.sort(() => Math.random() - 0.5).slice(0, 20);
  docs.forEach((doc) => {
    const d = doc.data();
    samples.push(`${d.name} → ${d.nameEn || '❌ MISSING'}`);
  });
  console.log(`Total: ${total}`);
  console.log(`With nameEn: ${withEn} (${(withEn/total*100).toFixed(1)}%)`);
  console.log(`Missing nameEn: ${empty}`);
  console.log(`Same as name (already EN): ${same}`);
  console.log('--- Random samples ---');
  samples.forEach((s) => console.log(s));
  process.exit(0);
}
verify().catch((e) => { console.error(e); process.exit(1); });
