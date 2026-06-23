const admin = require('firebase-admin');
const serviceAccount = require('/Users/teraki/Downloads/virgilapp-firebase-adminsdk-fbsvc-23488b6eba.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const brands = ['Angst', 'Cora', 'Kaufland', 'Lidl', 'Penny', 'Profi', 'Mega', 'Selgros', 'Carrefour'];

function normalize(str) {
  return str.toLowerCase().trim()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/Ă/g, 'a')
    .replace(/Â/g, 'a')
    .replace(/Î/g, 'i')
    .replace(/Ș/g, 's')
    .replace(/Ț/g, 't');
}

async function cleanupBrands() {
  console.log('🔍 Fetching all ingredients...');
  const snapshot = await db.collection('ingredients').get();
  console.log(`📦 Total ingredients: ${snapshot.size}`);

  let updatedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let name = data.name;
    
    if (!name) continue;

    let modified = false;
    
    // Check if name ends with any brand
    for (const brand of brands) {
      if (name.endsWith(' ' + brand)) {
        // Remove brand from end
        name = name.substring(0, name.length - brand.length - 1).trim();
        modified = true;
        break;
      }
    }

    if (modified) {
      const nameSearch = normalize(name);
      
      batch.update(doc.ref, {
        name: name,
        nameSearch: nameSearch
      });
      
      updatedCount++;
      batchCount++;
      
      console.log(`✏️  ${doc.id}: "${data.name}" → "${name}"`);

      // Firestore batch limit is 500
      if (batchCount >= 500) {
        console.log('💾 Committing batch...');
        await batch.commit();
        batch = db.batch(); // Create new batch
        batchCount = 0;
      }
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    console.log('💾 Committing final batch...');
    await batch.commit();
  }

  console.log(`\n✅ Done! Updated ${updatedCount} ingredients.`);
  process.exit(0);
}

cleanupBrands().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
