import { waitlistDb } from './firebase_waitlist';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export interface WaitlistEntry {
  name: string;
  email: string;
  timestamp: Timestamp;
}

export const addToWaitlist = async (name: string, email: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(waitlistDb, 'waitlist'), {
      name,
      email,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
};
