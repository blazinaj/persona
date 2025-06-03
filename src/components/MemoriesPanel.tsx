import React, { useState, useEffect } from 'react';
import { Plus, Brain, Edit, Trash, Search, Tag, Clock, X, AlertCircle, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { Memory } from '../types';

interface MemoriesPanelProps {
  personaId?: string;
  spaceId?: string;
  onClose?: () => void;
}

export const MemoriesPanel: React.FC<MemoriesPanelProps> = ({
  personaId,
  spaceId,
  onClose
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<number | null>(null);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const [newImportance, setNewImportance] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (personaId || spaceId) {
      fetchMemories();
    }
  }, [personaId, spaceId]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (personaId) {
        const { data, error } = await supabase
          .from('persona_memories')
          .select('*')
          .eq('persona_id', personaId)
          .order('importance', { ascending: false })
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        setMemories(data.map(memory => ({
          id: memory.id,
          personaId: memory.persona_id,
          memoryKey: memory.memory_key,
          memoryValue: memory.memory_value,
          importance: memory.importance,
          createdAt: new Date(memory.created_at),
          updatedAt: new Date(memory.updated_at)
        })));
      } else if (spaceId) {
        const { data, error } = await supabase
          .from('space_memories')
          .select('*')
          .eq('space_id', spaceId)
          .order('importance', { ascending: false })
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        setMemories(data.map(memory => ({
          id: memory.id,
          spaceId: memory.space_id,
          memoryKey: memory.memory_key,
          memoryValue: memory.memory_value,
          importance: memory.importance,
          createdAt: new Date(memory.created_at),
          updatedAt: new Date(memory.updated_at),
          createdByPersonaId: memory.created_by_persona_id,
          createdByUserId: memory.created_by_user_id
        })));
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) {
      setError('Memory key and value are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      if (personaId) {
        // Use the upsert_persona_memory RPC function
        const { error } = await supabase
          .rpc('upsert_persona_memory', {
            persona_id_input: personaId,
            memory_key_input: newMemoryKey.trim(),
            memory_value_input: newMemoryValue.trim(),
            importance_input: newImportance
          });

        if (error) throw error;
      } else if (spaceId) {
        // Use the upsert_space_memory RPC function
        const { error } = await supabase
          .rpc('upsert_space_memory', {
            space_id_input: spaceId,
            memory_key_input: newMemoryKey.trim(),
            memory_value_input: newMemoryValue.trim(),
            importance_input: newImportance
          });

        if (error) throw error;
      }
      
      await fetchMemories();
      setIsAddingMemory(false);
      setNewMemoryKey('');
      setNewMemoryValue('');
      setNewImportance(3);
    } catch (error) {
      console.error('Error creating memory:', error);
      setError('Failed to create memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMemory = async () => {
    if (!editingMemory || !editingMemory.memoryKey.trim() || !editingMemory.memoryValue.trim()) {
      setError('Memory key and value are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      if (personaId) {
        // Use the upsert_persona_memory RPC function to update the memory
        const { error } = await supabase
          .rpc('upsert_persona_memory', {
            persona_id_input: personaId,
            memory_key_input: editingMemory.memoryKey.trim(),
            memory_value_input: editingMemory.memoryValue.trim(),
            importance_input: editingMemory.importance
          });

        if (error) throw error;
      } else if (spaceId) {
        // Use the upsert_space_memory RPC function to update the memory
        const { error } = await supabase
          .rpc('upsert_space_memory', {
            space_id_input: spaceId,
            memory_key_input: editingMemory.memoryKey.trim(),
            memory_value_input: editingMemory.memoryValue.trim(),
            importance_input: editingMemory.importance
          });

        if (error) throw error;
      }
      
      await fetchMemories();
      setEditingMemory(null);
    } catch (error) {
      console.error('Error updating memory:', error);
      setError('Failed to update memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this memory? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        setError(null);
        
        if (personaId) {
          const { error } = await supabase
            .from('persona_memories')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } else if (spaceId) {
          const { error } = await supabase
            .from('space_memories')
            .delete()
            .eq('id', id);

          if (error) throw error;
        }
        
        await fetchMemories();
      } catch (error) {
        console.error('Error deleting memory:', error);
        setError('Failed to delete memory');
      }
    }
  };

  // Filter memories based on search term and selected importance
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = 
      searchTerm === '' || 
      memory.memoryKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.memoryValue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesImportance = 
      selectedImportance === null || 
      memory.importance === selectedImportance;
    
    return matchesSearch && matchesImportance;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Memories</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setIsAddingMemory(true);
              setEditingMemory(null);
            }}
          >
            Add Memory
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full"
            >
              <span className="sr-only">Close panel</span>
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by importance:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedImportance(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedImportance === null
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => setSelectedImportance(level === selectedImportance ? null : level)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  level === selectedImportance
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level === 1 && 'Low'}
                {level === 2 && 'Medium-Low'}
                {level === 3 && 'Medium'}
                {level === 4 && 'Medium-High'}
                {level === 5 && 'High'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading memories...</p>
          </div>
        ) : isAddingMemory ? (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Add New Memory</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Key
                </label>
                <input
                  type="text"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="E.g., User's name, Favorite color, etc."
                />
                <p className="mt-1 text-xs text-gray-500">
                  A short, descriptive label for this memory (max 100 characters)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Value
                </label>
                <textarea
                  value={newMemoryValue}
                  onChange={(e) => setNewMemoryValue(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="The content of the memory"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The actual information to remember (max 2000 characters)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newImportance}
                    onChange={(e) => setNewImportance(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium">
                    {newImportance === 1 && 'Low'}
                    {newImportance === 2 && 'Medium-Low'}
                    {newImportance === 3 && 'Medium'}
                    {newImportance === 4 && 'Medium-High'}
                    {newImportance === 5 && 'High'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Higher importance memories are more likely to be recalled
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingMemory(false);
                    setNewMemoryKey('');
                    setNewMemoryValue('');
                    setNewImportance(3);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateMemory}
                  loading={isSubmitting}
                  disabled={!newMemoryKey.trim() || !newMemoryValue.trim() || isSubmitting}
                >
                  Save Memory
                </Button>
              </div>
            </div>
          </div>
        ) : editingMemory ? (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Edit Memory</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Key
                </label>
                <input
                  type="text"
                  value={editingMemory.memoryKey}
                  onChange={(e) => setEditingMemory({...editingMemory, memoryKey: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="E.g., User's name, Favorite color, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Value
                </label>
                <textarea
                  value={editingMemory.memoryValue}
                  onChange={(e) => setEditingMemory({...editingMemory, memoryValue: e.target.value})}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="The content of the memory"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingMemory.importance}
                    onChange={(e) => setEditingMemory({...editingMemory, importance: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium">
                    {editingMemory.importance === 1 && 'Low'}
                    {editingMemory.importance === 2 && 'Medium-Low'}
                    {editingMemory.importance === 3 && 'Medium'}
                    {editingMemory.importance === 4 && 'Medium-High'}
                    {editingMemory.importance === 5 && 'High'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMemory(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateMemory}
                  loading={isSubmitting}
                  disabled={!editingMemory.memoryKey.trim() || !editingMemory.memoryValue.trim() || isSubmitting}
                >
                  Update Memory
                </Button>
              </div>
            </div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Brain size={48} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No memories yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || selectedImportance !== null
                ? "No memories match your search criteria."
                : "Add memories to help your persona remember important information."}
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsAddingMemory(true)}
            >
              Add First Memory
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{memory.memoryKey}</h3>
                    <Badge 
                      variant={
                        memory.importance === 5 ? 'danger' :
                        memory.importance === 4 ? 'warning' :
                        memory.importance === 3 ? 'primary' :
                        memory.importance === 2 ? 'secondary' :
                        'default'
                      }
                      className="mt-1"
                    >
                      {memory.importance === 5 && 'High'}
                      {memory.importance === 4 && 'Medium-High'}
                      {memory.importance === 3 && 'Medium'}
                      {memory.importance === 2 && 'Medium-Low'}
                      {memory.importance === 1 && 'Low'}
                      {' Importance'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingMemory(memory)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{memory.memoryValue}</p>
                
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Created {formatDate(memory.createdAt)}
                  </span>
                  {memory.updatedAt > memory.createdAt && (
                    <span>Updated {formatDate(memory.updatedAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoriesPanel;