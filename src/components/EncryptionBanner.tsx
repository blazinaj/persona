import React from 'react';
import { Shield, AlertTriangle, Lock, Lock as LockOff } from 'lucide-react';
import Button from './ui/Button';
import { isEncryptionEnabled, hasEncryptionKey } from '../utils/encryptionUtils';

interface EncryptionBannerProps {
  onSetupEncryption: () => void;
  onUnlockEncryption: () => void;
}

const EncryptionBanner: React.FC<EncryptionBannerProps> = ({
  onSetupEncryption,
  onUnlockEncryption
}) => {
  const encryptionEnabled = isEncryptionEnabled();
  const hasKey = hasEncryptionKey();
  
  // No banner needed if encryption is not enabled
  if (!encryptionEnabled) {
    return null;
  }
  
  // Show banner if encryption is enabled but key is not set
  if (encryptionEnabled && !hasKey) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400\" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Encrypted Messages</h3>
            <div className="mt-2 text-sm text-amber-700 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p>
                Your messages are encrypted and cannot be read without your key.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Lock size={14} />}
                onClick={onUnlockEncryption}
              >
                Unlock Messages
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show success banner if encryption is enabled and key is set
  if (encryptionEnabled && hasKey) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Messages are end-to-end encrypted
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default EncryptionBanner;