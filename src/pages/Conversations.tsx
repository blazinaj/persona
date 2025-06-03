import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Trash2, Clock, ChevronRight, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { formatRelativeTime } from '../utils/formatters';

const Conversations: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*, personas(id, name, avatar, visibility)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedConversations.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedConversations.length} conversation${selectedConversations.length > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        setIsDeleting(true);
        const { error } = await supabase
          .from('conversations')
          .delete()
          .in('id', selectedConversations);

        if (error) throw error;
        
        // Refresh conversations
        await fetchConversations();
        setSelectedConversations([]);
      } catch (error) {
        console.error('Error deleting conversations:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleConversationSelection = (id: string) => {
    setSelectedConversations(prev => 
      prev.includes(id) 
        ? prev.filter(convId => convId !== id) 
        : [...prev, id]
    );
  };

  const selectAllConversations = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map(conv => conv.id));
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.personas?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-600 mt-1">
            View and manage your chat history with personas
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {selectedConversations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              onClick={handleDeleteSelected}
              loading={isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete Selected
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllConversations}
          >
            {selectedConversations.length === filteredConversations.length && filteredConversations.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <MessageSquare size={48} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search to find what you're looking for."
              : "Start chatting with personas to create conversations."}
          </p>
          <div className="mt-6">
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
            >
              Go to Personas
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredConversations.map(conversation => (
              <div 
                key={conversation.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedConversations.includes(conversation.id)}
                      onChange={() => toggleConversationSelection(conversation.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/personas/${conversation.personas.id}`, { 
                      state: { conversationId: conversation.id } 
                    })}
                  >
                    <Avatar
                      src={getAvatarUrl(conversation.personas.avatar)}
                      name={conversation.personas.name}
                      size="sm"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{conversation.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Bot size={14} />
                          <span>{conversation.personas.name}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatRelativeTime(new Date(conversation.updated_at))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;