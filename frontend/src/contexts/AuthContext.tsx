'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserProfile, checkPilotAccess } from '@/utils/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  hasPilotAccess: boolean;
  pilotAccessLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPilotAccess, setHasPilotAccess] = useState(false);
  const [pilotAccessLoading, setPilotAccessLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setHasPilotAccess(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const checkUserPilotAccess = async (user: User | null) => {
    if (!user || !user.email) {
      console.log('🔍 Pilot Access Check: No user or email');
      setHasPilotAccess(false);
      setPilotAccessLoading(false);
      return;
    }

    console.log('🔍 Pilot Access Check: Checking access for', user.email);
    setPilotAccessLoading(true);
    try {
      const hasAccess = await checkPilotAccess(user.email);
      console.log('🔍 Pilot Access Check: Result for', user.email, '=', hasAccess);
      setHasPilotAccess(hasAccess);
    } catch (error) {
      console.error('❌ Error checking pilot access:', error);
      setHasPilotAccess(false);
    } finally {
      setPilotAccessLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create user profile in Firestore if it doesn't exist
        try {
          await createUserProfile(user);
        } catch (error) {
          console.error('Error creating user profile:', error);
        }

        // Check pilot access for authenticated users
        await checkUserPilotAccess(user);
      } else {
        setHasPilotAccess(false);
        setPilotAccessLoading(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    hasPilotAccess,
    pilotAccessLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
