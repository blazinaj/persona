import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Info, UserPlus, Bot, User, Loader2, AlertCircle, Share2, Check, Copy, Link, BrainCircuit, X, Menu, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Space, Persona } from '../types';
import SpaceChat from './SpaceChat';
import SpaceMembersPanel from './SpaceMembersPanel';
import SpaceSettingsPanel from './SpaceSettingsPanel';
import { Avatar } from './ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';
import SpaceMemoriesPanel from './SpaceMemoriesPanel';

interface SpaceDetailsProps {
  userId: string;
  onBack: () => void;
}

const SpaceDetails: React.FC<SpaceDetailsProps> = ({ userId, onBack }) => {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'members' | 'settings' | 'memories' | null>(null);
  const navigate = useNavigate();
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSpaceDetails();
      fetchUserPersonas();
    }
  }, [id, userId]);

  const fetchSpaceDetails = async () => {
    if (!id) return;

    try {
      console.log('Fetching space details for space ID:', id);
      setLoading(true);
      
      // Fetch space details - use maybeSingle to handle case where space doesn't exist
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (spaceError) {
        console.error('Error fetching space:', spaceError);
        throw spaceError;
      }
      
      // Check if space was found
      if (!spaceData) {
        setError('Space not found');
        setLoading(false);
        return;
      }
      
      // Fetch space members (without trying to join profiles or personas)
      const { data: membersData, error: membersError } = await supabase
        .from('space_members')
        .select('id, space_id, persona_id, user_id, role, joined_at')
        .eq('space_id', id);
        
      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }
      
      console.log('Fetched members data:', membersData);
      
      // Fetch related data for each member separately
      const enhancedMembers = await Promise.all(membersData.map(async (member) => {
        let personaData = null;
        let profileData = null;
        
        // If member has a persona_id, fetch the persona data
        if (member.persona_id) {
          const { data: personas, error: personaError } = await supabase
            .from('personas')
            .select('id, name, avatar, description, personality, knowledge, tone, instructions')
            .eq('id', member.persona_id)
            .limit(1);
            
          if (!personaError && personas && personas.length > 0) {
            personaData = personas[0];
          } else if (personaError) {
            console.error('Error fetching persona data:', personaError);
          }
        }
        
        // If member has a user_id, fetch the profile data
        if (member.user_id) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, email')
            .eq('id', member.user_id)
            .limit(1);
            
          if (!profileError && profiles && profiles.length > 0) {
            profileData = profiles[0];
          } else if (profileError) {
            console.error('Error fetching profile data:', profileError);
          }
        }
        
        // Return the member with related data
        return {
          ...member,
          personas: personaData,
          profiles: profileData
        };
      }));
      
      console.log('Enhanced members with related data:', enhancedMembers);
      
      // Check if user is a member of this space
      const isMember = enhancedMembers.some(member => member.user_id === userId) || spaceData.user_id === userId;
      
      if (!isMember && !spaceData.is_public) {
        setError('You do not have access to this space');
        setLoading(false);
        return;
      }
      
      // Transform data to match Space type
      setSpace({
        id: spaceData.id,
        name: spaceData.name,
        description: spaceData.description,
        createdAt: new Date(spaceData.created_at),
        updatedAt: new Date(spaceData.updated_at),
        userId: spaceData.user_id,
        isPublic: spaceData.is_public,
        coordinatorInstructions: spaceData.coordinator_instructions,
        members: enhancedMembers
      });
      
      console.log('Space object created:', {
        id: spaceData.id,
        name: spaceData.name,
        members: enhancedMembers.length
      });
    } catch (error) {
      console.error('Error fetching space details:', error);
      setError('Failed to load space details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id, name, description, avatar, visibility, created_at, updated_at, user_id, personality, knowledge, tone, instructions')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user personas:', error);
        throw error;
      }
      
      setPersonas(data.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at)
      })));
    } catch (error) {
      console.error('Error fetching user personas:', error);
    }
  };

  const handleAddMember = async (data: { personaIds: string[], userIds: string[] }) => {
    if (!space) return;
    
    try {
      // Add personas as members
      if (data.personaIds.length > 0) {
        const personaMembers = data.personaIds.map(personaId => ({
          space_id: space.id,
          persona_id: personaId,
          role: 'member'
        }));
        
        const { error: personasError } = await supabase
          .from('space_members')
          .insert(personaMembers);
          
        if (personasError) {
          console.error('Error adding persona members:', personasError);
          throw personasError;
        }
      }
      
      // Add users as members
      if (data.userIds.length > 0) {
        const userMembers = data.userIds.map(userId => ({
          space_id: space.id,
          user_id: userId,
          role: 'member'
        }));
        
        const { error: usersError } = await supabase
          .from('space_members')
          .insert(userMembers);
          
        if (usersError) {
          console.error('Error adding user members:', usersError);
          throw usersError;
        }
      }
      
      // Refresh space details
      await fetchSpaceDetails();
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!space) return;
    
    try {
      console.log('Removing member:', memberId);
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('id', memberId);
        
      if (error) {
        console.error('Error removing member:', error);
        throw error;
      }
      
      // Refresh space details
      await fetchSpaceDetails();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateSpace = async (data: { 
    name: string, 
    description: string, 
    isPublic: boolean,
    coordinatorInstructions: string,
    enableImages?: boolean,
    enablePDFs?: boolean,
    enableSpreadsheets?: boolean,
    enableInteractiveElements?: boolean
  }) => {
    if (!space) return;
    
    // Show loading state in the form
    try {
      console.log('Updating space:', data);
      const { error } = await supabase
        .from('spaces')
        .update({
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          coordinator_instructions: data.coordinatorInstructions
        })
        .eq('id', space.id);
        
      if (error) {
        console.error('Error updating space:', error);
        throw error;
      }
      
      console.log('Space updated successfully');
      
      // Refresh space details
      await fetchSpaceDetails();
    } catch (error) {
      console.error('Error updating space:', error);
      throw error;
    }
  };

  const handleDeleteSpace = async () => {
    if (!space) return;
    
    try {
      console.log('Deleting space:', space.id);
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', space.id);
        
      if (error) {
        console.error('Error deleting space:', error);
        throw error;
      }
      
      console.log('Space deleted successfully');
      navigate('/spaces');
    } catch (error) {
      console.error('Error deleting space:', error);
      throw error;
    }
  };

  const handleShareSpace = async () => {
    if (!space) return;
    
    const shareUrl = `${window.location.origin}/spaces/${space.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${space.name} on Persona`,
          text: space.description || `Join this space on Persona: ${space.name}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing space:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-50 rounded-full p-4 mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <Button variant="primary" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Users size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Space Not Found</h2>
        <p className="text-gray-600 text-center mb-6">The space you're looking for doesn't exist or you don't have access to it.</p>
        <Button variant="primary" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  const isOwner = space.userId === userId;
  const isAdmin = isOwner || space.members.some(member => 
    member.userId === userId && member.role === 'admin'
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 z-20 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{space.name}</h1>
              {space.description && (
                <p className="text-sm text-gray-500 line-clamp-1">{space.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              aria-label="Menu"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            
            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={showShareTooltip ? <Check size={16} /> : <Share2 size={16} />}
                  onClick={handleShareSpace}
                >
                  Share
                </Button>
                {showShareTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded">
                    Link copied!
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BrainCircuit size={16} />}
                onClick={() => setActivePanel(activePanel === 'memories' ? null : 'memories')}
              >
                Memories
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Users size={16} />}
                onClick={() => setActivePanel(activePanel === 'members' ? null : 'members')}
              >
                Members
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings size={16} />}
                  onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                >
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-2 p-2 bg-white border-t border-gray-100 rounded-lg shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Share2 size={16} />}
                onClick={() => {
                  handleShareSpace();
                  setShowMobileMenu(false);
                }}
                fullWidth
              >
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BrainCircuit size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'memories' ? null : 'memories');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Memories
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Users size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'members' ? null : 'members');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Members
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings size={16} />}
                  onClick={() => {
                    setActivePanel(activePanel === 'settings' ? null : 'settings');
                    setShowMobileMenu(false);
                    setShowMobileSidebar(true);
                  }}
                  fullWidth
                >
                  Settings
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center mt-2 overflow-x-auto pb-2 gap-2 hide-scrollbar mb-2">
          {space.members.slice(0, 10).map(member => (
            <div key={member.id} className="flex-shrink-0 mx-1 relative group">
              {member.persona_id ? (
                <div className="relative">
                  <Avatar
                    src={member.personas?.avatar}
                    name={member.personas?.name}
                    size="xs"
                    className="ring-2 ring-white"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-purple-500 rounded-full p-0.5">
                    <Bot size={8} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Avatar
                    src={member.profiles?.avatar_url}
                    name={member.profiles?.display_name}
                    size="xs"
                    className="ring-2 ring-white"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                    <User size={8} className="text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {member.persona_id ? member.personas?.name : member.profiles?.display_name}
              </div>
            </div>
          ))}
          
          {space.members.length > 10 && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-medium text-gray-600 flex-shrink-0 mx-1">
              +{space.members.length - 10}
            </div>
          )}
          
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 flex-shrink-0"
              leftIcon={<UserPlus size={14} />}
              onClick={() => {
                setActivePanel('members');
                setShowMobileSidebar(true);
              }}
            >
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <SpaceChat 
            space={space} 
            currentUserId={userId}
            personas={personas}
          />
        </div>
        
        {/* Mobile sidebar */}
        {activePanel && showMobileSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setShowMobileSidebar(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">
                  {activePanel === 'members' && 'Members'}
                  {activePanel === 'settings' && 'Settings'}
                  {activePanel === 'memories' && 'Memories'}
                </h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                {activePanel === 'members' && (
                  <SpaceMembersPanel
                    space={space}
                    onClose={() => setShowMobileSidebar(false)}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                    currentUserId={userId}
                    userPersonas={personas}
                  />
                )}
                
                {activePanel === 'memories' && (
                  <SpaceMemoriesPanel
                    spaceId={space.id}
                    onClose={() => setShowMobileSidebar(false)}
                  />
                )}
                
                {activePanel === 'settings' && isAdmin && (
                  <SpaceSettingsPanel
                    space={space}
                    onClose={() => setShowMobileSidebar(false)}
                    onUpdate={handleUpdateSpace}
                    onDelete={handleDeleteSpace}
                    isOwner={isOwner}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop sidebars */}
        {activePanel === 'members' && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto hidden md:block">
            <SpaceMembersPanel
              space={space}
              onClose={() => setActivePanel(null)}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              currentUserId={userId}
              userPersonas={personas}
            />
          </div>
        )}
        
        {activePanel === 'memories' && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto hidden md:block">
            <SpaceMemoriesPanel
              spaceId={space.id}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
        
        {activePanel === 'settings' && isAdmin && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto hidden md:block">
            <SpaceSettingsPanel
              space={space}
              onClose={() => setActivePanel(null)}
              onUpdate={handleUpdateSpace}
              onDelete={handleDeleteSpace}
              isOwner={isOwner}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceDetails;