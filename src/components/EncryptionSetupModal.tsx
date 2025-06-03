import React, { useState, useEffect } from 'react';
import { X, Key, Info, AlertTriangle, EyeOff, Eye, Shield, Loader2, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import { 
  setupEncryption, 
  disableEncryption, 
  verifyEncryptionKey, 
  isEncryptionEnabled,
  setEncryptionKey,
  getEncryptionSettings
} from '../utils/encryptionUtils';

interface EncryptionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySet: () => void;
}

const EncryptionSetupModal: React.FC<EncryptionSetupModalProps> = ({
  isOpen,
  onClose,
  onKeySet
}) => {
  const [encryptionKey, setEncryptionKeyInput] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [mode, setMode] = useState<'setup' | 'unlock' | 'disable'>('setup');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine if we're setting up for the first time or unlocking
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setEncryptionKeyInput('');
      setConfirmKey('');
      
      const settings = getEncryptionSettings();
      if (settings.enabled) {
        setMode('unlock');
      } else {
        setMode('setup');
      }
    }
  }, [isOpen]);

  const handleSetupEncryption = () => {
    setError(null);
    
    if (!encryptionKey) {
      setError('Please enter an encryption key');
      return;
    }
    
    if (encryptionKey.length < 8) {
      setError('Encryption key must be at least 8 characters');
      return;
    }
    
    if (mode === 'setup' && encryptionKey !== confirmKey) {
      setError('Encryption keys do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      if (mode === 'setup') {
        // Set up new encryption
        setupEncryption(encryptionKey);
        setEncryptionKey(encryptionKey);
        setSuccess('Encryption has been set up successfully');
      } else if (mode === 'unlock') {
        // Verify the key
        if (verifyEncryptionKey(encryptionKey)) {
          setEncryptionKey(encryptionKey);
          setSuccess('Key verified. Messages will now be decrypted.');
        } else {
          setError('Invalid encryption key');
          setLoading(false);
          return;
        }
      } else if (mode === 'disable') {
        // Verify the key before disabling
        if (verifyEncryptionKey(encryptionKey)) {
          disableEncryption();
          setSuccess('Encryption has been disabled');
        } else {
          setError('Invalid encryption key');
          setLoading(false);
          return;
        }
      }
      
      setTimeout(() => {
        setLoading(false);
        onKeySet();
        onClose();
      }, 1000);
    } catch (err) {
      setError('Failed to set up encryption: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (mode === 'setup') {
      setMode('unlock');
    } else if (mode === 'unlock') {
      setMode('disable');
    } else {
      setMode('setup');
    }
    setError(null);
    setEncryptionKeyInput('');
    setConfirmKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Shield size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'setup' && 'Set Up Message Encryption'}
                {mode === 'unlock' && 'Enter Encryption Key'}
                {mode === 'disable' && 'Disable Encryption'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {mode === 'setup' && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Important Warning</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      If you lose your encryption key, <strong>all your encrypted messages will be permanently unrecoverable</strong>. 
                      We cannot reset or recover your key as it's never stored on our servers.
                    </p>
                    <p className="mt-2">
                      Please save your key in a secure password manager or other safe location.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'setup' && 'Create Encryption Key'}
                {mode === 'unlock' && 'Enter Encryption Key'}
                {mode === 'disable' && 'Confirm Encryption Key'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-gray-400" />
                </div>
                <input
                  type={showKey ? "text" : "password"}
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKeyInput(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter encryption key"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              {mode === 'setup' && (
                <p className="mt-1 text-xs text-gray-500">
                  Your key should be at least 8 characters and include a mix of letters, numbers, and symbols.
                </p>
              )}
            </div>

            {mode === 'setup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Encryption Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-gray-400" />
                  </div>
                  <input
                    type={showKey ? "text" : "password"}
                    value={confirmKey}
                    onChange={(e) => setConfirmKey(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm encryption key"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                <p>{success}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSetupEncryption}
                disabled={loading}
                loading={loading}
                leftIcon={loading ? <Loader2 className="animate-spin" /> : undefined}
              >
                {mode === 'setup' && 'Set Up Encryption'}
                {mode === 'unlock' && 'Unlock Messages'}
                {mode === 'disable' && 'Disable Encryption'}
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onClick={toggleMode}
              >
                {mode === 'setup' && 'I already have a key'}
                {mode === 'unlock' && 'Disable Encryption'}
                {mode === 'disable' && 'Set Up New Encryption'}
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">About End-to-End Encryption</p>
                <p className="mt-1">
                  With encryption enabled, your private messages with personas are encrypted before being sent to the server.
                  Only you can read them with your encryption key.
                </p>
                <p className="mt-1">
                  Your key is never sent to our servers, and messages in public Spaces remain unencrypted to allow
                  collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionSetupModal;