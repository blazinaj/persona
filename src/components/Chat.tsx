import React, { useRef, useEffect, useState, useContext } from 'react';
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
  Circle,
  ArrowRight,
  Book,
  FileText,
  Lock,
  Shield,
  Key
} from 'lucide-react';
import { Persona } from '../types';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Avatar } from './ui/Avatar';
import { ConversationsPanel } from './ConversationsPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { getVoiceForPersona, getSpeechSpeed, getSpeechPitch } from '../lib/speechSynthesis';
import ChatMessage from './chat/ChatMessage';
import ChatHeader from './chat/ChatHeader';
import ChatInput from './chat/ChatInput';
import ChatSuggestions from './chat/ChatSuggestions';
import ChatStatus from './chat/ChatStatus';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { supabase } from '../lib/supabase';
import { isPDFRequest, extractDocumentSections, generatePDFReport } from '../utils/pdfHelpers';
import { 
  encryptMessage, 
  decryptMessage, 
  isEncryptionEnabled, 
  getEncryptionKey, 
  hasEncryptionKey,
  isEncryptedMessage
} from '../utils/encryptionUtils';
import EncryptionBanner from './EncryptionBanner';
import EncryptionSetupModal from './EncryptionSetupModal';

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

// Check if message contains image request
const containsImageRequest = (message: string): boolean => {
  const imageKeywords = [
    'generate an image',
    'create an image',
    'make an image',
    'draw',
    'create a picture',
    'generate a picture',
    'make a picture',
    'visualize',
    'show me',
    'create art',
    'design',
    'illustrate',
    'paint',
    'render'
  ];
  
  const message_lower = message.toLowerCase();
  
  // Check for direct matches
  if (imageKeywords.some(keyword => message_lower.includes(keyword))) {
    return true;
  }
  
  // Check for implied image requests
  const impliedPatterns = [
    /how .* looks?/i,
    /can .* visual/i,
    /create .* scene/i,
    /make .* look like/i,
    /generate .* visual/i
  ];
  
  return impliedPatterns.some(pattern => pattern.test(message));
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
  const [showInteractiveHints, setShowInteractiveHints] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(selectedConversationId);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const lastPlayedMessageRef = useRef<string | null>(null);
  const [transcript, setTranscriptState] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isScrollingRef = useRef(false);
  const [relevantKnowledge, setRelevantKnowledge] = useState<any[]>([]);
  
  // Encryption state
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);

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

  // Scroll to bottom on initial load and when new messages are added
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    // Smooth scroll to bottom when messages change
    if (autoScroll && !isScrollingRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages]);

  // Set up scroll event listener to detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      scrollPositionRef.current = scrollTop;
      
      // Consider "scrolled to bottom" if within 100px of the bottom
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isScrolledToBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Scroll to bottom when component mounts or when returning to the chat
  useEffect(() => {
    scrollToBottom('auto');
    
    // Also scroll to bottom when the window is resized
    const handleResize = () => {
      if (autoScroll) {
        scrollToBottom('auto');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Function to scroll to the bottom of the chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!messagesContainerRef.current) return;
    
    try {
      isScrollingRef.current = true;
      
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ 
          behavior, 
          block: 'end' 
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      
      // Reset the scrolling flag after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, behavior === 'smooth' ? 300 : 0);
      
      setAutoScroll(true);
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
      isScrollingRef.current = false;
    }
  };

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
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Process messages - decrypt if encrypted and we have the key
      const processedMessages = await processMessages(data || []);
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setEncryptionError("Some messages may be encrypted. Enter your encryption key to view them.");
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Process messages for encryption/decryption
  const processMessages = async (messages: any[]): Promise<any[]> => {
    // If encryption is not enabled, return the messages as-is
    if (!isEncryptionEnabled()) {
      return messages;
    }
    
    // Get encryption key from session storage
    const key = getEncryptionKey();
    if (!key) {
      // If we don't have the key, mark encrypted messages
      return messages.map(msg => {
        if (isEncryptedMessage(msg.content)) {
          return {
            ...msg,
            isEncrypted: true,
            originalContent: msg.content,
            content: "[Encrypted message - enter your key to view]"
          };
        }
        return msg;
      });
    }
    
    // If we have the key, try to decrypt encrypted messages
    return messages.map(msg => {
      try {
        if (isEncryptedMessage(msg.content)) {
          const decrypted = decryptMessage(msg.content, key);
          return {
            ...msg,
            wasEncrypted: true,
            content: decrypted
          };
        }
        return msg;
      } catch (e) {
        // If decryption fails, mark the message
        return {
          ...msg,
          isEncrypted: true,
          originalContent: msg.content,
          content: "[Encrypted message - unable to decrypt. Check your encryption key.]"
        };
      }
    });
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

  // Function to fetch relevant knowledge entries for a query
  const fetchRelevantKnowledge = async (query: string) => {
    if (!query || !persona.id) return [];
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-retrieval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            personaId: persona.id,
            query: query
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Knowledge retrieval failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.entries || [];
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage(input);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Stop any ongoing speech when sending a new message
    stopSpeaking();

    if (!user) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    const userContent = messageText.trim();

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
    setEncryptionError(null);
    
    let conversationId = currentConversationId;

    // Create a new conversation if we don't have one yet
    if (!conversationId) {
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
        setTokenWarning(null);
        conversationId = data.id;
        setCurrentConversationId(conversationId);
        if (onConversationSelect) {
          onConversationSelect(conversationId);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        setError('Failed to create new conversation');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Encrypt the message if encryption is enabled and key is available
      let contentToSend = userContent;
      const isEncrypted = isEncryptionEnabled() && hasEncryptionKey();
      
      if (isEncrypted) {
        const key = getEncryptionKey();
        if (key) {
          contentToSend = encryptMessage(userContent, key);
          console.log('Message encrypted');
        } else {
          setEncryptionError("Encryption is enabled but key is not available. Message will not be encrypted.");
        }
      }
      
      // Add optimistic user message with real content for display
      const tempUserMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: conversationId,
        role: 'user',
        content: userContent, // Show unencrypted for display
        persona_id: persona.id,
        created_at: new Date().toISOString(),
        wasEncrypted: isEncrypted
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      const tempLoadingMessage = {
        id: 'loading-' + Date.now(),
        conversation_id: conversationId,
        role: 'assistant',
        content: '...',
        persona_id: persona.id,
        created_at: new Date().toISOString(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, tempLoadingMessage]);

      const isImageRequest = containsImageRequest(userContent);
      const isPdfRequest = isPDFRequest(userContent);
      
      if (isImageRequest) {
        setIsGeneratingImage(true);
        setImageGenerationProgress('Analyzing request...');
      }
      
      if (isPdfRequest) {
        setImageGenerationProgress('Preparing document content...');
      }

      // Fetch relevant knowledge entries for this query
      const knowledgeEntries = await fetchRelevantKnowledge(userContent);
      setRelevantKnowledge(knowledgeEntries);

      try {
        // Only try to save message if we have a conversation ID
        if (conversationId) {
          const { data: savedUserMessage, error: insertError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              role: 'user',
              content: contentToSend, // Save encrypted content
              persona_id: persona.id,
            })
            .select()
            .single();

          if (insertError) throw insertError;
        }

        if (isImageRequest) {
          setImageGenerationProgress('Crafting image prompt...');
        }
        
        if (isPdfRequest) {
          setImageGenerationProgress('Creating document...');
        }

        const currentMessages =
          recentMessages.length === 0
            ? [{ role: 'user', content: userContent }]
            : [
                ...recentMessages.map((m) => {
                  // Decrypt messages if needed for the API request
                  let content = m.content;
                  if (m.wasEncrypted && hasEncryptionKey()) {
                    try {
                      const key = getEncryptionKey()!;
                      content = decryptMessage(m.originalContent || m.content, key);
                    } catch (e) {
                      console.error('Error decrypting message:', e);
                      content = m.content; // Use displayed content as fallback
                    }
                  }
                  return {
                    role: m.role,
                    content: content,
                  };
                }),
                { role: 'user', content: userContent },
              ];

        const knowledge = persona.knowledge?.length
          ? persona.knowledge
          : ['general knowledge'];
        const personality = persona.personality?.length
          ? persona.personality
          : ['helpful', 'friendly'];
        // FIX: Explicitly check for empty string and use default 'neutral' tone
        const tone = persona.tone && persona.tone.trim() !== '' 
          ? persona.tone 
          : 'neutral';

        console.log('Sending chat request with data:', {
          messages: currentMessages,
          personaId: persona.id,
          personality,
          knowledge,
          tone,
          instructions: persona.instructions,
          knowledgeEntries,
          functions: functions.map(f => ({
            name: f.name,
            description: f.description,
            code: f.code
          })),
          userId: user.id,
          tokensNeeded: totalTokens,
          generatePdf: isPdfRequest
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
              instructions: persona.instructions,
              knowledgeEntries,
              functions: functions.map(f => ({
                name: f.name,
                description: f.description,
                code: f.code
              })),
              userId: user.id,
              tokensNeeded: totalTokens,
              generatePdf: isPdfRequest
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMessages((prev) => prev.filter((m) => !m.isLoading));

          // Get the response content and encrypt it if needed
          let content = data.imageUrl
            ? `![Generated Image](${data.imageUrl})\n\n${data.message || 'Image generated successfully'}`
            : data.pdfUrl
            ? `I've created a PDF document for you based on your request.\n\n${data.pdfUrl}\n\n${data.message || 'Document generated successfully'}`
            : data.message || 'No response received';
            
          let contentToSave = content;
          
          // Encrypt the response if encryption is enabled and key is available
          if (isEncryptionEnabled() && hasEncryptionKey()) {
            try {
              const key = getEncryptionKey()!;
              contentToSave = encryptMessage(content, key);
              console.log('Response encrypted');
            } catch (e) {
              console.error('Error encrypting response:', e);
              setEncryptionError("Failed to encrypt response. Message will be stored unencrypted.");
            }
          }

          const { error: assistantError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: contentToSave,
              persona_id: persona.id,
            });

          if (assistantError) throw assistantError;

          // Reload chat history to get properly encrypted/decrypted messages
          await loadChatHistory(conversationId);
          
          // Play audio for the new assistant message if audio is enabled
          if (audioEnabled && data.message) {
            await speakText(data.message);
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

        if (conversationId) {
          await supabase.from('chat_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${errorMessage}`,
            persona_id: persona.id,
          });

          await loadChatHistory(conversationId);
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

  const generateSuggestions = async () => {
    if (!messages.length) {
      setSuggestions([
        `Tell me about your expertise in ${persona.knowledge?.[0] || 'your field'}`,
        'What can you help me with?',
        `How would you approach a problem in ${persona.knowledge?.[0] || 'your area of expertise'}?`
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
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        persona={persona} 
        onSetupEncryption={() => setShowEncryptionSetup(true)}
        onUnlockEncryption={() => setShowEncryptionSetup(true)}
      />
      
      <EncryptionBanner
        onSetupEncryption={() => setShowEncryptionSetup(true)}
        onUnlockEncryption={() => setShowEncryptionSetup(true)}
      />
      
      {encryptionError && (
        <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle size={16} />
          <div className="flex-1">
            <p>{encryptionError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Key size={14} />}
            onClick={() => setShowEncryptionSetup(true)}
          >
            Enter Key
          </Button>
        </div>
      )}
      
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 pb-24 md:pb-20 scroll-smooth"
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
            onSendMessage={sendMessage}
          />
        ))}

        <ChatStatus
          error={error}
          tokenWarning={tokenWarning}
          isGeneratingImage={isGeneratingImage}
          imageGenerationProgress={imageGenerationProgress}
          canClaimTrial={canClaimTrial}
          claimingTrial={claimingTrial}
          handleClaimTrial={async () => {
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
            } finally {
              setClaimingTrial(false);
            }
          }}
        />
        
        {/* Invisible element at the end for scrolling reference */}
        <div ref={lastMessageRef} className="h-0.5 w-full" />
        
        {!autoScroll && messages.length > 0 && (
          <div className="sticky bottom-0 flex justify-center mb-2">
            <button
              onClick={() => {
                scrollToBottom();
              }}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium py-1 px-3 rounded-full shadow-sm flex items-center"
            >
              <span>New messages</span>
              <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 sm:p-4 shadow-md z-10">
        <div className="relative max-w-7xl mx-auto w-full pb-env-safe-bottom">
          <ChatInput
            input={input}
            setInput={setInput}
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
            showInteractiveHints={showInteractiveHints}
            setShowInteractiveHints={setShowInteractiveHints}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-20 sm:z-auto">
              <ChatSuggestions 
                suggestions={suggestions} 
                onSuggestionClick={(suggestion: string) => {
                  setInput(suggestion);
                  setShowSuggestions(false);
                }} 
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Encryption setup modal */}
      <EncryptionSetupModal
        isOpen={showEncryptionSetup}
        onClose={() => setShowEncryptionSetup(false)}
        onKeySet={() => {
          // Reload the chat history with the new key
          if (currentConversationId) {
            loadChatHistory(currentConversationId);
          }
          setEncryptionError(null);
        }}
      />
    </div>
  );
};