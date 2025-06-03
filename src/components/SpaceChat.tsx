import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Loader2,
  Smile,
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Avatar } from './ui/Avatar';
import { getAvatarUrl } from '../utils/avatarHelpers';
import { Markdown } from './ui/Markdown';
import { formatDate } from '../utils/formatters';
import { Space, SpaceMessage, Persona } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface SpaceChatProps {
  space: Space;
  currentUserId: string;
  personas: Persona[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const coordinatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isScrollingRef = useRef(false);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Instead of trying to determine sender info here, reload the entire chat history
    // This ensures we get the correct sender information from the database
    console.log('Reloading chat history after receiving new message');
    loadChatHistory();
    
    // Process message based on type (using the raw message data)
    if (newMessage.persona_id) {
      setRespondingPersonas(prev => 
        prev.filter(p => p.id !== newMessage.persona_id)
      );
      console.log(`Removing persona ${newMessage.persona_id} from responding list`);
    }
    
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
      
      console.log('Transformed messages:', transformedMessages);
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
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

      // Manually trigger the room coordinator function
      try {
        console.log('Calling room coordinator for space:', space.id);
        
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
              messageId: data[0].id
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Room coordinator response error:', response.status, errorText);
          throw new Error(`Room coordinator error: ${response.statusText}`);
        }
        
        const result = await response.json();
        
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
              // Find sender information
              const sender = message.personaId 
                ? space.members.find(m => m.personaId === message.personaId)?.personas
                : space.members.find(m => m.userId === message.userId)?.profiles;
              
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
            <div className="flex-shrink-0 hidden sm:block">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Add attachment"
              >
                <Plus size={20} className="text-gray-500" />
              </Button>
            </div>

            <div className="relative flex-1">
              <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${space.name}...`}
                  className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none text-base resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
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
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                    title="Add emoji"
                  >
                    <Smile size={18} />
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
                  <>
                    <Send className="w-5 h-5" />
                    {!isMobile && <span className="ml-2">Send</span>}
                  </>
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