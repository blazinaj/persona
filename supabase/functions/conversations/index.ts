// Handler for /conversations endpoints (GET)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserIdFromRequest } from '../api-middleware.ts';

export async function handleConversations(req: Request, params: Record<string, string>): Promise<Response> {
  // Only support GET method
  if (req.method !== 'GET') {
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
  
  try {
    const url = new URL(req.url);
    const personaId = url.searchParams.get('persona_id');
    const includeMessages = url.searchParams.get('include_messages') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Build query
    let query = supabase
      .from('conversations')
      .select(includeMessages 
        ? 'id, persona_id, title, created_at, updated_at, personas(id, name, avatar), chat_messages(id, content, role, created_at)' 
        : 'id, persona_id, title, created_at, updated_at, personas(id, name, avatar)'
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    // Filter by persona if provided
    if (personaId) {
      query = query.eq('persona_id', personaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data || []),
      { headers: { 'Content-Type': 'application/json' }}
    );
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch conversations' }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
}