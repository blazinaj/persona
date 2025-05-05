import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Edit, Copy, Trash, MessageSquare } from 'lucide-react';
import { Persona } from '../types';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';

interface PersonaDetailsProps {
  personas: Persona[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PersonaDetails: React.FC<PersonaDetailsProps> = ({
  personas,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { id } = useParams<{ id: string }>();
  const persona = personas.find(p => p.id === id);

  if (!persona) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Persona Details</h1>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Hero section */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="h-full w-full object-cover mix-blend-overlay opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{persona.name}</h2>
            <p className="text-lg opacity-90">{persona.description}</p>
          </div>
        </div>

        {/* Content sections */}
        <div className="p-6 space-y-8">
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              leftIcon={<MessageSquare size={16} />}
              onClick={() => alert('Chat functionality would be implemented here')}
            >
              Start Chat
            </Button>
            <Button
              variant="outline"
              leftIcon={<Edit size={16} />}
              onClick={() => onEdit(persona.id)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              leftIcon={<Copy size={16} />}
              onClick={() => onDuplicate(persona.id)}
            >
              Duplicate
            </Button>
            <Button
              variant="outline"
              leftIcon={<Trash size={16} />}
              onClick={() => onDelete(persona.id)}
              className="text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{formatDate(persona.created)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Last Modified</p>
              <p className="font-medium">{formatDate(persona.lastModified)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Visibility</p>
              <Badge variant={persona.isPublic ? 'success' : 'secondary'}>
                {persona.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {persona.tags.map((tag) => (
                <Badge key={tag} variant="primary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Personality</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {persona.personality.map((trait) => (
                <div
                  key={trait}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                    {trait[0].toUpperCase()}
                  </div>
                  <span className="capitalize">{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Areas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Knowledge Areas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {persona.knowledge.map((area) => (
                <div
                  key={area}
                  className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-purple-800"
                >
                  {area}
                </div>
              ))}
            </div>
          </div>

          {/* Communication Style */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Communication Style</h3>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-gray-700 capitalize">{persona.tone}</p>
            </div>
          </div>

          {/* Example Interactions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Example Interactions</h3>
            <div className="space-y-3">
              {persona.examples.map((example, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <p className="text-gray-700">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetails;