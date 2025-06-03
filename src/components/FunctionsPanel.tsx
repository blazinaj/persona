import React from 'react';
import { Code, Plus, X, Edit, Trash, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

interface FunctionsPanelProps {
  functions: any[];
  onAddFunction: () => void;
  onEditFunction: (func: any) => void;
  onDeleteFunction: (id: string) => void;
  onToggleFunction: (id: string, isActive: boolean) => void;
  onClose: () => void;
  fetchError?: string | null;
  onRetry?: () => void;
}

export const FunctionsPanel: React.FC<FunctionsPanelProps> = ({
  functions,
  onAddFunction,
  onEditFunction,
  onDeleteFunction,
  onToggleFunction,
  onClose,
  fetchError,
  onRetry
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="text-lg font-medium">Functions</h3>
        <div className="flex items-center gap-2">
          <Button onClick={onAddFunction} leftIcon={<Plus size={16} />} size="sm">Add</Button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors md:hidden"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700 mb-2">{fetchError}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                leftIcon={<RefreshCw size={16} />}
              >
                Try Again
              </Button>
            )}
          </div>
        ) : functions.length === 0 ? (
          <div className="text-center py-8">
            <Code className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No functions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add custom code that your persona can execute during conversations.
            </p>
            <div className="mt-6">
              <Button onClick={onAddFunction} leftIcon={<Plus size={16} />} size="sm">
                Add Function
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {functions.map((func) => (
              <div
                key={func.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{func.name}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFunction(func.id, !func.is_active)}
                      className="text-gray-500 hover:text-gray-700"
                      title={func.is_active ? "Disable function" : "Enable function"}
                    >
                      {func.is_active ? (
                        <ToggleRight size={20} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => onEditFunction(func)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Edit function"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteFunction(func.id)}
                      className="text-gray-500 hover:text-red-600"
                      title="Delete function"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
                {func.description && (
                  <p className="text-sm text-gray-600 mb-2">{func.description}</p>
                )}
                <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto font-mono">
                  <pre className="whitespace-pre-wrap break-words">
                    {func.code.length > 150 
                      ? `${func.code.substring(0, 150)}...` 
                      : func.code}
                  </pre>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{func.is_active ? "Active" : "Inactive"}</span>
                  <span>Created: {new Date(func.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionsPanel;