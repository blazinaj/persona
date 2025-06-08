// Handler for /personas/:id endpoints (GET, PUT, DELETE)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserIdFromRequest } from '../api-middleware.ts';

export async function handlePersonaById(req: Request, params: Record<string, string>): Promise<Response> {
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
  
  // First check if user has access to this persona
  const { data: accessCheck, error: accessError } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .eq('user_id', userId)
    .maybeSingle();
    
  if (accessError) {
    return new Response(
      JSON.stringify({ error: accessError.message || 'Database error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
  
  if (!accessCheck) {
    return new Response(
      JSON.stringify({ error: 'Persona not found or you do not have access' }),
      { status: 404, headers: { 'Content-Type': 'application/json' }}
    );
  }
  
  // Handle GET request to fetch a specific persona
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Persona not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error('Error fetching persona:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to fetch persona' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  }
  
  // Handle PUT request to update a persona
  if (req.method === 'PUT') {
    try {
      const requestData = await req.json();
      
      // Prepare data for update
      const updateData = {
        name: requestData.name,
        description: requestData.description,
        avatar: requestData.avatar,
        tags: requestData.tags,
        personality: requestData.personality,
        knowledge: requestData.knowledge,
        tone: requestData.tone,
        examples: requestData.examples,
        instructions: requestData.instructions,
        visibility: requestData.visibility,
        voice: requestData.voice,
        // Don't allow changing user_id
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      // Update persona
      const { data, error } = await supabase
        .from('personas')
        .update(updateData)
        .eq('id', personaId)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, persona: data }),
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error('Error updating persona:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to update persona' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }
  }
  
  // Handle DELETE request to delete a persona
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error('Error deleting persona:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to delete persona' }),
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