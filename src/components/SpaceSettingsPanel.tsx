import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Trash2, AlertTriangle, Check, Info, Sparkles, Loader2, Settings, Image, FileText, Table, MessageSquare, Key } from 'lucide-react';
import Button from './ui/Button';
import { Space } from '../types';
import { AuthContext } from '../lib/AuthContext';
import { SpaceInviteManager } from './SpaceInviteManager';

const spaceSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isPublic: z.boolean().default(false),
  coordinatorInstructions: z.string().max(10000, 'Instructions must be 10000 characters or less').optional(),
  enableImages: z.boolean().default(true),
  enablePDFs: z.boolean().default(true),
  enableSpreadsheets: z.boolean().default(true),
  enableInteractiveElements: z.boolean().default(true)
});

type SpaceSettingsForm = z.infer<typeof spaceSettingsSchema>;

interface Space {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coordinatorInstructions?: string;
}

interface AuthContextType {
  user: { id: string } | null;
}

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
      coordinatorInstructions: space.coordinatorInstructions || '',
      enableImages: true,
      enablePDFs: true,
      enableSpreadsheets: true,
      enableInteractiveElements: true
    }
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [showInviteManager, setShowInviteManager] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedInstructions, setGeneratedInstructions] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const coordinatorInstructions = watch('coordinatorInstructions');
  const instructionsLength = coordinatorInstructions?.length || 0;

  const { user } = useContext(AuthContext) as AuthContextType;

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
            existingInstructions: coordinatorInstructions || undefined,
            userId: user?.id
          })
        }
      );

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Request failed with status: ${response.status}`;
        } catch (e) {
          errorMessage = `Request failed with status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data: { instructions: string } = await response.json();
      setGeneratedInstructions(data.instructions);
    } catch (error) {
      console.error('Error generating instructions:', error);
      setGenerationError(error instanceof Error ? error.message : 'An unexpected error occurred');
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

  const toggleInviteManager = () => {
    setShowInviteManager(!showInviteManager);
  };

  if (showInviteManager) {
    return <SpaceInviteManager space={space} onClose={() => setShowInviteManager(false)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Space Settings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Key size={16} />}
            onClick={toggleInviteManager}
          >
            Invites
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full"
          >
            <span className="sr-only">Close panel</span>
            <X size={18} className="text-gray-500" />
          </button>
        </div>
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
              placeholder="Describe the purpose of this space"
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

          <div className="flexlam">
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

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Settings size={16} className="text-blue-600" />
              <span>Space Features</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-purple-600" />
                  <span className="text-sm">Image Generation</span>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="enableImages"
                    {...register('enableImages')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="enableImages"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      watch('enableImages') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        watch('enableImages') ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />
                  <span className="text-sm">PDF Uploads</span>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="enablePDFs"
                    {...register('enablePDFs')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="enablePDFs"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      watch('enablePDFs') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        watch('enablePDFs') ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table size={16} className="text-purple-600" />
                  <span className="text-sm">Spreadsheet Support</span>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="enableSpreadsheets"
                    {...register('enableSpreadsheets')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="enableSpreadsheets"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      watch('enableSpreadsheets') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        watch('enableSpreadsheets') ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-purple-600" />
                  <span className="text-sm">Interactive Elements</span>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="enableInteractiveElements"
                    {...register('enableInteractiveElements')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="enableInteractiveElements"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      watch('enableInteractiveElements') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        watch('enableInteractiveElements') ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Trash2 size={16} className="text-red-600" />
                <span>Danger Zone</span>
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Delete this space</p>
                    <p className="text-sm text-red-700">This action cannot be undone.</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={16} />}
                    onClick={handleDeleteSpace}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Space'}
                  </Button>
                </div>
                {showDeleteConfirm && (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-700 mb-2">Are you sure you want to delete this space? This will permanently remove all data associated with it.</p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteSpace}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          'Confirm Delete'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          {updateSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <Check size={16} />
              <span className="text-sm">Settings saved successfully</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save size={16} />}
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceSettingsPanel;