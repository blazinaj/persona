import React from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

interface ChatStatusProps {
  error: string | null;
  tokenWarning: string | null;
  isGeneratingImage: boolean;
  imageGenerationProgress: string;
  canClaimTrial: boolean;
  claimingTrial: boolean;
  handleClaimTrial: () => Promise<void>;
}

const ChatStatus: React.FC<ChatStatusProps> = ({
  error,
  tokenWarning,
  isGeneratingImage,
  imageGenerationProgress,
  canClaimTrial,
  claimingTrial,
  handleClaimTrial
}) => {
  return (
    <>
      {isGeneratingImage && (
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{imageGenerationProgress}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center space-x-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {tokenWarning && (
        <div className="flex items-center justify-center space-x-2 text-yellow-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{tokenWarning}</span>
        </div>
      )}

      {canClaimTrial && (
        <div className="flex flex-col items-center justify-center p-4 space-y-2 bg-blue-50 rounded-lg">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <p className="text-center text-sm">
            Try our service for free! Claim your trial now.
          </p>
          <Button
            onClick={handleClaimTrial}
            disabled={claimingTrial}
            className="w-full sm:w-auto"
          >
            {claimingTrial ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Claiming trial...
              </>
            ) : (
              'Claim Free Trial'
            )}
          </Button>
        </div>
      )}
    </>
  );
};

export default ChatStatus;