import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Trash2, AlertTriangle, Check, Info, Sparkles, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import { Space } from '../types';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const spaceSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isPublic: z.boolean().default(false),
  coordinatorInstructions: z.string().max(10000, 'Instructions must be 10000 characters or less').optional()
});

type SpaceSettingsForm = z.infer<typeof spaceSettingsSchema>;

interface SpaceSettingsPanelProps {
  space: Space;
  onClose: () => void;
  onUpdate: (data: SpaceSettingsForm) => Promise<void>;
  onDelete: () => Promise<void>;
  isOwner: boolean;
}

const SpaceSettingsPanel: React.FC<SpaceSettingsPanelProps> = ({
  space,
  onClose,
  onUpdate,
  onDelete,
  isOwner
}) => {
  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, watch, setValue } = useForm<SpaceSettingsForm>({
    resolver: zodResolver(spaceSettingsSchema),
    defaultValues: {
      name: space.name,
      description: space.description || '',
      isPublic: space.isPublic,
      coordinatorInstructions: space.coordinatorInstructions || ''
    }
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);
  
  // AI Assistant states
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedInstructions, setGeneratedInstructions] = React.useState<string | null>(null);
  const [generationError, setGenerationError] = React.useState<string | null>(null);
  
  const coordinatorInstructions = watch('coordinatorInstructions');
  const instructionsLength = coordinatorInstructions?.length || 0;
  
  // Get current user context
  const { user } = useContext(AuthContext);

  const handleFormSubmit = async (data: SpaceSettingsForm) => {
    try {
      await onUpdate(data);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update space settings:', error);
    }
  };

  const handleDeleteSpace = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      console.error('Failed to delete space:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const generateInstructions = async () => {
    setIsGenerating(true);
    setGeneratedInstructions(null);
    setGenerationError(null);
    
    try {
      // Get space personas if any exist
      const personaIds = space.members
        .filter(m => m.personaId)
        .map(m => m.personaId)
        .filter(Boolean) as string[];
      
      // Use the dedicated space instructions generator function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-space-instructions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            spaceId: space.id,
            spaceName: space.name,
            spaceDescription: space.description,
            personaIds: personaIds.length > 0 ? personaIds : undefined,
            existingInstructions: coordinatorInstructions || undefined,
            userId: user?.id
          })
        }
      );
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Request failed with status: ${response.status}`;
        } catch (e) {
          errorMessage = `Request failed with status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setGeneratedInstructions(data.instructions);
    } catch (error) {
      console.error('Error generating instructions:', error);
      setGenerationError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedInstructions = () => {
    if (generatedInstructions) {
      setValue('coordinatorInstructions', generatedInstructions, { shouldDirty: true });
      setGeneratedInstructions(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Space Settings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordinator Instructions (optional)
              <span className="text-gray-400 text-xs ml-1 float-right">{instructionsLength}/10000</span>
            </label>
            <div className="mb-2">
              <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg mb-2">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p>These instructions guide how personas interact in your space. Use them to:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Set conversation topics or themes</li>
                    <li>Define behavior rules for personas</li>
                    <li>Adjust response frequency or style</li>
                    <li>Create role-playing scenarios</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <textarea
                {...register('coordinatorInstructions')}
                rows={5}
                placeholder="Example: Personas in this space should focus on technical topics, avoid political discussions, and limit responses to 1-2 sentences."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  onClick={generateInstructions}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              {errors.coordinatorInstructions && (
                <p className="mt-1 text-sm text-red-600">{errors.coordinatorInstructions.message}</p>
              )}
              
              {generationError && (
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                  <AlertTriangle size={16} className="mt-0.5" />
                  <p className="text-sm">{generationError}</p>
                </div>
              )}
            </div>
            
            {generatedInstructions && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-blue-600" size={16} />
                    <span className="font-medium text-blue-800">AI-Generated Instructions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneratedInstructions(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap text-gray-700">{generatedInstructions}</p>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={applyGeneratedInstructions}
                  >
                    Use These Instructions
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
              Make this space public
            </label>
          </div>
        
          {updateSuccess && (
            <div className="rounded-lg bg-green-50 p-4 flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              <p className="text-sm text-green-700">Space settings updated successfully</p>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={16} />}
              disabled={!isDirty || isSubmitting}
              loading={isSubmitting}
              fullWidth
            >
              Save Changes
            </Button>
          </div>
        </form>

        {isOwner && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-red-50 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Danger Zone</h3>
                <p className="mt-1 text-sm text-red-700">
                  Deleting this space will permanently remove all messages and member data. This action cannot be undone.
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    leftIcon={<Trash2 size={16} />} 
                    onClick={handleDeleteSpace}
                    loading={isDeleting}
                    className={`border-red-300 text-red-700 hover:bg-red-50 ${showDeleteConfirm ? 'bg-red-100' : ''}`}
                  >
                    {showDeleteConfirm ? 'Confirm Delete' : 'Delete Space'}
                  </Button>
                  {showDeleteConfirm && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="ml-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceSettingsPanel;