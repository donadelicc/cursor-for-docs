'use client';

import HeaderHome from '@/app/landingPage/HeaderHome' ;
import HeaderLoggedIn from '@/app/dashboard/HeaderLoggedIn';
import HeroSection from '@/app/landingPage/HeroSection';
import FeaturesSection from '@/app/landingPage/FeaturesSection';
import WelcomeSection from '@/app/dashboard/WelcomeSection';
import MyProjects from '@/app/dashboard/MyProjects';
import { useAuth } from '@/contexts/AuthContext';


export default function Home() {
  const { currentUser } = useAuth();

  // Show different home page based on authentication status
  if (!currentUser) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(220, 40%, 8%)' }}>
        <HeaderHome />
        <HeroSection />
        <FeaturesSection />
      </div>
    );
  }


  // Logged-in user's home page
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden transition-colors duration-200">
      {/* Header - Fixed */}
      <HeaderLoggedIn />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
          <WelcomeSection />
          <div className="flex-1 overflow-hidden">
            <MyProjects />
          </div>
        </div>
      </main>
    </div>
  );
}
