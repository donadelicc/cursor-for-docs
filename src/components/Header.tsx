"use client";

import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "./UserProfile";
import LoginButton from "./LoginButton";

export default function Header() {
  const { currentUser } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Yeeeehaw!</h1>
          </div>
          <div className="flex items-center space-x-8">
            <div className="relative z-20">
              {currentUser ? <UserProfile /> : <LoginButton />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
