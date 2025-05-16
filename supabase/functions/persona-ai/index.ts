import OpenAI from 'npm:openai@4.29.1';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestBody {
  action: 'create' | 'update' | 'delete';
  userId: string;
  personaId?: string;
  data?: {
    name?: string;
    description?: string;
    tags?: string[];
    personality?: string[];
    knowledge?: string[];
    tone?: string;
    examples?: string[];
    visibility?: 'private' | 'unlisted' | 'public';
  };
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, personaId, data, message } = await req.json() as RequestBody;

    // Validate input
    if (!userId || !message || !action) {
      throw new Error('Missing required parameters');
    }

    // Create system prompt based on action
    let systemPrompt = `You are an AI assistant that helps manage personas. You can create, update, and delete personas based on natural language requests. 

Current request: ${action} operation
User message: ${message}

You should:
1. Understand the user's intent
2. Extract relevant information
3. Validate the request
4. Perform the requested operation
5. Provide a natural response

Available fields:
- name (required, max 50 chars)
- description (optional, max 200 chars)
- tags (optional array)
- personality (optional array)
- knowledge (optional array)
- tone (optional)
- examples (optional array)
- visibility (private/unlisted/public)`;

    // Get completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    // Perform database operation based on action
    let result;
    switch (action) {
      case 'create':
        if (!data) throw new Error('Data required for create operation');
        const { error: createError } = await supabase
          .from('personas')
          .insert({
            ...data,
            user_id: userId
          });
        if (createError) throw createError;
        result = 'Persona created successfully';
        break;

      case 'update':
        if (!personaId || !data) throw new Error('PersonaId and data required for update operation');
        const { error: updateError } = await supabase
          .from('personas')
          .update(data)
          .eq('id', personaId)
          .eq('user_id', userId);
        if (updateError) throw updateError;
        result = 'Persona updated successfully';
        break;

      case 'delete':
        if (!personaId) throw new Error('PersonaId required for delete operation');
        const { error: deleteError } = await supabase
          .from('personas')
          .delete()
          .eq('id', personaId)
          .eq('user_id', userId);
        if (deleteError) throw deleteError;
        result = 'Persona deleted successfully';
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ 
        message: aiResponse,
        result 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});