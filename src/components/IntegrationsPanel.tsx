import React from 'react';
import { Plus, Code, Edit, Trash, Globe, Key } from 'lucide-react';
import { Integration } from '../types';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';

interface IntegrationsPanelProps {
  integrations: Integration[];
  onAddIntegration: () => void;
  onEditIntegration: (integration: Integration) => void;
  onDeleteIntegration: (id: string) => void;
  onClose?: () => void;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  integrations,
  onAddIntegration,
  onEditIntegration,
  onDeleteIntegration,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Integrations</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onAddIntegration}
          >
            Add Integration
          </Button>
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {integrations.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Code size={48} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No integrations yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add integrations to extend your persona's capabilities
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={onAddIntegration}
            >
              Add First Integration
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`p-4 rounded-lg border ${
                  integration.is_active
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{integration.name}</h3>
                    {integration.description && (
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditIntegration(integration)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Edit size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => onDeleteIntegration(integration.id)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Trash size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe size={14} />
                    <span className="font-mono">{integration.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Code size={14} />
                    <span className="uppercase">{integration.method}</span>
                  </div>
                  {Object.keys(integration.headers).length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Key size={14} />
                      <span>{Object.keys(integration.headers).length} Headers</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <Badge
                    variant={integration.is_active ? 'success' : 'secondary'}
                  >
                    {integration.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Added {formatDate(integration.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};