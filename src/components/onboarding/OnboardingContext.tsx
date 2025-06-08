import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

type WalkthroughType = 'basic' | 'detailed' | 'none';

interface OnboardingContextType {
  isOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  role: string | null;
  intention: string | null;
  walkthroughType: WalkthroughType;
  currentStep: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => Promise<void>;
  setRole: (role: string) => void;
  setIntention: (intention: string) => void;
  setWalkthroughType: (type: WalkthroughType) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [walkthroughType, setWalkthroughType] = useState<WalkthroughType>('basic');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setIsLoading(true);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('Checking onboarding status for user:', user.id);
          
          // First check if the profile exists at all
          const { data: profileExists, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
            
          if (checkError && checkError.code !== 'PGRST116') { 
            console.error('Error checking if profile exists:', checkError);
          }
            
          // If profile doesn't exist, create it first
          if (!profileExists) {
            console.log('Creating new profile for user');
            const { error: createError } = await supabase
              .from('profiles')
              .insert({ 
                id: user.id,
                email: user.email,
                onboarding_completed: false 
              });
              
            if (createError) {
              console.error('Error creating profile:', createError);
            }
          }
          
          // Check localStorage for onboarding status - ONLY consider true values
          const localStatus = localStorage.getItem('onboardingCompleted');
          const isCompletedLocally = localStatus === 'true';
          
          // Now check onboarding_completed in the database
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed, role, primary_intention')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error checking onboarding status:', error);
            // If there's a database error, use the localStorage value
            setHasCompletedOnboarding(isCompletedLocally);
            setIsLoading(false);
            return;
          }
          
          console.log('Profile data:', data);
          
          // Require BOTH localStorage and database to confirm completion
          // This ensures reset works properly from either source
          const isCompleted = isCompletedLocally && data?.onboarding_completed;
          
          setHasCompletedOnboarding(isCompleted);
          
          // Load saved preferences
          if (data.role) setRole(data.role);
          if (data.primary_intention) setIntention(data.primary_intention);
          
          // Update localStorage to match database
          if (data.onboarding_completed) {
            localStorage.setItem('onboardingCompleted', 'true');
          } else {
            localStorage.removeItem('onboardingCompleted');
          }
        } else {
          // No user, set not completed
          setHasCompletedOnboarding(false);
          localStorage.removeItem('onboardingCompleted');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, assume not completed to show onboarding
        setHasCompletedOnboarding(false);
        localStorage.removeItem('onboardingCompleted');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep(0);
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Completing onboarding for user:', user.id);
        
        // Update user profile
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            role: role,
            primary_intention: intention
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      }
      
      // Set local state
      setIsOnboarding(false);
      setHasCompletedOnboarding(true);
      localStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    setIsOnboarding(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const resetOnboarding = async () => {
    try {
      // Reset local states first
      setIsOnboarding(false);
      setHasCompletedOnboarding(false);
      setRole(null);
      setIntention(null);
      setWalkthroughType('basic');
      setCurrentStep(0);
      
      // Clear localStorage onboarding flags
      localStorage.removeItem('onboardingCompleted');
      localStorage.removeItem('persona_tour_completed');
      localStorage.removeItem('persona_dashboard_tour_seen');
      localStorage.removeItem('persona_explore_tour_seen');
      localStorage.removeItem('persona_chat_tour_seen');
      localStorage.removeItem('persona_spaces_tour_seen');
      localStorage.removeItem('persona_tour_type');
      localStorage.removeItem('persona_tour_in_progress');

      // Update the database as well
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: false
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating onboarding status in database:', error);
        }
      }
      
      console.log('Onboarding reset complete - should show onboarding now');
      
      // Force page reload to ensure the app picks up the new state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        hasCompletedOnboarding,
        role,
        intention,
        walkthroughType,
        currentStep,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
        setRole,
        setIntention,
        setWalkthroughType,
        nextStep,
        prevStep
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};