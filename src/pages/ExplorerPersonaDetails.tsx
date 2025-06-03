import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, StarOff, Eye, MessageSquare, Code, Info, Share2, Copy, Check, Book, MoreHorizontal, Menu, X } from 'lucide-react';
import { Persona } from '../types';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/AuthContext';
import { Chat } from '../components/Chat';
import { DetailsPanel } from '../components/DetailsPanel';
import { EmbedModal } from '../components/EmbedModal';
import { KnowledgePanel } from '../components/KnowledgePanel';
import { ConversationsPanel } from '../components/ConversationsPanel';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

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
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [creator, setCreator] = useState<{ email: string } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationsPanel, setShowConversationsPanel] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [publicPersona, setPublicPersona] = useState<Persona | null>(null);
  const navigate = useNavigate();

  // First try to find the persona in the user's personas
  let persona = personas.find(p => p.id === id);

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

  // If persona is not found in user's personas, fetch it from the database
  useEffect(() => {
    if (id && !persona) {
      fetchPublicPersona(id);
    }
  }, [id, persona]);

  const fetchPublicPersona = async (personaId: string) => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .eq('visibility', 'public')
        .single();

      if (error) throw error;
      
      if (data) {
        setPublicPersona({
          ...data,
          created: new Date(data.created_at),
          lastModified: new Date(data.updated_at)
        });
      }
    } catch (error) {
      console.error('Error fetching public persona:', error);
    }
  };

  useEffect(() => {
    if (user?.id && id) {
      loadConversations();
    } else {
      setConversations([]);
      setSelectedConversationId(undefined);
    } 
  }, [user?.id, id]);

  const loadConversations = async () => {
    if (!user?.id || !id) return;
    
    try {
      setIsLoadingConversations(true);
      
      // We need to fetch conversations for the current user with this persona, 
      // regardless of whether it's a public persona or the user's own persona
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('persona_id', id)
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

  // Use either the user's persona or the fetched public persona
  const displayPersona = persona || publicPersona;

  const handleShare = async () => {
    if (!displayPersona) return;
    
    const shareUrl = `${window.location.origin}/explore/personas/${displayPersona.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chat with ${displayPersona.name}`,
          text: displayPersona.description || `Check out this AI persona: ${displayPersona.name}`,
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

  if (!displayPersona) {
    // Show loading state instead of immediately redirecting
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only allow public personas to be viewed in explorer
  if (displayPersona && displayPersona.visibility !== 'public') {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white safe-top shadow-sm">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar
                src={getAvatarUrl(displayPersona)}
                name={displayPersona.name}
                size="sm"
              />
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-none">{displayPersona.name}</h1>
                {creator && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[180px] sm:max-w-none">by {creator.email}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span>{viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={14} />
                <span>Public</span>
              </div>
            </div>
            
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
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
                leftIcon={<Book size={16} />}
                onClick={() => setShowKnowledge(!showKnowledge)}
              >
                Knowledge
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Code size={16} />}
                onClick={() => setShowEmbedModal(true)}
              >
                Embed
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                leftIcon={isFavorited ? <Star size={16} className="text-amber-500" /> : <StarOff size={16} />}
              >
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
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
                leftIcon={<MessageSquare size={16} />}
                onClick={() => {
                  setShowConversationsPanel(!showConversationsPanel);
                  setShowMobileMenu(false);
                }}
                fullWidth
              >
                Conversations
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Info size={16} />}
                onClick={() => {
                  setShowDetails(!showDetails);
                  setShowMobileMenu(false);
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
                  setShowKnowledge(!showKnowledge);
                  setShowMobileMenu(false);
                }}
                fullWidth
              >
                Knowledge
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleToggleFavorite();
                  setShowMobileMenu(false);
                }}
                leftIcon={isFavorited ? <Star size={16} className="text-amber-500" /> : <StarOff size={16} />}
                fullWidth
              >
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Chat section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Chat
            persona={displayPersona}
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
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[80vh] md:h-auto z-20">
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
                      persona_id: displayPersona.id,
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
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[80vh] md:h-auto z-20">
            <DetailsPanel 
              persona={displayPersona}
              onClose={() => setShowDetails(false)}
            />
          </div>
        )}

        {/* Knowledge sidebar */}
        {showKnowledge && (
          <div className="fixed inset-x-0 bottom-0 md:static md:w-96 bg-white border-t md:border md:rounded-lg md:border-gray-200 md:shadow-sm overflow-hidden safe-bottom h-[80vh] md:h-auto z-20">
            <KnowledgePanel 
              personaId={displayPersona.id}
              onClose={() => setShowKnowledge(false)}
            />
          </div>
        )}

        {/* Embed Modal */}
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          personaId={displayPersona.id}
        />
      </div>
    </div>
  );
};

export default ExplorerPersonaDetails;