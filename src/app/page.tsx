'use client';

import { useState, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import UsernameSetup from '@/components/UsernameSetup';
import ChatInterface from '@/components/ChatInterface';
import { getUserData, clearUserData } from '@/lib/storage';

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const userData = getUserData();
    if (userData) {
      setIsAuthenticated(true);
      setShowLanding(false);
    }
    setIsLoading(false);
  }, []);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleLoginComplete = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearUserData();
    setIsAuthenticated(false);
    setShowLanding(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <>
      {isAuthenticated ? (
        <ChatInterface onLogout={handleLogout} />
      ) : (
        <UsernameSetup onComplete={handleLoginComplete} />
      )}
    </>
  );
}
