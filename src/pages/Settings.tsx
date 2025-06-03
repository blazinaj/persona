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
} from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { ApiKeySettings } from '../components/ApiKeySettings';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Billing } from './Billing';

const Settings: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL if present, default to 'subscription'
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'subscription';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getTabFromUrl());
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`);
  };

  // If not logged in, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

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
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete Account
                      </Button>
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