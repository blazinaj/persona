import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload } from 'lucide-react';
import Button from './ui/Button';
import { Persona, PersonalityTrait } from '../types';

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

const editPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  avatar: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  personality: z.array(z.string()).optional(),
  customPersonality: z.string().optional(),
  knowledge: z.array(z.string()).optional(),
  tone: z.string().optional(),
  examples: z.array(z.string()).optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private')
});

type EditPersonaForm = z.infer<typeof editPersonaSchema>;

interface EditPersonaModalProps {
  isOpen: boolean;
  persona: Persona;
  onClose: () => void;
  onSubmit: (id: string, data: EditPersonaForm) => void;
}

export const EditPersonaModal: React.FC<EditPersonaModalProps> = ({
  isOpen,
  persona,
  onClose,
  onSubmit
}) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EditPersonaForm>({
    resolver: zodResolver(editPersonaSchema),
    defaultValues: {
      name: persona.name,
      description: persona.description || '',
      avatar: persona.avatar || '',
      tags: persona.tags || [],
      personality: persona.personality || [],
      knowledge: persona.knowledge || [],
      tone: persona.tone || '',
      examples: persona.examples || [],
      visibility: persona.visibility || 'private'
    }
  });

  const handleCustomPersonality = () => {
    const customTrait = watch('customPersonality');
    if (customTrait) {
      const currentPersonality = watch('personality') || [];
      setValue('personality', [...currentPersonality, customTrait]);
      setValue('customPersonality', '');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 text-left shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Edit Persona</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit((data) => onSubmit(persona.id, data))} className="space-y-6">
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
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPersonaModal;