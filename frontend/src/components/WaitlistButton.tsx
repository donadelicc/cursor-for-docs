"use client";

import React, { useState } from "react";
import WaitlistSignup from "./WaitlistSignup";

interface WaitlistButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({
  children,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const handleClick = () => {
    setIsWaitlistOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>

      <WaitlistSignup
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
      />
    </>
  );
};

export default WaitlistButton;
