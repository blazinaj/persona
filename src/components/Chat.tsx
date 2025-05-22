import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Loader2,
  MessageSquare,
  List,
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
} from 'lucide-react';
import { Persona } from '../types';
import { DEFAULT_PERSONA_AVATAR } from '../utils/constants';
import { Markdown } from './ui/Markdown';
import { Avatar } from './ui/Avatar';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { ConversationsPanel } from './ConversationsPanel';

interface ChatProps {
  persona: Persona;
  selectedConversationId?: string;
  isLoadingConversations?: boolean;
  showConversationsButton?: boolean;
  onToggleConversations?: () => void;
  onConversationSelect?: (id: string) => void;
}

interface Integration {
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
}

const MAX_CONTEXT_MESSAGES = 10; // Maximum number of previous messages to include
const MAX_MESSAGE_LENGTH = 2000; // Maximum length of a single message
const TOKEN_WARNING_THRESHOLD = 5000; // Show warning when approaching token limit

// Rough token estimation (4 chars per token on average)
const estimateTokens = (text: string): number => {
  const words = text.trim().split(/\s+/);
  return Math.ceil(words.length * 1.3); // Average of 1.3 tokens per word
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
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [functions, setFunctions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokenWarning, setTokenWarning] = useState<string | null>(null);
  const [canClaimTrial, setCanClaimTrial] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] =
    useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(selectedConversationId);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingConversation, setEditingConversation] = useState<string | null>(
    null
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      // Validate URL
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Invalid image URL');
      }

      // First try to fetch with CORS mode
      let response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          Accept: 'image/*',
        },
      });

      // If CORS fails, try no-cors mode as fallback
      if (!response.ok && response.type === 'opaque') {
        response = await fetch(imageUrl, {
          mode: 'no-cors',
          headers: {
            Accept: 'image/*',
          },
        });
      }

      if (!response.ok && response.status !== 0) {
        // Status 0 is returned for successful no-cors requests
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type if available
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        throw new Error('Invalid content type: Expected an image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get file extension from content type or URL
      const extension = contentType ? contentType.split('/')[1] : 'png';
      link.download = `generated-image-${Date.now()}.${extension}`;

      // Append link, trigger download, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Image download error:', err);
      let errorMessage = 'Failed to download image';

      // Provide more specific error messages
      if (err.message.includes('Invalid image URL')) {
        errorMessage = 'Invalid image URL provided';
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Failed to fetch image: ${err.message}`;
      } else if (err.message.includes('Invalid content type')) {
        errorMessage = 'Invalid file type: Expected an image';
      }

      setError(errorMessage);
    }
  };

  // Update currentConversationId when selectedConversationId changes
  useEffect(() => {
    setCurrentConversationId(selectedConversationId);
  }, [selectedConversationId]);

  // Handle keyboard shortcuts for fullscreen
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
    // Get the current user
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Check if user can claim trial
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
    loadIntegrations();
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

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('is_active', true);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
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
      // Set initial title based on first message
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
    // Get the most recent messages up to MAX_CONTEXT_MESSAGES
    return allMessages.slice(-MAX_CONTEXT_MESSAGES);
  };

  // Calculate total tokens for the conversation
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

    // If not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    const userContent = input.trim();

    if (userContent.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`
      );
      return;
    }

    // Calculate total tokens including the new message
    const recentMessages = getRecentMessages(messages);
    const totalTokens = estimateTokens(
      recentMessages.map((m) => m.content).join(' ') + ' ' + userContent
    );

    // Show warning if approaching token limit
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

    // Always create a new conversation for first interaction
    if (!currentConversationId || messages.length === 0) {
      try {
        // Set initial title based on first message
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
      // Add user message immediately to UI
      const tempUserMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: currentConversationId,
        role: 'user',
        content: userContent,
        persona_id: persona.id,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Add temporary loading message
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

      // Check if this is an image generation request
      const isImageRequest = containsImageRequest(userContent);
      if (isImageRequest) {
        setIsGeneratingImage(true);
        setImageGenerationProgress('Analyzing request...');
      }

      try {
        // Insert user message
        const { data: savedUserMessage, error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConversationId,
            role: 'user',
            content: userContent || 'Empty message', // Provide default content if empty
            persona_id: persona.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (isImageRequest) {
          setImageGenerationProgress('Crafting image prompt...');
        }

        // Get recent messages for context
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

        // Log request data for debugging
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
          tokensNeeded: totalTokens,
          integrations: integrations.map((i) => ({
            name: i.name,
            description: i.description,
            endpoint: i.endpoint,
            method: i.method,
            headers: i.headers,
            parameters: i.parameters,
          })),
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
              tokensNeeded: totalTokens,
              integrations:
                integrations.length > 0
                  ? integrations.map((i) => ({
                      name: i.name,
                      description: i.description,
                      endpoint: i.endpoint,
                      method: i.method,
                      headers: i.headers,
                      parameters: i.parameters,
                    }))
                  : [],
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Remove temporary loading message
          setMessages((prev) => prev.filter((m) => !m.isLoading));

          // Handle image generation response
          const content = data.imageUrl
            ? `![Generated Image](${data.imageUrl})\n\n${data.message || 'Image generated successfully'}`
            : data.message || 'No response received';

          // Insert assistant response
          const { error: assistantError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              role: 'assistant',
              content, // Ensure content is never null
              persona_id: persona.id,
            });

          if (assistantError) throw assistantError;

          // Reload messages to get the new response
          await loadChatHistory(currentConversationId);
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
        // Remove temporary loading message
        setMessages((prev) => prev.filter((m) => !m.isLoading));

        const errorMessage =
          error.message || 'An error occurred while processing your request';
        setError(errorMessage);

        // Insert error message if we have a valid conversation ID
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
      // Remove temporary messages
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

  // Generate suggestions based on conversation context
  const generateSuggestions = async () => {
    if (!messages.length) {
      // Default suggestions for new conversations
      setSuggestions([
        `Tell me about your expertise in ${
          persona.knowledge?.[0] || 'your field'
        }`,
        'What can you help me with?',
        `How would you approach ${
          persona.personality?.[0] || 'different'
        } situations?`,
      ]);
      return;
    }

    try {
      // Don't make the API call if we don't have a user
      if (!user?.id) {
        setSuggestions([
          'Could you elaborate on that?',
          'What are your thoughts on this?',
          'Tell me more about your perspective',
        ]);
        return;
      }

      const recentMessages = messages.slice(-3); // Get last 3 messages for context
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              ...recentMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              {
                role: 'user',
                content:
                  'Based on our conversation, suggest 3 relevant follow-up questions or prompts. Respond with just the suggestions separated by |',
              },
            ],
            personaId: persona.id,
            personality: persona.personality || ['helpful', 'friendly'],
            knowledge: persona.knowledge || ['general knowledge'],
            tone: persona.tone || 'neutral',
            functions: functions.map(f => ({
              name: f.name,
              description: f.description,
              code: f.code
            })),
            userId: user.id,
            tokensNeeded: 100, // Small token count for suggestions
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.message) {
        setSuggestions(data.message.split('|').map((s: string) => s.trim()));
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        'Could you elaborate on that?',
        'What are your thoughts on this?',
        'Tell me more about your perspective',
      ]);
    }
  };

  // Update suggestions when messages change
  useEffect(() => {
    if (!isLoading) {
      generateSuggestions();
    }
  }, [messages, isLoading]);

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    loadChatHistory(conversationId);
    setShowConversations(false);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] md:h-[calc(100dvh-10rem)] bg-white">
      {/* Scrollable Message Container */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 transition-all duration-300 ease-in-out min-h-0 ${
          isExpanded ? 'bg-gray-50' : ''
        } ${(isLoadingHistory || isLoadingConversations) ? 'opacity-50' : ''}`}
      >
        {(isLoadingHistory || isLoadingConversations) && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isLoadingConversations
                  ? 'Loading conversations...'
                  : 'Loading chat history...'}
              </span>
            </div>
          </div>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <MessageSquare size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Start a Conversation
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Begin chatting with {persona.name} to experience their unique
              personality and knowledge.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fadeIn max-w-[85%] md:max-w-[75%] ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role !== 'user' && (
              <Avatar
                src={persona.avatar || DEFAULT_PERSONA_AVATAR}
                name={persona.name}
                size="sm"
              />
            )}
            <div className="relative group w-full">
              <div
                className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                } ${message.isLoading ? 'animate-pulse' : ''}`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : message.role === 'assistant' ? (
                  <Markdown
                    content={message.content}
                    className={
                      message.role === 'user' ? 'text-white prose-invert' : ''
                    }
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {!message.isLoading && message.role === 'assistant' && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm p-1">
                  <button
                    onClick={() =>
                      handleCopyMessage(message.content, message.id)
                    }
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} className="text-gray-500" />
                    )}
                  </button>
                  {message.content.includes('![Generated Image]') && (
                    <button
                      onClick={() => {
                        const imageUrl = message.content.match(
                          /!\[Generated Image\]\((.*?)\)/
                        )?.[1];
                        if (imageUrl) handleDownloadImage(imageUrl);
                      }}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Download image"
                    >
                      <Download size={14} className="text-gray-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <Avatar src={undefined} name="You" size="sm" />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            {isGeneratingImage ? (
              <div className="flex items-center gap-2">
                <Image className="w-4  h-4 animate-pulse text-blue-500" />
                <span className="text-blue-600">
                  {imageGenerationProgress}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Fixed Input Area */}
      <div className="border-t border-gray-200  bg-white p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {tokenWarning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
            <AlertCircle size={16} />
            <p className="text-sm">{tokenWarning}</p>
          </div>
        )}
        {canClaimTrial && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-2 text-blue-700">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <p className="text-sm">
                Try our premium features with a free trial!
              </p>
            </div>
            <Button
              onClick={handleClaimTrial}
              disabled={claimingTrial}
              className="text-sm"
            >
              {claimingTrial ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Claiming...
                </>
              ) : (
                'Claim Trial'
              )}
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="w-full p-3 pr-24 rounded-lg border border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </form>
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(suggestion);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};