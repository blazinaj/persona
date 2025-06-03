import React from 'react';
import { X } from 'lucide-react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({
  suggestions,
  onSuggestionClick
}) => {
  return (
    <div className="mx-2 mb-2 bg-white border rounded-lg shadow-lg max-h-[40vh] overflow-y-auto z-20 relative">
      <div className="sticky top-0 flex items-center justify-between p-3 border-b bg-white sm:hidden">
        <span className="text-sm font-medium text-gray-700">Suggestions</span>
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          onClick={() => onSuggestionClick('')}
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onSuggestionClick(suggestion);
          }}
          className="w-full px-4 py-3.5 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default ChatSuggestions;