const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('/Users/teraki/Downloads/virgilapp-firebase-adminsdk-fbsvc-23488b6eba.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupIngredients() {
  console.log('🔍 Fetching all ingredients...');
  const snapshot = await db.collection('ingredients').get();
  console.log(`📦 Total ingredients: ${snapshot.size}`);

  const backup = [];
  
  snapshot.forEach(doc => {
    backup.push({
      id: doc.id,
      data: doc.data()
    });
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ingredients-backup-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`✅ Backup saved to: ${filename}`);
  console.log(`📊 Total documents backed up: ${backup.length}`);
  
  process.exit(0);
}

backupIngredients().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
