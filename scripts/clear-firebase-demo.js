import { initializeAdminSdk } from './firebase-admin-common.js';

const targets = [
  ['account_directory', 'TEST-DRIVER-001'],
  ['account_directory', 'TEST-OCCUPANT-001'],
  ['vehicles', 'SS-TEST-01'],
  ['monitoring_sessions', 'TEST-SESSION-001'],
  ['hardware_status', 'SS-TEST-01'],
  ['incidents', 'TEST-INCIDENT-001'],
  ['incidents', 'TEST-INCIDENT-002']
];

async function main() {
  const { db } = initializeAdminSdk();
  const batch = db.batch();
  for (const [collection, id] of targets) batch.delete(db.collection(collection).doc(id));

  const diagnostics = await db.collection('diagnostic_requests').where('vehicleId', '==', 'SS-TEST-01').get();
  for (const doc of diagnostics.docs) batch.delete(doc.ref);

  await batch.commit();
  console.log('SafeSeat synthetic Firebase test records removed.');
  console.log('The real admin account and its admin_settings document were intentionally kept.');
}

main().catch(error => {
  console.error('Firebase demo cleanup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
