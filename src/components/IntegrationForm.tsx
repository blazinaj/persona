import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus } from 'lucide-react';
import Button from './ui/Button';
import { Integration } from '../types';

const integrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  endpoint: z.string().url('Please enter a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  parameters: z.record(z.string()).optional(),
  is_active: z.boolean().default(true)
});

type IntegrationFormData = z.infer<typeof integrationSchema>;

interface IntegrationFormProps {
  integration?: Integration;
  onSubmit: (data: IntegrationFormData) => void;
  onCancel: () => void;
}

export const IntegrationForm: React.FC<IntegrationFormProps> = ({
  integration,
  onSubmit,
  onCancel
}) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: integration || {
      method: 'GET',
      headers: {},
      parameters: {},
      is_active: true
    }
  });

  const [newHeaderKey, setNewHeaderKey] = React.useState('');
  const [newHeaderValue, setNewHeaderValue] = React.useState('');
  const [newParamKey, setNewParamKey] = React.useState('');
  const [newParamValue, setNewParamValue] = React.useState('');

  const headers = watch('headers') || {};
  const parameters = watch('parameters') || {};

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setValue('headers', { ...headers, [newHeaderKey]: newHeaderValue });
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setValue('headers', newHeaders);
  };

  const handleAddParameter = () => {
    if (newParamKey && newParamValue) {
      setValue('parameters', { ...parameters, [newParamKey]: newParamValue });
      setNewParamKey('');
      setNewParamValue('');
    }
  };

  const handleRemoveParameter = (key: string) => {
    const newParams = { ...parameters };
    delete newParams[key];
    setValue('parameters', newParams);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          {...register('name')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter integration name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-gray-400 text-xs ml-1">(optional)</span>
        </label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Describe what this integration does"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Endpoint URL
        </label>
        <input
          type="text"
          {...register('endpoint')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="https://api.example.com/endpoint"
        />
        {errors.endpoint && (
          <p className="mt-1 text-sm text-red-600">{errors.endpoint.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HTTP Method
        </label>
        <select
          {...register('method')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headers
          <span className="text-gray-400 text-xs ml-1">(optional)</span>
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              placeholder="Header name"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              placeholder="Header value"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddHeader}
              disabled={!newHeaderKey || !newHeaderValue}
              leftIcon={<Plus size={14} />}
            >
              Add
            </Button>
          </div>
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="flex-1 text-sm font-medium">{key}</span>
              <span className="flex-1 text-sm text-gray-600">{value}</span>
              <button
                type="button"
                onClick={() => handleRemoveHeader(key)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parameters
          <span className="text-gray-400 text-xs ml-1">(optional)</span>
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newParamKey}
              onChange={(e) => setNewParamKey(e.target.value)}
              placeholder="Parameter name"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newParamValue}
              onChange={(e) => setNewParamValue(e.target.value)}
              placeholder="Parameter description"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddParameter}
              disabled={!newParamKey || !newParamValue}
              leftIcon={<Plus size={14} />}
            >
              Add
            </Button>
          </div>
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="flex-1 text-sm font-medium">{key}</span>
              <span className="flex-1 text-sm text-gray-600">{value}</span>
              <button
                type="button"
                onClick={() => handleRemoveParameter(key)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register('is_active')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Active</span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {integration ? 'Update Integration' : 'Create Integration'}
        </Button>
      </div>
    </form>
  );
};