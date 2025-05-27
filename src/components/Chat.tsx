import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Loader2,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Image,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Persona } from '../types';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Avatar } from './ui/Avatar';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { ConversationsPanel } from './ConversationsPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { getVoiceForPersona, getSpeechSpeed, getSpeechPitch } from '../lib/speechSynthesis';
import ChatMessage from './chat/ChatMessage';
import ChatHeader from './chat/ChatHeader';
import ChatInput from './chat/ChatInput';
import ChatSuggestions from './chat/ChatSuggestions';
import { useAudioPlayback } from '../hooks/useAudioPlayback';

interface ChatProps {
  persona: Persona;
  selectedConversationId?: string;
  isLoadingConversations?: boolean;
  showConversationsButton?: boolean;
  onToggleConversations?: () => void;
  onConversationSelect?: (id: string) => void;
}

const MAX_CONTEXT_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2000;
const TOKEN_WARNING_THRESHOLD = 5000;

const estimateTokens = (text: string): number => {
  const words = text.trim().split(/\s+/);
  return Math.ceil(words.length * 1.3);
};

export const Chat: React.FC<ChatProps> = ({
  persona,
  selectedConversationId,
  isLoadingConversations = false,
  showConversationsButton = false,
  onToggleConversations,
  onConversationSelect,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [functions, setFunctions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokenWarning, setTokenWarning] = useState<string | null>(null);
  const [canClaimTrial, setCanClaimTrial] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(selectedConversationId);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const lastPlayedMessageRef = useRef<string | null>(null);
  const [transcript, setTranscriptState] = useState('');

  const {
    isSpeaking,
    audioEnabled,
    toggleAudio,
    speakText,
    stopSpeaking
  } = useAudioPlayback(persona);

  const {
    transcript: speechTranscript,
    resetTranscript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    isSpeechSupported,
    error: speechError
  } = useSpeechRecognition({
    continuous: true,
    language: 'en-US'
  });

  useEffect(() => {
    console.log('Speech recognition supported in browser:', browserSupportsSpeechRecognition);
    console.log('Speech recognition supported in hook:', isSpeechSupported);
    console.log('SpeechRecognition in window:', 'SpeechRecognition' in window);
    console.log('webkitSpeechRecognition in window:', 'webkitSpeechRecognition' in window);
  }, [browserSupportsSpeechRecognition, isSpeechSupported]);

  useEffect(() => {
    if (speechTranscript) {
      setTranscriptState(speechTranscript);
      setInput(speechTranscript);
    }
  }, [transcript]);

  // Helper function to play audio for a specific message
  const playMessageAudio = async (text: string) => {
    if (audioEnabled && text) {
      await speakText(text);
    } else if (!audioEnabled) {
      // If audio is disabled, enable it first then play
      toggleAudio();
      await speakText(text);
    }
  };
  
  useEffect(() => {
    if (speechError) {
      setTranscriptError(speechError);
      setTimeout(() => setTranscriptError(null), 5000);
    }
  }, [speechError]);

  const [firstRender, setFirstRender] = useState(false);

  useEffect(() => {
    setFirstRender(true);
  }, []);

  useEffect(() => {
    // Only run this effect when messages change and audio is enabled
    if (!audioEnabled || !messages.length) return;
    
    try {
      const lastMessage = messages[messages.length - 1];
      
      // Check if this is a new message that hasn't been played yet
      if (lastMessage?.role === 'assistant' && 
          !lastMessage.isLoading && 
          lastMessage.id !== lastPlayedMessageRef.current && 
          !isLoading) {
        
        // Mark this message as played
        lastPlayedMessageRef.current = lastMessage.id;
        
        // Extract text content from markdown
        const textContent = lastMessage.content.replace(/!\[.*?\]\(.*?\)/g, '').trim();
        if (textContent) {
          speakText(textContent);
        }
      }
    } catch (err) {
      console.error('Error playing message audio:', err);
    }
  }, [messages, isLoading, audioEnabled]);

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
      console.log('Stopping voice input');
      setIsListening(false);
    } else {
      resetTranscript();
      console.log('Starting voice input');
      startListening();
      setIsListening(true);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    setCurrentConversationId(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: canClaim, error } = await supabase.rpc(
            'can_claim_free_trial',
            { user_id_input: user.id }
          );

          if (error) throw error;
          setCanClaimTrial(canClaim);
        }
      } catch (error) {
        console.error('Error checking trial status:', error);
      }
    };
    getCurrentUser();
  }, []);

  const handleClaimTrial = async () => {
    if (!user) return;

    setClaimingTrial(true);
    try {
      const { data: claimed, error } = await supabase.rpc('claim_free_trial', {
        user_id_input: user.id,
      });

      if (error) throw error;

      if (claimed) {
        setCanClaimTrial(false);
        setError(null);
        setTokenWarning(null);
      }
    } catch (error) {
      console.error('Error claiming trial:', error);
      setError('Failed to claim free trial. Please try again.');
    } finally {
      setClaimingTrial(false);
    }
  };

  useEffect(() => {
    loadConversations();
    fetchFunctions();
    setIsPublicView(window.location.pathname.startsWith('/explore/personas/'));
  }, [persona.id]);

  const fetchFunctions = async () => {
    try {
      const { data, error } = await supabase
        .from('persona_functions')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunctions(data || []);
    } catch (error) {
      console.error('Error fetching functions:', error);
    }
  };

  useEffect(() => {
    if (selectedConversationId) {
      loadChatHistory(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadChatHistory = async (conversationId: string) => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const title = input.length > 30 ? `${input.slice(0, 30)}...` : input;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          persona_id: persona.id,
          title,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setConversations([data, ...conversations]);
      setMessages([]);
      setTokenWarning(null);
      setCurrentConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const handleRenameConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editTitle })
        .eq('id', conversationId);

      if (error) throw error;

      await loadConversations();
      setEditingConversation(null);
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      await loadConversations();
      if (currentConversationId === conversationId) {
        setMessages([]);
        setTokenWarning(null);
        setCurrentConversationId(undefined);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`
      );
    } else {
      setInput(value);
      setError(null);
    }
  };

  const getRecentMessages = (allMessages: any[]) => {
    return allMessages.slice(-MAX_CONTEXT_MESSAGES);
  };

  const calculateTotalTokens = (
    messages: any[],
    newMessage: string
  ): number => {
    const systemPrompt = `You are an AI assistant with the following characteristics:
- Personality traits: ${persona.personality?.join(', ') || 'helpful, friendly'}
- Knowledge areas: ${persona.knowledge?.join(', ') || 'general knowledge'}
- Communication style: ${persona.tone || 'neutral'}`;

    const allText =
      messages.map((m) => m.content).join(' ') + newMessage + systemPrompt;
    return estimateTokens(allText);
  };

  const containsImageRequest = (message: string): boolean => {
    const imageKeywords = [
      'generate an image',
      'create an image',
      'make an image',
      'draw',
      'create a picture',
      'generate a picture',
      'visualize',
      'show me',
      'create art',
      'design',
      'illustrate',
      'paint',
      'render',
    ];
    return imageKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop any ongoing speech when sending a new message
    stopSpeaking();

    if (!user) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    const userContent = input.trim();

    if (userContent.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`
      );
      return;
    }

    const recentMessages = getRecentMessages(messages);
    const totalTokens = estimateTokens(
      recentMessages.map((m) => m.content).join(' ') + ' ' + userContent
    );

    if (totalTokens > TOKEN_WARNING_THRESHOLD) {
      setTokenWarning(
        'Approaching message limit. Consider starting a new conversation.'
      );
    } else {
      setTokenWarning(null);
    }

    setInput('');
    setIsLoading(true);
    setError(null);

    if (!currentConversationId || messages.length === 0) {
      try {
        const title =
          userContent.length > 30
            ? `${userContent.slice(0, 30)}...`
            : userContent;

        const { data, error } = await supabase
          .from('conversations')
          .insert({
            persona_id: persona.id,
            title,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setConversations([data, ...conversations]);
        setMessages([]);
        setTokenWarning(null);
        setCurrentConversationId(data.id);
        if (onConversationSelect) {
          onConversationSelect(data.id);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        setError('Failed to create new conversation');
        setIsLoading(false);
        return;
      }
    }

    try {
      const tempUserMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: currentConversationId,
        role: 'user',
        content: userContent,
        persona_id: persona.id,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      const tempLoadingMessage = {
        id: 'loading-' + Date.now(),
        conversation_id: currentConversationId,
        role: 'assistant',
        content: '...',
        persona_id: persona.id,
        created_at: new Date().toISOString(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, tempLoadingMessage]);

      const isImageRequest = containsImageRequest(userContent);
      if (isImageRequest) {
        setIsGeneratingImage(true);
        setImageGenerationProgress('Analyzing request...');
      }

      try {
        // Only try to save message if we have a conversation ID
        if (currentConversationId) {
          const { data: savedUserMessage, error: insertError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              role: 'user',
              content: userContent || 'Empty message',
              persona_id: persona.id,
            })
            .select()
            .single();

          if (insertError) throw insertError;
        }

        if (isImageRequest) {
          setImageGenerationProgress('Crafting image prompt...');
        }

        const currentMessages =
          recentMessages.length === 0
            ? [{ role: 'user', content: userContent }]
            : [
                ...recentMessages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
                { role: 'user', content: userContent },
              ];

        const knowledge = persona.knowledge?.length
          ? persona.knowledge
          : ['general knowledge'];
        const personality = persona.personality?.length
          ? persona.personality
          : ['helpful', 'friendly'];
        const tone = persona.tone || 'neutral';

        console.log('Sending chat request with data:', {
          messages: currentMessages,
          personaId: persona.id,
          personality,
          knowledge,
          tone,
          functions: functions.map(f => ({
            name: f.name,
            description: f.description,
            code: f.code
          })),
          userId: user.id,
          tokensNeeded: totalTokens
        });

        if (isImageRequest) {
          setImageGenerationProgress('Generating image...');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              messages: currentMessages,
              personaId: persona.id,
              personality,
              knowledge,
              tone,
              functions: functions.map(f => ({
                name: f.name,
                description: f.description,
                code: f.code
              })),
              userId: user.id,
              tokensNeeded: totalTokens
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMessages((prev) => prev.filter((m) => !m.isLoading));

          const content = data.imageUrl
            ? `![Generated Image](${data.imageUrl})\n\n${data.message || 'Image generated successfully'}`
            : data.message || 'No response received';

          const { error: assistantError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              role: 'assistant',
              content,
              persona_id: persona.id,
            });

          if (assistantError) throw assistantError;

          await loadChatHistory(currentConversationId);
          
          // Play audio for the new assistant message if audio is enabled
          if (audioEnabled && data.message) {
            await playMessageAudio(data.message);
          }
        } else {
          if (data.error === 'Token limit exceeded') {
            setError('Message limit reached. Please start a new conversation.');
            setTokenWarning(null);
          } else {
            throw new Error(data.error || 'Failed to get response');
          }
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        setMessages((prev) => prev.filter((m) => !m.isLoading));

        const errorMessage =
          error.message || 'An error occurred while processing your request';
        setError(errorMessage);

        if (currentConversationId) {
          await supabase.from('chat_messages').insert({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${errorMessage}`,
            persona_id: persona.id,
          });

          await loadChatHistory(currentConversationId);
        }
      }
    } catch (error: any) {
      console.error('Error handling message:', error);
      setError('Failed to process message');
      setMessages((prev) =>
        prev.filter(
          (m) => !m.id.startsWith('temp-') && !m.id.startsWith('loading-')
        )
      );
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const generateSuggestions = async () => {
    if (!messages.length) {
      setSuggestions([
        `Tell me about your expertise in ${
          persona.knowledge?.[0] || 'your field'
        }`,
        'What can you help me with?',
        `How would you approach a problem in ${
          persona.knowledge?.[0] || 'your area of expertise'
        }?`
      ]);
      return;
    }

    const recentMessages = getRecentMessages(messages);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: recentMessages,
            personaId: persona.id,
            personality: persona.personality,
            knowledge: persona.knowledge,
            tone: persona.tone
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([
        'Can you explain that in more detail?',
        'What are the next steps?',
        'Could you provide an example?'
      ]);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isExpanded ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <ChatHeader
        audioEnabled={audioEnabled}
        toggleAudio={toggleAudio}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-20"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            persona={persona}
            isSpeaking={isSpeaking}
            copiedMessageId={copiedMessageId}
            setCopiedMessageId={setCopiedMessageId}
            speakText={speakText}
            stopSpeaking={stopSpeaking}
            setError={setError}
          />
        ))}

        {isGeneratingImage && (
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{imageGenerationProgress}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center space-x-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {tokenWarning && (
          <div className="flex items-center justify-center space-x-2 text-yellow-500">
            <AlertCircle className="w-4 h-4" />
            <span>{tokenWarning}</span>
          </div>
        )}

        {canClaimTrial && (
          <div className="flex flex-col items-center justify-center p-4 space-y-2 bg-blue-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <p className="text-center text-sm">
              Try our service for free! Claim your trial now.
            </p>
            <Button
              onClick={handleClaimTrial}
              disabled={claimingTrial}
              className="w-full sm:w-auto"
            >
              {claimingTrial ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Claiming trial...
                </>
              ) : (
                'Claim Free Trial'
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-md">
        <div className="relative">
          <ChatInput
            input={input}
            setInput={setInput}
            handleInputChange={handleInputChange}
            transcript={transcript}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
            audioEnabled={audioEnabled}
            toggleAudio={toggleAudio}
            isListening={isListening}
            toggleVoiceInput={toggleVoiceInput}
            browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
            transcriptError={transcriptError}
            generateSuggestions={generateSuggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <ChatSuggestions
              suggestions={suggestions}
              onSuggestionClick={(suggestion: string) => {
                setInput(suggestion);
                setShowSuggestions(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;