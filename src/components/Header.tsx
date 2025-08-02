"use client";

import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "./UserProfile";
import LoginButton from "./LoginButton";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const { currentUser } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => {
                console.log("Logo clicked - navigating to home!");
                router.push("/");
              }}
            >
              <Image
                src="/useful_sm.png"
                alt="Useful Logo"
                height={100}
                width={200}
                className="h-10 w-auto"
                priority
              />
            </div>
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
