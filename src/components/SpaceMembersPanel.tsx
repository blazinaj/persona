import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Bot, User, Check, Trash2, Shield, Crown } from 'lucide-react';
import Button from './ui/Button';
import { Space, Persona } from '../types';
import { supabase } from '../lib/supabase';
import { Avatar } from './ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';

interface SpaceMembersPanelProps {
  space: Space;
  onClose: () => void;
  onAddMember: (data: { personaIds: string[], userIds: string[] }) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  currentUserId: string;
  userPersonas: Persona[];
}

const SpaceMembersPanel: React.FC<SpaceMembersPanelProps> = ({
  space,
  onClose,
  onAddMember,
  onRemoveMember,
  currentUserId,
  userPersonas
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [personaSearchTerm, setPersonaSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdding) {
      fetchAvailablePersonasAndUsers();
    }
  }, [isAdding, space.members, userPersonas]);

  const fetchAvailablePersonasAndUsers = async () => {
    try {
      setLoadingPersonas(true);
      setLoadingUsers(true);
      setError(null);
      
      // Filter out personas that are already members
      const existingPersonaIds = space.members
        .filter(member => member.personaId)
        .map(member => member.personaId!);
        
      setAvailablePersonas(userPersonas.filter(persona => 
        !existingPersonaIds.includes(persona.id)
      ));
      
      // Get existing user members
      const existingUserIds = space.members
        .filter(member => member.userId)
        .map(member => member.userId!);
      
      // Fetch public profiles that aren't already members
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, email')
        .eq('is_public', true)
        .filter('id', 'not.in', `(${[...existingUserIds, currentUserId].join(',')})`);
        
      if (error) throw error;
      
      setAvailableUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching available members:', error);
      setError(error.message || 'Error loading available members');
    } finally {
      setLoadingPersonas(false);
      setLoadingUsers(false);
    }
  };

  const handleAddMembers = async () => {
    try {
      await onAddMember({
        personaIds: selectedPersonas,
        userIds: selectedUsers
      });
      
      setIsAdding(false);
      setSelectedPersonas([]);
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error adding members:', error);
      setError(error.message || 'Failed to add members');
    }
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter available personas based on search term
  const filteredPersonas = availablePersonas.filter(persona =>
    persona.name.toLowerCase().includes(personaSearchTerm.toLowerCase()) ||
    (persona.description && persona.description.toLowerCase().includes(personaSearchTerm.toLowerCase()))
  );

  // Filter available users based on search term
  const filteredUsers = availableUsers.filter(user =>
    (user.display_name && user.display_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // Check if current user is owner or admin
  const isOwnerOrAdmin = space.userId === currentUserId || 
    space.members.some(member => 
      member.userId === currentUserId && 
      (member.role === 'owner' || member.role === 'admin')
    );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Members</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            {space.members.length} {space.members.length === 1 ? 'Member' : 'Members'}
          </h3>
          {isOwnerOrAdmin && !isAdding && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserPlus size={14} />}
              onClick={() => setIsAdding(true)}
            >
              Add
            </Button>
          )}
        </div>
        
        {isAdding ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Personas
              </label>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search your personas..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={personaSearchTerm}
                  onChange={(e) => setPersonaSearchTerm(e.target.value)}
                />
              </div>
              
              {loadingPersonas ? (
                <div className="text-center py-3">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                </div>
              ) : filteredPersonas.length === 0 ? (
                <div className="text-center py-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">No personas available</p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                  {filteredPersonas.map(persona => (
                    <div
                      key={persona.id}
                      onClick={() => togglePersona(persona.id)}
                      className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${
                        selectedPersonas.includes(persona.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar
                          src={getAvatarUrl(persona.avatar)}
                          name={persona.name}
                          size="xs"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-purple-500 rounded-full p-0.5">
                          <Bot size={8} className="text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-medium flex-1 truncate">{persona.name}</span>
                      {selectedPersonas.includes(persona.id) && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Users
              </label>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-gray-400" />
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
                <div className="text-center py-3">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">No users available</p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${
                        selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar
                          src={user.avatar_url}
                          name={user.display_name || user.email}
                          size="xs"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                          <User size={8} className="text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-medium flex-1 truncate">
                        {user.display_name || user.email}
                      </span>
                      {selectedUsers.includes(user.id) && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setSelectedPersonas([]);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddMembers}
                disabled={selectedPersonas.length === 0 && selectedUsers.length === 0}
              >
                Add Selected
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search members..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {space.members.map(member => {
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === 'owner';
            const isAdmin = member.role === 'admin';
            
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {member.personaId ? (
                    <div className="relative">
                      <Avatar
                        src={getAvatarUrl(member.personas?.avatar)}
                        name={member.personas?.name}
                        size="sm"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5">
                        <Bot size={10} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar
                        src={member.profiles?.avatar_url}
                        name={member.profiles?.display_name || member.profiles?.email}
                        size="sm"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <User size={10} className="text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {member.personaId 
                          ? member.personas?.name 
                          : member.profiles?.display_name || member.profiles?.email}
                      </span>
                      
                      {isOwner && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Crown size={10} className="mr-1" />
                          Owner
                        </span>
                      )}
                      
                      {isAdmin && !isOwner && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield size={10} className="mr-1" />
                          Admin
                        </span>
                      )}
                      
                      {isCurrentUser && (
                        <span className="text-xs text-gray-500">(you)</span>
                      )}
                    </div>
                    
                    {member.personaId && member.personas?.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {member.personas.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {isOwnerOrAdmin && !isOwner && member.userId !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpaceMembersPanel;