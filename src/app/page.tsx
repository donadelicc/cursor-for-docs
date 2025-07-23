"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to JUVO Docs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {currentUser
                ? `Welcome back, ${currentUser.displayName || "User"}! Ready to create amazing documents?`
                : "Sign in with Google to start creating and editing documents with our powerful editor."}
            </p>
          </div>

          {/* New Document Button for all users */}
          <div className="space-y-4">
            <Link href="/document">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform">
                New Document
              </button>
            </Link>
            {!currentUser && (
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                🌟 You can create documents without signing in! Sign in later to
                save your work and access additional features.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
