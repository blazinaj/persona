// Handler for /personas/:id/chat endpoint (POST)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserIdFromRequest } from '../api-middleware.ts';

export async function handlePersonaChat(req: Request, params: Record<string, string>): Promise<Response> {
  // Only support POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    );
  }
  
  // Create Supabase client with admin privileges
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  
  // Get user ID from request (set by middleware)
  const userId = getUserIdFromRequest(req);
  
  // Get persona ID from route params
  const personaId = params.id;
  if (!personaId) {
    return new Response(
      JSON.stringify({ error: 'Persona ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' }}
    );
  }
  
  try {
    // Check if the persona exists and the user has access to it
    const { data: personaData, error: personaError } = await supabase
      .from('personas')
      .select('id, name, personality, knowledge, tone, instructions, visibility')
      .eq('id', personaId)
      .single();
    
    if (personaError) {
      throw new Error(personaError.message);
    }
    
    // If the persona is not public and doesn't belong to the user, deny access
    if (personaData.visibility !== 'public' && personaData.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'You do not have access to this persona' }),
        { status: 403, headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    // Parse request body
    const { messages, conversationId } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    // Get or create a conversation for this chat
    let activeConversationId = conversationId;
    
    if (!activeConversationId) {
      // Create a new conversation
      const userMessage = messages[messages.length - 1];
      const conversationTitle = userMessage.content.length > 30 
        ? `${userMessage.content.slice(0, 30)}...` 
        : userMessage.content;
        
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          persona_id: personaId,
          title: conversationTitle,
          user_id: userId
        })
        .select()
        .single();
        
      if (convError) throw new Error(convError.message);
      activeConversationId = newConversation.id;
    } else {
      // Verify the conversation belongs to this user and persona
      const { data: convCheck, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', activeConversationId)
        .eq('user_id', userId)
        .eq('persona_id', personaId)
        .single();
        
      if (convError || !convCheck) {
        return new Response(
          JSON.stringify({ error: 'Invalid conversation ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
    }
    
    // Save the user message to the database
    const userMessage = messages[messages.length - 1];
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: userMessage.content,
        persona_id: personaId
      });
      
    if (msgError) throw new Error(msgError.message);
    
    // Call the chat function to generate a response
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          messages,
          personaId,
          personality: personaData.personality || [],
          knowledge: personaData.knowledge || [],
          tone: personaData.tone || 'neutral',
          instructions: personaData.instructions || '',
          userId,
          conversationId: activeConversationId
        })
      }
    );
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to generate response');
    }
    
    // Save assistant's response to the database
    const { error: resMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: responseData.message || '',
        persona_id: personaId
      });
      
    if (resMsgError) throw new Error(resMsgError.message);
    
    // Return the AI response
    return new Response(
      JSON.stringify({
        message: responseData.message,
        conversationId: activeConversationId
      }),
      { headers: { 'Content-Type': 'application/json' }}
    );
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
}