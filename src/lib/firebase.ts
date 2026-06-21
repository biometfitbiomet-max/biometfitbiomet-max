import admin from 'firebase-admin';

let _db: admin.firestore.Firestore | null = null;
let _auth: admin.auth.Auth | null = null;

function init() {
  if (_db) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Missing Firebase env vars');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });
  }
  _db = admin.firestore();
  _auth = admin.auth();
}

export function getDb() {
  init();
  return _db!;
}

export function getAuth() {
  init();
  return _auth!;
}
