"use client";

import Image from "next/image";
import Link from "next/link";
import LoginButton from "./LoginButton";

export default function HeaderHome() {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-[1050]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo on the left */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src="/useful_sm.png"
                alt="Useful Logo"
                height={100}
                width={200}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Login button on the right */}
          <div className="flex items-center">
            <LoginButton />
          </div>
        </div>
      </div>
    </header>
  );
}
