import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Globe, 
  MessageSquare, 
  Clock, 
  User, 
  Share2, 
  Copy, 
  Check, 
  Link, 
  ChevronRight, 
  ChevronLeft,
  Bot,
  Crown,
  Shield,
  Sparkles,
  Zap,
  Heart,
  Settings,
  X,
  Menu
} from 'lucide-react';
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

type SpaceCategory = 'recent' | 'owned' | 'member' | 'public';

const SpacesList: React.FC<SpacesListProps> = ({ userId }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState<string | null>(null);
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);
  const [spaceCategories, setSpaceCategories] = useState<Record<SpaceCategory, Space[]>>({
    recent: [],
    owned: [],
    member: [],
    public: []
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();
  
  // Create refs for category scrolling
  const scrollContainerRefs = React.useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (userId) {
      fetchSpaces();
    }
  }, [userId]);

  // Organize spaces into categories when they change
  useEffect(() => {
    if (spaces.length > 0) {
      organizeSpacesByCategory();
    }
  }, [spaces]);

  const fetchSpaces = async () => {
    if (!userId) return;

    try {
      console.log('Fetching spaces for user ID:', userId);
      setLoading(true);
      
      // Fetch space details
      const { data: spaceData, error: spaceError } = await supabase
        .rpc('get_user_spaces', { user_id_input: userId });
        
      if (spaceError) {
        console.error('Error fetching spaces:', spaceError);
        throw spaceError;
      }
      
      // Fetch space members (without trying to join profiles or personas)
      const { data: membersData, error: membersError } = await supabase
        .from('space_members')
        .select('id, space_id, persona_id, user_id, role, joined_at');
        
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
          const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('id, name, avatar, description, personality, knowledge, tone, instructions')
            .eq('id', member.persona_id)
            .single();
            
          if (!personaError) {
            personaData = persona;
          } else {
            console.error('Error fetching persona data:', personaError);
          }
        }
        
        // If member has a user_id, fetch the profile data
        if (member.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, email')
            .eq('id', member.user_id)
            .single();
            
          if (!profileError) {
            profileData = profile;
          } else {
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
      
      // Group members by space_id
      const membersBySpace: Record<string, any[]> = {};
      enhancedMembers.forEach(member => {
        if (!membersBySpace[member.space_id]) {
          membersBySpace[member.space_id] = [];
        }
        membersBySpace[member.space_id].push(member);
      });
      
      // Add members to spaces
      const spacesWithMembers = spaceData.map((space: any) => ({
        ...space,
        members: membersBySpace[space.id] || [],
        created: new Date(space.created_at),
        updated: new Date(space.updated_at)
      }));
      
      console.log('Spaces with members:', spacesWithMembers);
      setSpaces(spacesWithMembers);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Organize spaces into categories
  const organizeSpacesByCategory = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Sort by updated_at
    const sortedSpaces = [...spaces].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    // Recent spaces (updated in the last week)
    const recentSpaces = sortedSpaces.filter(
      space => new Date(space.updated_at) > oneWeekAgo
    );
    
    // Owned spaces (user is the creator)
    const ownedSpaces = sortedSpaces.filter(
      space => space.user_id === userId
    );
    
    // Member spaces (user is a member but not owner)
    const memberSpaces = sortedSpaces.filter(
      space => space.user_id !== userId && space.members.some(
        member => member.user_id === userId
      )
    );
    
    // Public spaces (that user hasn't joined)
    const publicSpaces = sortedSpaces.filter(
      space => space.is_public && 
              space.user_id !== userId && 
              !space.members.some(member => member.user_id === userId)
    );
    
    setSpaceCategories({
      recent: recentSpaces,
      owned: ownedSpaces,
      member: memberSpaces,
      public: publicSpaces
    });
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
          console.log('Web Share API failed, falling back to clipboard:', shareError);
        }
      }
      
      // Fall back to clipboard copy
      await navigator.clipboard.writeText(shareUrl);
      setShowShareTooltip(spaceId);
      setTimeout(() => setShowShareTooltip(null), 2000);
    } catch (error) {
      console.error('Error sharing space:', error);
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
  
  // Function to scroll a category row
  const scrollCategory = (categoryId: string, direction: 'left' | 'right') => {
    const container = scrollContainerRefs.current[categoryId];
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
        
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Filter spaces based on search term
  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (space.description && space.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Render a category row of spaces
  const renderSpaceCategory = (
    categoryId: SpaceCategory, 
    title: string, 
    icon: React.ReactNode, 
    spacesToRender: Space[],
    emptyMessage: string
  ) => {
    if (spacesToRender.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h2>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => scrollCategory(categoryId, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div 
            ref={(el) => scrollContainerRefs.current[categoryId] = el}
            className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory gap-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {spacesToRender.map(space => (
              <div 
                key={space.id} 
                className="flex-none w-72 snap-start card-zoom"
              >
                <div
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                  onClick={() => navigate(`/spaces/${space.id}`)}
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate mr-2">{space.name}</h3>
                      {space.is_public ? (
                        <Badge variant="success" className="flex items-center gap-1 text-xs">
                          <Globe size={12} />
                          <span>Public</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Lock size={12} />
                          <span>Private</span>
                        </Badge>
                      )}
                    </div>
                    {space.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{space.description}</p>
                    )}
                    
                    {/* Member avatars */}
                    <div className="flex -space-x-2 overflow-hidden mb-3">
                      {space.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white relative"
                        >
                          {member.persona_id ? (
                            <div className="relative">
                              <Avatar
                                src={member.personas?.avatar}
                                name={member.personas?.name}
                                size="xs"
                                className="h-8 w-8"
                              />
                              <div className="absolute bottom-0 right-0 bg-purple-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                <Bot size={8} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <Avatar
                                src={member.profiles?.avatar_url}
                                name={member.profiles?.display_name || member.profiles?.email}
                                size="xs"
                                className="h-8 w-8"
                              />
                              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                <User size={8} className="text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {space.members.length > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-800">
                          +{space.members.length - 5}
                        </div>
                      )}
                    </div>
                    
                    {/* Role indicators */}
                    {space.user_id === userId ? (
                      <Badge variant="warning" className="flex items-center gap-1 text-xs mb-1">
                        <Crown size={10} />
                        <span>Owner</span>
                      </Badge>
                    ) : space.members.some(m => m.user_id === userId && m.role === 'admin') ? (
                      <Badge variant="primary" className="flex items-center gap-1 text-xs mb-1">
                        <Shield size={10} />
                        <span>Admin</span>
                      </Badge>
                    ) : space.members.some(m => m.user_id === userId) ? (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs mb-1">
                        <Users size={10} />
                        <span>Member</span>
                      </Badge>
                    ) : null}
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>{formatRelativeTime(new Date(space.updated_at))}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {space.user_id !== userId && !space.members.some(m => m.user_id === userId) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinSpace(space.id);
                          }}
                          disabled={joiningSpaceId === space.id}
                          loading={joiningSpaceId === space.id}
                          className="text-xs"
                        >
                          {joiningSpaceId === space.id ? "Joining..." : "Join"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<MessageSquare size={14} />}
                          className="text-xs"
                        >
                          Chat
                        </Button>
                      )}
                      
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareSpace(space.id);
                          }}
                          leftIcon={showShareTooltip === space.id ? <Check size={14} /> : <Share2 size={14} />}
                          className="text-xs"
                        >
                          Share
                        </Button>
                        {showShareTooltip === space.id && (
                          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                            Link copied!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scrollCategory(categoryId, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero section with search and create button */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Collaborative Spaces</h1>
            <p className="text-xl opacity-90 mb-8">Create and join spaces where humans and AI personas can interact</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="text-purple-300" />
                </div>
                <input
                  type="text"
                  placeholder="Search spaces..."
                  className="block w-full pl-10 pr-3 py-3 rounded-full shadow-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X size={16} className="text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>
              
              <Button
                variant="primary"
                className="bg-white text-purple-700 hover:bg-gray-100 py-3 px-6 shadow-md"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Space
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading spaces...</p>
          </div>
        ) : (
          <>
            {/* Search results */}
            {searchTerm && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Search size={20} className="text-blue-600" />
                    Search Results
                    <span className="text-sm font-normal text-gray-500">
                      ({filteredSpaces.length} {filteredSpaces.length === 1 ? 'result' : 'results'})
                    </span>
                  </h2>
                  <Button 
                    variant="outline"
                    size="sm"
                    leftIcon={<X size={16} />}
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </Button>
                </div>
                
                {filteredSpaces.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      We couldn't find any spaces matching your search. Try different keywords or browse by category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSpaces.map(space => (
                      <div
                        key={space.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/spaces/${space.id}`)}
                      >
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 truncate mr-2">{space.name}</h3>
                            {space.is_public ? (
                              <Badge variant="success" className="flex items-center gap-1 text-xs">
                                <Globe size={12} />
                                <span>Public</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                <Lock size={12} />
                                <span>Private</span>
                              </Badge>
                            )}
                          </div>
                          {space.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{space.description}</p>
                          )}
                          
                          {/* Member avatars */}
                          <div className="flex -space-x-2 overflow-hidden mb-3">
                            {space.members.slice(0, 5).map((member) => (
                              <div
                                key={member.id}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white relative"
                              >
                                {member.persona_id ? (
                                  <div className="relative">
                                    <Avatar
                                      src={member.personas?.avatar}
                                      name={member.personas?.name}
                                      size="xs"
                                      className="h-8 w-8"
                                    />
                                    <div className="absolute bottom-0 right-0 bg-purple-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                      <Bot size={8} className="text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <Avatar
                                      src={member.profiles?.avatar_url}
                                      name={member.profiles?.display_name || member.profiles?.email}
                                      size="xs"
                                      className="h-8 w-8"
                                    />
                                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                      <User size={8} className="text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {space.members.length > 5 && (
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-800">
                                +{space.members.length - 5}
                              </div>
                            )}
                          </div>
                          
                          {/* Role indicators */}
                          {space.user_id === userId ? (
                            <Badge variant="warning" className="flex items-center gap-1 text-xs mb-1">
                              <Crown size={10} />
                              <span>Owner</span>
                            </Badge>
                          ) : space.members.some(m => m.user_id === userId && m.role === 'admin') ? (
                            <Badge variant="primary" className="flex items-center gap-1 text-xs mb-1">
                              <Shield size={10} />
                              <span>Admin</span>
                            </Badge>
                          ) : space.members.some(m => m.user_id === userId) ? (
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs mb-1">
                              <Users size={10} />
                              <span>Member</span>
                            </Badge>
                          ) : null}
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>{formatRelativeTime(new Date(space.updated_at))}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {space.user_id !== userId && !space.members.some(m => m.user_id === userId) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinSpace(space.id);
                                }}
                                disabled={joiningSpaceId === space.id}
                                loading={joiningSpaceId === space.id}
                                className="text-xs"
                              >
                                {joiningSpaceId === space.id ? "Joining..." : "Join"}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<MessageSquare size={14} />}
                                className="text-xs"
                              >
                                Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          
            {!searchTerm && (
              <>
                {/* Featured spaces */}
                {spaceCategories.recent.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles size={20} className="text-amber-500" />
                        Recent Activity
                      </h2>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => scrollCategory('recent', 'left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div 
                        ref={(el) => scrollContainerRefs.current['recent'] = el}
                        className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory gap-4 scroll-row"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {spaceCategories.recent.map(space => (
                          <div 
                            key={space.id} 
                            className="flex-none w-72 snap-start card-zoom"
                          >
                            <div
                              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                              onClick={() => navigate(`/spaces/${space.id}`)}
                            >
                              <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold text-gray-900 truncate mr-2">{space.name}</h3>
                                  {space.is_public ? (
                                    <Badge variant="success" className="flex items-center gap-1 text-xs">
                                      <Globe size={12} />
                                      <span>Public</span>
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                      <Lock size={12} />
                                      <span>Private</span>
                                    </Badge>
                                  )}
                                </div>
                                {space.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{space.description}</p>
                                )}
                                
                                {/* Member avatars */}
                                <div className="flex -space-x-2 overflow-hidden mb-3">
                                  {space.members.slice(0, 5).map((member) => (
                                    <div
                                      key={member.id}
                                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white relative"
                                    >
                                      {member.persona_id ? (
                                        <div className="relative">
                                          <Avatar
                                            src={member.personas?.avatar}
                                            name={member.personas?.name}
                                            size="xs"
                                            className="h-8 w-8"
                                          />
                                          <div className="absolute bottom-0 right-0 bg-purple-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                            <Bot size={8} className="text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                          <Avatar
                                            src={member.profiles?.avatar_url}
                                            name={member.profiles?.display_name || member.profiles?.email}
                                            size="xs"
                                            className="h-8 w-8"
                                          />
                                          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-3 h-3 border-2 border-white flex items-center justify-center">
                                            <User size={8} className="text-white" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {space.members.length > 5 && (
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-800">
                                      +{space.members.length - 5}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Activity badge */}
                                <Badge variant="primary" className="flex items-center gap-1 text-xs">
                                  <Clock size={10} />
                                  <span>Recently Active</span>
                                </Badge>
                              </div>
                              
                              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock size={12} className="mr-1" />
                                  <span>{formatRelativeTime(new Date(space.updated_at))}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<MessageSquare size={14} />}
                                    className="text-xs"
                                  >
                                    Chat
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => scrollCategory('recent', 'right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                        aria-label="Scroll right"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Spaces you own */}
                {renderSpaceCategory(
                  'owned', 
                  'Your Spaces', 
                  <Crown size={20} className="text-amber-500" />, 
                  spaceCategories.owned,
                  "You don't own any spaces yet. Create one to get started."
                )}
                
                {/* Spaces you're a member of */}
                {renderSpaceCategory(
                  'member', 
                  'Member Spaces', 
                  <Users size={20} className="text-blue-500" />, 
                  spaceCategories.member,
                  "You haven't joined any spaces yet."
                )}
                
                {/* Public spaces */}
                {renderSpaceCategory(
                  'public', 
                  'Public Spaces', 
                  <Globe size={20} className="text-green-500" />, 
                  spaceCategories.public,
                  "No public spaces available."
                )}
                
                {/* Explore AI + Human Collaboration */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-100 p-8 my-12">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="md:w-1/2">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap size={20} className="text-purple-600" />
                        AI + Human Collaboration
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Spaces bring together AI personas and humans in collaborative environments. Create specialized spaces for different topics, projects, or teams.
                      </p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <div className="bg-blue-100 p-1 rounded-full">
                            <Heart size={12} className="text-blue-600" />
                          </div>
                          <span className="text-gray-700">Mix multiple AI personas with different skills</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="bg-green-100 p-1 rounded-full">
                            <Settings size={12} className="text-green-600" />
                          </div>
                          <span className="text-gray-700">Customize coordinator instructions for better interactions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="bg-amber-100 p-1 rounded-full">
                            <MessageSquare size={12} className="text-amber-600" />
                          </div>
                          <span className="text-gray-700">Share with your team or make it public</span>
                        </li>
                      </ul>
                      <Button 
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        Create Your First Space
                      </Button>
                    </div>
                    <div className="md:w-1/2 flex justify-center">
                      <div className="relative">
                        <div className="w-64 h-40 bg-white rounded-lg shadow-lg border border-purple-200 p-4 z-20 relative">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                              <Bot size={16} className="text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">AI Persona</div>
                              <div className="text-xs text-gray-500">Technical Expert</div>
                            </div>
                          </div>
                          <div className="text-xs bg-gray-50 rounded p-2">
                            I analyzed your code and found the issue! The asynchronous function needs to await the Promise result.
                          </div>
                        </div>
                        <div className="w-64 h-40 bg-white rounded-lg shadow-lg border border-blue-200 p-4 absolute top-10 left-10 transform -rotate-6">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <User size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Human</div>
                              <div className="text-xs text-gray-500">Team Member</div>
                            </div>
                          </div>
                          <div className="text-xs bg-gray-50 rounded p-2">
                            Could someone help debug this function? It's throwing an error when called.
                          </div>
                        </div>
                        <div className="w-64 h-40 bg-white rounded-lg shadow-lg border border-green-200 p-4 absolute top-20 left-20 transform rotate-3">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                              <Bot size={16} className="text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">AI Persona</div>
                              <div className="text-xs text-gray-500">Creative Assistant</div>
                            </div>
                          </div>
                          <div className="text-xs bg-gray-50 rounded p-2">
                            I can help visualize the solution! Here's a diagram of the correct data flow.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Empty state - only show if there are no spaces at all */}
                {spaces.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <div className="mx-auto h-16 w-16 text-gray-400 mb-6">
                      <MessageSquare size={64} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No spaces yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                      Create your first space to start collaborating with AI personas and other users.
                    </p>
                    <Button 
                      variant="primary" 
                      leftIcon={<Plus size={16} />}
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mx-auto"
                    >
                      Create New Space
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        {/* Create Space Modal */}
        <CreateSpaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSpace}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default SpacesList;