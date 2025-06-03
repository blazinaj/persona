import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, Star, Eye, MessageSquare, TrendingUp, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

type SortOption = 'popular' | 'newest' | 'active';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
  website: string;
  twitter: string;
  github: string;
  is_public: boolean;
  created_at: string;
  stats: {
    total_personas: number;
    public_personas: number;
    total_views: number;
    total_favorites: number;
  };
  followers_count: number;
}

export const Community = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // First get all public profiles
      const { data: publicProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true);

      if (profilesError) throw profilesError;
      
      if (!publicProfiles || publicProfiles.length === 0) {
        setProfiles([]);
        return;
      }
      
      // Get profile stats for each profile
      const profilesWithStats = await Promise.all(publicProfiles.map(async (profile) => {
        // Get stats using the RPC function
        const { data: stats, error: statsError } = await supabase
          .rpc('get_profile_stats', { profile_id_input: profile.id });
          
        if (statsError) {
          console.error(`Error fetching stats for profile ${profile.id}:`, statsError);
          return {
            ...profile,
            stats: {
              total_personas: 0,
              public_personas: 0,
              total_views: 0,
              total_favorites: 0,
              followers_count: 0
            },
            followers_count: 0
          };
        }
        
        return {
          ...profile,
          stats: {
            total_personas: stats.total_personas || 0,
            public_personas: stats.public_personas || 0,
            total_views: stats.total_views || 0,
            total_favorites: stats.total_favorites || 0
          },
          followers_count: stats.followers_count || 0
        };
      }));

      setProfiles(profilesWithStats);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort profiles based on selected option
  const sortedProfiles = [...profiles].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return ((b.stats.total_views || 0) + (b.stats.total_favorites || 0) * 2) - 
               ((a.stats.total_views || 0) + (a.stats.total_favorites || 0) * 2);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'active':
        return (b.stats.public_personas || 0) - (a.stats.public_personas || 0);
      default:
        return 0;
    }
  });

  // Filter profiles based on search term
  const filteredProfiles = sortedProfiles.filter(profile => {
    const searchString = searchTerm.toLowerCase();
    return (
      profile.display_name?.toLowerCase().includes(searchString) ||
      profile.email.toLowerCase().includes(searchString) ||
      profile.bio?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Community</h1>
            <Badge variant="primary" className="uppercase">Beta</Badge>
          </div>
          <p className="text-lg text-gray-600">Discover and connect with persona creators from around the world</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredProfiles.length}</span> creators
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="active">Most Active</option>
          </select>
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
              placeholder="Search creators..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading creators...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Users size={48} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No creators found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search to find what you're looking for."
              : "No public profiles are available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name || profile.email}
                    size="lg"
                    className="ring-4 ring-offset-2 ring-blue-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {profile.display_name || profile.email}
                    </h2>
                    {profile.bio && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Website
                        </a>
                      )}
                      {profile.twitter && (
                        <a
                          href={`https://twitter.com/${profile.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Twitter
                        </a>
                      )}
                      {profile.github && (
                        <a
                          href={`https://github.com/${profile.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{profile.stats.public_personas || 0}</p>
                    <p className="text-sm text-gray-600">Public Personas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{profile.stats.total_views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{profile.stats.total_favorites || 0} favorites</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<User size={14} />}
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;