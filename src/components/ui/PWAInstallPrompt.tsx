import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import Button from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if user has previously dismissed the prompt
    const hasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    
    if (!isAppInstalled && !hasDismissed) {
      window.addEventListener('beforeinstallprompt', handler);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 animate-fadeIn">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">Install Persona</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install this app on your device for quick access and offline capabilities.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={handleInstall}
            >
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded-full hover:bg-gray-100"
          aria-label="Dismiss"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;