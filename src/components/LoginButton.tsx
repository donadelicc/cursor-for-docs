"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const LoginButton: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
    >
      Login
    </button>
  );
};

export default LoginButton;
