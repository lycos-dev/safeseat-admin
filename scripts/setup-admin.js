import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { initializeAdminSdk, readArg, requireValue } from './firebase-admin-common.js';

const email = requireValue(readArg('email') || process.env.SAFESEAT_ADMIN_EMAIL, '--email or SAFESEAT_ADMIN_EMAIL').trim().toLowerCase();
const password = requireValue(readArg('password') || process.env.SAFESEAT_ADMIN_PASSWORD, '--password or SAFESEAT_ADMIN_PASSWORD');
const name = (readArg('name') || process.env.SAFESEAT_ADMIN_NAME || 'SafeSeat Administrator').trim();

if (!email.includes('@')) {
  console.error('ERROR: Admin email is not valid.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('ERROR: Use an admin password with at least 8 characters.');
  process.exit(1);
}

async function main() {
  const { db } = initializeAdminSdk();
  const auth = getAuth();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    userRecord = await auth.updateUser(userRecord.uid, {
      password,
      displayName: name,
      disabled: false,
      emailVerified: true
    });
    console.log(`Updated existing Firebase Authentication user: ${email}`);
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
      emailVerified: true
    });
    console.log(`Created Firebase Authentication user: ${email}`);
  }

  await db.collection('admin_accounts').doc(userRecord.uid).set({
    name,
    email,
    role: 'Fleet Admin',
    status: 'ACTIVE',
    enabled: true,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('Created/updated the protected admin authorization record.');
  console.log('');
  console.log('SafeSeat Admin account is ready.');
  console.log(`  Email: ${email}`);
  console.log(`  UID:   ${userRecord.uid}`);
  console.log('  Role:  Fleet Admin');
  console.log('  Status: ACTIVE');
  console.log('');
  console.log('The password is intentionally not printed. Use the password supplied to this command.');
}

main().catch(error => {
  console.error('Admin setup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
