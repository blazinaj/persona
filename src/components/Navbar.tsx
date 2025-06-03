import React, { useState, useContext } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, ChevronDown, Home, Compass, Users, BookOpen, ChevronRight, Code, MessageSquare, Bell, History, Plus, Clock, Sparkles } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { Avatar } from './ui/Avatar';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  onCreatePersona: () => void;
  onSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCreatePersona, onSignIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [recentPersonas, setRecentPersonas] = useState<any[]>([]);
  const { user, signOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleQuickActions = async () => {
    setShowQuickActions(!showQuickActions);
    
    // Fetch recent personas when opening the menu
    if (!showQuickActions && user) {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('id, name, avatar, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        setRecentPersonas(data || []);
      } catch (error) {
        console.error('Error fetching recent personas:', error);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 safe-top">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <nav className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <span className="font-bold text-lg">P</span>
                </div>
                <span className="ml-2 text-xl font-semibold hidden sm:inline">Persona</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {[
                { path: '/', label: 'Dashboard', exact: true },
                { path: '/explore', label: 'Explore' },
                { path: '/spaces', label: 'Spaces' },
                { path: '/conversations', label: 'Conversations' },
                { path: '/community', label: 'Community' },
                { path: '/resources', label: 'Resources' },
                { path: '/api', label: 'API' }
              ].map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  end={item.exact}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <div className="relative">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="hidden md:inline-flex"
                  onClick={toggleQuickActions}
                  rightIcon={<ChevronDown size={16} />}
                >
                  Quick Actions
                </Button>
                
                {showQuickActions && (
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={() => {
                        onCreatePersona();
                        setShowQuickActions(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Plus size={16} className="mr-2 text-blue-600" />
                      Create New Persona
                    </button>
                    
                    {recentPersonas.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs font-medium text-gray-500">
                          Recent Personas
                        </div>
                        
                        {recentPersonas.map(persona => (
                          <button
                            key={persona.id}
                            onClick={() => {
                              navigate(`/personas/${persona.id}`);
                              setShowQuickActions(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Avatar 
                              src={persona.avatar} 
                              name={persona.name} 
                              size="xs" 
                              className="mr-2" 
                            />
                            <span className="truncate">{persona.name}</span>
                            <Clock size={12} className="ml-auto text-gray-400" />
                          </button>
                        ))}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            navigate('/');
                            setShowQuickActions(false);
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                        >
                          <Sparkles size={16} className="mr-2" />
                          View All Personas
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onSignIn}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
            )}
            
            {user && (
            <div className="relative ml-3">
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex items-center rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={toggleUserMenu}
                >
                  <span className="sr-only">Open user menu</span>
                  <Avatar src={undefined} name={user.email} size="sm" />
                  <ChevronDown size={14} className="ml-1 text-gray-500 hidden sm:block" />
                </button>
              </div>
              
              {showUserMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User size={16} className="mr-2" /> Your Profile
                  </Link>
                  <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings size={16} className="mr-2" /> Settings
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" /> Sign out
                  </button>
                </div>
              )}
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-4">
              <div className="flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500"
                  onClick={toggleMenu}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50 max-h-[80vh] overflow-y-auto">
          <div className="divide-y divide-gray-100 pb-safe">
            <div className="py-1">
              {[
                { path: '/', label: 'Dashboard', icon: Home, exact: true },
                { path: '/explore', label: 'Explore', icon: Compass },
                { path: '/conversations', label: 'Conversations', icon: History },
                { path: '/spaces', label: 'Spaces', icon: MessageSquare },
                { path: '/community', label: 'Community', icon: Users },
                { path: '/resources', label: 'Resources', icon: BookOpen },
                { path: '/api', label: 'API', icon: Code }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 my-1 ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                    end={item.exact}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </NavLink>
                );
              })}
            </div>
            
            {/* Mobile menu actions */}
            <div className="px-4 py-3">
              {!user ? (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={onSignIn}
                  className="mt-2"
                >
                  Sign In
                </Button>
              ) : (
                <>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={toggleQuickActions}
                  className="mt-1"
                  rightIcon={<ChevronDown size={16} />}
                >
                  Quick Actions
                </Button>
                
                {showQuickActions && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <button
                      onClick={() => {
                        onCreatePersona();
                        setIsMenuOpen(false);
                        setShowQuickActions(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <Plus size={16} className="mr-2 text-blue-600" />
                      Create New Persona
                    </button>
                    
                    {recentPersonas.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="px-3 py-1 text-xs font-medium text-gray-500">
                          Recent Personas
                        </div>
                        
                        {recentPersonas.map(persona => (
                          <button
                            key={persona.id}
                            onClick={() => {
                              navigate(`/personas/${persona.id}`);
                              setIsMenuOpen(false);
                              setShowQuickActions(false);
                            }}
                            className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Avatar 
                              src={persona.avatar} 
                              name={persona.name} 
                              size="xs" 
                              className="mr-2" 
                            />
                            <span className="truncate">{persona.name}</span>
                          </button>
                        ))}
                        
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => {
                            navigate('/');
                            setIsMenuOpen(false);
                            setShowQuickActions(false);
                          }}
                          className="flex w-full items-center px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 rounded-md"
                        >
                          <Sparkles size={16} className="mr-2" />
                          View All Personas
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
              )}
              
              {user && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center px-2 py-1">
                    <Avatar src={undefined} name={user.email} size="sm" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      leftIcon={<User size={14} />}
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                    >
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      leftIcon={<Settings size={14} />}
                      onClick={() => {
                        navigate('/settings');
                        setIsMenuOpen(false);
                      }}
                    >
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      leftIcon={<LogOut size={14} />}
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="col-span-2"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;