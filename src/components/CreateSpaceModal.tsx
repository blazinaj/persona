import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Users, Plus, Search, User, Bot, Check, Info, Sparkles, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { Avatar } from './ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';

const createSpaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isPublic: z.boolean().default(false),
  coordinatorInstructions: z.string().max(10000, 'Instructions must be 10000 characters or less').optional(),
  personas: z.array(z.string()).optional(),
  users: z.array(z.string()).optional()
});

type CreateSpaceForm = z.infer<typeof createSpaceSchema>;

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSpaceForm) => void;
  userId: string;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId
}) => {
  const [availablePersonas, setAvailablePersonas] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [personaSearchTerm, setPersonaSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // AI Assistant states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInstructions, setGeneratedInstructions] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreateSpaceForm>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      coordinatorInstructions: '',
      personas: [],
      users: []
    }
  });

  const selectedPersonas = watch('personas') || [];
  const selectedUsers = watch('users') || [];
  const coordinatorInstructions = watch('coordinatorInstructions') || '';

  useEffect(() => {
    if (isOpen) {
      fetchPersonas();
      fetchUsers();
    }
  }, [isOpen]);

  const fetchPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setAvailablePersonas(data || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, email')
        .eq('is_public', true)
        .neq('id', userId); // Exclude current user

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePersona = (personaId: string) => {
    const current = [...selectedPersonas];
    if (current.includes(personaId)) {
      setValue('personas', current.filter(id => id !== personaId));
    } else {
      setValue('personas', [...current, personaId]);
    }
  };

  const toggleUser = (userId: string) => {
    const current = [...selectedUsers];
    if (current.includes(userId)) {
      setValue('users', current.filter(id => id !== userId));
    } else {
      setValue('users', [...current, userId]);
    }
  };

  const generateInstructions = async () => {
    setIsGenerating(true);
    setGeneratedInstructions(null);
    
    try {
      const spaceName = watch('name');
      const spaceDescription = watch('description');
      
      // Get details of selected personas for context
      const selectedPersonaDetails = availablePersonas
        .filter(p => selectedPersonas.includes(p.id))
        .map(p => ({
          name: p.name,
          description: p.description,
          personality: p.personality,
          knowledge: p.knowledge,
          tone: p.tone
        }));
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-space-instructions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            spaceName,
            spaceDescription,
            personaIds: selectedPersonas,
            existingInstructions: coordinatorInstructions || undefined,
            userId
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setGeneratedInstructions(data.instructions);
    } catch (error) {
      console.error('Error generating instructions:', error);
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

  // Filter personas based on search term
  const filteredPersonas = availablePersonas.filter(persona =>
    persona.name.toLowerCase().includes(personaSearchTerm.toLowerCase()) ||
    (persona.description && persona.description.toLowerCase().includes(personaSearchTerm.toLowerCase()))
  );

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(user =>
    (user.display_name && user.display_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create New Space</h2>
            </div>
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
                Space Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter space name"
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
                <span className="text-gray-400 text-xs ml-1 float-right">{coordinatorInstructions.length}/10000</span>
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
                  rows={4}
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
                    disabled={isGenerating || !watch('name') || selectedPersonas.length === 0}
                  >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>
              {errors.coordinatorInstructions && (
                <p className="mt-1 text-sm text-red-600">{errors.coordinatorInstructions.message}</p>
              )}
              
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Add Personas
              </label>
              
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search personas..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={personaSearchTerm}
                  onChange={(e) => setPersonaSearchTerm(e.target.value)}
                />
              </div>
              
              {loadingPersonas ? (
                <div className="text-center py-4">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading personas...</p>
                </div>
              ) : filteredPersonas.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <Bot size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No personas found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {filteredPersonas.map(persona => (
                    <div
                      key={persona.id}
                      onClick={() => togglePersona(persona.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                        selectedPersonas.includes(persona.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Avatar
                        src={getAvatarUrl(persona.avatar)}
                        name={persona.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{persona.name}</p>
                      </div>
                      {selectedPersonas.includes(persona.id) && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {selectedPersonas.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Selected Personas:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersonas.map(personaId => {
                      const persona = availablePersonas.find(p => p.id === personaId);
                      return persona ? (
                        <div
                          key={personaId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {persona.name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePersona(personaId);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Invite Users (optional)
              </label>
              
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              
              {loadingUsers ? (
                <div className="text-center py-4">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <User size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Avatar
                        src={user.avatar_url}
                        name={user.display_name || user.email}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.display_name || user.email}
                        </p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {selectedUsers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Selected Users:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find(u => u.id === userId);
                      return user ? (
                        <div
                          key={userId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {user.display_name || user.email}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUser(userId);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Plus size={16} />}
              >
                Create Space
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSpaceModal;