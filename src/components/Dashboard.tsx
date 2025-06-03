import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, X, Grid, List, SortAsc, Clock, ChevronRight, Menu, Star, MessageSquare, Sparkles } from 'lucide-react';
import { Persona } from '../types';
import PersonaCard from './PersonaCard';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { formatRelativeTime } from '../utils/formatters';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Badge } from './ui/Badge';

const VIEW_MODE_KEY = 'persona_view_mode';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'created' | 'modified';

interface DashboardProps {
  personas: Persona[];
  onCreatePersona: () => void;
  onEditPersona: (id: string) => void;
  onDuplicatePersona: (id: string) => void;
  onDeletePersona: (id: string) => void;
  onViewPersona: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  personas,
  onCreatePersona,
  onEditPersona,
  onDuplicatePersona,
  onDeletePersona,
  onViewPersona,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY);
    return (savedMode === 'list' || savedMode === 'grid') ? savedMode : 'grid';
  });
  const [isCompactView, setIsCompactView] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('modified');
  const [showFilters, setShowFilters] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Save view mode preference when it changes
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchViewsAndFavorites();
    fetchRecentConversations();
  }, [personas]);

  const fetchViewsAndFavorites = async () => {
    if (!personas.length || !user?.id) return;

    try {
      // Fetch view counts
      const { data: views } = await supabase
        .from('persona_views')
        .select('persona_id')
        .in('persona_id', personas.map(p => p.id));

      const counts = views?.reduce((acc, view) => {
        acc[view.persona_id] = (acc[view.persona_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setViewCounts(counts);

      // Fetch user's favorites
      const { data: favs } = await supabase
        .from('persona_favorites')
        .select('persona_id')
        .eq('user_id', user.id);

      setFavorites(favs?.map(f => f.persona_id) || []);
    } catch (error) {
      console.error('Error fetching views and favorites:', error);
    }
  };

  const fetchRecentConversations = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*, personas(id, name, avatar, visibility)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentConversations(data || []);
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleToggleFavorite = async (personaId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('toggle_persona_favorite', {
          persona_id_input: personaId
        });

      if (error) throw error;

      // Update local state
      setFavorites(prev => 
        data ? [...prev, personaId] : prev.filter(id => id !== personaId)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Get all unique tags from personas
  const allTags = Array.from(
    new Set(personas.flatMap((persona) => persona.tags))
  );

  // Sort personas
  const sortedPersonas = [...personas].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.created.getTime() - a.created.getTime();
      case 'modified':
        return b.lastModified.getTime() - a.lastModified.getTime();
      default:
        return 0;
    }
  });

  // Filter personas based on search term and active filters
  const filteredPersonas = sortedPersonas.filter((persona) => {
    const matchesSearch =
      searchTerm === '' ||
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => persona.tags.includes(filter));

    return matchesSearch && matchesFilters;
  });

  const toggleFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter((t) => t !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex-1 mb-2 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">My Personas</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600 mt-1">
              Manage and customize your AI personas
            </p>
            <Badge variant="primary" className="mt-1">
              {personas.length} Total
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            leftIcon={<Plus size={16} />}
            onClick={onCreatePersona}
            className="hidden sm:flex"
          >
            Create New Persona
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={onCreatePersona}
            className="sm:hidden"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Recent Conversations */}
      {recentConversations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => navigate('/conversations')}
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentConversations.slice(0, 3).map(conversation => (
              <div 
                key={conversation.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer p-3"
                onClick={() => navigate(`/personas/${conversation.personas.id}`, { 
                  state: { conversationId: conversation.id } 
                })}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    src={getAvatarUrl(conversation.personas.avatar)}
                    name={conversation.personas.name}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{conversation.personas.name}</h3>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(new Date(conversation.updated_at))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium truncate">{conversation.title}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <MessageSquare size={12} className="mr-1" />
                  <span>Continue conversation</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List size={16} />
              </button>
              {viewMode === 'list' && (
                <button
                  onClick={() => setIsCompactView(!isCompactView)}
                  className={`p-2 rounded ${
                    isCompactView
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={isCompactView ? 'Show details' : 'Compact view'}
                >
                  <ChevronRight size={16} className={`transform transition-transform ${isCompactView ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="modified">Last Modified</option>
                <option value="created">Date Created</option>
                <option value="name">Name</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 md:flex-none"
            >
              <span className="md:hidden">Filters</span>
              <span className="hidden md:inline">Filter</span>
              {activeFilters.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Filter tags */}
        {showFilters && (
          <div className="mt-4 p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Filter by tags</h3>
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.includes(tag)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-4">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {filter}
                <button
                  type="button"
                  onClick={() => toggleFilter(filter)}
                  className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <span className="sr-only">Remove filter for {filter}</span>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {filteredPersonas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <Search size={20} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No personas found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || activeFilters.length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Get started by creating a new persona."}
          </p>
          <div className="mt-6">
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onCreatePersona}>
              Create New Persona
            </Button>
          </div>
        </div>
      ) : (
        <>
        {/* Favorites Section - Only show if there are favorites */}
        {favorites.length > 0 && !activeFilters.includes('favorites') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
              {favorites.length > 3 && (
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  onClick={() => setActiveFilters([...activeFilters, 'favorites'])}
                >
                  View all <ChevronRight size={16} />
                </button>
              )}
            </div>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'
                : 'space-y-4'
            }>
              {filteredPersonas
                .filter(persona => favorites.includes(persona.id))
                .slice(0, 3)
                .map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    viewMode={viewMode}
                    isCompact={isCompactView}
                    viewCount={viewCounts[persona.id] || 0}
                    isFavorited={favorites.includes(persona.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={onEditPersona}
                    onDuplicate={onDuplicatePersona}
                    onDelete={onDeletePersona}
                    onView={(id) => navigate(`/personas/${id}`)}
                    navigate={navigate}
                    navigate={navigate}
                    navigate={navigate}
                  />
                ))}
            </div>
          </div>
        )}
        
        {/* All Personas or Filtered Results */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {activeFilters.length > 0 ? 'Filtered Results' : 'All Personas'}
        </h2>
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'
            : 'space-y-4'
        }>
          {(activeFilters.includes('favorites') 
            ? filteredPersonas.filter(p => favorites.includes(p.id))
            : filteredPersonas).map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              viewMode={viewMode}
              isCompact={isCompactView}
              viewCount={viewCounts[persona.id] || 0}
              isFavorited={favorites.includes(persona.id)}
              onToggleFavorite={handleToggleFavorite}
              onEdit={onEditPersona}
              onDuplicate={onDuplicatePersona}
              onDelete={onDeletePersona}
              onView={(id) => navigate(`/personas/${id}`)}
              navigate={navigate}
            />
          ))}
        </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;