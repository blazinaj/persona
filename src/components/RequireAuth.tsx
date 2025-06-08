import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../lib/AuthContext';
import { Loader2 } from 'lucide-react';
import { useOnboarding } from './onboarding/OnboardingContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  const { hasCompletedOnboarding } = useOnboarding();
  const location = useLocation();
  
  // Add debug logging
  useEffect(() => {
    console.log('RequireAuth: user=', user?.id, 'hasCompletedOnboarding=', hasCompletedOnboarding);
  }, [user, hasCompletedOnboarding]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // If authenticated but hasn't completed onboarding, redirect to onboarding
  if (user && !hasCompletedOnboarding && location.pathname !== '/onboarding') {
    console.log('RequireAuth: Redirecting to onboarding from RequireAuth');
    return <Navigate to="/onboarding\" replace />;
  }
  
  // User is authenticated and has completed onboarding, render children
  return <>{children}</>;
};

export default RequireAuth;