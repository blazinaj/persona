import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Sparkles, TrendingUp, Clock, Users, Eye, Code, Palette, Briefcase, Heart, Text, X, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import PersonaCard from '../components/PersonaCard';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Persona } from '../types';

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'trending' | 'newest' | 'name';
type CategoryFilter = 'all' | 'technical' | 'creative' | 'business' | 'lifestyle';

// Define categories array
const categories = [
  { id: 'all', name: 'All', icon: <Star size={16} /> },
  { id: 'technical', name: 'Technical', icon: <Code size={16} /> },
  { id: 'creative', name: 'Creative', icon: <Palette size={16} /> },
  { id: 'business', name: 'Business', icon: <Briefcase size={16} /> },
  { id: 'lifestyle', name: 'Lifestyle', icon: <Heart size={16} /> },
];

// Define sort options
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
];

// Define all available tags
const allTags = [
  'AI', 'Writing', 'Coding', 'Design', 'Business',
  'Marketing', 'Health', 'Education', 'Entertainment',
  'Productivity', 'Technology', 'Lifestyle'
];

export const Explore = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [featuredPersonas, setFeaturedPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [stats, setStats] = useState<Record<string, { views: number, favorites: number }>>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  // Helper function to get category from tags
  const getCategoryFromTags = (tags: string[]): CategoryFilter => {
    if (tags.some(tag => ['Programming', 'Code', 'Development', 'Tech'].includes(tag))) return 'technical';
    if (tags.some(tag => ['Art', 'Design', 'Writing', 'Music'].includes(tag))) return 'creative';
    if (tags.some(tag => ['Business', 'Marketing', 'Finance', 'Sales'].includes(tag))) return 'business';
    if (tags.some(tag => ['Health', 'Lifestyle', 'Wellness', 'Personal'].includes(tag))) return 'lifestyle';
    return 'all';
  };

  // Helper function to toggle filters
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Function to fetch public personas
  const fetchPublicPersonas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('visibility', 'public');

      if (error) throw error;
      
      const allPersonas = data || [];
      setPersonas(allPersonas.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at)
      })));
      
      // Select 3 random personas for featured section
      const shuffled = [...allPersonas].sort(() => 0.5 - Math.random());
      setFeaturedPersonas(shuffled.slice(0, 3).map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at)
      })));
      
      // Fetch stats for all personas
      await fetchPersonaStats(allPersonas.map(p => p.id));
      
      // If user is logged in, check which personas they have favorited
      if (user) {
        await checkFavorites(allPersonas.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch stats for all personas
  const fetchPersonaStats = async (personaIds: string[]) => {
    if (!personaIds.length) return;
    
    try {
      // Fetch all view records
      const { data: viewsData, error: viewsError } = await supabase
        .from('persona_views')
        .select('persona_id')
        .in('persona_id', personaIds);
        
      if (viewsError) {
        console.error('Error fetching view counts:', viewsError);
      }
      
      // Fetch all favorite records
      const { data: favsData, error: favsError } = await supabase
        .from('persona_favorites')
        .select('persona_id')
        .in('persona_id', personaIds);
        
      if (favsError) {
        console.error('Error fetching favorite counts:', favsError);
      }
      
      // Process the data
      const statsData: Record<string, { views: number, favorites: number }> = {};
      
      // Initialize all personas with zero counts
      personaIds.forEach(id => {
        statsData[id] = { views: 0, favorites: 0 };
      });
      
      // Count views for each persona
      viewsData?.forEach((item: any) => {
        if (item.persona_id) {
          statsData[item.persona_id].views += 1;
        }
      });
      
      // Count favorites for each persona
      favsData?.forEach((item: any) => {
        if (item.persona_id) {
          statsData[item.persona_id].favorites += 1;
        }
      });
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching persona stats:', error);
    }
  };
  
  // Function to check which personas the user has favorited
  const checkFavorites = async (personaIds: string[]) => {
    if (!user || !personaIds.length) return;
    
    try {
      const { data, error } = await supabase
        .from('persona_favorites')
        .select('persona_id')
        .eq('user_id', user.id)
        .in('persona_id', personaIds);
        
      if (error) throw error;
      
      setFavorites(data.map(f => f.persona_id));
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  // Function to handle persona view
  const handlePersonaView = async (personaId: string) => {
    if (!user) return;
    
    try {
      // Use the RPC function instead of direct upsert
      const { data, error } = await supabase
        .rpc('track_persona_view', {
          persona_id_input: personaId,
          viewer_id_input: user.id
        });

      if (error) throw error;
      if (!data) {
        console.warn('Unable to track view - insufficient permissions');
      }
      
      // Update local stats
      setStats(prev => ({
        ...prev,
        [personaId]: {
          ...prev[personaId],
          views: (prev[personaId]?.views || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };
  
  // Function to handle favoriting/unfavoriting
  const handleToggleFavorite = async (personaId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const { data: toggled, error } = await supabase
        .rpc('toggle_persona_favorite', {
          persona_id_input: personaId
        });
        
      if (error) throw error;
      
      // Update favorites state
      setFavorites(prev => 
        toggled ? [...prev, personaId] : prev.filter(id => id !== personaId)
      );
      
      // Update local stats
      setStats(prev => ({
        ...prev,
        [personaId]: {
          ...prev[personaId],
          favorites: toggled 
            ? (prev[personaId]?.favorites || 0) + 1
            : Math.max((prev[personaId]?.favorites || 0) - 1, 0)
        }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Filter and sort personas
  const filteredPersonas = personas
    .filter(persona => {
      const matchesSearch = searchTerm === '' ||
        persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (persona.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' ||
        getCategoryFromTags(persona.tags || []) === selectedCategory;

      const matchesFilters = activeFilters.length === 0 ||
        activeFilters.every(filter =>
          persona.tags?.includes(filter)
        );

      return matchesSearch && matchesCategory && matchesFilters;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (stats[b.id]?.views || 0) - (stats[a.id]?.views || 0);
        case 'trending':
          return (stats[b.id]?.favorites || 0) - (stats[a.id]?.favorites || 0);
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  useEffect(() => {
    fetchPublicPersonas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-safe">
      <div className="flex flex-col gap-3 sm:gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Personas</h1>
            <Badge variant="primary" className="uppercase">Community</Badge>
          </div>
          <p className="text-base sm:text-lg text-gray-600">Discover and use public personas created by the community</p>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar mb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as CategoryFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{category.icon}</span>
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

      {/* Featured Personas Section */}
      {!loading && featuredPersonas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Featured Personas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                viewMode="grid"
                navigate={navigate}
                onView={() => {
                  handlePersonaView(persona.id);
                  navigate(`/explore/personas/${persona.id}`);
                }}
                viewCount={stats[persona.id]?.views || 0}
                isFavorited={favorites.includes(persona.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm"
            >
              <span className="hidden sm:inline">Filter</span>
              <span className="sm:hidden">
                <Filter size={16} />
              </span>
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
          <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Filter by tags</h3>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
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
        
        <div className="mt-4 flex justify-between items-center">
          {/* Active filters display */}
          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
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
          ) : (
            <div></div> 
          )}
          
          <div className="text-xs sm:text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{filteredPersonas.length}</span> personas
          </div>
        </div>
      </div>

      {/* All Personas Section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {selectedCategory !== 'all' 
          ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Personas` 
          : 'All Personas'}
      </h2>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading personas...</p>
        </div>
      ) : filteredPersonas.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              viewMode="grid"
              viewCount={stats[persona.id]?.views || 0}
              isFavorited={favorites.includes(persona.id)}
              onToggleFavorite={handleToggleFavorite}
              onView={() => {
                handlePersonaView(persona.id);
                navigate(`/explore/personas/${persona.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;