import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
};

// Handle CORS
export function handleCors(req: Request, res?: Response): Response {
  // If this is a preflight OPTIONS request, return a simple response with CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  // If we have a response, add CORS headers to it
  if (res) {
    const headers = new Headers(res.headers);
    
    // Add CORS headers to the response
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }
    
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  }

  // Default response with CORS headers
  return new Response(null, {
    headers: CORS_HEADERS
  });
}

// Authenticate API request using either:
// 1. API key from the Authorization header
// 2. The anonymous key for public endpoints
export async function authenticateRequest(req: Request): Promise<{ success: boolean; userId?: string; error?: string }> {
  // Get the API key from Authorization header (Bearer token)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header' };
  }

  // Extract the token from Bearer token
  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  if (!match) {
    return { success: false, error: 'Invalid Authorization header format. Use "Bearer YOUR_API_KEY"' };
  }

  const apiKey = match[1];
  if (!apiKey) {
    return { success: false, error: 'Missing API key' };
  }

  // Create Supabase client with admin rights to verify the API key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    // Check if this is a valid API key in our database
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active, expires_at')
      .eq('key', apiKey)
      .single();

    if (error || !data) {
      console.error('API key validation error:', error);
      return { success: false, error: 'Invalid API key' };
    }

    // Check if the API key is still active
    if (!data.is_active) {
      return { success: false, error: 'API key is inactive' };
    }

    // Check if the API key has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { success: false, error: 'API key has expired' };
    }

    // Update last_used timestamp
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key', apiKey);

    // Authentication successful
    return { success: true, userId: data.user_id };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Error handler
export function handleError(error: unknown): Response {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  let status = 500;
  
  if (error instanceof Error) {
    message = error.message;
    
    // If this is a specific error type with status code
    if ('status' in error && typeof (error as any).status === 'number') {
      status = (error as any).status;
    }
  }
  
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    }
  );
}

// Helper function to get the user ID from the request headers
// Set by the authenticateRequest middleware
export function getUserIdFromRequest(req: Request): string {
  const userId = req.headers.get('X-User-ID');
  if (!userId) {
    throw new Error('User ID not found in request');
  }
  return userId;
}

// Create a Supabase client with the user's permissions
export function createSupabaseClient(req: Request) {
  const userId = getUserIdFromRequest(req);
  
  // Create a Supabase client with the service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Set the authenticated user's ID
  return supabase.auth.setSession({
    access_token: '',
    refresh_token: '',
    user: { id: userId }
  }).then(() => supabase);
}