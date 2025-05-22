import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';

interface PersonaAIFormProps {
  onSuggest: (suggestions: {
    name?: string;
    description?: string;
    tags?: string[];
    personality?: string[];
    knowledge?: string[];
    tone?: string;
    examples?: string[];
  }) => void;
}

export const PersonaAIForm: React.FC<PersonaAIFormProps> = ({ onSuggest }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'create',
            message: input
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      // Parse suggestions from AI response
      const suggestions = {
        name: data.name,
        description: data.description,
        tags: data.tags,
        personality: data.personality,
        knowledge: data.knowledge,
        tone: data.tone,
        examples: data.examples
      };

      onSuggest(suggestions);
      setInput('');
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-blue-600" />
        <h3 className="font-medium text-blue-900">AI Assistant</h3>
      </div>
      
      <p className="text-sm text-blue-800 mb-4">
        Describe the persona you want to create, and I'll help you fill out the form.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Create a technical writing assistant that helps with documentation"
            className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isLoading}
            leftIcon={isLoading ? <Loader2 className="animate-spin" /> : <Send size={16} />}
          >
            {isLoading ? 'Generating...' : 'Get Suggestions'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonaAIForm;