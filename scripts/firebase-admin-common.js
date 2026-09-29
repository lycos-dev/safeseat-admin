import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function readArg(name) {
  const key = `--${name}`;
  const index = process.argv.indexOf(key);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

export function hasArg(name) {
  return process.argv.includes(`--${name}`);
}

export function serviceAccountPath() {
  return resolve(
    process.cwd(),
    readArg('service-account') || process.env.SAFESEAT_SERVICE_ACCOUNT || 'service-account.json'
  );
}

export function initializeAdminSdk() {
  const path = serviceAccountPath();
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`ERROR: Could not read Firebase service account at: ${path}`);
    console.error('Download a private key from Firebase Console > Project Settings > Service Accounts.');
    console.error('Keep the JSON file private; service-account.json is ignored by Git in this project.');
    if (error instanceof Error) console.error(`Reason: ${error.message}`);
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  return { db: getFirestore(), serviceAccountPath: path };
}

export function requireValue(value, label) {
  if (!value) {
    console.error(`ERROR: Missing ${label}.`);
    process.exit(1);
  }
  return value;
}
