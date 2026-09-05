import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), 'service-account.json');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin789';
const ADMIN_NAME = 'SafeSeat Administrator';

async function main() {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  } catch {
    console.error('ERROR: service-account.json not found in project root.');
    console.error('Download it from Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const auth = getAuth();
  const db = getFirestore();

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });
    console.log(`Created Firebase Auth user: ${userRecord.uid} (${ADMIN_EMAIL})`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`User already exists. Using existing UID: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  const uid = userRecord.uid;
  const adminDoc = {
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'Fleet Admin',
    status: 'ACTIVE',
    enabled: true,
  };

  await db.collection('admin_accounts').doc(uid).set(adminDoc);
  console.log(`Created admin_accounts document for UID: ${uid}`);
  console.log('\nAdmin account ready:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  UID:      ${uid}`);
  console.log(`  Role:     Fleet Admin`);
  console.log(`  Status:   ACTIVE`);
}

main().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
