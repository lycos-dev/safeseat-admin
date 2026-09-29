/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'demo' | 'firebase';
  readonly VITE_DEMO_ADMIN_EMAIL?: string;
  readonly VITE_DEMO_ADMIN_PASSWORD?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_FIRESTORE_ACCOUNT_DIRECTORY_COLLECTION?: string;
  readonly VITE_FIRESTORE_ADMINS_COLLECTION?: string;
  readonly VITE_FIRESTORE_VEHICLES_COLLECTION?: string;
  readonly VITE_FIRESTORE_SESSIONS_COLLECTION?: string;
  readonly VITE_FIRESTORE_INCIDENTS_COLLECTION?: string;
  readonly VITE_FIRESTORE_HARDWARE_COLLECTION?: string;
  readonly VITE_FIRESTORE_SETTINGS_COLLECTION?: string;
  readonly VITE_FIRESTORE_DIAGNOSTICS_COLLECTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
