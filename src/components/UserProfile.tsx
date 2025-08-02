"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "./Avatar";

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
        <Avatar
          src={currentUser.photoURL}
          alt={currentUser.displayName || "Profile"}
          size={32}
          className="w-8 h-8"
          fallbackText={currentUser.displayName || currentUser.email || "User"}
        />
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {currentUser.displayName || "User"}
          </p>
        </div>
      </div>

      <Link
        href="/profile"
        className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md border border-indigo-200 hover:border-indigo-300 transition-colors font-medium"
      >
        My Documents
      </Link>

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
