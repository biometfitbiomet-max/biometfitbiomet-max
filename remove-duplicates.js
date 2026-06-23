const admin = require('firebase-admin');
const serviceAccount = require('/Users/teraki/Downloads/virgilapp-firebase-adminsdk-fbsvc-23488b6eba.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeDuplicates() {
  console.log('🔍 Fetching all ingredients...');
  const snapshot = await db.collection('ingredients').get();
  console.log(`📦 Total ingredients: ${snapshot.size}\n`);

  // Group by nameSearch
  const groups = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const nameSearch = data.nameSearch || '';
    
    if (!nameSearch) return;
    
    if (!groups[nameSearch]) {
      groups[nameSearch] = [];
    }
    
    groups[nameSearch].push({
      ref: doc.ref,
      id: doc.id,
      name: data.name
    });
  });

  // Find duplicates (groups with more than 1 item)
  const duplicates = Object.entries(groups)
    .filter(([_, items]) => items.length > 1);

  console.log(`🔍 Found ${duplicates.length} duplicate groups\n`);
  
  let deletedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const [nameSearch, items] of duplicates) {
    // Keep first, delete rest
    const toKeep = items[0];
    const toDelete = items.slice(1);
    
    console.log(`📝 "${nameSearch}" - keeping: ${toKeep.id}`);
    
    for (const item of toDelete) {
      console.log(`   ❌ Deleting: ${item.id} ("${item.name}")`);
      batch.delete(item.ref);
      deletedCount++;
      batchCount++;
      
      // Firestore batch limit is 500
      if (batchCount >= 500) {
        console.log('💾 Committing batch...');
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    console.log('💾 Committing final batch...');
    await batch.commit();
  }

  console.log(`\n✅ Done!`);
  console.log(`   Deleted: ${deletedCount} duplicate ingredients`);
  console.log(`   Remaining: ${snapshot.size - deletedCount} unique ingredients`);
  
  process.exit(0);
}

removeDuplicates().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
