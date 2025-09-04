'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthStatus: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="fixed top-4 right-4 z-40">
      {currentUser ? (
        <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Signed in as {currentUser.displayName}</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Your work will be saved automatically</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium">Guest Mode</span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">Sign in to save your documents</p>
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
