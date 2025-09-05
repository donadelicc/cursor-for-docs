#!/usr/bin/env node

/**
 * Script to add pilot users to the Firestore database
 * Usage: node scripts/add-pilot-user.js <email> [displayName] [notes]
 * 
 * Example:
 * node scripts/add-pilot-user.js "john@example.com" "John Doe" "Beta tester from company X"
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase configuration - you'll need to set these environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


async function addPilotUser(email, displayName, notes) {
  try {
    console.log(firebaseConfig);
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    // Prepare pilot user data
    const pilotUserData = {
      email: email.toLowerCase(),
      displayName: displayName || null,
      addedBy: 'admin-script', // You can change this to track who added the user
      notes: notes || null,
      isActive: true,
      addedAt: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'pilotUsers'), pilotUserData);
    
    console.log('✅ Successfully added pilot user:');
    console.log(`   Email: ${email}`);
    console.log(`   Display Name: ${displayName || 'Not provided'}`);
    console.log(`   Notes: ${notes || 'None'}`);
    console.log(`   Document ID: ${docRef.id}`);
    
  } catch (error) {
    console.error('❌ Error adding pilot user:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/add-pilot-user.js <email> [displayName] [notes]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/add-pilot-user.js "john@example.com"');
  console.log('  node scripts/add-pilot-user.js "john@example.com" "John Doe"');
  console.log('  node scripts/add-pilot-user.js "john@example.com" "John Doe" "Beta tester from company X"');
  process.exit(1);
}

const [email, displayName, notes] = args;

// Run the script
addPilotUser(email, displayName, notes);
