import React, { useContext, useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Mail, 
  Globe, 
  Lock, 
  Camera, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Users, 
  Star, 
  Edit, 
  Check, 
  X, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import AvatarGenerator from '../components/AvatarGenerator';
import { useParams, useNavigate } from 'react-router-dom';

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  twitter: string;
  github: string;
  is_public: boolean;
}

interface ProfileStats {
  total_personas: number;
  public_personas: number;
  total_views: number;
  total_favorites: number;
  followers_count: number;
}

export const Profile = () => {
  const { user } = useContext(AuthContext);
  const { id: profileId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isOwnProfile = !profileId || (user && profileId === user.id);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    twitter: '',
    github: '',
    is_public: false
  });
  const [formData, setFormData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    twitter: '',
    github: '',
    is_public: false
  });
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAvatarGenerator, setShowAvatarGenerator] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const targetId = profileId || user?.id;
    if (targetId) {
      fetchProfileData(targetId);
      fetchUserStats(targetId);
      fetchPublicPersonas(targetId);
      
      if (user?.id && profileId && user.id !== profileId) {
        checkFollowStatus(profileId);
      }
    }
  }, [user?.id, profileId]);

  const fetchProfileData = async (targetId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          website: data.website || '',
          twitter: data.twitter || '',
          github: data.github || '',
          is_public: data.is_public || false
        });
        setFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          website: data.website || '',
          twitter: data.twitter || '',
          github: data.github || '',
          is_public: data.is_public || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (!isOwnProfile) {
        navigate('/profile');
      } else {
        setError('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (targetId: string) => {
    if (!targetId) return;

    try {
      // Get profile stats using the RPC function
      const { data: profileStats, error: statsError } = await supabase
        .rpc('get_profile_stats', { profile_id_input: targetId });

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
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchPublicPersonas = async (targetId: string) => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', targetId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicPersonas(data || []);
    } catch (error) {
      console.error('Error fetching public personas:', error);
    }
  };

  const checkFollowStatus = async (targetId: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profile_followers')
        .select('id')
        .eq('profile_id', targetId)
        .eq('follower_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user?.id || !profileId) {
      navigate('/login');
      return;
    }

    try {
      const { data: isNowFollowing, error } = await supabase
        .rpc('toggle_profile_follow', {
          profile_id_input: profileId
        });

      if (error) throw error;
      setIsFollowing(isNowFollowing);
      
      // Update followers count
      setStats(prev => ({
        ...prev,
        followers_count: isNowFollowing ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_public: e.target.checked
    }));
  };

  const validateUrl = (url: string): string => {
    if (!url) return url;
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      avatar_url: url
    }));
    setShowAvatarGenerator(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    const targetId = user.id;
    
    try {
      // Validate and format data
      const formattedData = {
        id: targetId,
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        website: validateUrl(formData.website),
        twitter: formData.twitter,
        github: formData.github,
        is_public: formData.is_public,
        updated_at: new Date().toISOString()
      };

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('profiles')
        .upsert(formattedData);

      if (error) throw error;
      
      // Show success message
      setSaveSuccess(true);
      setEditMode(false);
      
      // Update displayed profile data
      setProfileData(formData);
      
      // Refresh profile data
      await fetchProfileData(targetId);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
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

  // If viewing someone else's profile but it's not public
  if (!isOwnProfile && !profileData.is_public) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <EyeOff size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Private Profile</h2>
          <p className="text-gray-600 mb-6">This profile is not publicly available.</p>
          <Button variant="primary" onClick={() => navigate('/explore')}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isOwnProfile ? 'Your Profile' : `${profileData.display_name}'s Profile`}
        </h1>
        {isOwnProfile && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              leftIcon={<Settings size={16} />}
            >
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 relative">
        {/* Profile Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <div className="p-6 pt-0 relative">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <div className="relative">
              <Avatar
                src={profileData.avatar_url}
                name={profileData.display_name}
                size="xl"
                className="ring-4 ring-white shadow-md"
              />
              {isOwnProfile && !editMode && (
                <button 
                  onClick={() => setShowAvatarGenerator(true)}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                  title="Change avatar"
                >
                  <Camera size={14} />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {isOwnProfile ? (
                editMode ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      leftIcon={saving ? <Loader2 className="animate-spin" /> : <Check size={16} />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    leftIcon={<Edit size={16} />}
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                )
              ) : (
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
          </div>
          
          {/* Profile Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="mt-4">
                {editMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter your display name"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profileData.display_name || user?.email || 'Anonymous User'}
                    </h2>
                    {profileData.is_public ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Globe size={12} />
                        <span>Public</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock size={12} />
                        <span>Private</span>
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Email - only shown on own profile */}
                {isOwnProfile && (
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <Mail size={14} />
                    <span>{user?.email}</span>
                  </div>
                )}
                
                {/* Bio */}
                <div className="mt-4">
                  {editMode ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Tell others about yourself"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{profileData.bio || 'No bio provided'}</p>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {editMode ? (
                    <div className="w-full space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            <Globe size={16} />
                          </span>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Twitter Username
                        </label>
                        <input
                          type="text"
                          name="twitter"
                          value={formData.twitter}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GitHub Username
                        </label>
                        <input
                          type="text"
                          name="github"
                          value={formData.github}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="username"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_public"
                          checked={formData.is_public}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                          Make my profile public
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
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
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}
      
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check size={16} />
          <p>Profile updated successfully</p>
        </div>
      )}

      {/* Public Personas Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isOwnProfile ? 'Your Public Personas' : 'Public Personas'}
        </h2>
        
        {publicPersonas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Users size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No public personas yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {isOwnProfile 
                ? "You haven't made any of your personas public yet. Public personas can be discovered by other users."
                : "This user hasn't made any personas public yet."}
            </p>
            {isOwnProfile && (
              <Button 
                variant="primary"
                onClick={() => navigate('/')}
              >
                Go to My Personas
              </Button>
            )}
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
      
      {/* Avatar Generator Modal */}
      {showAvatarGenerator && (
        <AvatarGenerator
          onSelectAvatar={handleAvatarChange}
          onClose={() => setShowAvatarGenerator(false)}
          initialAvatar={profileData.avatar_url}
        />
      )}
    </div>
  );
};

export default Profile;