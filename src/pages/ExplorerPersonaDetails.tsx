import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, StarOff, Eye, MessageSquare, Code, Info } from 'lucide-react';
import { Persona } from '../types';
import { DEFAULT_PERSONA_AVATAR } from '../utils/constants';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { Chat } from '../components/Chat';
import { DetailsPanel } from '../components/DetailsPanel';
import { EmbedModal } from '../components/EmbedModal';
import { ConversationsPanel } from '../components/ConversationsPanel';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface ExplorerPersonaDetailsProps {
  personas: Persona[];
  onBack: () => void;
}

export const ExplorerPersonaDetails: React.FC<ExplorerPersonaDetailsProps> = ({
  personas,
  onBack,
}) => {
  const { user } = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [creator, setCreator] = useState<{ email: string } | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationsPanel, setShowConversationsPanel] = useState(false);

  const persona = personas.find(p => p.id === id);

  useEffect(() => {
    if (id && user?.id) {
      trackView();
      fetchStats();
      checkIfFavorited();
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (persona?.user_id) {
      fetchCreator();
    }
  }, [persona?.user_id]);

  useEffect(() => {
    if (user?.id && persona?.id) {
      loadConversations();
    } else {
      setConversations([]);
      setSelectedConversationId(undefined);
    } 
  }, [user?.id, persona?.id]);

  const loadConversations = async () => {
    try {
      if (!user?.id || !persona?.id) return;
      
      setIsLoadingConversations(true);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setConversations(data || []);
      
      // Only set the selected conversation after we have the data
      if (data && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchCreator = async () => {
    try {
      if (!persona?.user_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', persona.user_id)
        .single();

      if (error) throw error;
      setCreator(data);
    } catch (error) {
      console.error('Error fetching creator:', error);
      // Don't show the error to the user, just handle it gracefully
      setCreator({ email: 'Anonymous User' });
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
    if (!user?.id || !id) {
      navigate('/login');
      return;
    }

    try {
      const { data: toggled, error } = await supabase
        .rpc('toggle_persona_favorite', {
          persona_id_input: id
        });

      if (error) throw error;
      setIsFavorited(toggled);
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  if (!persona || persona.visibility !== 'public') {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <img
                  src={persona.avatar || DEFAULT_PERSONA_AVATAR}
                  alt={persona.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{persona.name}</h1>
                  {creator && (
                    <p className="text-sm text-gray-500">by {creator.email}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>{viewCount} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  <span>Public</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MessageSquare size={16} />}
                  onClick={() => setShowConversationsPanel(!showConversationsPanel)}
                >
                  Conversations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Info size={16} />}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Code size={16} />}
                  onClick={() => setShowEmbedModal(true)}
                >
                  Embed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                  leftIcon={isFavorited ? <Star size={16} className="text-amber-500" /> : <StarOff size={16} />}
                >
                  {isFavorited ? 'Favorited' : 'Add to Favorites'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Chat section */}
          <div className="flex-1">
            <Chat 
              persona={persona}
              isLoadingConversations={isLoadingConversations}
              selectedConversationId={selectedConversationId}
              showConversationsButton={user !== null}
              onToggleConversations={() => setShowConversationsPanel(!showConversationsPanel)} 
              onConversationSelect={(id) => {
                setSelectedConversationId(id);
                setShowConversationsPanel(false);
              }}
            />
          </div>

          {/* Conversations Panel */}
          {showConversationsPanel && (
            <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom">
              <ConversationsPanel
                conversations={conversations}
                currentConversationId={selectedConversationId}
                onSelectConversation={(id) => {
                  setSelectedConversationId(id);
                  setShowConversationsPanel(false);
                }}
                onCreateConversation={async () => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  try {
                    const { data, error } = await supabase
                      .from('conversations')
                      .insert({
                        persona_id: persona.id,
                        title: 'New Conversation',
                        user_id: user.id
                      })
                      .select()
                      .single();

                    if (error) throw error;
                    setConversations([data, ...conversations]);
                    setSelectedConversationId(data.id);
                    setShowConversationsPanel(false);
                  } catch (error) {
                    console.error('Error creating conversation:', error);
                  }
                }}
                onRenameConversation={async (id, newTitle) => {
                  try {
                    const { error } = await supabase
                      .from('conversations')
                      .update({ title: newTitle })
                      .eq('id', id);

                    if (error) throw error;
                    await loadConversations();
                  } catch (error) {
                    console.error('Error renaming conversation:', error);
                  }
                }}
                onDeleteConversation={async (id) => {
                  try {
                    const { error } = await supabase
                      .from('conversations')
                      .delete()
                      .eq('id', id);

                    if (error) throw error;
                    await loadConversations();
                    if (selectedConversationId === id) {
                      setSelectedConversationId(undefined);
                    }
                  } catch (error) {
                    console.error('Error deleting conversation:', error);
                  }
                }}
                onClose={() => setShowConversationsPanel(false)}
              />
            </div>
          )}

          {/* Details sidebar */}
          {showDetails && (
            <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom">
              <DetailsPanel
                persona={persona}
                onClose={() => setShowDetails(false)}
              />
            </div>
          )}

          {/* Embed Modal */}
          <EmbedModal
            isOpen={showEmbedModal}
            onClose={() => setShowEmbedModal(false)}
            personaId={persona.id}
          />
        </div>
      </div>
    </div>
  );
};

export default ExplorerPersonaDetails;