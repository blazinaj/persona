import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import Button from '../ui/Button';

interface ChatHeaderProps {
  audioEnabled: boolean;
  toggleAudio: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  audioEnabled,
  toggleAudio,
  isExpanded,
  setIsExpanded
}) => {
  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleAudio}
        title={audioEnabled ? 'Disable audio' : 'Enable audio'}
        className="bg-white/80 backdrop-blur-sm shadow-sm"
      >
        {audioEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white/80 backdrop-blur-sm shadow-sm"
      >
        {isExpanded ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
};

export default ChatHeader;