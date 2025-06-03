import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Lock as LockOpen, Settings, Download, Info, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Persona } from '../../types';
import { getAvatarUrl } from '../../utils/avatarHelpers';
import EncryptionToggle from '../ui/EncryptionToggle';
import { 
  isEncryptionEnabled, 
  hasEncryptionKey, 
  clearEncryptionKey, 
  disableEncryption
} from '../../utils/encryptionUtils';
import { AuthContext } from '../../lib/AuthContext';

interface ChatHeaderProps {
  persona?: Persona;
  onSetupEncryption?: () => void;
  onUnlockEncryption?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  persona,
  onSetupEncryption = () => {},
  onUnlockEncryption = () => {}
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // If no persona is provided, return null
  if (!persona) return null;

  const encryptionEnabled = isEncryptionEnabled();
  const encryptionUnlocked = hasEncryptionKey();

  const handleLockEncryption = () => {
    clearEncryptionKey();
    setShowDropdown(false);
  };

  const handleDisableEncryption = () => {
    // Confirm with the user
    if (window.confirm("Are you sure you want to disable encryption? Any new messages will no longer be encrypted, but existing encrypted messages will remain encrypted.")) {
      disableEncryption();
      clearEncryptionKey();
      setShowDropdown(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center">
        <Avatar
          src={getAvatarUrl(persona)}
          name={persona.name}
          size="sm"
          className="mr-3"
        />
        <div>
          <h2 className="font-semibold text-gray-900">{persona.name}</h2>
          {persona.description && (
            <p className="text-xs text-gray-500 line-clamp-1">
              {persona.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Encryption toggle button */}
        <EncryptionToggle
          onSetupEncryption={onSetupEncryption}
          onUnlockEncryption={onUnlockEncryption}
          size="sm"
        />
        
        {/* Settings dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDropdown(!showDropdown)}
            leftIcon={<Settings size={16} />}
          >
            <span className="hidden sm:inline">Settings</span>
          </Button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {encryptionEnabled && (
                <>
                  {encryptionUnlocked && (
                    <button
                      onClick={handleLockEncryption}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LockOpen size={16} className="mr-2 text-amber-500" />
                      Lock Encryption
                    </button>
                  )}
                  <button
                    onClick={handleDisableEncryption}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Lock size={16} className="mr-2 text-red-500" />
                    Disable Encryption
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                </>
              )}
              
              <button
                onClick={() => {
                  // Export chat functionality would go here
                  setShowDropdown(false);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download size={16} className="mr-2 text-gray-500" />
                Export Conversation
              </button>
              
              <a
                href="https://personify.mobi/docs/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Info size={16} className="mr-2 text-gray-500" />
                Privacy Policy
                <ExternalLink size={12} className="ml-1 text-gray-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;