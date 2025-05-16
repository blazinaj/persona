import React, { useState, useContext } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import Button from './ui/Button';

interface PersonaAIProps {
  action: 'create' | 'update' | 'delete';
  onOpenCreateForm?: () => void;
  onOpenEditForm?: (data: any) => void;
  onClose: () => void;
}

export const PersonaAIChat: React.FC<PersonaAIProps> = ({
  action,
  onOpenCreateForm,
  onOpenEditForm,
  onClose
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    // Default data for create action
    const defaultData = action === 'create' ? {
      name: '',
      description: '',
      tags: [],
      personality: [],
      knowledge: [],
      tone: 'neutral',
      examples: [],
      visibility: 'private' as const
    } : undefined;

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
            action,
            userId: user.id,
            message: input
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process request');
      }

      setAiResponse(result.message);
      setTimeout(() => {
        onComplete();
      }, 2000);

      onComplete();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How can I help you {action} this persona?
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe what you want to do..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {aiResponse && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            {aiResponse}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !input.trim()}
          leftIcon={isLoading ? <Loader2 className="animate-spin" /> : <Send size={16} />}
        >
          Send Request
        </Button>
      </form>
    </div>
  );
};