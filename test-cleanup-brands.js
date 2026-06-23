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

async function testCleanup() {
  console.log('🧪 DRY RUN - Testing on first 10 ingredients with brands\n');
  
  const snapshot = await db.collection('ingredients').get();
  
  let foundCount = 0;
  
  for (const doc of snapshot.docs) {
    if (foundCount >= 10) break;
    
    const data = doc.data();
    let name = data.name;
    
    if (!name) continue;

    let modified = false;
    let newName = name;
    
    // Check if name ends with any brand
    for (const brand of brands) {
      if (name.endsWith(' ' + brand)) {
        // Remove brand from end
        newName = name.substring(0, name.length - brand.length - 1).trim();
        modified = true;
        break;
      }
    }

    if (modified) {
      foundCount++;
      const newNameSearch = normalize(newName);
      
      console.log(`${foundCount}. Doc ID: ${doc.id}`);
      console.log(`   BEFORE: "${name}"`);
      console.log(`   AFTER:  "${newName}"`);
      console.log(`   nameSearch: "${data.nameSearch}" → "${newNameSearch}"`);
      console.log('');
    }
  }

  console.log(`\n✅ Test complete! Found ${foundCount} ingredients that would be updated.`);
  console.log('⚠️  NO CHANGES WERE MADE (dry-run mode)');
  console.log('\nIf this looks good, run: node cleanup-brands.js');
  
  process.exit(0);
}

testCleanup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
