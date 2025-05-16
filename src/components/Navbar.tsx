import React, { useState, useContext } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, ChevronDown, Home, Compass, Users, BookOpen } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { Avatar } from './ui/Avatar';
import Button from './ui/Button';

interface NavbarProps {
  onCreatePersona: () => void;
  onSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCreatePersona, onSignIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useContext(AuthContext);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 safe-top">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <span className="font-bold text-lg">P</span>
                </div>
                <span className="ml-2 text-xl font-semibold hidden sm:inline">Persona</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
                end
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
              >
                Explore
              </NavLink>
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
              >
                Community
              </NavLink>
              <NavLink
                to="/resources"
                className={({ isActive }) =>
                  `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
              >
                Resources
              </NavLink>
            </nav>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {!user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onSignIn}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
            ) : (
              <>
            <Button 
              variant="primary"
              size="sm"
              className="hidden md:inline-flex"
              onClick={onCreatePersona}
            >
              Create Persona
            </Button>
            
            {/* User menu */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={toggleUserMenu}
                >
                  <span className="sr-only">Open user menu</span>
                  <Avatar src={undefined} name={user.email} size="sm" />
                  <ChevronDown size={16} className="ml-1 text-gray-500" />
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
                  <Link to="/settings/billing" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
            </>
            )}
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={toggleMenu}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-lg ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
            end
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-lg ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Compass size={20} />
            <span className="text-xs mt-1">Explore</span>
          </NavLink>
          <NavLink
            to="/community"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-lg ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Users size={20} />
            <span className="text-xs mt-1">Community</span>
          </NavLink>
          <NavLink
            to="/resources"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-lg ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <BookOpen size={20} />
            <span className="text-xs mt-1">Resources</span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;