import { handleCors, authenticateRequest, handleError } from '../api-middleware.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Define route handlers mapping
interface RouteConfig {
  methods: string[];
  handler: (req: Request, params: Record<string, string>) => Promise<Response>;
}

// Import route handlers
import { handlePersonas } from '../personas/index.ts';
import { handlePersonaById } from '../personas-id/index.ts';
import { handlePersonaChat } from '../personas-chat/index.ts';
import { handleConversations } from '../conversations/index.ts';
import { handleKnowledge } from '../knowledge/index.ts';
import { generateApiDocumentation } from '../api-documentation.ts';

// Define API routes and their handlers
const routes: Record<string, RouteConfig> = {
  '/personas': { 
    methods: ['GET', 'POST'], 
    handler: handlePersonas 
  },
  '/personas/:id': { 
    methods: ['GET', 'PUT', 'DELETE'], 
    handler: handlePersonaById 
  },
  '/personas/:id/chat': { 
    methods: ['POST'], 
    handler: handlePersonaChat 
  },
  '/conversations': { 
    methods: ['GET'], 
    handler: handleConversations 
  },
  '/knowledge': { 
    methods: ['GET', 'POST'], 
    handler: handleKnowledge 
  },
  '/docs': { 
    methods: ['GET'], 
    handler: async () => new Response(
      JSON.stringify(generateApiDocumentation()),
      { headers: { 'Content-Type': 'application/json' }}
    )
  }
};

/**
 * Pattern matching function to determine if a path matches a route pattern
 * Supports path parameters like :id
 */
function matchRoute(path: string, routePattern: string): { match: boolean; params: Record<string, string> } {
  const params: Record<string, string> = {};
  
  // Split the paths into segments
  const pathSegments = path.split('/').filter(Boolean);
  const patternSegments = routePattern.split('/').filter(Boolean);
  
  // If the number of segments doesn't match, it's not a match
  if (pathSegments.length !== patternSegments.length) {
    return { match: false, params };
  }
  
  // Compare each segment
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];
    
    // If the pattern segment is a parameter (starts with :)
    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.substring(1);
      params[paramName] = pathSegment;
      continue;
    }
    
    // Otherwise, the segments must match exactly
    if (patternSegment !== pathSegment) {
      return { match: false, params };
    }
  }
  
  return { match: true, params };
}

// Main request handler
async function handleRequest(req: Request): Promise<Response> {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return handleCors(req);
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/api\/?/, '/');
    
    // First try to match against exact routes
    let matchedRoute: string | null = null;
    let routeParams: Record<string, string> = {};
    
    for (const [routePattern, config] of Object.entries(routes)) {
      const { match, params } = matchRoute(path, routePattern);
      if (match) {
        matchedRoute = routePattern;
        routeParams = params;
        
        // Check if the method is allowed
        if (!config.methods.includes(req.method)) {
          return new Response(
            JSON.stringify({ error: `Method ${req.method} not allowed for this endpoint` }),
            { 
              status: 405, 
              headers: { 
                'Content-Type': 'application/json',
                'Allow': config.methods.join(', ')
              }
            }
          );
        }
        
        break;
      }
    }
    
    // If no route matches, return 404
    if (!matchedRoute) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    // Authenticate the request (except for docs endpoint)
    if (matchedRoute !== '/docs') {
      const authResult = await authenticateRequest(req);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' }}
        );
      }
      
      // Add user information to the request for downstream handlers
      req.headers.set('X-User-ID', authResult.userId);
    }
    
    // Handle the request with the appropriate handler
    const response = await routes[matchedRoute].handler(req, routeParams);
    
    // Ensure CORS headers are applied to the response
    return handleCors(req, response);
    
  } catch (error) {
    return handleError(error);
  }
}

// Serve the HTTP handler
serve(handleRequest);

console.log(`API function running at ${Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'}/functions/v1/api`);