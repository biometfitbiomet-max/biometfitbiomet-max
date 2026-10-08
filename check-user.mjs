import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

admin.initializeApp({
  credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
});

const email = process.argv[2];
if (!email) {
  console.error('Usage: node check-user.mjs <email>');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

try {
  const userRecord = await auth.getUserByEmail(email);
  console.log('--- Auth User ---');
  console.log('uid:', userRecord.uid);
  console.log('email:', userRecord.email);
  console.log('creationTime:', userRecord.metadata.creationTime);
  console.log('lastSignInTime:', userRecord.metadata.lastSignInTime);

  const profileSnap = await db
    .collection('users').doc(userRecord.uid)
    .collection('settings').doc('profile')
    .get();

  console.log('\n--- Firestore users/{uid}/settings/profile ---');
  console.log('exists:', profileSnap.exists);
  if (profileSnap.exists) {
    console.log('data:', JSON.stringify(profileSnap.data(), null, 2));
  }

  const planAssignSnap = await db
    .collection('users').doc(userRecord.uid)
    .collection('settings').doc('plan_assignments')
    .get();
  console.log('\n--- Firestore users/{uid}/settings/plan_assignments ---');
  console.log('exists:', planAssignSnap.exists);
  if (planAssignSnap.exists) {
    console.log('data:', JSON.stringify(planAssignSnap.data(), null, 2));
  }
} catch (e) {
  console.error('Error:', e.message);
}

process.exit(0);
