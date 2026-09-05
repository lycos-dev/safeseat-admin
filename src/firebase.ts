import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfigured, runtimeConfig } from './config/runtime';

if (runtimeConfig.dataMode === 'firebase' && !firebaseConfigured) {
  throw new Error('SafeSeat Admin is in Firebase mode but Firebase environment variables are incomplete. Copy .env.example to .env and use the same Firebase project values as safeseat-app.');
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp(runtimeConfig.firebase);

export const auth = getAuth(app);
export const db = getFirestore(app);
