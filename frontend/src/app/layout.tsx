import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hello Boston!',
  description: 'Blazing fast papers',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col bg-gradient-to-b from-anti-flash-white to-lace-cap`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow relative isolate">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent"></div>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
