import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Check } from 'lucide-react';
import Button from './ui/Button';
import { Badge } from './ui/Badge';

interface PersonaAIFormProps {
  isMultiGeneration?: boolean;
  multiCount?: number;
  onSuggest: (suggestions: {
    name?: string;
    description?: string;
    tags?: string[];
    personality?: string[];
    knowledge?: string[];
    tone?: string;
    instructions?: string;
    examples?: string[];
    multiPersonas?: any[];
  }) => void;
}

const PersonaAIForm: React.FC<PersonaAIFormProps> = ({ 
  onSuggest, 
  isMultiGeneration = false,
  multiCount = 3
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generatedPersonas, setGeneratedPersonas] = useState<any[]>([]);

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
            action: isMultiGeneration ? 'create-multiple' : 'create',
            message: input,
            count: isMultiGeneration ? multiCount : undefined
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate personas');
      }

      if (isMultiGeneration && Array.isArray(data)) {
        // Process each persona to ensure examples are strings
        const processedPersonas = data.map((persona: any) => {
          const processedExamples = persona.examples?.map((example: any) => {
            if (typeof example === 'object' && example.interaction) {
              return example.interaction;
            } else if (typeof example === 'object' && example !== null) {
              try {
                return JSON.stringify(example);
              } catch (e) {
                return 'Example interaction';
              }
            }
            return typeof example === 'string' ? example : 
                  example !== null && example !== undefined ? String(example) : 
                  'Example interaction';
          });
          
          return {
            name: persona.name,
            description: persona.description,
            tags: persona.tags || [],
            personality: persona.personality || [],
            knowledge: persona.knowledge || [],
            tone: persona.tone || 'neutral',
            examples: processedExamples || [],
            instructions: persona.instructions || ''
          };
        });
        
        // Store the generated personas for display
        setGeneratedPersonas(processedPersonas);
        setGenerationSuccess(true);
        onSuggest({ multiPersonas: processedPersonas });
      } else {
        // Process single persona
        const processedExamples = data.examples?.map((example: any) => {
          if (typeof example === 'object' && example.interaction) {
            return example.interaction;
          } else if (typeof example === 'object' && example !== null) {
            try {
              return JSON.stringify(example);
            } catch (e) {
              return 'Example interaction';
            }
          }
          return typeof example === 'string' ? example : 
                example !== null && example !== undefined ? String(example) : 
                'Example interaction';
        });
        
        const suggestions = {
          name: data.name,
          description: data.description,
          tags: data.tags,
          personality: data.personality,
          knowledge: data.knowledge,
          tone: data.tone,
          examples: Array.isArray(data.examples) 
            ? processedExamples
            : []
        };

        setGenerationSuccess(true);
        onSuggest(suggestions);
      }

      setInput('');
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneratedPersonas = () => {
    if (!generationSuccess || !isMultiGeneration || generatedPersonas.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Check size={18} className="text-green-600" />
          <h3 className="font-medium text-green-800">Generated {generatedPersonas.length} personas successfully!</h3>
        </div>
        
        <div className="space-y-3">
          {generatedPersonas.map((persona, index) => (
            <div key={index} className="bg-white p-3 rounded border border-green-100">
              <h4 className="font-medium text-gray-900">{persona.name}</h4>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{persona.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {persona.tags?.slice(0, 3).map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
                {persona.tags?.length > 3 && (
                  <span className="text-xs text-gray-500">+{persona.tags.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-green-700 mt-3">
          Click "Create Persona" below to add {generatedPersonas.length > 1 ? 'these personas' : 'this persona'} to your collection.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-blue-600" />
        <h3 className="font-medium text-blue-900">AI Assistant</h3>
        {isMultiGeneration && (
          <Badge variant="primary" className="ml-2">
            Multi-Generate
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-blue-800 mb-4">
        {isMultiGeneration 
          ? `Describe the type of personas you want to create, and I'll generate ${multiCount} variations.` 
          : 'Describe the persona you want to create, and I\'ll help you fill out the form.'}
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
            placeholder={isMultiGeneration
              ? "e.g., Create variations of a technical writing assistant with different specialties"
              : "e.g., Create a technical writing assistant that helps with documentation"}
            className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isLoading}
            leftIcon={isLoading ? <Loader2 className="animate-spin" /> : <Send size={16} />}
            title={isMultiGeneration ? `Generate ${multiCount} personas` : "Get suggestions"}
          >
            {isLoading ? 'Generating...' : isMultiGeneration ? `Generate ${multiCount}` : 'Generate'}
          </Button>
        </div>
      </form>
      
      {renderGeneratedPersonas()}
    </div>
  );
};

export default PersonaAIForm;