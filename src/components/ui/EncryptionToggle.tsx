import React, { useState } from 'react';
import { Lock, Lock as LockOpen, Key, Info, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { isEncryptionEnabled, hasEncryptionKey } from '../../utils/encryptionUtils';

interface EncryptionToggleProps {
  onSetupEncryption: () => void;
  onUnlockEncryption: () => void;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const EncryptionToggle: React.FC<EncryptionToggleProps> = ({
  onSetupEncryption,
  onUnlockEncryption,
  size = 'md',
  showTooltip = true
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const isEnabled = isEncryptionEnabled();
  const hasKey = hasEncryptionKey();

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'p-1.5 text-xs';
      case 'lg': return 'p-3 text-base';
      default: return 'p-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 20;
      default: return 16;
    }
  };

  return (
    <div className="relative">
      {isEnabled ? (
        <Button
          variant="outline"
          size={size}
          className={`relative ${hasKey ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
          onClick={hasKey ? () => setShowInfo(!showInfo) : onUnlockEncryption}
          title={hasKey ? "Messages are encrypted" : "Encryption enabled but locked"}
        >
          {hasKey ? (
            <Lock size={getIconSize()} />
          ) : (
            <div className="flex items-center gap-1">
              <LockOpen size={getIconSize()} />
              <span>Unlock</span>
            </div>
          )}
        </Button>
      ) : (
        <Button
          variant="outline"
          size={size}
          onClick={onSetupEncryption}
          title="Set up end-to-end encryption"
        >
          <div className="flex items-center gap-1">
            <Key size={getIconSize()} />
            <span>Encrypt</span>
          </div>
        </Button>
      )}

      {showTooltip && showInfo && isEnabled && hasKey && (
        <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-white rounded shadow-lg border border-gray-200 z-50">
          <div className="flex items-start gap-2">
            <div className="mt-1 text-green-500 flex-shrink-0">
              <Lock size={16} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">End-to-End Encryption Active</h4>
              <p className="text-xs text-gray-600 mt-1">
                Your messages with this persona are encrypted and can only be read with your key.
              </p>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInfo(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTooltip && showInfo && !isEnabled && (
        <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-white rounded shadow-lg border border-gray-200 z-50">
          <div className="flex items-start gap-2">
            <div className="mt-1 text-amber-500 flex-shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Encryption Not Active</h4>
              <p className="text-xs text-gray-600 mt-1">
                Your messages are not encrypted. Enable encryption for additional privacy.
              </p>
              <div className="mt-2">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={onSetupEncryption}
                  leftIcon={<Key size={12} />}
                  className="w-full"
                >
                  Set Up Encryption
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncryptionToggle;