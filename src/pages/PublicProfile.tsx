import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Globe, Users, Star, Eye, ExternalLink, Check } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

interface ProfileData {
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
}

interface ProfileStats {
  total_personas: number;
  public_personas: number;
  total_views: number;
  total_favorites: number;
  followers_count: number;
}

export const PublicProfile: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { id: profileId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    total_personas: 0,
    public_personas: 0,
    total_views: 0,
    total_favorites: 0,
    followers_count: 0
  });
  const [publicPersonas, setPublicPersonas] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      navigate('/');
      return;
    }
    
    fetchProfileData();
    fetchUserStats();
    fetchPublicPersonas();
    
    if (user?.id) {
      checkFollowStatus();
    }
  }, [profileId, user?.id]);

  const fetchProfileData = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;
      
      if (data) {
        // Check if profile is public
        if (!data.is_public && (!user || user.id !== data.id)) {
          setError('This profile is private');
          setLoading(false);
          return;
        }
        
        setProfileData(data);
      } else {
        setError('Profile not found');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get profile stats using the new RPC function
      const { data: profileStats, error: statsError } = await supabase
        .rpc('get_profile_stats', { profile_id_input: profileId });

      if (statsError) throw statsError;

      if (profileStats) {
        setStats({
          total_personas: profileStats.total_personas || 0,
          public_personas: profileStats.public_personas || 0,
          total_views: profileStats.total_views || 0,
          total_favorites: profileStats.total_favorites || 0,
          followers_count: profileStats.followers_count || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchPublicPersonas = async () => {
    try {
      const { data, error: personasError } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', profileId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (personasError) throw personasError;
      setPublicPersonas(data || []);
    } catch (error: any) {
      console.error('Error fetching public personas:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user?.id || !profileId) return;
    
    try {
      const { data, error: followError } = await supabase
        .from('profile_followers')
        .select('id')
        .eq('profile_id', profileId)
        .eq('follower_id', user.id)
        .maybeSingle();

      if (followError && followError.code !== 'PGRST116') throw followError;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user?.id || !profileId) {
      navigate('/login');
      return;
    }

    try {
      const { data: isNowFollowing, error: toggleError } = await supabase
        .rpc('toggle_profile_follow', {
          profile_id_input: profileId
        });

      if (toggleError) throw toggleError;
      setIsFollowing(isNowFollowing);
      
      // Update followers count
      setStats(prev => ({
        ...prev,
        followers_count: isNowFollowing ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    } catch (error: any) {
      console.error('Error toggling follow status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/explore')}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => navigate('/explore')}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && user.id === profileData.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {profileData.display_name}'s Profile
        </h1>
        {isOwnProfile && (
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 relative">
        {/* Profile Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <div className="p-6 pt-0 relative">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <Avatar
              src={profileData.avatar_url}
              name={profileData.display_name}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
            
            {!isOwnProfile && (
              <Button
                variant={isFollowing ? "outline" : "primary"}
                size="sm"
                leftIcon={isFollowing ? <Check size={16} /> : <Users size={16} />}
                onClick={handleToggleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profileData.display_name || 'Anonymous User'}
                </h2>
                
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Users size={14} />
                  <span>Public Profile</span>
                </div>
                
                {/* Bio */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">About</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{profileData.bio || 'No bio provided'}</p>
                </div>
                
                {/* Social Links */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {profileData.website && (
                    <a 
                      href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      <Globe size={14} />
                      <span>Website</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {profileData.twitter && (
                    <a 
                      href={`https://twitter.com/${profileData.twitter.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Twitter</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {profileData.github && (
                    <a 
                      href={`https://github.com/${profileData.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-4 sm:gap-6 md:w-64">
              <div className="bg-gray-50 rounded-lg p-4 flex-1">
                <div className="text-2xl font-bold text-gray-900">{stats.followers_count}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex-1">
                <div className="text-2xl font-bold text-gray-900">{stats.public_personas}</div>
                <div className="text-sm text-gray-600">Public Personas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex-1">
                <div className="text-2xl font-bold text-gray-900">{stats.total_views}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
            </div>
          </div>
          
          {/* Member Since */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Member since {new Date(profileData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Public Personas Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Public Personas
        </h2>
        
        {publicPersonas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Users size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No public personas yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {isOwnProfile 
                ? "You haven't made any of your personas public yet. Public personas can be discovered by other users."
                : "This user hasn't made any personas public yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicPersonas.map(persona => (
              <div 
                key={persona.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => navigate(`/explore/personas/${persona.id}`)}
              >
                <div className="h-32 bg-gradient-to-br from-blue-500/90 to-purple-600/90 relative">
                  <img
                    src={persona.avatar ? persona.avatar.startsWith('http') ? persona.avatar : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/persona-avatars/${persona.avatar}` : ''}
                    alt={persona.name}
                    className="h-full w-full object-cover mix-blend-overlay opacity-90"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                    <h3 className="font-semibold truncate">{persona.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{persona.description}</p>
                  <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>0 views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} />
                        <span>0 favorites</span>
                      </div>
                    </div>
                    <span>View Details</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;