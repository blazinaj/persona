import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, StarOff, Eye, MessageSquare, Code, Info, Share2, Copy, Check, Book, MoreHorizontal, Menu, X, List, Edit, Trash, BrainCircuit } from 'lucide-react';
import { Persona } from '../types';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { Chat } from './Chat';
import { DetailsPanel } from './DetailsPanel';
import { FunctionModal } from './FunctionModal';
import { FunctionsPanel } from './FunctionsPanel';
import { KnowledgePanel } from './KnowledgePanel';
import { ConversationsPanel } from './ConversationsPanel';
import { EmbedModal } from './EmbedModal';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import MemoriesPanel from './MemoriesPanel';

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
  const { user } = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [activePanel, setActivePanel] = useState<'details' | 'integrations' | 'knowledge' | 'functions' | 'conversations' | 'memories' | null>(null);
  const [functions, setFunctions] = useState<any[]>([]);
  const [isAddingFunction, setIsAddingFunction] = useState(false);
  const [editingFunction, setEditingFunction] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(() => {
    // Check if a conversationId was passed in location state
    const state = window.history.state?.usr;
    return state?.conversationId;
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const persona = personas.find(p => p.id === id);
  const navigate = useNavigate();

  // If persona is not found, redirect to home
  useEffect(() => {
    if (id && !persona) {
      window.location.href = '/';
    }
  }, [id, persona]);

  useEffect(() => {
    if (id && user?.id) {
      trackView();
      fetchStats();
      checkIfFavorited();
      fetchConversations();
    }
  }, [id, user?.id]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .eq('persona_id', id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      
      // Auto-select the most recent conversation if it exists
      if (data && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const createNewConversation = async () => {
    if (!user?.id || !id) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          persona_id: id,
          user_id: user.id,
          title: 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchConversations();
      setSelectedConversationId(data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);

      if (error) throw error;
      await fetchConversations();
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this conversation? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);

        if (error) throw error;
        await fetchConversations();
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(undefined);
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchFunctions();
    }
  }, [id]);

  const fetchFunctions = async () => {
    // Reset error state at the beginning of the fetch attempt
    setFetchError(null);
    
    if (!id) {
      console.warn('Cannot fetch functions: No persona ID provided');
      return;
    }

    try {
      // Make the Supabase request with a timeout
      const fetchPromise = supabase
        .from('persona_functions')
        .select('*')
        .eq('persona_id', id)
        .order('created_at', { ascending: false });
      
      // Set a timeout for the fetch operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );
      
      // Race between the fetch and the timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => { throw new Error('Request timed out'); })
      ]) as any;

      if (error) throw error;
      setFunctions(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching functions:', error);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prevCount => prevCount + 1);
        console.log(`Retrying fetch (${retryCount + 1}/${maxRetries})...`);
        
        // Exponential backoff: wait longer between each retry
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchFunctions(), backoffDelay);
      } else {
        // Set a user-friendly error message based on the error type
        if (error.message === 'Request timed out') {
          setFetchError('Request timed out. Please check your network connection and try again.');
        } else if (error.code === 'PGRST301') {
          setFetchError('Authentication error. Please log in again.');
        } else if (error.message && error.message.includes('Failed to fetch')) {
          setFetchError('Network error. Please check your internet connection.');
        } else {
          setFetchError(`Error loading functions: ${error.message || 'Unknown error'}`);
        }
      }
    }
  };

  const handleCreateFunction = async (data: any) => {
    try {
      const { error } = await supabase
        .from('persona_functions')
        .insert({
          persona_id: id,
          name: data.name,
          description: data.description,
          code: data.code,
          is_active: data.is_active,
          user_id: user?.id
        });

      if (error) throw error;
      await fetchFunctions();
      setIsAddingFunction(false);
    } catch (error) {
      console.error('Error creating function:', error);
    }
  };

  const handleUpdateFunction = async (functionId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('persona_functions')
        .update({
          name: data.name,
          description: data.description,
          code: data.code,
          is_active: data.is_active
        })
        .eq('id', functionId);

      if (error) throw error;
      await fetchFunctions();
      setEditingFunction(null);
    } catch (error) {
      console.error('Error updating function:', error);
    }
  };

  const handleDeleteFunction = async (functionId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this function? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('persona_functions')
          .delete()
          .eq('id', functionId);

        if (error) throw error;
        await fetchFunctions();
      } catch (error) {
        console.error('Error deleting function:', error);
      }
    }
  };

  const handleToggleFunction = async (functionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('persona_functions')
        .update({ is_active: isActive })
        .eq('id', functionId);

      if (error) throw error;
      await fetchFunctions();
    } catch (error) {
      console.error('Error toggling function:', error);
    }
  };

  const checkIfFavorited = async () => {
    if (!user?.id || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('persona_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('persona_id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorited(data !== null);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !id) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('persona_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('persona_id', id);

        if (error) throw error;
        setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from('persona_favorites')
          .insert({
            user_id: user.id,
            persona_id: id
          });

        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/explore/personas/${persona.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chat with ${persona.name}`,
          text: persona.description || `Check out this AI persona: ${persona.name}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const trackView = async () => {
    if (!user?.id || !id) return;

    try {
      // Use the RPC function instead of direct upsert
      const { data, error } = await supabase
        .rpc('track_persona_view', {
          persona_id_input: id,
          viewer_id_input: user.id
        });

      if (error) throw error;
      if (!data) {
        console.warn('Unable to track view - insufficient permissions');
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchStats = async () => {
    if (!id) return;

    try {
      const { count, error } = await supabase
        .from('persona_views')
        .select('id', { count: 'exact' })
        .eq('persona_id', id);

      if (error) throw error;
      setViewCount(count || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Function to retry fetching data
  const retryFetch = () => {
    setFetchError(null);
    setRetryCount(0); // Reset retry count
    fetchFunctions();
  };

  if (!persona) {
    return null; // Return null instead of Navigate component
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white safe-top shadow-sm">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar
                src={persona.avatar}
                name={persona.name}
                size="sm"
              />
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-none">{persona.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<List size={16} />}
                onClick={() => setActivePanel(activePanel === 'conversations' ? null : 'conversations')}
              >
                Conversations
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Book size={16} />}
                onClick={() => setActivePanel(activePanel === 'knowledge' ? null : 'knowledge')}
              >
                Knowledge
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BrainCircuit size={16} />}
                onClick={() => setActivePanel(activePanel === 'memories' ? null : 'memories')}
              >
                Memories
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Info size={16} />}
                onClick={() => setActivePanel(activePanel === 'details' ? null : 'details')}
              >
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Code size={16} />}
                onClick={() => setActivePanel(activePanel === 'functions' ? null : 'functions')}
              >
                Functions
              </Button>
              {persona.visibility === 'public' && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Code size={16} />}
                  onClick={() => setShowEmbedModal(true)}
                >
                  Embed
                </Button>
              )}
              {(persona.visibility === 'public' || persona.visibility === 'unlisted') && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={showShareTooltip ? <Check size={16} /> : <Share2 size={16} />}
                    onClick={handleShare}
                  >
                    {showShareTooltip ? 'Copied!' : 'Share'}
                  </Button>
                  {showShareTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded">
                      Link copied!
                    </div>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" leftIcon={<Edit size={16} />} onClick={() => onEdit(persona.id)}>Edit</Button>
              <Button variant="outline" size="sm" leftIcon={<Copy size={16} />} onClick={() => onDuplicate(persona.id)}>
                <span className="hidden lg:inline">Duplicate</span>
                <span className="lg:hidden">Copy</span>
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Trash size={16} />} onClick={() => onDelete(persona.id)} className="text-red-600">
                <span className="hidden lg:inline">Delete</span>
              </Button>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Mobile action menu */}
        {showMobileMenu && (
          <div className="absolute right-0 left-0 top-14 z-30 bg-white shadow-lg border-b border-gray-200 md:hidden">
            <div className="p-2 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Info size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'details' ? null : 'details');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Book size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'knowledge' ? null : 'knowledge');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Knowledge
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BrainCircuit size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'memories' ? null : 'memories');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Memories
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<List size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'conversations' ? null : 'conversations');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Conversations
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Code size={16} />}
                onClick={() => {
                  setActivePanel(activePanel === 'functions' ? null : 'functions');
                  setShowMobileMenu(false);
                  setShowMobileSidebar(true);
                }}
                fullWidth
              >
                Functions
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit size={16} />}
                onClick={() => {
                  onEdit(persona.id);
                  setShowMobileMenu(false);
                }}
                fullWidth
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy size={16} />}
                onClick={() => {
                  onDuplicate(persona.id);
                  setShowMobileMenu(false);
                }}
                fullWidth
              >
                Duplicate
              </Button>
              {persona.visibility === 'public' && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Code size={16} />}
                  onClick={() => {
                    setShowEmbedModal(true);
                    setShowMobileMenu(false);
                  }}
                  fullWidth
                >
                  Embed
                </Button>
              )}
              {(persona.visibility === 'public' || persona.visibility === 'unlisted') && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 size={16} />}
                  onClick={() => {
                    handleShare();
                    setShowMobileMenu(false);
                  }}
                  fullWidth
                >
                  Share
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash size={16} />}
                onClick={() => {
                  onDelete(persona.id);
                  setShowMobileMenu(false);
                }}
                className="text-red-600 col-span-2"
                fullWidth
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Chat section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Chat persona={persona} selectedConversationId={selectedConversationId} />
        </div>

        {/* Sidebars */}
        {activePanel === 'conversations' && (
          <div className={`fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom ${showMobileSidebar ? 'h-[80vh]' : 'h-0'} md:h-auto z-20 transition-all duration-300`}>
            <ConversationsPanel
              conversations={conversations}
              currentConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onCreateConversation={createNewConversation}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => {
                setActivePanel(null);
                setShowMobileSidebar(false);
              }}
            />
          </div>
        )}

        {activePanel === 'details' && (
          <div className={`fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom ${showMobileSidebar ? 'h-[80vh]' : 'h-0'} md:h-auto z-20 transition-all duration-300`}>
            <DetailsPanel
              persona={persona}
              onClose={() => {
                setActivePanel(null);
                setShowMobileSidebar(false);
              }}
            />
          </div>
        )}

        {/* Knowledge sidebar */}
        {activePanel === 'knowledge' && (
          <div className={`fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom ${showMobileSidebar ? 'h-[80vh]' : 'h-0'} md:h-auto z-20 transition-all duration-300`}>
            <KnowledgePanel
              personaId={persona.id}
              onClose={() => {
                setActivePanel(null);
                setShowMobileSidebar(false);
              }}
            />
          </div>
        )}

        {/* Memories sidebar */}
        {activePanel === 'memories' && (
          <div className={`fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom ${showMobileSidebar ? 'h-[80vh]' : 'h-0'} md:h-auto z-20 transition-all duration-300`}>
            <MemoriesPanel
              personaId={persona.id}
              onClose={() => {
                setActivePanel(null);
                setShowMobileSidebar(false);
              }}
            />
          </div>
        )}

        {/* Functions sidebar */}
        {activePanel === 'functions' && (
          <div className={`fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom ${showMobileSidebar ? 'h-[80vh]' : 'h-0'} md:h-auto z-20 transition-all duration-300`}>
            <FunctionsPanel
              functions={functions}
              onAddFunction={() => setIsAddingFunction(true)}
              onEditFunction={setEditingFunction}
              onDeleteFunction={handleDeleteFunction}
              onToggleFunction={handleToggleFunction}
              onClose={() => {
                setActivePanel(null);
                setShowMobileSidebar(false);
              }}
              fetchError={fetchError}
              onRetry={retryFetch}
            />
          </div>
        )}

        {/* Function Modal */}
        <FunctionModal
          isOpen={isAddingFunction || editingFunction !== null}
          personaId={persona.id}
          onClose={() => {
            setIsAddingFunction(false);
            setEditingFunction(null);
          }}
          onSubmit={(data) => {
            if (editingFunction) {
              handleUpdateFunction(editingFunction.id, data);
            } else {
              handleCreateFunction(data);
            }
          }}
        />

        {/* Embed Modal */}
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          personaId={persona.id}
        />
      </div>
    </div>
  );
};

export default PersonaDetails;