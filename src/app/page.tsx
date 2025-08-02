"use client";

import HeaderHome from "@/components/HeaderHome";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WelcomeSection from "@/components/WelcomeSection";
import MyDocuments from "@/components/MyDocuments";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();

  // Show different home page based on authentication status
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        <HeaderHome />
        <HeroSection />
        <FeaturesSection />
      </div>
    );
  }

  // Logged-in user's home page
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <HeaderLoggedIn />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
          <WelcomeSection />
          <div className="flex-1 overflow-hidden">
            <MyDocuments />
          </div>
        </div>
      </main>
    </div>
  );
}
