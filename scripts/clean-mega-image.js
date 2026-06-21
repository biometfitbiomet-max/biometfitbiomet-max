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

async function cleanMegaImage() {
  const snap = await db.collection('ingredients').get();
  let updated = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const name = d.name || d.nume || '';
    if (name.toLowerCase().includes('mega image')) {
      const newName = name.replace(/\s*[Mm]ega\s*[Ii]mage\s*/g, '').replace(/\s*[Mm]ega\s*[Ii]mage$/g, '').trim();
      const finalName = newName || name;
      const updateData = { name: finalName };
      if (d.nameSearch) {
        updateData.nameSearch = finalName.toLowerCase()
          .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
          .replace(/ș/g, 's').replace(/ț/g, 't');
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

  console.log('Done! Updated ' + updated + ' ingredients (removed "Mega Image")');
  process.exit(0);
}

cleanMegaImage().catch(e => { console.error(e); process.exit(1); });
