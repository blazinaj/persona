import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Bot,
  User,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  MessageSquare as MessageSquareIcon,
  X,
  Image as ImageIcon,
  FileText,
  Table,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Avatar } from './ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Markdown } from './ui/Markdown';
import { formatDate } from '../utils/formatters';
import { Space, SpaceMessage, Persona } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { isPDFRequest, extractDocumentSections, generatePDFReport } from '../utils/pdfHelpers';
import { isLikelyCSV, parseCSV, csvToHtmlTable } from '../utils/csvHelpers';
import PdfViewer from './ui/PdfViewer';
import SpreadsheetDisplay from './ui/SpreadsheetDisplay';

interface SpaceChatProps {
  space: Space;
  currentUserId: string;
  personas: Persona[];
}

// Interface for interactive elements
interface InteractiveElement {
  type: 'keyword' | 'checklist' | 'button';
  text: string;
  value: string;
}

const SpaceChat: React.FC<SpaceChatProps> = ({ space, currentUserId, personas }) => {
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinatorThinking, setCoordinatorThinking] = useState(false);
  const [respondingPersonas, setRespondingPersonas] = useState<{id: string, name: string, avatar?: string}[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const coordinatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isScrollingRef = useRef(false);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Advanced features state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<string>('');
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    console.log('Space component initialized with space ID:', space.id);
    loadChatHistory();
    generateSuggestions();
    
    // Set up real-time subscription for new messages
    const channelName = `space_messages_${space.id}`;
    console.log(`Setting up real-time subscription for channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'space_messages',
        filter: `space_id=eq.${space.id}`
      }, handleRealtimeMessage)
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });
    
    return () => {
      console.log(`Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
      
      // Clear any pending timeouts
      if (coordinatorTimeoutRef.current) {
        clearTimeout(coordinatorTimeoutRef.current);
      }
    };
  }, [space.id]);

  // Handle realtime message updates
  const handleRealtimeMessage = (payload: any) => {
    console.log('Received new message:', payload);
    
    // Get the new message data
    const newMessage = payload.new;
    
    // Don't add duplicate messages
    if (lastMessageId === newMessage.id) {
      console.log('Duplicate message detected, skipping update');
      return;
    }
    
    setLastMessageId(newMessage.id);
    
    // Format the message for display
    getSenderInfo(newMessage).then(({ senderName, senderAvatar, isPersona }) => {
      const formattedMessage: SpaceMessage = {
        id: newMessage.id,
        spaceId: newMessage.space_id,
        content: newMessage.content,
        personaId: newMessage.persona_id,
        userId: newMessage.user_id,
        createdAt: new Date(newMessage.created_at),
        senderName,
        senderAvatar,
        isPersona
      };
      
      // Add to messages
      setMessages(prevMessages => [...prevMessages, formattedMessage]);
      
      // Process new message content if it's from a persona
      if (newMessage.persona_id) {
        processPersonaMessageContent(formattedMessage);
        
        // Remove persona from responding list
        setRespondingPersonas(prev => 
          prev.filter(p => p.id !== newMessage.persona_id)
        );
        console.log(`Removing persona ${newMessage.persona_id} from responding list`);
      }
      
      // If it's a user message, check for advanced features
      if (newMessage.user_id && !newMessage.persona_id) {
        checkForAdvancedFeatures(newMessage.content);
      }
    });
    
    // Clear coordinator thinking state when any message arrives
    setCoordinatorThinking(false);
    
    // Clear any pending timeouts
    if (coordinatorTimeoutRef.current) {
      clearTimeout(coordinatorTimeoutRef.current);
      coordinatorTimeoutRef.current = null;
    }
    
    // Generate new suggestions based on the updated conversation
    generateSuggestions();
  };

  // Function to get sender information
  const getSenderInfo = async (message: any) => {
    let senderName = "User";
    let senderAvatar = null;
    let isPersona = false;
    
    if (message.persona_id) {
      // Get persona info
      isPersona = true;
      const { data: persona } = await supabase
        .from('personas')
        .select('name, avatar')
        .eq('id', message.persona_id)
        .single();
        
      if (persona) {
        senderName = persona.name;
        senderAvatar = persona.avatar;
      }
    } else if (message.user_id) {
      // Get user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', message.user_id)
        .single();
        
      if (profile) {
        senderName = profile.display_name || 'User';
        senderAvatar = profile.avatar_url;
      } else {
        // Fallback to user email
        const { data: user } = await supabase
          .auth
          .admin
          .getUserById(message.user_id);
          
        if (user?.user?.email) {
          senderName = user.user.email;
        }
      }
    }
    
    return { senderName, senderAvatar, isPersona };
  };

  // Process persona message content for special features
  const processPersonaMessageContent = (message: SpaceMessage) => {
    // Check for image URLs
    checkForImageUrls(message.content);
    
    // Check for PDF data or requests
    checkForPdfData(message.content);
    
    // Check for CSV data
    checkForCsvData(message.content);
    
    // Extract interactive elements
    extractInteractiveElements(message.content);
  };

  // Check for image URLs in messages
  const checkForImageUrls = (content: string) => {
    const imageUrlRegex = /!\[(.*?)\]\((https:\/\/[^)]+)\)/g;
    const matches = [...content.matchAll(imageUrlRegex)];
    
    if (matches.length > 0) {
      // We found an image - no need to set any state,
      // the Markdown component will render it
      console.log('Found image in message:', matches[0][2]);
    }
  };

  // Check message for PDF data
  const checkForPdfData = (content: string) => {
    // Check if the message contains a PDF data URL
    const pdfDataUrl = content.match(/data:application\/pdf;base64,[^"')]+/);
    if (pdfDataUrl) {
      setPdfData(pdfDataUrl[0]);
      setShowPdf(true);
      return;
    }

    // Check for PDF file link
    const pdfLinkRegex = /(https?:\/\/[^\s]+\.pdf)/gi;
    const pdfLinkMatch = content.match(pdfLinkRegex);
    if (pdfLinkMatch && pdfLinkMatch[0]) {
      setPdfData(pdfLinkMatch[0]);
      setShowPdf(true);
      return;
    }
    
    // Check for a PDF context with URL
    if (content.includes("I've created a PDF") || content.includes("PDF document")) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlMatch = content.match(urlRegex);
      if (urlMatch && urlMatch[0]) {
        setPdfData(urlMatch[0]);
        setShowPdf(true);
      }
    }
  };

  // Check for CSV data in messages
  const checkForCsvData = (content: string) => {
    // Extract CSV data from code blocks
    const csvRegex = /```(?:csv)?\s*\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = csvRegex.exec(content)) !== null) {
      const potentialCsv = match[1].trim();
      
      if (isLikelyCSV(potentialCsv)) {
        setCsvData(potentialCsv);
        setShowSpreadsheet(true);
        return;
      }
    }
  };

  // Extract interactive elements from message content
  const extractInteractiveElements = (content: string) => {
    const elements: InteractiveElement[] = [];
    
    // Extract checklist items - format: - [ ] Item text
    const checklistRegex = /- \[([ x])\] (.+?)(?=\n|$)/g;
    let checklistMatch;
    while ((checklistMatch = checklistRegex.exec(content)) !== null) {
      elements.push({
        type: 'checklist',
        text: checklistMatch[2],
        value: `I've completed: ${checklistMatch[2]}`
      });
    }
    
    // Extract keywords with dotted underlines - format: [keyword]{.interactive}
    const keywordRegex = /\[([^\]]+)\]\{\.interactive\}/g;
    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(content)) !== null) {
      elements.push({
        type: 'keyword',
        text: keywordMatch[1],
        value: `Tell me more about ${keywordMatch[1]}`
      });
    }
    
    // Extract button links - format: [Button Text](send:message to send)
    const buttonRegex = /\[([^\]]+)\]\(send:([^)]+)\)/g;
    let buttonMatch;
    while ((buttonMatch = buttonRegex.exec(content)) !== null) {
      elements.push({
        type: 'button',
        text: buttonMatch[1],
        value: buttonMatch[2]
      });
    }
    
    if (elements.length > 0) {
      setInteractiveElements(elements);
    }
  };

  // Handle interactive element actions
  const handleInteractiveElementClick = (element: InteractiveElement) => {
    if (element.type === 'checklist') {
      setCheckedItems(prev => [...prev, element.text]);
    }
    setInput(element.value);
  };

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

  const loadChatHistory = async () => {
    try {
      console.log('Loading chat history for space:', space.id);
      setIsLoadingHistory(true);
      setError(null);
      
      // Call the get_space_messages RPC function
      const { data, error } = await supabase
        .rpc('get_space_messages', {
          space_id_input: space.id, 
          limit_count: 100 
        });
        
      if (error) {
        console.error('Error from get_space_messages RPC:', error);
        throw error;
      }
      
      console.log('Received raw messages data:', data);

      if (!data || data.length === 0) {
        console.log('No messages found for space');
        setMessages([]);
        setIsLoadingHistory(false);
        return;
      }
      
      // Transform data to match SpaceMessage type
      const transformedMessages = data.map((message: any) => ({
        id: message.space_messages_id,
        spaceId: message.space_id,
        content: message.content,
        personaId: message.persona_id,
        userId: message.user_id,
        createdAt: new Date(message.created_at),
        senderName: message.sender_name || (message.persona_id ? 'Unknown Persona' : 'Unknown User'),
        senderAvatar: message.sender_avatar || null,
        isPersona: message.is_persona
      }));
      
      if (transformedMessages.length > 0) {
        // Set the last message ID to prevent duplicates
        setLastMessageId(transformedMessages[transformedMessages.length - 1].id);
      }
      
      console.log('Transformed messages:', transformedMessages);
      setMessages(transformedMessages);
      
      // Process persona messages for special features
      transformedMessages.forEach(msg => {
        if (msg.isPersona) {
          processPersonaMessageContent(msg);
        }
      });
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Check for advanced features in user messages
  const checkForAdvancedFeatures = (content: string) => {
    // Check for image generation request
    const isImageRequest = containsImageRequest(content);
    if (isImageRequest) {
      setIsGeneratingImage(true);
      setImageGenerationProgress('Analyzing image request...');
    }
    
    // Check for PDF request
    const isPdfReq = isPDFRequest(content);
    if (isPdfReq) {
      setImageGenerationProgress('Preparing document content...');
    }
  };

  // Function to check if message is requesting image generation
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

  const generateSuggestions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            spaceId: space.id
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }
      
      const data = await response.json();
      console.log('Received suggestions:', data.suggestions);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Set fallback suggestions
      setSuggestions([
        'What do you think about this?',
        'Can you help me with something?',
        'Tell me more about yourself.'
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (coordinatorTimeoutRef.current) {
      clearTimeout(coordinatorTimeoutRef.current);
    }
    
    // Store the message content before clearing input
    const messageContent = input.trim();
    setInput('');

    // Show coordinator thinking immediately
    setCoordinatorThinking(true);

    // Auto-resize textarea back to default height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    console.log(`Sending message to space ${space.id}:`, messageContent);
    
    try {
      // Check for advanced features
      const isImageRequest = containsImageRequest(messageContent);
      const isPdfReq = isPDFRequest(messageContent);
      
      if (isImageRequest) {
        setIsGeneratingImage(true);
        setImageGenerationProgress('Analyzing request...');
      }
      
      if (isPdfReq) {
        setImageGenerationProgress('Preparing document content...');
      }
      
      // Insert the user message with proper user_id
      const { data, error } = await supabase
        .from('space_messages')
        .insert({ 
          space_id: space.id,
          content: messageContent,
          user_id: currentUserId
        })
        .select();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      console.log('User message inserted successfully:', data);
      
      // Set this message as the last message ID to prevent duplicates from realtime
      if (data && data[0]) {
        setLastMessageId(data[0].id);
      }

      // Manually trigger the room coordinator function
      try {
        console.log('Calling room coordinator for space:', space.id);
        
        // Get space features from settings
        const features = {
          enableImages: true,
          enablePDFs: true,
          enableSpreadsheets: true,
          enableInteractiveElements: true
        };
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/room-coordinator`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ 
              spaceId: space.id,
              messageId: data[0].id,
              features
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Room coordinator response error:', response.status, errorText);
          throw new Error(`Room coordinator error: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Room coordinator result:', result);
        
        // Update responding personas
        if (result.respondingPersonas && result.respondingPersonas.length > 0) {
          setRespondingPersonas(result.respondingPersonas);
        }
        
        // Set a timeout to clear coordinator thinking if no responses come
        coordinatorTimeoutRef.current = setTimeout(() => {
          console.log('No persona responses received within timeout, clearing coordinator state');
          setCoordinatorThinking(false);
          setRespondingPersonas([]);
        }, 10000);
      } catch (coordError) {
        console.error('Error triggering room coordinator:', coordError);
      }
      
      // Generate new suggestions
      generateSuggestions();
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Restore the input if sending failed
      setInput(messageContent);
      
      // Clear coordinator thinking state and timeout
      setCoordinatorThinking(false);
      if (coordinatorTimeoutRef.current) {
        clearTimeout(coordinatorTimeoutRef.current);
        coordinatorTimeoutRef.current = null;
      }
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  // Handle textarea input change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  // Handle keyboard shortcuts in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new lines (default behavior)
      // Do nothing, let the default behavior insert a new line
    }
  };

  // Handle message copying
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Error copying message:', err);
    }
  };

  // Toggle audio playback
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  // Generate PDF from message content
  const handleGeneratePdf = (content: string) => {
    const sections = extractDocumentSections(content);
    const pdfDataUrl = generatePDFReport(
      'Generated Report',
      sections,
      { date: new Date().toLocaleDateString() }
    );
    setPdfData(pdfDataUrl);
    setShowPdf(true);
  };

  // Download generated image
  const handleDownloadImage = async (messageId: string, content: string) => {
    try {
      // Extract image URL
      const match = content.match(/!\[.*?\]\((.*?)\)/);
      if (!match || !match[1]) {
        throw new Error('No image URL found in message');
      }
      
      const imageUrl = match[1];
      
      // Fetch the image
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: { 'Accept': 'image/*' }
      });
      
      if (!response.ok && response.status !== 0) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `space-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Error downloading image:', err);
      setError('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 pb-24 md:pb-20 scroll-smooth"
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500 max-w-md">
              Be the first to start a conversation in this space!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Determine if this is a consecutive message from the same sender
              const isConsecutive = index > 0 && 
                ((message.personaId && message.personaId === messages[index - 1].personaId) ||
                 (message.userId && message.userId === messages[index - 1].userId));
              
              return (
                <div key={message.id} className={`flex ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                  {!isConsecutive && (
                    <div className="flex-shrink-0 mr-3">
                      {message.personaId ? (
                        <div className="relative">
                          <Avatar
                            src={message.personaId ? getAvatarUrl(message.senderAvatar) : message.senderAvatar}
                            name={message.senderName}
                            size="sm"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5">
                            <Bot size={10} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Avatar
                            src={message.userId ? message.senderAvatar : null}
                            name={message.senderName}
                            size="sm"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <User size={10} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`flex-1 ${isConsecutive ? 'pl-10' : ''}`}>
                    {!isConsecutive && (
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-900">
                          {message.senderName}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} className="mr-1" />
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className="prose prose-sm max-w-none">
                      <Markdown content={message.content} />
                    </div>
                    
                    {/* Message actions */}
                    <div className="flex items-center justify-end space-x-2 mt-2 text-xs text-gray-400">
                      {/* Copy button */}
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-gray-600 transition-colors p-1.5 rounded hover:bg-gray-100"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      
                      {/* Show PDF button (for document-like messages) */}
                      {message.isPersona && isPDFRequest(message.content) && (
                        <button
                          onClick={() => handleGeneratePdf(message.content)}
                          className="hover:text-gray-600 transition-colors p-1.5 rounded hover:bg-gray-100"
                          title="View as PDF"
                        >
                          <FileText size={14} />
                        </button>
                      )}
                      
                      {/* Show spreadsheet button (for CSV data) */}
                      {message.isPersona && message.content.includes("```csv") && (
                        <button
                          onClick={() => {
                            const match = message.content.match(/```csv\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) {
                              setCsvData(match[1]);
                              setShowSpreadsheet(true);
                            }
                          }}
                          className="hover:text-gray-600 transition-colors p-1.5 rounded hover:bg-gray-100"
                          title="View as spreadsheet"
                        >
                          <Table size={14} />
                        </button>
                      )}
                      
                      {/* Download image button */}
                      {message.content.includes("![") && message.content.includes("](http") && (
                        <button
                          onClick={() => handleDownloadImage(message.id, message.content)}
                          className="hover:text-gray-600 transition-colors p-1.5 rounded hover:bg-gray-100"
                          title="Download image"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      
                      {/* Audio toggle (future use) */}
                      {audioEnabled && message.isPersona && (
                        <button
                          className="hover:text-gray-600 transition-colors p-1.5 rounded hover:bg-gray-100"
                          title="Listen to message"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* Interactive elements */}
                    {message.isPersona && interactiveElements.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {interactiveElements.filter(el => el.type === 'checklist').length > 0 && (
                          <div className="space-y-1.5">
                            {interactiveElements
                              .filter(el => el.type === 'checklist')
                              .map((item, index) => (
                                <div 
                                  key={`checklist-${index}`}
                                  className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                                    checkedItems.includes(item.text) ? 'text-green-600' : 'text-gray-700'
                                  }`}
                                  onClick={() => handleInteractiveElementClick(item)}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center border rounded border-gray-400">
                                    {checkedItems.includes(item.text) && <Check size={12} />}
                                  </div>
                                  <span className={checkedItems.includes(item.text) ? 'line-through' : ''}>
                                    {item.text}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        )}
                        
                        {interactiveElements.filter(el => el.type === 'keyword').length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {interactiveElements
                              .filter(el => el.type === 'keyword')
                              .map((item, index) => (
                                <span
                                  key={`keyword-${index}`}
                                  className="inline-block border-b border-dotted border-blue-500 text-blue-600 cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded"
                                  onClick={() => handleInteractiveElementClick(item)}
                                >
                                  {item.text}
                                </span>
                              ))
                            }
                          </div>
                        )}
                        
                        {interactiveElements.filter(el => el.type === 'button').length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {interactiveElements
                              .filter(el => el.type === 'button')
                              .map((item, index) => (
                                <button
                                  key={`button-${index}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
                                  onClick={() => handleInteractiveElementClick(item)}
                                >
                                  {item.text}
                                  <ChevronRight size={14} />
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Coordinator thinking state */}
            {coordinatorThinking && (
              <div className="flex items-center justify-center mt-4 mb-2">
                <div className="bg-gray-100 rounded-lg p-3 flex flex-col items-center">
                  <div className="flex space-x-1 mb-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">Coordinator is thinking...</span>
                </div>
              </div>
            )}
            
            {/* Active personas responding */}
            {respondingPersonas.length > 0 && (
              <div className="flex flex-col items-center mt-4 mb-2">
                <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center">
                  <div className="flex space-x-2 mb-2">
                    {respondingPersonas.map((persona, index) => (
                      <div key={persona.id} className="flex flex-col items-center">
                        <div className="relative">
                          <Avatar
                            src={persona.avatar}
                            name={persona.name || 'Unknown Persona'}
                            size="sm"
                            className="ring-2 ring-blue-100 animate-pulse"
                            style={{ animationDelay: `${index * 200}ms` }}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5">
                            <Bot size={10} className="text-white" />
                          </div>
                        </div>
                        <span className="text-xs text-blue-700 mt-1">{persona.name}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-blue-600">
                    {respondingPersonas.length === 1 
                      ? `${respondingPersonas[0].name || 'A persona'} is writing a response...` 
                      : `${respondingPersonas.length} personas are responding...`}
                  </span>
                </div>
              </div>
            )}

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
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Image generation indicator */}
      {isGeneratingImage && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center gap-2 text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{imageGenerationProgress || 'Generating image...'}</span>
        </div>
      )}

      {/* PDF Viewer */}
      {showPdf && pdfData && (
        <div className="fixed inset-0 z-50 p-4 bg-black/50 flex items-center justify-center" onClick={() => setShowPdf(false)}>
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl max-h-[90vh] w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <PdfViewer data={pdfData} title="Space Document" onClose={() => setShowPdf(false)} />
          </div>
        </div>
      )}
      
      {/* Spreadsheet Viewer */}
      {showSpreadsheet && csvData && (
        <div className="fixed inset-0 z-50 p-4 bg-black/50 flex items-center justify-center" onClick={() => setShowSpreadsheet(false)}>
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl max-h-[90vh] w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <SpreadsheetDisplay 
              data={csvData}
              title="Space Data" 
              onClose={() => setShowSpreadsheet(false)}
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:p-4 shadow-md z-10 pb-env-safe-bottom">
        <div className="relative max-w-7xl mx-auto w-full">
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 right-0">
              <div className="mx-2 bg-white rounded-lg border border-gray-200 shadow-lg max-h-[40vh] overflow-y-auto">
                <div className="sticky top-0 flex items-center justify-between p-3 border-b bg-white sm:hidden">
                  <span className="text-sm font-medium text-gray-700">Suggestions</span>
                  <button 
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestionClick(suggestion);
                      }}
                      className="w-full px-4 py-3.5 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
            <div className="flex-shrink-0 hidden xs:block">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title={audioEnabled ? "Disable audio playback" : "Enable audio playback"}
                aria-label={audioEnabled ? "Disable audio playback" : "Enable audio playback"}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-500" />
                )}
              </Button>
            </div>
            <div className="relative flex-1">
              <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="pl-3 pr-1 text-gray-400 hover:text-gray-600 xs:hidden"
                  title={audioEnabled ? "Disable audio" : "Enable audio"}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${space.name}...`}
                  className="flex-1 pl-2 xs:pl-4 pr-4 py-3 rounded-lg border-0 focus:outline-none text-base resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
                  disabled={isLoading}
                  rows={1}
                />
                <div className="flex items-center pr-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className={`p-2 hover:bg-gray-100 rounded-full ${
                      showSuggestions ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Show suggestions"
                  >
                    {showSuggestions ? <X size={18} /> : <MessageSquareIcon size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 px-4 flex items-center justify-center whitespace-nowrap flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Function to format message time
const formatMessageTime = (date: Date) => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return formatDate(date);
  }
};

export default SpaceChat;