import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { runtimeConfig } from '../config/runtime';

type AdminIdentity = {
  uid: string;
  name: string;
  email: string;
  role: 'Fleet Admin';
};

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  identity: AdminIdentity | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadFirebaseAdmin(user: User): Promise<AdminIdentity | null> {
  const { db } = await import('../firebase');
  const snap = await getDoc(doc(db, runtimeConfig.collections.admins, user.uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (data.status === 'DISABLED' || data.enabled === false) return null;
  const role = String(data.role || 'Fleet Admin');
  if (role !== 'Fleet Admin' && role !== 'admin' && role !== 'fleet_admin') return null;
  return {
    uid: user.uid,
    name: String(data.name || user.displayName || 'SafeSeat Admin'),
    email: String(data.email || user.email || ''),
    role: 'Fleet Admin'
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(runtimeConfig.dataMode === 'demo');
  const [identity, setIdentity] = useState<AdminIdentity | null>(() => {
    if (runtimeConfig.dataMode !== 'demo') return null;
    return sessionStorage.getItem('safeseat-admin-auth') === 'true'
      ? { uid: 'demo-admin', name: 'SafeSeat Admin', email: runtimeConfig.demoAdminEmail, role: 'Fleet Admin' }
      : null;
  });

  useEffect(() => {
    if (runtimeConfig.dataMode !== 'firebase') return;
    let active = true;
    let unsubscribe = () => {};

    void import('../firebase').then(({ auth }) => {
      unsubscribe = onAuthStateChanged(auth, async user => {
        if (!active) return;
        if (!user) {
          setIdentity(null);
          setReady(true);
          return;
        }
        try {
          const admin = await loadFirebaseAdmin(user);
          if (!active) return;
          if (!admin) {
            await firebaseSignOut(auth);
            setIdentity(null);
          } else {
            setIdentity(admin);
          }
        } finally {
          if (active) setReady(true);
        }
      });
    }).catch(() => setReady(true));

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ready,
    authenticated: Boolean(identity),
    identity,
    signIn: async (email, password) => {
      if (runtimeConfig.dataMode === 'demo') {
        if (email.trim().toLowerCase() !== runtimeConfig.demoAdminEmail.toLowerCase() || password !== runtimeConfig.demoAdminPassword) {
          throw new Error('Invalid demo credentials.');
        }
        sessionStorage.setItem('safeseat-admin-auth', 'true');
        setIdentity({ uid: 'demo-admin', name: 'SafeSeat Admin', email: runtimeConfig.demoAdminEmail, role: 'Fleet Admin' });
        return;
      }

      const { auth } = await import('../firebase');
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const admin = await loadFirebaseAdmin(credential.user);
      if (!admin) {
        await firebaseSignOut(auth);
        throw new Error('This account is not authorized for the SafeSeat Admin Module.');
      }
      setIdentity(admin);
    },
    signOut: async () => {
      if (runtimeConfig.dataMode === 'demo') {
        sessionStorage.removeItem('safeseat-admin-auth');
        setIdentity(null);
        return;
      }
      const { auth } = await import('../firebase');
      await firebaseSignOut(auth);
      setIdentity(null);
    }
  }), [ready, identity]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
