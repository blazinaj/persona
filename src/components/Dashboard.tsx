import React, { useState, useEffect, useContext } from 'react';
import { Search, Filter, Plus, X, Grid, List, SortAsc, Clock, ChevronRight } from 'lucide-react';
import { Persona } from '../types';
import PersonaCard from './PersonaCard';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';

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
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCompactView, setIsCompactView] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('modified');
  const [showFilters, setShowFilters] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchViewsAndFavorites();
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">My Personas</h1>
          <p className="text-gray-600 mt-1">
            Manage and customize your AI personas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <Button 
            variant="primary" 
            leftIcon={<Plus size={16} />}
            className="hidden md:inline-flex"
            onClick={onCreatePersona}
          >
            Create New Persona
          </Button>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
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
          
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              className="md:hidden flex-1"
              onClick={onCreatePersona}
            >
              Create
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="modified">Last Modified</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
            </select>
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
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
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
          <div className="flex flex-wrap gap-2 mt-4">
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <Search size={24} />
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
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
            : 'space-y-4'
        }>
          {filteredPersonas.map((persona) => (
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
              onView={onViewPersona}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;