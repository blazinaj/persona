// Handler for /personas endpoints (GET, POST)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserIdFromRequest } from '../api-middleware.ts';

export async function handlePersonas(req: Request): Promise<Response> {
  // Create Supabase client with admin privileges 
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  
  // Get user ID from request (set by middleware)
  const userId = getUserIdFromRequest(req);
  
  // Handle GET request to list personas
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify(data || []),
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error('Error fetching personas:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to fetch personas' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  }
  
  // Handle POST request to create a new persona
  if (req.method === 'POST') {
    try {
      const requestData = await req.json();
      
      // Validate required fields
      if (!requestData.name) {
        return new Response(
          JSON.stringify({ error: 'Persona name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Prepare data for insertion
      const personaData = {
        name: requestData.name,
        description: requestData.description || null,
        avatar: requestData.avatar || null,
        tags: requestData.tags || [],
        personality: requestData.personality || [],
        knowledge: requestData.knowledge || [],
        tone: requestData.tone || 'neutral',
        examples: requestData.examples || [],
        instructions: requestData.instructions || '',
        visibility: requestData.visibility || 'private',
        voice: requestData.voice || {},
        user_id: userId
      };
      
      // Insert new persona
      const { data, error } = await supabase
        .from('personas')
        .insert([personaData])
        .select()
        .single();
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Persona created successfully',
          persona: data
        }),
        { 
          status: 201, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error creating persona:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create persona' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  }
  
  // If we get here, method is not supported
  return new Response(
    JSON.stringify({ error: `Method ${req.method} not allowed` }),
    { status: 405, headers: { 'Content-Type': 'application/json' }}
  );
}