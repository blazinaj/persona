import React from 'react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({
  suggestions,
  onSuggestionClick
}) => {
  return (
    <div className="absolute bottom-full left-0 right-0 mx-2 bg-white border rounded-lg shadow-lg mb-2 max-h-[40vh] overflow-y-auto z-20">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 touch-manipulation"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default ChatSuggestions;