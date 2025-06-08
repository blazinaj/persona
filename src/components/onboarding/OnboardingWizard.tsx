import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowRight, 
  Check, 
  Code, 
  Users, 
  Briefcase, 
  Lightbulb, 
  Coffee, 
  BookOpen, 
  MessageSquare, 
  Bot,
  Rocket
} from 'lucide-react';
import Button from '../ui/Button';

// Define the schema for onboarding data
const onboardingSchema = z.object({
  role: z.enum(['developer', 'business', 'student', 'content_creator', 'researcher', 'other']),
  intention: z.enum(['personal_assistant', 'knowledge_hub', 'creativity_partner', 'productivity', 'learning', 'other']),
  walkthrough: z.enum(['basic', 'detailed', 'none'])
});

type OnboardingData = z.infer<typeof onboardingSchema>;

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  loading?: boolean;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, loading = false }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<string | null>(null);

  const { register, handleSubmit, setValue, trigger, formState: { errors, isValid } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange'
  });

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setValue('role', role as any);
    trigger('role');
  };

  const handleIntentionSelect = (intention: string) => {
    setSelectedIntention(intention);
    setValue('intention', intention as any);
    trigger('intention');
  };

  const handleWalkthroughSelect = (walkthrough: string) => {
    setSelectedWalkthrough(walkthrough);
    setValue('walkthrough', walkthrough as any);
    trigger('walkthrough');
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await trigger('role');
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger('intention');
      if (isValid) setStep(3);
    } else if (step === 3) {
      handleSubmit(onComplete)();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'developer': return <Code />;
      case 'business': return <Briefcase />;
      case 'student': return <BookOpen />;
      case 'content_creator': return <Lightbulb />;
      case 'researcher': return <Coffee />;
      default: return <Users />;
    }
  };

  const getIntentionIcon = (intention: string) => {
    switch (intention) {
      case 'personal_assistant': return <Bot />;
      case 'knowledge_hub': return <BookOpen />;
      case 'creativity_partner': return <Lightbulb />;
      case 'productivity': return <Rocket />;
      case 'learning': return <Coffee />;
      default: return <MessageSquare />;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">What best describes your role?</h2>
            <p className="text-gray-600">This helps us tailor your experience.</p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'developer', label: 'Developer', icon: <Code size={24} /> },
                { value: 'business', label: 'Business Professional', icon: <Briefcase size={24} /> },
                { value: 'student', label: 'Student', icon: <BookOpen size={24} /> },
                { value: 'content_creator', label: 'Content Creator', icon: <Lightbulb size={24} /> },
                { value: 'researcher', label: 'Researcher', icon: <Coffee size={24} /> },
                { value: 'other', label: 'Other', icon: <Users size={24} /> },
              ].map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  className={`flex flex-col items-center justify-center p-6 border rounded-lg ${
                    selectedRole === role.value 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } transition-all`}
                >
                  <div className={`p-3 rounded-full mb-3 ${
                    selectedRole === role.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {role.icon}
                  </div>
                  <span className="font-medium">{role.label}</span>
                  {selectedRole === role.value && (
                    <Check size={16} className="absolute top-3 right-3 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">What's your main intention for using Persona?</h2>
            <p className="text-gray-600">We'll recommend features and templates based on your needs.</p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'personal_assistant', label: 'Personal Assistant', icon: <Bot size={24} /> },
                { value: 'knowledge_hub', label: 'Knowledge Hub', icon: <BookOpen size={24} /> },
                { value: 'creativity_partner', label: 'Creativity Partner', icon: <Lightbulb size={24} /> },
                { value: 'productivity', label: 'Boost Productivity', icon: <Rocket size={24} /> },
                { value: 'learning', label: 'Learning & Education', icon: <Coffee size={24} /> },
                { value: 'other', label: 'Other', icon: <MessageSquare size={24} /> },
              ].map(intention => (
                <button
                  key={intention.value}
                  type="button"
                  onClick={() => handleIntentionSelect(intention.value)}
                  className={`flex flex-col items-center justify-center p-6 border rounded-lg ${
                    selectedIntention === intention.value 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } transition-all`}
                >
                  <div className={`p-3 rounded-full mb-3 ${
                    selectedIntention === intention.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {intention.icon}
                  </div>
                  <span className="font-medium">{intention.label}</span>
                  {selectedIntention === intention.value && (
                    <Check size={16} className="absolute top-3 right-3 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Choose your walkthrough experience</h2>
            <p className="text-gray-600">Learn how to get the most out of Persona.</p>

            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  value: 'basic', 
                  label: 'Basic Walkthrough', 
                  description: 'A quick 2-minute tour of the essential features.',
                  icon: <Rocket size={24} />
                },
                { 
                  value: 'detailed', 
                  label: 'Detailed Walkthrough', 
                  description: 'An in-depth guide to all major features and workflows.',
                  icon: <BookOpen size={24} /> 
                },
                { 
                  value: 'none', 
                  label: 'No Walkthrough', 
                  description: 'Skip the guided tour and explore on your own.',
                  icon: <ArrowRight size={24} />
                },
              ].map(walkthrough => (
                <button
                  key={walkthrough.value}
                  type="button"
                  onClick={() => handleWalkthroughSelect(walkthrough.value)}
                  className={`flex items-center p-6 border rounded-lg ${
                    selectedWalkthrough === walkthrough.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } transition-all`}
                >
                  <div className={`p-3 rounded-full mr-4 ${
                    selectedWalkthrough === walkthrough.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {walkthrough.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-medium ${selectedWalkthrough === walkthrough.value ? 'text-blue-700' : 'text-gray-800'}`}>
                      {walkthrough.label}
                    </h3>
                    <p className="text-sm text-gray-600">{walkthrough.description}</p>
                  </div>
                  {selectedWalkthrough === walkthrough.value && (
                    <Check size={20} className="ml-2 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Persona</h1>
          <div className="text-sm font-medium text-gray-500">Step {step} of 3</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={e => e.preventDefault()}>
        {renderStep()}

        <div className="flex justify-between mt-10 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            type="button"
          >
            Back
          </Button>

          <Button
            variant="primary"
            onClick={nextStep}
            disabled={
              (step === 1 && !selectedRole) || 
              (step === 2 && !selectedIntention) || 
              (step === 3 && !selectedWalkthrough) ||
              loading
            }
            loading={loading}
            type="button"
          >
            {step === 3 ? 'Get Started' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingWizard;