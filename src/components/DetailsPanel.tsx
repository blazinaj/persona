import React from 'react';
import { Persona } from '../types';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';

interface DetailsPanelProps {
  persona: Persona;
  onClose?: () => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  persona,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Persona Details</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <span className="sr-only">Close panel</span>
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Description</p>
          <p className="text-gray-900">{persona.description}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {persona.tags.map((tag) => (
              <Badge key={tag} variant="primary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Personality</p>
          <div className="flex flex-wrap gap-2">
            {persona.personality.map((trait) => (
              <Badge key={trait} variant="secondary" className="capitalize">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Knowledge Areas</p>
          <div className="space-y-1">
            {persona.knowledge.map((area) => (
              <div
                key={area}
                className="px-3 py-1.5 rounded bg-purple-50 text-purple-800 text-sm"
              >
                {area}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Communication Style</p>
          <p className="text-gray-900 capitalize">{persona.tone}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Example Interactions</p>
          <div className="space-y-2">
            {persona.examples.map((example, index) => (
              <div
                key={index}
                className="p-3 rounded bg-gray-50 text-gray-700 text-sm"
              >
                {example}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-200 mt-4">
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium">{formatDate(persona.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Modified</p>
            <p className="text-sm font-medium">{formatDate(persona.updated_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Visibility</p>
            <Badge 
              variant={
                persona.visibility === 'public' 
                  ? 'success' 
                  : persona.visibility === 'unlisted' 
                  ? 'warning' 
                  : 'secondary'
              }
            >
              {persona.visibility === 'public' 
                ? 'Public' 
                : persona.visibility === 'unlisted'
                ? 'Unlisted'
                : 'Private'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};