import React, { useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Mic, MicOff, Volume2, VolumeX, AlertCircle, X } from 'lucide-react';
import Button from '../ui/Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  transcript?: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  showInteractiveHints: boolean;
  setShowInteractiveHints: (show: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  transcript,
  handleInputChange = () => {},
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
  setShowSuggestions,
  showInteractiveHints,
  setShowInteractiveHints
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea height based on content whenever input changes
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to fit the content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  // Handle textarea input change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  // Handle keyboard shortcuts in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new lines (default behavior)
      // Do nothing, let the default behavior insert a new line
    }
  };

  return (
    <div className="relative z-10 w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <div className="flex-shrink-0 hidden xs:block">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
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
            <button
              type="button"
              onClick={toggleAudio}
              className="pl-3 pr-1 text-gray-400 hover:text-gray-600 xs:hidden"
              title={audioEnabled ? "Disable audio" : "Enable audio"}
            >
              {audioEnabled ? (
                <Volume2 className="w-5 h-5 text-blue-600" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 pl-2 xs:pl-4 pr-4 py-3 rounded-lg border-0 focus:outline-none text-base resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
              disabled={isLoading}
              rows={1}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center pr-2 gap-2">
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={`p-2 rounded-full ${
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
                className={`p-2 hover:bg-gray-100 rounded-full ${
                  showSuggestions ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Show suggestions"
              >
                {showSuggestions ? <X size={18} /> : <MessageSquare size={18} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 px-4 flex items-center justify-center whitespace-nowrap flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isMobile ? (
                <Send className="w-5 h-5" />
              ) : (
                <>
                  <span className="mr-1">Send</span>
                  <Send className="w-5 h-5" />
                </>
              )
            )}
          </Button>
        </div>
      </form>

      {transcriptError && (
        <div className="mt-2 text-red-500 text-xs sm:text-sm flex items-center gap-1 px-2 bg-red-50 p-2 rounded">
          <AlertCircle size={14} />
          {transcriptError}
        </div>
      )}
      
      {isListening && transcript && (
        <div className="mt-2 text-blue-600 text-xs sm:text-sm px-2 bg-blue-50 p-2 rounded">
          <p className="font-medium">Listening: {transcript}</p>
        </div>
      )}
      
      {showSuggestions && (
        <div className="fixed inset-0 bg-black/30 z-10 sm:hidden" onClick={() => setShowSuggestions(false)}></div>
      )}
    </div>
  );
}

export default ChatInput;