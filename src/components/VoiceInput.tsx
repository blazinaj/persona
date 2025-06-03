import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import 'regenerator-runtime/runtime';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  tooltip?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  className = '',
  size = 'md',
  disabled = false,
  tooltip = 'Toggle voice input'
}) => {
  const [showError, setShowError] = useState(false);
  
  console.log('VoiceInput component rendering');
  console.log('Disabled prop:', disabled);
  
  const {
    transcript,
    isListening,
    toggleListening,
    resetTranscript,
    error,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({
    onResult: (text) => {
      if (text) {
        onTranscript(text);
        console.log('Transcript received and passed to parent:', text);
      }
    }
  });

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Log speech recognition support
  useEffect(() => {
    console.log('Speech recognition supported in VoiceInput:', browserSupportsSpeechRecognition);
    if (!browserSupportsSpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
    }
  }, [browserSupportsSpeechRecognition]);

  if (!browserSupportsSpeechRecognition) {
    console.log('Speech recognition not supported, not rendering VoiceInput');
    return null;
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          console.log('Voice input button clicked');
          toggleListening();
          if (!isListening) {
            resetTranscript();
          }
        }}
        disabled={disabled}
        className={`${sizeClasses[size]} rounded-full transition-colors relative ${
          isListening 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'hover:bg-gray-100 text-gray-500'
        } ${className}`}
        title={tooltip}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <MicOff size={iconSizes[size]} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          </>
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </button>
      
      {showError && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 text-xs rounded px-2 py-1 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-red-100"></div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;