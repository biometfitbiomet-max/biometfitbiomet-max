require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

function normalize(s) {
  return s.toLowerCase().trim()
    .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
    .replace(/ș/g, 's').replace(/ț/g, 't');
}

async function cleanBrand(brand) {
  const snap = await db.collection('ingredients').get();
  let updated = 0;
  const batch = db.batch();
  let batchCount = 0;
  const regex = new RegExp('\\s*' + brand + '\\s*', 'gi');

  for (const doc of snap.docs) {
    const d = doc.data();
    const name = d.name || '';
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      let newName = name.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      if (!newName) newName = name;
      const updateData = { name: newName };
      if (d.nameSearch) {
        updateData.nameSearch = normalize(newName);
      }
      batch.update(doc.ref, updateData);
      batchCount++;
      updated++;
      if (batchCount === 400) {
        await batch.commit();
        console.log('  Committed batch of 400...');
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log('Done! Updated ' + updated + ' ingredients (removed "' + brand + '")');
  process.exit(0);
}

const brand = process.argv[2] || 'Kaufland';
cleanBrand(brand).catch(e => { console.error(e); process.exit(1); });
