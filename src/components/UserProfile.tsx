"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {currentUser.photoURL && (
          <Image
            src={currentUser.photoURL}
            alt="Profile"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
            unoptimized={true}
          />
        )}
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {currentUser.displayName || "User"}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="relative z-10 text-sm text-gray-500 px-4 py-2 rounded-md border-0 transition-colors cursor-pointer font-medium shadow-sm hover:shadow-md"
        type="button"
      >
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;
