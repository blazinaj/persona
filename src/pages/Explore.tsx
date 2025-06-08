import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  StarOff, 
  TrendingUp, 
  Clock, 
  Users, 
  Eye, 
  Code, 
  Palette, 
  Briefcase, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  X,
  Sparkles,
  Flame,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import PersonaCard from '../components/PersonaCard';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Persona } from '../types';

// Define category types with friendly names and icons
const categories = [
  { id: 'technical', name: 'Technical', icon: <Code size={16} className="text-blue-600" /> },
  { id: 'creative', name: 'Creative', icon: <Palette size={16} className="text-purple-600" /> },
  { id: 'business', name: 'Business', icon: <Briefcase size={16} className="text-amber-600" /> },
  { id: 'lifestyle', name: 'Lifestyle', icon: <Heart size={16} className="text-pink-600" /> }
];

// Define sort options
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
];

export const Explore = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State for personas and UI
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [featuredPersonas, setFeaturedPersonas] = useState<Persona[]>([]);
  const [trendingPersonas, setTrendingPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<Record<string, { views: number, favorites: number }>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Create refs for category scrolling
  const scrollContainerRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Category-organized personas
  const [categorizedPersonas, setCategorizedPersonas] = useState<{[key: string]: Persona[]}>({
    technical: [],
    creative: [],
    business: [],
    lifestyle: []
  });
  
  useEffect(() => {
    fetchPublicPersonas();
  }, []);
  
  // Organize personas into categories when they change
  useEffect(() => {
    if (allPersonas.length > 0) {
      organizePersonasByCategory();
    }
  }, [allPersonas, stats]);
  
  // Update search results when search term changes
  useEffect(() => {
    if (searchTerm) {
      const results = allPersonas.filter(persona => 
        persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (persona.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (persona.tags && persona.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchTerm, allPersonas]);
  
  // Helper function to get category from tags
  const getCategoryFromTags = (persona: Persona): string => {
    const tags = persona.tags || [];
    const knowledgeAreas = persona.knowledge || [];
    
    // Technical category patterns
    const technicalPatterns = ['programming', 'code', 'development', 'tech', 'software', 'data', 'ai', 'machine learning', 'engineering'];
    // Creative category patterns
    const creativePatterns = ['art', 'design', 'writing', 'music', 'creative', 'content', 'storytelling'];
    // Business category patterns
    const businessPatterns = ['business', 'marketing', 'finance', 'sales', 'management', 'entrepreneur'];
    // Lifestyle category patterns
    const lifestylePatterns = ['health', 'lifestyle', 'fitness', 'personal', 'wellness', 'coaching', 'travel'];
    
    // Check tags and knowledge areas for matches
    const allTerms = [...tags, ...knowledgeAreas].map(t => t.toLowerCase());
    
    if (allTerms.some(term => technicalPatterns.some(pattern => term.includes(pattern)))) {
      return 'technical';
    }
    if (allTerms.some(term => creativePatterns.some(pattern => term.includes(pattern)))) {
      return 'creative';
    }
    if (allTerms.some(term => businessPatterns.some(pattern => term.includes(pattern)))) {
      return 'business';
    }
    if (allTerms.some(term => lifestylePatterns.some(pattern => term.includes(pattern)))) {
      return 'lifestyle';
    }
    
    // Check personality traits as a fallback
    const personality = persona.personality || [];
    if (personality.includes('analytical') || personality.includes('technical')) return 'technical';
    if (personality.includes('creative') || personality.includes('artistic')) return 'creative';
    if (personality.includes('professional') || personality.includes('direct')) return 'business';
    if (personality.includes('friendly') || personality.includes('empathetic')) return 'lifestyle';
    
    // Default to technical if nothing matches
    return 'technical';
  };
  
  // Function to organize personas by category
  const organizePersonasByCategory = () => {
    const categorized: {[key: string]: Persona[]} = {
      technical: [],
      creative: [],
      business: [],
      lifestyle: []
    };
    
    // Score and sort all personas by views and favorites
    const scoredPersonas = allPersonas.map(persona => {
      const viewCount = stats[persona.id]?.views || 0;
      const favoriteCount = stats[persona.id]?.favorites || 0;
      // Calculate a popularity score - favorites count more than views
      const popularityScore = viewCount + (favoriteCount * 3);
      return {
        ...persona,
        popularityScore,
        viewCount,
        favoriteCount
      };
    });
    
    // Sort by popularity score
    const sortedPersonas = [...scoredPersonas].sort((a, b) => b.popularityScore - a.popularityScore);
    
    // Set featured personas (top 5 by popularity)
    setFeaturedPersonas(sortedPersonas.slice(0, 6));
    
    // Set trending personas (most favorited recently)
    const trending = [...scoredPersonas]
      .sort((a, b) => b.favoriteCount - a.favoriteCount)
      .filter(p => p.favoriteCount > 0)
      .slice(0, 6);
    setTrendingPersonas(trending);
    
    // Categorize all personas
    allPersonas.forEach(persona => {
      const category = getCategoryFromTags(persona);
      if (categorized[category]) {
        categorized[category].push(persona);
      } else {
        // If category doesn't exist yet, add to 'technical' as default
        categorized.technical.push(persona);
      }
    });
    
    // Sort each category by popularity
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => {
        const aScore = (stats[a.id]?.views || 0) + ((stats[a.id]?.favorites || 0) * 3);
        const bScore = (stats[b.id]?.views || 0) + ((stats[b.id]?.favorites || 0) * 3);
        return bScore - aScore;
      });
    });
    
    setCategorizedPersonas(categorized);
  };
  
  // Function to fetch all public personas
  const fetchPublicPersonas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('visibility', 'public');

      if (error) throw error;
      
      const allPersonas = data || [];
      
      // Format persona data
      const formattedPersonas = allPersonas.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at)
      }));
      
      setAllPersonas(formattedPersonas);
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero section with search */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Explore AI Personas</h1>
            <p className="text-xl opacity-90 mb-8">Discover and chat with AI personas created by the community</p>
            
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-blue-300" />
              </div>
              <input
                type="text"
                placeholder="Search personas by name, description, or tags..."
                className="block w-full pl-10 pr-3 py-3 rounded-full shadow-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
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
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter and sort controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm"
            >
              Filter
              {activeFilters.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </Button>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Categories:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    const element = document.getElementById(`category-${category.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm hover:shadow-md transition-all text-sm"
                >
                  {category.icon}
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Filter tags drawer */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-8">
            <div className="flex justify-between items-center mb-4">
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
            
            <div className="flex flex-wrap gap-2">
              {/* Get unique tags from all personas */}
              {Array.from(new Set(allPersonas.flatMap(p => p.tags || []))).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (activeFilters.includes(tag)) {
                      setActiveFilters(activeFilters.filter(t => t !== tag));
                    } else {
                      setActiveFilters([...activeFilters, tag]);
                    }
                  }}
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
        
        {/* Search results */}
        {showSearchResults && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Search size={20} className="text-blue-600" />
                Search Results
                <span className="text-sm font-normal text-gray-500">
                  ({searchResults.length} {searchResults.length === 1 ? 'result' : 'results'})
                </span>
              </h2>
              <Button 
                variant="outline"
                size="sm"
                leftIcon={<X size={16} />}
                onClick={() => {
                  setSearchTerm('');
                  setShowSearchResults(false);
                }}
              >
                Clear search
              </Button>
            </div>
            
            {searchResults.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We couldn't find any personas matching your search. Try different keywords or browse by category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map(persona => (
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
            )}
          </div>
        )}
        
        {!showSearchResults && (
          <>
            {/* Featured section */}
            {featuredPersonas.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-amber-500" />
                    Featured Personas
                  </h2>
                  {featuredPersonas.length > 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/explore?category=featured')}
                    >
                      View all
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPersonas.slice(0, 6).map(persona => (
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
            
            {/* Trending section */}
            {trendingPersonas.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Flame size={20} className="text-red-500" />
                    Trending Now
                  </h2>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => scrollCategory('trending', 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div 
                    ref={(el) => scrollContainerRefs.current['trending'] = el}
                    className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory gap-4"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {trendingPersonas.map(persona => (
                      <div 
                        key={persona.id} 
                        className="flex-none w-64 snap-start"
                      >
                        <div
                          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                          onClick={() => {
                            handlePersonaView(persona.id);
                            navigate(`/explore/personas/${persona.id}`);
                          }}
                        >
                          <div className="h-36 bg-gradient-to-br from-blue-500/90 to-purple-600/90 relative">
                            {persona.avatar && (
                              <img
                                src={persona.avatar.startsWith('http') 
                                  ? persona.avatar 
                                  : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/persona-avatars/${persona.avatar}`}
                                alt={persona.name}
                                className="h-full w-full object-cover mix-blend-overlay opacity-90"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <Badge variant="danger" className="flex items-center gap-1 text-xs">
                                <Flame size={12} />
                                <span>Trending</span>
                              </Badge>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-3">
                              <h3 className="text-white font-semibold truncate">{persona.name}</h3>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Eye size={12} />
                                  <span>{stats[persona.id]?.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star size={12} className={favorites.includes(persona.id) ? "text-amber-500 fill-amber-500" : ""} />
                                  <span>{stats[persona.id]?.favorites || 0}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(persona.id);
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-100"
                              >
                                {favorites.includes(persona.id) ? (
                                  <Star size={14} className="text-amber-500 fill-amber-500" />
                                ) : (
                                  <StarOff size={14} className="text-gray-400" />
                                )}
                              </button>
                            </div>
                            {persona.tags && persona.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {persona.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {persona.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{persona.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => scrollCategory('trending', 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Recently Added Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap size={20} className="text-blue-500" />
                  Recently Added
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
                  className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory gap-4"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {[...allPersonas]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map(persona => (
                      <div 
                        key={persona.id} 
                        className="flex-none w-64 snap-start"
                      >
                        <div
                          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                          onClick={() => {
                            handlePersonaView(persona.id);
                            navigate(`/explore/personas/${persona.id}`);
                          }}
                        >
                          <div className="h-36 bg-gradient-to-br from-blue-500/90 to-purple-600/90 relative">
                            {persona.avatar && (
                              <img
                                src={persona.avatar.startsWith('http') 
                                  ? persona.avatar 
                                  : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/persona-avatars/${persona.avatar}`}
                                alt={persona.name}
                                className="h-full w-full object-cover mix-blend-overlay opacity-90"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <Badge variant="primary" className="flex items-center gap-1 text-xs">
                                <Clock size={12} />
                                <span>New</span>
                              </Badge>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-3">
                              <h3 className="text-white font-semibold truncate">{persona.name}</h3>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Eye size={12} />
                                  <span>{stats[persona.id]?.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star size={12} className={favorites.includes(persona.id) ? "text-amber-500 fill-amber-500" : ""} />
                                  <span>{stats[persona.id]?.favorites || 0}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(persona.id);
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-100"
                              >
                                {favorites.includes(persona.id) ? (
                                  <Star size={14} className="text-amber-500 fill-amber-500" />
                                ) : (
                                  <StarOff size={14} className="text-gray-400" />
                                )}
                              </button>
                            </div>
                            {persona.tags && persona.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {persona.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {persona.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{persona.tags.length - 2}</span>
                                )}
                              </div>
                            )}
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
            
            {/* Category Rows */}
            {categories.map(category => {
              const personasInCategory = categorizedPersonas[category.id] || [];
              if (personasInCategory.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-12" id={`category-${category.id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {category.icon}
                      <span>{category.name} Personas</span>
                    </h2>
                    {personasInCategory.length > 10 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/explore?category=${category.id}`)}
                      >
                        View all
                      </Button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => scrollCategory(category.id, 'left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div 
                      ref={(el) => scrollContainerRefs.current[category.id] = el}
                      className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory gap-4"
                      style={{ scrollbarWidth: 'none' }}
                    >
                      {personasInCategory.slice(0, 20).map(persona => (
                        <div 
                          key={persona.id} 
                          className="flex-none w-64 snap-start"
                        >
                          <div
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                            onClick={() => {
                              handlePersonaView(persona.id);
                              navigate(`/explore/personas/${persona.id}`);
                            }}
                          >
                            <div className="h-36 bg-gradient-to-br from-blue-500/90 to-purple-600/90 relative">
                              {persona.avatar && (
                                <img
                                  src={persona.avatar.startsWith('http') 
                                    ? persona.avatar 
                                    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/persona-avatars/${persona.avatar}`}
                                  alt={persona.name}
                                  className="h-full w-full object-cover mix-blend-overlay opacity-90"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute bottom-0 left-0 w-full p-3">
                                <h3 className="text-white font-semibold truncate">{persona.name}</h3>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Eye size={12} />
                                    <span>{stats[persona.id]?.views || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className={favorites.includes(persona.id) ? "text-amber-500 fill-amber-500" : ""} />
                                    <span>{stats[persona.id]?.favorites || 0}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(persona.id);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-gray-100"
                                >
                                  {favorites.includes(persona.id) ? (
                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                  ) : (
                                    <StarOff size={14} className="text-gray-400" />
                                  )}
                                </button>
                              </div>
                              {persona.tags && persona.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {persona.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {persona.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">+{persona.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => scrollCategory(category.id, 'right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        
        {/* Empty state */}
        {!loading && allPersonas.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No public personas found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no public personas available at the moment. Check back later or create your own!
            </p>
            <Button 
              variant="primary"
              onClick={() => navigate('/')}
            >
              Create your own personas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;