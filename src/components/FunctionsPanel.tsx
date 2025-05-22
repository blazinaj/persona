import React from 'react';
import { Plus, Code, Edit, Trash, Play, Pause } from 'lucide-react';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';

interface PersonaFunction {
  id: string;
  name: string;
  description?: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FunctionsPanelProps {
  functions: PersonaFunction[];
  onAddFunction: () => void;
  onEditFunction: (func: PersonaFunction) => void;
  onDeleteFunction: (id: string) => void;
  onToggleFunction: (id: string, isActive: boolean) => void;
  onClose?: () => void;
}

export const FunctionsPanel: React.FC<FunctionsPanelProps> = ({
  functions,
  onAddFunction,
  onEditFunction,
  onDeleteFunction,
  onToggleFunction,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Custom Functions</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onAddFunction}
          >
            Add Function
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
        {functions.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Code size={48} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No functions yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add custom functions to extend your persona's capabilities
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={onAddFunction}
            >
              Add First Function
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {functions.map((func) => (
              <div
                key={func.id}
                className={`p-4 rounded-lg border ${
                  func.is_active
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{func.name}</h3>
                    {func.description && (
                      <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFunction(func.id, !func.is_active)}
                      className="p-1 hover:bg-white rounded"
                      title={func.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {func.is_active ? (
                        <Pause size={14} className="text-gray-500" />
                      ) : (
                        <Play size={14} className="text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditFunction(func)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Edit size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => onDeleteFunction(func.id)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Trash size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <Badge
                    variant={func.is_active ? 'success' : 'secondary'}
                  >
                    {func.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Updated {formatDate(func.updated_at)}
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