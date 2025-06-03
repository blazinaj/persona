import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Button from './ui/Button';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface FunctionModalProps {
  isOpen: boolean;
  personaId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const functionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  code: z.string().min(1, 'Function code is required'),
  is_active: z.boolean().default(true)
});

export const FunctionModal: React.FC<FunctionModalProps> = ({
  isOpen,
  personaId,
  onClose,
  onSubmit
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      is_active: true
    }
  });

  const handleAIGenerate = async () => {
    const prompt = watch('description');
    if (!prompt) {
      setError('Please provide a description of what the function should do');
      return;
    }

    if (!user) {
      setError('You must be logged in to generate functions');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Generate a JavaScript function that ${prompt}. Return ONLY the function code that follows this template, with no additional text or explanation:

async function execute(input) {
  try {
    // Your implementation here
    // Access input parameters via the input object
    // Example: const { param1, param2 } = input;
    
    // Return success response with result
    return { success: true, result: "..." };
  } catch (error) {
    // Return error response
    return { success: false, error: error.message };
  }
}`
            }],
            personaId,
            personality: ['analytical', 'technical'],
            knowledge: ['programming', 'JavaScript'],
            tone: 'technical',
            userId: user.id,
            tokensNeeded: 1000
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate function');
      }

      // Generate function name from description
      const functionName = prompt
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(word => !['a', 'an', 'the', 'to', 'that'].includes(word))
        .slice(0, 3)
        .join('_');

      setValue('name', functionName);
      // Remove any markdown code block markers if present
      const code = data.message.replace(/```[jJ]ava[sS]cript\n?|\n?```/g, '').trim();
      setValue('code', code);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Add Custom Function</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
                <span className="text-gray-400 text-xs ml-1">(What should this function do?)</span>
              </label>
              <div className="flex gap-2">
                <textarea
                  {...register('description')}
                  rows={3}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe what you want the function to do..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  leftIcon={isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                >
                  Generate
                </Button>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter function name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Function Code
                <span className="text-gray-400 text-xs ml-1">(Press Ctrl+S or Cmd+S to save)</span>
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="javascript"
                theme="vs-light"
                value={watch('code')}
                onChange={(value) => setValue('code', value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  quickSuggestions: true,
                  folding: true,
                  foldingHighlight: true,
                  renderLineHighlight: 'line',
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8
                  }
                }}
                onMount={(editor) => {
                  // Add keyboard shortcut for saving
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    () => {
                      handleSubmit(onSubmit)();
                    }
                  );
                }}
              />
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Function is active
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Function
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};