import React, { useState, useEffect, useRef } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Users, Bot, Settings, Sparkles, Search, Save } from 'lucide-react';
import Button from '../ui/Button';

interface OnboardingWalkthroughProps {
  type: 'basic' | 'detailed' | 'none';
  onComplete: () => void;
  role: string;
  intention: string;
}

const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({ 
  type, 
  onComplete,
  role,
  intention
}) => {
  const navigate = useNavigate();
  const [run, setRun] = useState(type !== 'none');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [creatingPersona, setCreatingPersona] = useState(false);
  
  // States for active tasks
  const [hasCreatedPersona, setHasCreatedPersona] = useState(false);
  const [hasChatted, setHasChatted] = useState(false);
  const [hasCustomized, setHasCustomized] = useState(false);
  const [hasExplored, setHasExplored] = useState(false);
  const [hasCreatedSpace, setHasCreatedSpace] = useState(false);
  
  // References to elements we need to interact with
  const createPersonaButtonRef = useRef<HTMLButtonElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If type is none, complete immediately
    if (type === 'none') {
      onComplete();
      return;
    }

    // Store walkthrough state in localStorage
    localStorage.setItem('persona_tour_type', type);

    // Define the tour steps based on walkthrough type
    const basicSteps: Step[] = [
      {
        target: '.dashboard-header',
        content: 'Welcome to Persona! This is your dashboard where you can manage all your AI personas.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.create-persona-button',
        content: 'Start by creating your first AI persona with our guided setup.',
        disableBeacon: true,
        placement: 'bottom-end',
      },
      {
        target: '.explore-section',
        content: 'Explore existing personas created by the community for inspiration.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.spaces-section',
        content: 'Create spaces to have multiple personas interact with each other and users.',
        disableBeacon: true,
        placement: 'bottom',
      }
    ];

    const detailedSteps: Step[] = [
      {
        target: '.dashboard-header',
        content: 'Welcome to Persona! This is your dashboard where you can manage all your AI personas.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.create-persona-button',
        content: 'Start by creating your first AI persona with our guided setup.',
        disableBeacon: true,
        placement: 'bottom-end',
      },
      {
        target: '.persona-templates',
        content: 'Choose from templates or create your own custom persona from scratch.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.persona-ai-helper',
        content: 'Our AI assistant can help you define the perfect persona based on your needs.',
        disableBeacon: true,
        placement: 'top',
      },
      {
        target: '.persona-personality',
        content: 'Define your persona\'s personality traits to make it unique and suitable for your needs.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.explore-section',
        content: 'Explore existing personas created by the community for inspiration.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.featured-personas',
        content: 'Check out featured personas that are popular with our community.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.spaces-section',
        content: 'Create spaces to have multiple personas interact with each other and users.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '.space-creation',
        content: 'Set up custom spaces with different personas for specialized conversations.',
        disableBeacon: true,
        placement: 'bottom',
      }
    ];

    // Set steps based on walkthrough type
    setSteps(type === 'basic' ? basicSteps : detailedSteps);
    
    // Save the walkthrough completion status
    localStorage.setItem('persona_tour_in_progress', 'true');
  }, [type, onComplete]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index } = data;
    
    setCurrentStep(index);

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setTourCompleted(true);
      localStorage.setItem('persona_tour_completed', 'true');
    }
  };

  const handleCreatePersonaClick = () => {
    setCreatingPersona(true);
    
    // Simulate creating a persona
    setTimeout(() => {
      setCreatingPersona(false);
      setHasCreatedPersona(true);
      
      // Trigger the next part of the walkthrough
      navigate('/personas/sample-id');
    }, 1500);
  };

  const getTourActions = () => {
    // Return different actions based on the current step in the tour
    switch (currentStep) {
      case 1: // Create Persona step
        return (
          <div className="mt-4 flex justify-center">
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={handleCreatePersonaClick}
              loading={creatingPersona}
              ref={createPersonaButtonRef}
            >
              Create My First Persona
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const getTasks = () => {
    const tasks = [
      { completed: hasCreatedPersona, label: 'Create your first AI persona', icon: <Plus size={16} /> },
      { completed: hasChatted, label: 'Chat with your persona', icon: <MessageSquare size={16} /> },
      { completed: hasCustomized, label: 'Customize persona settings', icon: <Settings size={16} /> },
      { completed: hasExplored, label: 'Explore the community', icon: <Search size={16} /> },
      { completed: hasCreatedSpace, label: 'Create a collaborative space', icon: <Users size={16} /> }
    ];

    return (
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600" />
          <span>Getting Started Checklist</span>
        </h3>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div 
              key={index}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                task.completed ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className={`flex items-center justify-center rounded-full w-8 h-8 ${
                task.completed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {task.completed ? <Check size={16} /> : task.icon}
              </div>
              <span className={`ml-3 ${
                task.completed ? 'line-through text-green-700' : 'text-gray-700'
              }`}>
                {task.label}
              </span>
              {task.completed && (
                <span className="ml-auto text-xs font-medium text-green-600">Completed</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Button 
            variant="primary" 
            onClick={() => {
              // Save progress and complete onboarding
              onComplete();
              localStorage.setItem('persona_tour_completed', 'true');
            }}
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  // If the user chose no walkthrough
  if (type === 'none') {
    return null;
  }
  
  // For role and intention-based personalization
  const getRoleBasedText = () => {
    switch (role) {
      case 'developer':
        return "As a developer, you'll find our code integration and API features particularly useful.";
      case 'business':
        return "As a business professional, you can leverage our personas for customer service and team productivity.";
      case 'student':
        return "As a student, our personas can help with research, learning, and studying efficiently.";
      case 'content_creator':
        return "As a content creator, our personas can assist with ideation, editing, and audience engagement.";
      default:
        return "You'll find various features to help you get the most out of our AI personas.";
    }
  };

  return (
    <div>
      {/* Joyride tour */}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
          },
          buttonClose: {
            display: 'none',
          },
        }}
        callback={handleJoyrideCallback}
      />

      {/* After tour completion, show the tasks checklist */}
      {tourCompleted && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Persona!</h2>
            
            <p className="text-gray-600 mb-3">
              {getRoleBasedText()}
            </p>
            
            <p className="text-gray-600 mb-4">
              Complete these steps to get the most out of Persona:
            </p>
            
            {getTasks()}
          </div>
        </div>
      )}

      {/* Contextual action buttons based on current step */}
      {getTourActions()}
    </div>
  );
};

// Add a Check icon component
const Check = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default OnboardingWalkthrough;