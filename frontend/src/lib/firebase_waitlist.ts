// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration for waitlist
const firebaseWaitlistConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_WAITLIST_MEASUREMENT_ID,
};

// Initialize Firebase app for waitlist (with a different name to avoid conflicts)
const waitlistApp = initializeApp(firebaseWaitlistConfig, 'waitlist');

// Initialize analytics and firestore for waitlist
let waitlistAnalytics;
if (typeof window !== 'undefined') {
  waitlistAnalytics = getAnalytics(waitlistApp);
}

const waitlistDb = getFirestore(waitlistApp);

export { waitlistApp, waitlistAnalytics, waitlistDb };
