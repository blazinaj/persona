import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  Key, 
  Bell, 
  Shield, 
  UserX, 
  AlertTriangle, 
  Settings as SettingsIcon,
  User,
  ChevronRight,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { ApiKeySettings } from '../components/ApiKeySettings';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Billing } from './Billing';
import { useOnboarding } from '../components/onboarding/OnboardingContext';

const Settings: React.FC = () => {
  const { user, signOut } = useContext(AuthContext);
  const { resetOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL if present, default to 'subscription'
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'subscription';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getTabFromUrl());
  const [deleteAccount, setDeleteAccount] = useState<{
    isConfirming: boolean;
    password: string;
    loading: boolean;
    error: string | null;
  }>({
    isConfirming: false,
    password: '',
    loading: false,
    error: null
  });
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`);
  };

  // If not logged in, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleDeleteAccountClick = () => {
    setDeleteAccount({
      ...deleteAccount,
      isConfirming: true
    });
  };

  const handleCancelDelete = () => {
    setDeleteAccount({
      isConfirming: false,
      password: '',
      loading: false,
      error: null
    });
  };

  const handleDeleteConfirm = async () => {
    // Skip password confirmation if using OAuth providers since they don't have passwords
    const isOAuthUser = user.app_metadata?.provider && 
                        user.app_metadata?.provider !== 'email';
    
    if (!isOAuthUser && !deleteAccount.password) {
      setDeleteAccount({
        ...deleteAccount,
        error: 'Password is required to confirm account deletion'
      });
      return;
    }
    
    setDeleteAccount({
      ...deleteAccount,
      loading: true,
      error: null
    });
    
    try {
      // Get the current session to get the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Call the Edge Function to delete the account
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: deleteAccount.password
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      // Sign out the user
      await signOut();
      
      // Redirect to login page
      navigate('/login');
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      setDeleteAccount({
        ...deleteAccount,
        loading: false,
        error: error.message || 'Failed to delete account. Please try again or contact support.'
      });
    }
  };

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true);
    setResetSuccess(false);
    
    try {
      // Update profile in the database to reset onboarding status
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: false
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Reset onboarding in localStorage and context
      resetOnboarding();
      
      setResetSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    } finally {
      setResettingOnboarding(false);
    }
  };

  const handleResetTours = () => {
    // Clear any Joyride tour state from localStorage
    localStorage.removeItem('persona_tour_completed');
    localStorage.removeItem('persona_dashboard_tour_seen');
    localStorage.removeItem('persona_explore_tour_seen');
    localStorage.removeItem('persona_chat_tour_seen');
    localStorage.removeItem('persona_spaces_tour_seen');
    
    // Show success message
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-safe">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/profile')}
          leftIcon={<User size={16} />}
        >
          View Profile
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-medium text-gray-900">Settings</h2>
            </div>
            <ul className="py-2">
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'subscription' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('subscription')}
                >
                  <div className="flex items-center">
                    <CreditCard size={18} className="mr-3 text-gray-500" />
                    <span>Subscription</span>
                  </div>
                  {activeTab === 'subscription' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'api' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('api')}
                >
                  <div className="flex items-center">
                    <Key size={18} className="mr-3 text-gray-500" />
                    <span>API Keys</span>
                  </div>
                  {activeTab === 'api' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'onboarding' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('onboarding')}
                >
                  <div className="flex items-center">
                    <Sparkles size={18} className="mr-3 text-gray-500" />
                    <span>Onboarding</span>
                  </div>
                  {activeTab === 'onboarding' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('notifications')}
                >
                  <div className="flex items-center">
                    <Bell size={18} className="mr-3 text-gray-500" />
                    <span>Notifications</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  {activeTab === 'notifications' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'security' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('security')}
                >
                  <div className="flex items-center">
                    <Shield size={18} className="mr-3 text-gray-500" />
                    <span>Security</span>
                  </div>
                  {activeTab === 'security' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === 'danger' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleTabChange('danger')}
                >
                  <div className="flex items-center">
                    <UserX size={18} className="mr-3 text-gray-500" />
                    <span>Danger Zone</span>
                  </div>
                  {activeTab === 'danger' && (
                    <ChevronRight size={16} className="text-blue-500" />
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'subscription' && (
              <div>
                <Billing />
              </div>
            )}
            
            {activeTab === 'api' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">API Keys</h2>
                <ApiKeySettings />
              </div>
            )}
            
            {activeTab === 'onboarding' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Onboarding Settings</h2>
                
                {resetSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6 flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Reset successful! Changes will take effect on next page load.</span>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-medium text-gray-900 mb-2">Product Tours</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Reset the guided tours to see them again when you visit different sections of the app. 
                      This will restore all feature walkthroughs and helpful tips.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleResetTours}
                      leftIcon={<RefreshCw size={16} />}
                    >
                      Reset All Tours
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-medium text-gray-900 mb-2">Onboarding Experience</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Reset your onboarding status to go through the initial setup process again. 
                      This will let you reconfigure your preferences and see the getting started guide.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleResetOnboarding}
                      loading={resettingOnboarding}
                      leftIcon={resettingOnboarding ? undefined : <Sparkles size={16} />}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      {resettingOnboarding ? "Resetting..." : "Reset Onboarding Status"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="text-center py-8">
                <div className="bg-blue-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Bell size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Settings</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Notification settings will be available soon. You'll be able to customize how and when you receive updates.
                </p>
                <div className="mt-6">
                  <Badge variant="primary">Coming Soon</Badge>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Update your password to keep your account secure.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="primary">
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                      <Button variant="outline" disabled>
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Active Sessions</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Review and manage your active sessions across different devices.
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                      <Button variant="outline" disabled>
                        View Sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'danger' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Danger Zone</h2>
                
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle size={24} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-800 mb-2">Delete Your Account</h3>
                      <p className="text-red-700 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      
                      {!deleteAccount.isConfirming ? (
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={handleDeleteAccountClick}
                        >
                          Delete Account
                        </Button>
                      ) : (
                        <div className="bg-white border border-red-300 rounded-lg p-4 mt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-red-800">Confirm Account Deletion</h4>
                            <button 
                              onClick={handleCancelDelete} 
                              className="text-gray-500 hover:text-gray-700"
                              aria-label="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-700">
                            This will permanently delete your account along with all your personas, conversations, and other data. This action cannot be reversed.
                          </p>
                          
                          {(!user.app_metadata?.provider || 
                           user.app_metadata?.provider === 'email') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Enter your password to confirm
                              </label>
                              <input
                                type="password"
                                value={deleteAccount.password}
                                onChange={(e) => setDeleteAccount({
                                  ...deleteAccount,
                                  password: e.target.value
                                })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Your account password"
                              />
                            </div>
                          )}
                          
                          {deleteAccount.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                              {deleteAccount.error}
                            </div>
                          )}
                          
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={handleCancelDelete}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                              onClick={handleDeleteConfirm}
                              loading={deleteAccount.loading}
                              leftIcon={deleteAccount.loading ? <Loader2 className="animate-spin" /> : <UserX size={16} />}
                            >
                              {deleteAccount.loading ? "Deleting..." : "Permanently Delete Account"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;