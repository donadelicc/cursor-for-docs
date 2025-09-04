import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Storage and export reference. Use explicit bucket if provided.
// Normalize the env var to avoid accidental quotes ("..." or '...').
const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const normalizedBucket = rawBucket ? rawBucket.replace(/^['"]+|['"]+$/g, '').trim() : undefined;

// Optional: log once to help debug bucket setting issues
if (typeof window !== 'undefined') {
  console.debug('[Firebase] storage bucket', {
    fromEnv: rawBucket,
    normalizedBucket,
    fromConfig: firebaseConfig.storageBucket,
  });
}

export const storage = getStorage(app, normalizedBucket);

export default app;
