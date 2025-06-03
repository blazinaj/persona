import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Calendar, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Badge } from './ui/Badge';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export const ApiKeySettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('create_api_key', {
          name_input: newKeyName,
          expires_at_input: expiresAt || null
        });

      if (error) throw error;

      setNewKey(data.key);
      await fetchApiKeys();
      setShowCreateModal(false);
      setNewKeyName('');
      setExpiresAt('');
    } catch (error) {
      console.error('Error creating API key:', error);
      setError('Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this API key? This action cannot be undone.'
    );

    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchApiKeys();
      } catch (error) {
        console.error('Error deleting API key:', error);
        setError('Failed to delete API key');
      }
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy key:', err);
      setError('Failed to copy key to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
          <p className="text-sm text-gray-500">
            Manage your API keys for accessing the Persona API
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create API Key
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {newKey && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-green-800">New API Key Created</h4>
            <button
              onClick={() => setNewKey(null)}
              className="text-green-700 hover:text-green-900"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-green-700">
            Make sure to copy your API key now. You won't be able to see it again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white rounded border border-green-200 font-mono text-sm">
              {newKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyKey(newKey)}
              leftIcon={copiedKey === newKey ? <Check size={16} /> : <Copy size={16} />}
            >
              {copiedKey === newKey ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center">
            <Key size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create an API key to start making requests to the Persona API.
            </p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{key.name}</h4>
                    <Badge variant={key.is_active ? 'success' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </div>
                  {key.last_used && (
                    <div className="mt-1 text-sm text-gray-500">
                      Last used {new Date(key.last_used).toLocaleDateString()}
                    </div>
                  )}
                  {key.expires_at && (
                    <div className="mt-1 text-sm text-gray-500">
                      Expires {new Date(key.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteKey(key.id)}
                  leftIcon={<Trash2 size={16} />}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowCreateModal(false)} />
            
            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Create API Key</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new API key to access the Persona API
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter a name for this key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim()}
                  >
                    Create Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};