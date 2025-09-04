'use client';

import React from 'react';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { AuthProvider } from '@/contexts/AuthContext';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow relative isolate">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent"></div>
            {children}
          </main>
        </div>
      </AuthProvider>
    </DarkModeProvider>
  );
}
