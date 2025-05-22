import React, { useContext, useState, useEffect } from 'react';
import { User, Settings, Mail, Globe, Lock, Key } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

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
  total_chats: number;
}

export const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState<ProfileData>({
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
    total_chats: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  useEffect(() => {
    if (user?.id) {
      fetchUserStats();
      fetchProfileData();
    }
  }, [user?.id]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      // Get total personas
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('visibility')
        .eq('user_id', user.id);

      if (personasError) throw personasError;

      // Get total chats
      const { count: chatCount, error: chatError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (chatError) throw chatError;

      setStats({
        total_personas: personas?.length || 0,
        public_personas: personas?.filter(p => p.visibility === 'public').length || 0,
        total_chats: chatCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateUrl = (url: string): string => {
    if (!url) return url;
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Validate and format URLs
      const formattedData = {
        ...profileData,
        website: validateUrl(profileData.website),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(formattedData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Show success message
      setSaveSuccess(true);
      
      // Refresh profile data
      await fetchProfileData();
      
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <Button variant="outline" leftIcon={<Settings size={16} />}>
          Account Settings
        </Button>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profileData.avatar_url}
              name={user?.email}
              size="xl"
              className="ring-4 ring-offset-2 ring-blue-50"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profileData.display_name || user?.email}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-gray-600">
                <Mail size={14} />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="primary">Free Plan</Badge>
                <Badge variant="secondary">
                  Member since {new Date(user?.created_at || '').toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total_personas}</div>
              <div className="text-sm text-gray-600">Total Personas</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.public_personas}</div>
              <div className="text-sm text-gray-600">Public Personas</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total_chats}</div>
              <div className="text-sm text-gray-600">Total Chats</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Profile updated successfully!
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={profileData.display_name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    name="avatar_url"
                    value={profileData.avatar_url}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter avatar URL"
                  />
                </div>
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
                      value={profileData.website}
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
                    value={profileData.twitter}
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
                    value={profileData.github}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="username"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={profileData.is_public}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Make my profile public
                  </label>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      className="flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      className="flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      className="flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <Button variant="primary">Update Password</Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              <Button variant="outline" leftIcon={<Lock size={16} />}>
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;