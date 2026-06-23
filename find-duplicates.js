const admin = require('firebase-admin');
const serviceAccount = require('/Users/teraki/Downloads/virgilapp-firebase-adminsdk-fbsvc-23488b6eba.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findDuplicates() {
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
      id: doc.id,
      name: data.name,
      calories: data.energy || 0,
      protein: data.protein || 0,
      carbs: data.carbohydrates || 0,
      fat: data.fat || 0
    });
  });

  // Find duplicates (groups with more than 1 item)
  const duplicates = Object.entries(groups)
    .filter(([_, items]) => items.length > 1)
    .sort((a, b) => b[1].length - a[1].length); // Sort by count descending

  console.log(`🔍 Found ${duplicates.length} duplicate groups\n`);
  
  let totalDuplicateItems = 0;
  
  duplicates.slice(0, 20).forEach(([nameSearch, items], index) => {
    console.log(`${index + 1}. "${nameSearch}" (${items.length} duplicates):`);
    items.forEach(item => {
      console.log(`   - ${item.id}`);
      console.log(`     "${item.name}"`);
      console.log(`     ${item.calories} kcal | P:${item.protein}g C:${item.carbs}g F:${item.fat}g`);
    });
    console.log('');
    totalDuplicateItems += items.length;
  });

  if (duplicates.length > 20) {
    console.log(`... and ${duplicates.length - 20} more duplicate groups\n`);
  }

  // Calculate total duplicate items
  const allDuplicateItems = duplicates.reduce((sum, [_, items]) => sum + items.length, 0);
  const uniqueItems = duplicates.length;
  const redundantItems = allDuplicateItems - uniqueItems;

  console.log('📊 SUMMARY:');
  console.log(`   Total ingredients: ${snapshot.size}`);
  console.log(`   Duplicate groups: ${duplicates.length}`);
  console.log(`   Total duplicate items: ${allDuplicateItems}`);
  console.log(`   Redundant items (can be removed): ${redundantItems}`);
  console.log(`   Unique items after cleanup: ${snapshot.size - redundantItems}`);
  
  process.exit(0);
}

findDuplicates().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
