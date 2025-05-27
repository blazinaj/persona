import React from 'react';
import { Send, Loader2, MessageSquare, Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  transcript?: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  audioEnabled: boolean;
  toggleAudio: () => void;
  isListening: boolean;
  toggleVoiceInput: () => void;
  browserSupportsSpeechRecognition: boolean;
  transcriptError: string | null;
  generateSuggestions: () => Promise<void>;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  transcript,
  handleInputChange,
  isLoading,
  handleSubmit,
  audioEnabled,
  toggleAudio,
  isListening,
  toggleVoiceInput,
  browserSupportsSpeechRecognition,
  transcriptError,
  generateSuggestions,
  showSuggestions,
  setShowSuggestions
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <div className="max-w-7xl mx-auto relative z-10 w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <div className="flex-shrink-0 hidden sm:block">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            title={audioEnabled ? "Disable audio playback" : "Enable audio playback"}
            aria-label={audioEnabled ? "Disable audio playback" : "Enable audio playback"}
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-500" />
            )}
          </Button>
        </div>
        <div className="relative flex-1">
          <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
            {isMobile && (
              <button
                type="button"
                onClick={toggleAudio}
                className="pl-3 pr-1 text-gray-400 hover:text-gray-600"
                title={audioEnabled ? "Disable audio" : "Enable audio"}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            )}
            <input
              type="text" 
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className={`flex-1 ${isMobile ? 'pl-2' : 'px-4'} py-3 rounded-lg border-0 focus:outline-none`}
              disabled={isLoading}
            />
            <div className="flex items-center pr-2 gap-1 touch-manipulation">
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={`p-2 rounded-full touch-manipulation ${
                    isListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? (
                    <>
                      <MicOff size={16} />
                      <span className="sr-only">Stop voice input</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span className="sr-only">Start voice input</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  if (!showSuggestions) {
                    generateSuggestions();
                  }
                  setShowSuggestions(!showSuggestions);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full ml-1 touch-manipulation"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <span className={isMobile ? 'sr-only' : 'hidden sm:inline'}>Send</span>
          <span className="inline sm:hidden">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </span>
        </Button>
      </form>

      {transcriptError && (
        <div className="mt-2 text-red-500 text-xs sm:text-sm flex items-center gap-1 px-2 bg-red-50 p-2 rounded">
          <AlertCircle size={14} className="flex-shrink-0" />
          {transcriptError}
        </div>
      )}
      
      {isListening && transcript && (
        <div className="mt-2 text-blue-600 text-xs sm:text-sm px-2 bg-blue-50 p-2 rounded">
          <p className="font-medium">Listening: {transcript}</p>
        </div>
      )}
    </div>
  );
};

export default ChatInput;