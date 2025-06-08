import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from './onboarding/OnboardingWizard';
import OnboardingWalkthrough from './onboarding/OnboardingWalkthrough';
import { supabase } from '../lib/supabase';
import { useOnboarding } from './onboarding/OnboardingContext';
import { Loader2 } from 'lucide-react';

type OnboardingData = {
  role: 'developer' | 'business' | 'student' | 'content_creator' | 'researcher' | 'other';
  intention: 'personal_assistant' | 'knowledge_hub' | 'creativity_partner' | 'productivity' | 'learning' | 'other';
  walkthrough: 'basic' | 'detailed' | 'none';
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check if onboarding has been completed
  useEffect(() => {
    console.log('Onboarding component mounted, hasCompletedOnboarding:', hasCompletedOnboarding);
    setDebugInfo(`hasCompletedOnboarding: ${hasCompletedOnboarding}`);
    
    if (hasCompletedOnboarding) {
      // If onboarding is already completed, redirect to dashboard
      navigate('/');
    }
  }, [hasCompletedOnboarding, navigate]);

  const handleWizardComplete = async (data: OnboardingData) => {
    setOnboardingData(data);
    setSaving(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Saving onboarding data for user:', user.id);
        console.log('Onboarding data:', data);
        
        // First check if profile exists
        const { data: profileExists, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking profile:', checkError);
        }
        
        // If profile doesn't exist, create it first
        if (!profileExists) {
          console.log('Creating profile for user');
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              onboarding_completed: false
            });
            
          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
        }
        
        // Save onboarding preferences to user profile
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: data.walkthrough === 'none',
            role: data.role,
            primary_intention: data.intention
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
        
        console.log('Onboarding data saved successfully');
      }
      
      setSaving(false);
      
      // If user chose 'none' for walkthrough, mark as completed right away
      if (data.walkthrough === 'none') {
        completeOnboarding();
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setError('Failed to save your preferences. Please try again.');
      setSaving(false);
    }
  };

  const handleOnboardingComplete = () => {
    // Mark onboarding as completed
    completeOnboarding();
    setOnboardingCompleted(true);
    
    // Redirect to dashboard
    navigate('/');
  };

  // Debug information display for troubleshooting
  const DebugInfo = () => (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 text-xs rounded">
      {debugInfo}
    </div>
  );

  // If user has already completed the wizard but not the walkthrough
  if (onboardingData && !onboardingCompleted) {
    return (
      <>
        <OnboardingWalkthrough
          type={onboardingData.walkthrough}
          role={onboardingData.role}
          intention={onboardingData.intention}
          onComplete={handleOnboardingComplete}
        />
        {import.meta.env.DEV && <DebugInfo />}
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-6">
            <span className="font-bold text-2xl">P</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Persona</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's set up your experience to help you get the most out of AI personas.
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center">
            <p>{error}</p>
          </div>
        )}
        
        <OnboardingWizard 
          onComplete={handleWizardComplete} 
          loading={saving} 
        />

        {import.meta.env.DEV && <DebugInfo />}
      </div>
    </div>
  );
};

export default Onboarding;