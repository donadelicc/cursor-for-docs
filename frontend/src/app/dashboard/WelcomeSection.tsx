'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeSection() {
  const { currentUser } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-200">
            Welcome to Useful
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-200">
            {getGreeting()}, {firstName}! Ready to get working?
          </p>
        </div>
      </div>
    </div>
  );
}
