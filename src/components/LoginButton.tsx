"use client";

import React from "react";
import Link from "next/link";

const LoginButton: React.FC = () => {
  return (
    <Link
      href="/login"
      className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
    >
      Get Started
    </Link>
  );
};

export default LoginButton;
