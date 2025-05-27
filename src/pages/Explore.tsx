import React, { useState, useEffect, useContext } from 'react';
import { Search, Filter, Grid, List, Star, Sparkles, TrendingUp, Clock, Users, Eye, Code, Palette, Briefcase, Heart, Text } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import PersonaCard from '../components/PersonaCard';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Persona } from '../types';

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'trending' | 'newest' | 'name';
type CategoryFilter = 'all' | 'technical' | 'creative' | 'business' | 'lifestyle';

export const Explore = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [stats, setStats] = useState<Record<string, { views: number, favorites: number }>>({});

  useEffect(() => {
    fetchPublicPersonas();
  }, []);

  useEffect(() => {
    if (personas.length) {
      fetchPersonaStats();
    }
  }, [personas]);

  const fetchPublicPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPersonas(data.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at)
      })));
    } catch (error) {
      console.error('Error fetching public personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonaStats = async () => {
    try {
      // Get view counts
      const { data: views } = await supabase
        .from('persona_views')
        .select('persona_id')
        .in('persona_id', personas.map(p => p.id));

      // Get favorite counts
      const { data: favorites } = await supabase
        .from('persona_favorites')
        .select('persona_id')
        .in('persona_id', personas.map(p => p.id));

      const statsMap: Record<string, { views: number, favorites: number }> = {};
      
      personas.forEach(persona => {
        statsMap[persona.id] = {
          views: views?.filter(v => v.persona_id === persona.id).length || 0,
          favorites: favorites?.filter(f => f.persona_id === persona.id).length || 0
        };
      });

      setStats(statsMap);
    } catch (error) {
      console.error('Error fetching persona stats:', error);
    }
  };

  const getPersonaScore = (personaId: string) => {
    const personaStats = stats[personaId] || { views: 0, favorites: 0 };
    // Calculate a simple engagement score
    return personaStats.views + (personaStats.favorites * 2);
  };

  const getCategoryFromTags = (tags: string[]) => {
    // Simplified category detection based on tags
    if (tags.some(tag => ['programming', 'technical', 'development', 'coding'].includes(tag))) return 'technical';
    if (tags.some(tag => ['creative', 'writing', 'design', 'art'].includes(tag))) return 'creative';
    if (tags.some(tag => ['business', 'marketing', 'finance', 'strategy'].includes(tag))) return 'business';
    return 'lifestyle';
  };

  // Get all unique tags from personas
  const allTags = Array.from(
    new Set(personas.flatMap((persona) => persona.tags || []))
  );

  // Sort personas
  const sortedPersonas = [...personas].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return getPersonaScore(b.id) - getPersonaScore(a.id);
      case 'trending':
        // Simple trending algorithm based on recent views and favorites
        const scoreA = getPersonaScore(a.id) / Math.max(1, Date.now() - a.created.getTime());
        const scoreB = getPersonaScore(b.id) / Math.max(1, Date.now() - b.created.getTime());
        return scoreB - scoreA;
      case 'newest':
        return b.created.getTime() - a.created.getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Filter personas based on search term and active filters
  const filteredPersonas = sortedPersonas.filter((persona) => {
    if (selectedCategory !== 'all' && getCategoryFromTags(persona.tags || []) !== selectedCategory) {
      return false;
    }

    const matchesSearch =
      searchTerm === '' ||
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (persona.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => persona.tags?.includes(filter));

    return matchesSearch && matchesFilters;
  });

  const categories: { id: CategoryFilter; name: string; icon: React.ReactNode }[] = [
    { id: 'all', name: 'All Personas', icon: <Sparkles size={16} /> },
    { id: 'technical', name: 'Technical', icon: <Code size={16} /> },
    { id: 'creative', name: 'Creative', icon: <Palette size={16} /> },
    { id: 'business', name: 'Business', icon: <Briefcase size={16} /> },
    { id: 'lifestyle', name: 'Lifestyle', icon: <Heart size={16} /> },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'popular', label: 'Most Popular', icon: <Star size={14} /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
    { value: 'newest', label: 'Newest', icon: <Clock size={14} /> },
    { value: 'name', label: 'Name', icon: <Text size={14} /> },
  ];

  const toggleFilter = (tag: string) => {
    setActiveFilters(activeFilters.includes(tag)
      ? activeFilters.filter(t => t !== tag)
      : [...activeFilters, tag]
    );
  };

  const handlePersonaView = (id: string) => {
    navigate(`/explore/personas/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Explore Personas</h1>
            <Badge variant="primary" className="uppercase">Community</Badge>
          </div>
          <p className="text-lg text-gray-600">Discover and use public personas created by the community</p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span>{category.name}</span>
              {selectedCategory === category.id && (
                <Badge variant="primary" className="ml-1">
                  {filteredPersonas.filter(p => 
                    category.id === 'all' || 
                    getCategoryFromTags(p.tags || []) === category.id
                  ).length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredPersonas.length}</span> personas
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <div className="h-6 w-px bg-gray-300" />

            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter
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
                  onClick={() => setActiveFilters([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all filters
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
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading personas...</p>
        </div>
      ) : filteredPersonas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Search size={48} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No personas found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || activeFilters.length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : "No public personas are available at the moment."}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              viewMode={viewMode}
              onView={() => handlePersonaView(persona.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;