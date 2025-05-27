import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, StarOff, Eye, MessageSquare, Code, Info, Share2, Copy, Check, List, Edit, Trash, MoreHorizontal } from 'lucide-react';
import { Persona } from '../types';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { Chat } from './Chat';
import { DetailsPanel } from './DetailsPanel';
import { FunctionModal } from './FunctionModal';
import { FunctionsPanel } from './FunctionsPanel';
import { ConversationsPanel } from './ConversationsPanel';
import { EmbedModal } from './EmbedModal';
import Button from './ui/Button';
import Avatar from './ui/Avatar';

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
  const [activePanel, setActivePanel] = useState<'details' | 'integrations' | null>(null);
  const [functions, setFunctions] = useState<any[]>([]);
  const [isAddingFunction, setIsAddingFunction] = useState(false);
  const [editingFunction, setEditingFunction] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const persona = personas.find(p => p.id === id);
  const navigate = useNavigate();

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
      console.log(data)
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
        setSelectedConversationId(undefined);
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
    try {
      const { data, error } = await supabase
        .from('persona_functions')
        .select('*')
        .eq('persona_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunctions(data || []);
    } catch (error) {
      console.error('Error fetching functions:', error);
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

  if (!persona) {
    return <Navigate to="/\" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white safe-top">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar
                src={persona.avatar}
                name={persona.name}
                size="sm"
              />
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{persona.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
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
              <Button variant="outline" size="sm" leftIcon={<Copy size={16} />} onClick={() => onDuplicate(persona.id)}>Duplicate</Button>
              <Button variant="outline" size="sm" leftIcon={<Trash size={16} />} onClick={() => onDelete(persona.id)} className="text-red-600">Delete</Button>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        {showMenu && (
          <div className="absolute right-4 top-14 z-30 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button onClick={() => { setShowMenu(false); setActivePanel('details'); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Info size={16} className="mr-2" /> Details
              </button>
              <button onClick={() => { setShowMenu(false); setActivePanel('conversations'); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <List size={16} className="mr-2" /> Conversations
              </button>
              {persona.visibility === 'public' && (
                <button onClick={() => { setShowMenu(false); setShowEmbedModal(true); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Code size={16} className="mr-2" /> Embed
                </button>
              )}
              <button onClick={() => { setShowMenu(false); onEdit(persona.id); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Edit size={16} className="mr-2" /> Edit
              </button>
              <button onClick={() => { setShowMenu(false); onDuplicate(persona.id); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Copy size={16} className="mr-2" /> Duplicate
              </button>
              <button onClick={() => { setShowMenu(false); onDelete(persona.id); }} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                <Trash size={16} className="mr-2" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 pb-24 md:pb-4">
        {/* Chat section */}
        <div className="flex-1 h-[calc(100vh-4rem)]">
          <Chat persona={persona} selectedConversationId={selectedConversationId} />
        </div>

        {/* Sidebars */}
        {activePanel === 'conversations' && (
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[70vh] md:h-auto z-20">
            <ConversationsPanel
              conversations={conversations}
              currentConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onCreateConversation={createNewConversation}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}

        {activePanel === 'details' && (
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[70vh] md:h-auto z-20">
            <DetailsPanel
              persona={persona}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* Functions sidebar */}
        {activePanel === 'functions' && (
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[70vh] md:h-auto z-20">
            <FunctionsPanel
              functions={functions}
              onAddFunction={() => setIsAddingFunction(true)}
              onEditFunction={setEditingFunction}
              onDeleteFunction={handleDeleteFunction}
              onToggleFunction={handleToggleFunction}
              onClose={() => setActivePanel(null)}
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