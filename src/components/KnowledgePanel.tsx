import React, { useState, useEffect } from 'react';
import { Plus, Book, Edit, Trash, Search, Tag, ExternalLink, Info, AlertCircle, X, Upload, FileText } from 'lucide-react';
import { KnowledgeEntry, KnowledgeCategory } from '../types';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import KnowledgeEntryModal from './KnowledgeEntryModal';
import KnowledgeUploader from './KnowledgeUploader';

interface KnowledgePanelProps {
  personaId: string;
  onClose?: () => void;
}

export const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  personaId,
  onClose
}) => {
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchKnowledgeEntries();
  }, [personaId]);

  const fetchKnowledgeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('persona_knowledge_entries')
        .select('*')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setKnowledgeEntries(data.map(entry => ({
        ...entry,
        personaId: entry.persona_id,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
        userId: entry.user_id
      })));
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      setError('Failed to load knowledge entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (data: Partial<KnowledgeEntry>) => {
    try {
      const { error } = await supabase
        .from('persona_knowledge_entries')
        .insert({
          persona_id: personaId,
          title: data.title,
          description: data.description,
          category: data.category,
          source: data.source
        });

      if (error) throw error;
      
      await fetchKnowledgeEntries();
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      setError('Failed to create knowledge entry');
    }
  };

  const handleUpdateEntry = async (id: string, data: Partial<KnowledgeEntry>) => {
    try {
      const { error } = await supabase
        .from('persona_knowledge_entries')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          source: data.source
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchKnowledgeEntries();
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      setError('Failed to update knowledge entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this knowledge entry? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('persona_knowledge_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        await fetchKnowledgeEntries();
      } catch (error) {
        console.error('Error deleting knowledge entry:', error);
        setError('Failed to delete knowledge entry');
      }
    }
  };

  // Get all unique categories from entries
  const categories = Array.from(
    new Set(knowledgeEntries.map(entry => entry.category))
  );

  // Filter entries based on search term and selected category
  const filteredEntries = knowledgeEntries.filter(entry => {
    const matchesSearch = 
      searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === null || 
      entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Knowledge Base</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" 
            size="sm"
            leftIcon={<Upload size={14} />}
            onClick={() => setShowUploader(!showUploader)}
          >
            Upload
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsAddingEntry(true)}
          >
            Add Entry
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

      {showUploader && (
        <div className="p-4 border-b border-gray-200">
          <KnowledgeUploader 
            personaId={personaId}
            onUploadComplete={() => {
              fetchKnowledgeEntries();
              setShowUploader(false);
            }}
          />
        </div>
      )}

      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search knowledge entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {categories.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === null
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    category === selectedCategory
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
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
            <p className="mt-2 text-sm text-gray-500">Loading knowledge entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <FileText size={48} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No knowledge entries yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || selectedCategory
                ? "No entries match your search criteria."
                : "Add knowledge entries to enhance your persona's capabilities."}
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsAddingEntry(true)}
            >
              Add First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {entry.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{entry.description}</p>
                
                {entry.source && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                    <ExternalLink size={12} />
                    <a 
                      href={entry.source.startsWith('http') ? entry.source : `https://${entry.source}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Source: {entry.source}
                    </a>
                  </div>
                )}
                
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Added {formatDate(entry.createdAt)}</span>
                  {entry.updatedAt > entry.createdAt && (
                    <span>Updated {formatDate(entry.updatedAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <KnowledgeEntryModal
        isOpen={isAddingEntry || editingEntry !== null}
        entry={editingEntry}
        onClose={() => {
          setIsAddingEntry(false);
          setEditingEntry(null);
        }}
        onSubmit={(data) => {
          if (editingEntry) {
            handleUpdateEntry(editingEntry.id, data);
          } else {
            handleCreateEntry(data);
          }
        }}
      />
    </div>
  );
};

export default KnowledgePanel;