import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Users, Lock, Globe, MessageSquare, Clock, User, Share2, Copy, Check, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Space } from '../types';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import CreateSpaceModal from './CreateSpaceModal';
import { getAvatarUrl } from '../utils/avatarHelpers';

interface SpacesListProps {
  userId: string;
}

const SpacesList: React.FC<SpacesListProps> = ({ userId }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState<string | null>(null);
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpaces();
  }, [userId]);

  const fetchSpaces = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_spaces', { user_id_input: userId });

      if (error) throw error;

      // Transform data to match Space type
      const transformedSpaces = await Promise.all(data.map(async (space: any) => {
        // First fetch members
        const { data: members, error: membersError } = await supabase
          .from('space_members')
          .select('id, space_id, persona_id, user_id, role, joined_at')
          .eq('space_id', space.id);

        if (membersError) throw membersError;

        // Then fetch associated personas and profiles separately
        const memberDetails = await Promise.all((members || []).map(async (member) => {
          let personaData = null;
          let profileData = null;

          if (member.persona_id) {
            const { data: persona } = await supabase
              .from('personas')
              .select('id, name, avatar, description, personality, knowledge, tone, instructions')
              .eq('id', member.persona_id)
              .single();
            personaData = persona;
          }

          if (member.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, email')
              .eq('id', member.user_id)
              .single();
            profileData = profile;
          }

          return {
            id: member.id,
            spaceId: member.space_id,
            personaId: member.persona_id,
            userId: member.user_id,
            role: member.role,
            joinedAt: new Date(member.joined_at),
            personas: personaData,
            profiles: profileData
          };
        }));

        return {
          id: space.id,
          name: space.name,
          description: space.description,
          createdAt: new Date(space.created_at),
          updatedAt: new Date(space.updated_at),
          userId: space.user_id,
          isPublic: space.is_public,
          coordinatorInstructions: space.coordinator_instructions,
          members: memberDetails
        };
      }));

      setSpaces(transformedSpaces);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (data: any) => {
    try {
      // Insert new space
      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert({
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          user_id: userId,
          coordinator_instructions: data.coordinatorInstructions || null
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as an owner
      const { error: memberError } = await supabase
        .from('space_members')
        .insert({
          space_id: newSpace.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Add selected personas as members
      if (data.personas && data.personas.length > 0) {
        const personaMembers = data.personas.map((personaId: string) => ({
          space_id: newSpace.id,
          persona_id: personaId,
          role: 'member'
        }));

        const { error: personasError } = await supabase
          .from('space_members')
          .insert(personaMembers);

        if (personasError) throw personasError;
      }

      // Add selected users as members
      if (data.users && data.users.length > 0) {
        const userMembers = data.users.map((userId: string) => ({
          space_id: newSpace.id,
          user_id: userId,
          role: 'member'
        }));

        const { error: usersError } = await supabase
          .from('space_members')
          .insert(userMembers);

        if (usersError) throw usersError;
      }

      await fetchSpaces();
      setIsCreateModalOpen(false);
      
      // Navigate to the new space
      navigate(`/spaces/${newSpace.id}`);
    } catch (error) {
      console.error('Error creating space:', error);
    }
  };

  const handleShareSpace = async (spaceId: string) => {
    const shareUrl = `${window.location.origin}/spaces/${spaceId}`;
    
    try {
      // Try to use the Web Share API first
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join this space on Persona`,
            text: `Check out this space on Persona`,
            url: shareUrl
          });
          return; // Exit early if sharing was successful
        } catch (shareError) {
          // If Web Share API fails (permission denied or other error),
          // fall back to clipboard copy silently
          console.log('Web Share API failed, falling back to clipboard:', shareError);
        }
      }
      
      // Fall back to clipboard copy in all other cases
      await navigator.clipboard.writeText(shareUrl);
      setShowShareTooltip(spaceId);
      setTimeout(() => setShowShareTooltip(null), 2000);
    } catch (error) {
      console.error('Error sharing space:', error);
      // If even clipboard fails, at least show the tooltip so users know something happened
      setShowShareTooltip(spaceId);
      setTimeout(() => setShowShareTooltip(null), 2000);
    }
  };

  // Function to add current user as a member to a space
  const handleJoinSpace = async (spaceId: string) => {
    if (!userId) return;
    
    try {
      setJoiningSpaceId(spaceId);
      
      // Check if user is already a member
      const { data: existingMembership, error: checkError } = await supabase
        .from('space_members')
        .select('id')
        .eq('space_id', spaceId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      // If not already a member, add them
      if (!existingMembership) {
        const { error: joinError } = await supabase
          .from('space_members')
          .insert({
            space_id: spaceId,
            user_id: userId,
            role: 'member'
          });
          
        if (joinError) throw joinError;
      }
      
      // Navigate to the space
      navigate(`/spaces/${spaceId}`);
    } catch (error) {
      console.error('Error joining space:', error);
    } finally {
      setJoiningSpaceId(null);
    }
  };

  // Filter spaces based on search term
  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (space.description && space.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spaces</h1>
          <p className="text-gray-600 mt-1">
            Create and join collaborative spaces with personas and users
          </p>
        </div>
        
        <Button 
          variant="primary" 
          leftIcon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Space
        </Button>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search spaces..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading spaces...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Users size={48} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No spaces found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search to find what you're looking for."
              : "Get started by creating a new space."}
          </p>
          <div className="mt-6">
            <Button 
              variant="primary" 
              leftIcon={<Plus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Space
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => {
            // Check if user is already a member
            const isUserMember = space.members.some(member => 
              member.userId === userId && !member.personaId
            );

            return (
              <div
                key={space.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{space.name}</h2>
                    {space.isPublic ? (
                      <Globe size={16} className="text-green-600" />
                    ) : (
                      <Lock size={16} className="text-amber-600" />
                    )}
                  </div>
                  
                  {space.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{space.description}</p>
                  )}
                  
                  {/* Show if there are coordinator instructions */}
                  {space.coordinatorInstructions && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <Badge variant="success" className="text-xs">Custom Coordinator</Badge>
                    </div>
                  )}
                  
                  <div className="mt-4 flex -space-x-2 overflow-hidden">
                    {space.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      >
                        {member.personaId ? (
                          <Avatar
                            src={member.personas?.avatar}
                            name={member.personas?.name}
                            size="xs"
                            className="h-8 w-8"
                          />
                        ) : (
                          <Avatar
                            src={member.profiles?.avatar_url}
                            name={member.profiles?.display_name || member.profiles?.email}
                            size="xs"
                            className="h-8 w-8"
                          />
                        )}
                      </div>
                    ))}
                    {space.members.length > 5 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white">
                        <span className="text-xs font-medium text-gray-600">+{space.members.length - 5}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{space.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Updated {formatRelativeTime(space.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<MessageSquare size={16} />}
                      onClick={() => {
                        // If user isn't a member, join the space first
                        if (!isUserMember && (space.isPublic || space.userId === userId)) {
                          handleJoinSpace(space.id);
                        } else {
                          navigate(`/spaces/${space.id}`);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      loading={joiningSpaceId === space.id}
                      disabled={joiningSpaceId === space.id}
                    >
                      {isUserMember ? 'Join conversation' : 'Join space'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={showShareTooltip === space.id ? <Check size={16} /> : <Share2 size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareSpace(space.id);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Share
                      </Button>
                      {showShareTooltip === space.id && (
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                          Link copied!
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {space.userId === userId ? 'Owner' : isUserMember ? 'Member' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSpace}
        userId={userId}
      />
    </div>
  );
};

export default SpacesList;