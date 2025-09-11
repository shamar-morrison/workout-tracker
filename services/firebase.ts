import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

// In React Native, use initializeAuth with persistence backed by AsyncStorage.
// We guard against re-initialization during fast refresh.

let firebaseApp: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as const;

  if (!config.apiKey || !config.appId || !config.projectId) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] Missing required EXPO_PUBLIC_FIREBASE_* env vars');
  }

  return config;
}

export function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApps()[0]! : initializeApp(getFirebaseConfig());
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getFirestoreDb() {
  if (!firestoreInstance) {
    const app = getFirebaseApp();
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export const auth = getFirebaseAuth();
export const db = getFirestoreDb();
