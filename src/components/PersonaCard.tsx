import React from 'react';
import { MoreHorizontal, Edit, Copy, Trash, ExternalLink, MessageSquare, Star, StarOff, Users, Eye, EyeOff, Globe } from 'lucide-react';
import { Persona } from '../types';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Portal } from './ui/Portal';
import { Avatar } from './ui/Avatar';
import { formatRelativeTime } from '../utils/formatters';

interface PersonaCardProps {
  persona: Persona;
  viewMode?: 'grid' | 'list';
  isCompact?: boolean;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  isFavorited?: boolean;
  viewCount?: number;
  onToggleFavorite?: (id: string) => void;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  viewMode = 'grid',
  isCompact = false,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  isFavorited = false,
  viewCount = 0,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left - 120,
      });
    }
    setShowMenu(!showMenu);
  };

  const getVisibilityIcon = () => {
    switch (persona.visibility) {
      case 'public':
        return <Globe size={14} className="text-green-600" />;
      case 'unlisted':
        return <Users size={14} className="text-amber-600" />;
      default:
        return <EyeOff size={14} className="text-gray-600" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (persona.visibility) {
      case 'public':
        return 'Public';
      case 'unlisted':
        return 'Unlisted';
      default:
        return 'Private';
    }
  };

  const handleAction = (
    e: React.MouseEvent,
    action: ((id: string) => void) | undefined
  ) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action) {
      action(persona.id);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(persona.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onView) {
      onView(persona.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden active:scale-[0.99] select-none ${
          isCompact ? 'py-2 px-3' : 'p-4'
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          {!isCompact && (
            <Avatar
              src={getAvatarUrl(persona.avatar)}
              name={persona.name}
              size="sm"
              className="ring-2 ring-offset-2 ring-gray-100"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {persona.name}
              </h3>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium">
                {getVisibilityIcon()}
                <span className="ml-1">{getVisibilityLabel()}</span>
              </div>
            </div>
            {!isCompact && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {persona.description}
              </p>
            )}
            {!isCompact && (
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span>{viewCount} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>0 uses</span>
                </div>
              </div>
            )}
            {!isCompact && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {persona.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="capitalize text-xs">
                    {tag}
                  </Badge>
                ))}
                {(persona.tags?.length || 0) > 3 && (
                  <span className="text-xs text-gray-500">+{(persona.tags?.length || 0) - 3} more</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isCompact && (
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isFavorited ? <Star size={16} /> : <StarOff size={16} />}
              </button>
            )}
            <div className="relative">
                <button
                  ref={menuButtonRef}
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="More options"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showMenu && (
                  <Portal>
                    <div 
                      className="fixed inset-0 z-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <div
                        className="absolute bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        style={{
                          top: menuPosition.top,
                          left: menuPosition.left
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => handleAction(e, onEdit)}
                          >
                            <Edit size={16} className="mr-2" /> Edit
                          </button>
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => handleAction(e, onDuplicate)}
                          >
                            <Copy size={16} className="mr-2" /> Duplicate
                          </button>
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={(e) => handleAction(e, onDelete)}
                          >
                            <Trash size={16} className="mr-2" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </Portal>
                )}
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="h-full transition-transform duration-200 hover:-translate-y-1 cursor-pointer active:scale-[0.99] select-none" 
      onClick={handleCardClick}
    >
      <CardContent className="relative p-0 group">
        <div className="relative h-40 md:h-48 bg-gradient-to-br from-blue-500/90 to-purple-600/90 overflow-hidden">
          <img
            src={getAvatarUrl(persona.avatar)}
            alt={persona.name}
            className="h-full w-full object-cover mix-blend-overlay opacity-90 transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-900">
              {getVisibilityIcon()}
              <span className="ml-1">{getVisibilityLabel()}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-5 text-white">
            <h3 className="text-lg md:text-xl font-semibold truncate mb-1">{persona.name}</h3>
            <p className="text-sm/relaxed opacity-90 line-clamp-2">{persona.description}</p>
          </div>
        </div>
        
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {persona.tags?.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize text-xs">
                {tag}
              </Badge>
            ))}
            {(persona.tags?.length || 0) > 4 && (
              <span className="text-xs text-gray-500">+{(persona.tags?.length || 0) - 4} more</span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageSquare size={14} />
                <span>0 chats</span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} />
                <span>0 favorites</span>
              </div>
            </div>
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                ref={menuButtonRef}
                onClick={handleMenuToggle}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>
              
              {showMenu && (
                <Portal>
                  <div 
                    className="fixed inset-0 z-50"
                    onClick={() => setShowMenu(false)}
                  >
                    <div
                      className="absolute bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      style={{
                        top: menuPosition.top,
                        left: menuPosition.left
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="py-1">
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={(e) => handleAction(e, onEdit)}
                        >
                          <Edit size={16} className="mr-2" /> Edit
                        </button>
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={(e) => handleAction(e, onDuplicate)}
                        >
                          <Copy size={16} className="mr-2" /> Duplicate
                        </button>
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          onClick={(e) => handleAction(e, onDelete)}
                        >
                          <Trash size={16} className="mr-2" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Portal>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter 
        className="flex justify-between bg-gray-50 py-2 md:py-3 px-3 md:px-4"
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Eye size={14} className="text-gray-400" />
          <span>{viewCount} views</span>
          <span className="text-gray-300">•</span>
          <span>Updated {formatRelativeTime(persona.lastModified)}</span>
        </div>
        
        <button
          className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
          onClick={(e) => handleAction(e, onView)}
          aria-label="View Details"
        >
          <span className="hidden sm:inline">View Details</span>
          <ExternalLink size={14} className="ml-1" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default PersonaCard;