import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { OpenAI } from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const personaId = path[1]; // /personas/:id

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    // Extract token from auth header
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is an API key
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', token)
      .eq('is_active', true)
      .maybeSingle();
    
    let userId;
    
    if (apiKey) {
      // Use the user ID associated with the API key
      userId = apiKey.user_id;
    } else {
      // Try to get user from JWT token
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Unauthorized');
      }
      
      userId = user.id;
    }

    // Route handling
    switch (req.method) {
      case 'GET': {
        if (personaId) {
          // Get single persona
          const { data, error } = await supabase
            .from('personas')
            .select('*')
            .eq('id', personaId)
            .single();

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // List personas
          const { data, error } = await supabase
            .from('personas')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'POST': {
        if (personaId && path[2] === 'chat') {
          // Chat with persona
          const { messages } = await req.json();

          // Get persona details
          const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('*')
            .eq('id', personaId)
            .single();

          if (personaError) throw personaError;

          // Create chat completion
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant with the following characteristics:
- Personality traits: ${persona.personality?.join(', ') || 'helpful, friendly'}
- Knowledge areas: ${persona.knowledge?.join(', ') || 'general knowledge'}
- Communication style: ${persona.tone || 'neutral'}`
              },
              ...messages
            ],
            temperature: 0.7
          });

          return new Response(
            JSON.stringify({ message: completion.choices[0].message.content }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Create new persona
          const data = await req.json();
          const { error } = await supabase
            .from('personas')
            .insert([{
              ...data,
              user_id: userId
            }]);

          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'PUT': {
        if (!personaId) throw new Error('Missing persona ID');

        // Update persona
        const data = await req.json();
        const { error } = await supabase
          .from('personas')
          .update(data)
          .eq('id', personaId)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'DELETE': {
        if (!personaId) throw new Error('Missing persona ID');

        // Delete persona
        const { error } = await supabase
          .from('personas')
          .delete()
          .eq('id', personaId)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Method ${req.method} not allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});