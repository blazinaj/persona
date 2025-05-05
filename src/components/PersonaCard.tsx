import React from 'react';
import { MoreHorizontal, Edit, Copy, Trash, ExternalLink } from 'lucide-react';
import { Persona } from '../types';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { formatDate } from '../utils/formatters';

interface PersonaCardProps {
  persona: Persona;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  onEdit,
  onDuplicate,
  onDelete,
  onView
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (
    e: React.MouseEvent,
    action: (id: string) => void | undefined
  ) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action) {
      action(persona.id);
    }
  };

  return (
    <Card className="h-full transition-transform duration-200 hover:-translate-y-1 cursor-pointer" onClick={() => onView && onView(persona.id)}>
      <CardContent className="p-0">
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="h-full w-full object-cover mix-blend-overlay opacity-75"
          />
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
            <h3 className="text-xl font-semibold truncate">{persona.name}</h3>
            <p className="text-sm opacity-90 line-clamp-2 mt-1">{persona.description}</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {persona.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>Last modified: {formatDate(persona.lastModified)}</div>
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 py-3 px-4">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {persona.personality.slice(0, 3).map((trait, index) => (
              <span key={trait} className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-xs border-2 border-white capitalize">
                {trait.slice(0, 1)}
              </span>
            ))}
          </div>
          {persona.personality.length > 3 && (
            <span className="text-xs text-gray-500 ml-1">+{persona.personality.length - 3}</span>
          )}
        </div>
        
        <button
          className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
          onClick={(e) => handleAction(e, onView)}
        >
          View <ExternalLink size={16} className="ml-1" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default PersonaCard;