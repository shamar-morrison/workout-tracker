import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from '@/services/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signUpWithEmail(email, password, displayName) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        return credential.user;
      },
      async signInWithEmail(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
      },
      async signOutUser() {
        await signOut(auth);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
