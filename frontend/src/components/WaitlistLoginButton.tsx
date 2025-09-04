"use client";

import React, { useState } from "react";
import WaitlistSignup from "./WaitlistSignup";

const WaitlistLoginButton: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const handleClick = () => {
    setIsWaitlistOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center px-6 py-2 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg backdrop-blur-sm border border-gray-700/30"
        style={{ backgroundColor: "#29a7ac" }}
      >
        Join Waitlist
      </button>

      <WaitlistSignup
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
      />
    </>
  );
};

export default WaitlistLoginButton;
