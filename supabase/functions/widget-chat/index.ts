import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { OpenAI } from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, personaId, sessionId } = await req.json();

    if (!message || !personaId || !sessionId) {
      throw new Error('Missing required parameters');
    }

    // Validate session
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_widget_session', {
        session_id_input: sessionId,
        persona_id_input: personaId
      });

    if (validationError || !isValid) {
      throw new Error('Invalid session');
    }

    // Get persona details
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('visibility', 'public')
      .single();

    if (personaError || !persona) {
      throw new Error('Persona not found or not public');
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('widget_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('widget_messages')
      .insert({
        session_id: session.id,
        content: message,
        role: 'user'
      });

    if (messageError) {
      throw new Error('Failed to save message');
    }

    // Get chat completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant with the following characteristics:
- Personality traits: ${persona.personality?.join(', ') || 'helpful, friendly'}
- Knowledge areas: ${persona.knowledge?.join(', ') || 'general knowledge'}
- Communication style: ${persona.tone || 'neutral'}

Respond to user queries while maintaining these traits and expertise areas. Keep responses focused and relevant.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;

    // Save assistant message
    await supabase
      .from('widget_messages')
      .insert({
        session_id: session.id,
        content: response,
        role: 'assistant'
      });

    return new Response(
      JSON.stringify({ message: response }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Widget chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});