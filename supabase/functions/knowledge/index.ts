// Handler for /knowledge endpoints (GET, POST)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserIdFromRequest } from '../api-middleware.ts';

export async function handleKnowledge(req: Request): Promise<Response> {
  // Create Supabase client with admin privileges 
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  
  // Get user ID from request (set by middleware)
  const userId = getUserIdFromRequest(req);
  
  // Handle GET request to list knowledge entries
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const personaId = url.searchParams.get('persona_id');
      
      // Persona ID is required
      if (!personaId) {
        return new Response(
          JSON.stringify({ error: 'persona_id query parameter is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Verify user has access to this persona
      const { data: personaCheck, error: personaError } = await supabase
        .from('personas')
        .select('id')
        .eq('id', personaId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (personaError) throw personaError;
      
      if (!personaCheck) {
        return new Response(
          JSON.stringify({ error: 'Persona not found or you do not have access' }),
          { status: 404, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Fetch knowledge entries
      const { data, error } = await supabase
        .from('persona_knowledge_entries')
        .select('*')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify(data || []),
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to fetch knowledge entries' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  }
  
  // Handle POST request to create a new knowledge entry
  if (req.method === 'POST') {
    try {
      const requestData = await req.json();
      
      // Validate required fields
      if (!requestData.persona_id) {
        return new Response(
          JSON.stringify({ error: 'persona_id is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      if (!requestData.title) {
        return new Response(
          JSON.stringify({ error: 'title is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      if (!requestData.description) {
        return new Response(
          JSON.stringify({ error: 'description is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      if (!requestData.category) {
        return new Response(
          JSON.stringify({ error: 'category is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Verify user has access to this persona
      const { data: personaCheck, error: personaError } = await supabase
        .from('personas')
        .select('id')
        .eq('id', requestData.persona_id)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (personaError) throw personaError;
      
      if (!personaCheck) {
        return new Response(
          JSON.stringify({ error: 'Persona not found or you do not have access' }),
          { status: 404, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Insert knowledge entry
      const { data, error } = await supabase
        .from('persona_knowledge_entries')
        .insert({
          persona_id: requestData.persona_id,
          title: requestData.title,
          description: requestData.description,
          category: requestData.category,
          source: requestData.source || null,
          user_id: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ 
          success: true,
          entry: data
        }),
        { 
          status: 201, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create knowledge entry' }),
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