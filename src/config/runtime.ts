const env = import.meta.env;

export type DataMode = 'demo' | 'firebase';

function readMode(value: unknown): DataMode {
  return String(value || 'demo').toLowerCase() === 'firebase' ? 'firebase' : 'demo';
}

export const runtimeConfig = {
  dataMode: readMode(env.VITE_DATA_MODE),
  demoAdminEmail: String(env.VITE_DEMO_ADMIN_EMAIL || 'admin@safeseat.demo'),
  demoAdminPassword: String(env.VITE_DEMO_ADMIN_PASSWORD || 'SafeSeat2026!'),
  firebase: {
    apiKey: String(env.VITE_FIREBASE_API_KEY || ''),
    authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID || ''),
    storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
    messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
    appId: String(env.VITE_FIREBASE_APP_ID || ''),
    measurementId: String(env.VITE_FIREBASE_MEASUREMENT_ID || '')
  },
  collections: {
    accounts: String(env.VITE_FIRESTORE_ACCOUNT_DIRECTORY_COLLECTION || 'account_directory'),
    admins: String(env.VITE_FIRESTORE_ADMINS_COLLECTION || 'admin_accounts'),
    vehicles: String(env.VITE_FIRESTORE_VEHICLES_COLLECTION || 'vehicles'),
    sessions: String(env.VITE_FIRESTORE_SESSIONS_COLLECTION || 'monitoring_sessions'),
    incidents: String(env.VITE_FIRESTORE_INCIDENTS_COLLECTION || 'incidents'),
    hardware: String(env.VITE_FIRESTORE_HARDWARE_COLLECTION || 'hardware_status'),
    settings: String(env.VITE_FIRESTORE_SETTINGS_COLLECTION || 'admin_settings'),
    diagnostics: String(env.VITE_FIRESTORE_DIAGNOSTICS_COLLECTION || 'diagnostic_requests')
  }
} as const;

export const firebaseConfigured = Boolean(
  runtimeConfig.firebase.apiKey &&
  runtimeConfig.firebase.authDomain &&
  runtimeConfig.firebase.projectId &&
  runtimeConfig.firebase.appId
);
