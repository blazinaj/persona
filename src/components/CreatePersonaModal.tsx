import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Check, Plus, Tag, Brain, MessageSquare, Code } from 'lucide-react';
import Button from './ui/Button';
import { PersonalityTrait, PersonaTemplate, CommunicationTone, KnowledgeArea } from '../types';
import { personaTemplates } from '../data/personaTemplates';
import { Badge } from './ui/Badge';

const personalityTraits: PersonalityTrait[] = [
  'friendly',
  'professional',
  'humorous',
  'empathetic',
  'direct',
  'creative',
  'analytical',
  'motivational'
];

const communicationTones: CommunicationTone[] = [
  'formal',
  'casual',
  'technical',
  'supportive',
  'enthusiastic',
  'neutral'
];

const knowledgeAreas: KnowledgeArea[] = [
  'programming',
  'design',
  'business',
  'science',
  'arts',
  'education',
  'health',
  'technology'
];

const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  avatar: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  customTag: z.string().optional(),
  personality: z.array(z.string()).optional(),
  customPersonality: z.string().optional(),
  knowledge: z.array(z.string()).optional(),
  customKnowledge: z.string().optional(),
  tone: z.string().optional(),
  examples: z.array(z.string()).optional(),
  customExample: z.string().optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private')
});

type CreatePersonaForm = z.infer<typeof createPersonaSchema>;

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePersonaForm) => void;
}

export const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreatePersonaForm>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: {
      tags: [],
      personality: [],
      knowledge: [],
      examples: [],
      tone: 'neutral',
      visibility: 'private'
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleAddTag = () => {
    const customTag = watch('customTag');
    if (customTag) {
      const currentTags = watch('tags') || [];
      setValue('tags', [...currentTags, customTag]);
      setValue('customTag', '');
    }
  };

  const handleCustomPersonality = () => {
    const customTrait = watch('customPersonality');
    if (customTrait) {
      const currentPersonality = watch('personality') || [];
      setValue('personality', [...currentPersonality, customTrait]);
      setValue('customPersonality', '');
    }
  };

  const handleAddKnowledge = () => {
    const customKnowledge = watch('customKnowledge');
    if (customKnowledge) {
      const currentKnowledge = watch('knowledge') || [];
      setValue('knowledge', [...currentKnowledge, customKnowledge]);
      setValue('customKnowledge', '');
    }
  };

  const handleAddExample = () => {
    const customExample = watch('customExample');
    if (customExample) {
      const currentExamples = watch('examples') || [];
      setValue('examples', [...currentExamples, customExample]);
      setValue('customExample', '');
    }
  };

  const applyTemplate = (template: PersonaTemplate) => {
    setValue('name', template.name);
    setValue('description', template.description);
    setValue('avatar', template.avatar);
    setValue('tags', template.tags);
    setValue('personality', template.personality);
    setValue('knowledge', template.knowledge);
    setValue('tone', template.tone);
    setValue('examples', template.examples);
    setSelectedTemplate(template.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 text-left shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Create New Persona</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Template</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {personaTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2">
                        <Check size={16} className="text-blue-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={template.avatar}
                        alt={template.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setValue('name', '');
                    setValue('description', '');
                    setValue('avatar', '');
                    setValue('tags', []);
                    setValue('personality', []);
                    setValue('knowledge', []);
                    setValue('tone', '');
                    setValue('examples', []);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Or start from scratch
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter persona name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Describe your persona's purpose and capabilities"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
                <span className="block text-xs text-gray-500">Leave empty to use default avatar</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('avatar')}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<Upload size={16} />}
                >
                  Upload
                </Button>
              </div>
              {errors.avatar && (
                <p className="mt-1 text-sm text-red-600">{errors.avatar.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
              </label>
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('customTag')}
                    placeholder="Add custom tag..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!watch('customTag')}
                    leftIcon={<Tag size={16} />}
                  >
                    Add Tag
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {watch('tags')?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch('tags') || [];
                        setValue('tags', current.filter(t => t !== tag));
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personality Traits
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
              </label>
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('customPersonality')}
                    placeholder="Add custom trait..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCustomPersonality}
                    disabled={!watch('customPersonality')}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {personalityTraits.map((trait) => (
                  <label
                    key={trait}
                    className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={trait}
                      {...register('personality')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{trait}</span>
                  </label>
                ))}
                {watch('personality')?.filter(trait => !personalityTraits.includes(trait as PersonalityTrait)).map((customTrait) => (
                  <div
                    key={customTrait}
                    className="flex items-center justify-between p-2 rounded border border-gray-200 bg-blue-50"
                  >
                    <span className="text-sm">{customTrait}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch('personality') || [];
                        setValue('personality', current.filter(t => t !== customTrait));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Knowledge Areas
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
              </label>
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('customKnowledge')}
                    placeholder="Add custom knowledge area..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddKnowledge}
                    disabled={!watch('customKnowledge')}
                    leftIcon={<Brain size={16} />}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {knowledgeAreas.map((area) => (
                  <label
                    key={area}
                    className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={area}
                      {...register('knowledge')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{area}</span>
                  </label>
                ))}
                {watch('knowledge')?.filter(k => !knowledgeAreas.includes(k as KnowledgeArea)).map((customArea) => (
                  <div
                    key={customArea}
                    className="flex items-center justify-between p-2 rounded border border-gray-200 bg-blue-50"
                  >
                    <span className="text-sm">{customArea}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch('knowledge') || [];
                        setValue('knowledge', current.filter(k => k !== customArea));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Communication Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {communicationTones.map((tone) => (
                  <label
                    key={tone}
                    className={`flex items-center justify-center p-2 rounded border cursor-pointer transition-colors ${
                      watch('tone') === tone
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={tone}
                      {...register('tone')}
                      className="sr-only"
                    />
                    <span className="text-sm capitalize">{tone}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Example Interactions
                <span className="text-gray-400 text-xs ml-1">(optional)</span>
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('customExample')}
                    placeholder="Add example interaction..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddExample}
                    disabled={!watch('customExample')}
                    leftIcon={<MessageSquare size={16} />}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {watch('examples')?.map((example, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-2 p-3 rounded bg-gray-50"
                    >
                      <p className="flex-1 text-sm text-gray-700">{example}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const current = watch('examples') || [];
                          setValue('examples', current.filter((_, i) => i !== index));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                {...register('visibility')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="private">Private - Only visible to you</option>
                <option value="unlisted">Unlisted - Not listed but can be embedded</option>
                <option value="public">Public - Listed in explore and can be embedded</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Persona
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePersonaModal;