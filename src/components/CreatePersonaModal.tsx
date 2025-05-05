import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload } from 'lucide-react';
import Button from './ui/Button';
import { PersonalityTrait } from '../types';

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

const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().min(10, 'Description must be at least 10 characters').max(200),
  avatar: z.string().url('Please enter a valid image URL'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  personality: z.array(z.enum(['friendly', 'professional', 'humorous', 'empathetic', 'direct', 'creative', 'analytical', 'motivational']))
    .min(1, 'Select at least one personality trait'),
  knowledge: z.array(z.string()).min(1, 'At least one knowledge area is required'),
  tone: z.string().min(1, 'Tone is required'),
  examples: z.array(z.string()).min(1, 'At least one example is required'),
  isPublic: z.boolean()
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
  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreatePersonaForm>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: {
      isPublic: false,
      tags: [],
      personality: [],
      knowledge: [],
      examples: ['']
    }
  });

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
              </label>
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
              </div>
              {errors.personality && (
                <p className="mt-1 text-sm text-red-600">{errors.personality.message}</p>
              )}
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