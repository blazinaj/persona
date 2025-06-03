import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const personaId = url.searchParams.get('personaId');

    if (!personaId) {
      throw new Error('Missing personaId parameter');
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

    // Generate embed code
    const embedCode = `
<!-- Persona Chat Widget -->
<div id="persona-chat-${personaId}"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${supabaseUrl}/functions/v1/chat-widget.js';
  script.async = true;
  script.onload = function() {
    window.PersonaChat.init({
      personaId: '${personaId}',
      container: 'persona-chat-${personaId}',
      apiUrl: '${supabaseUrl}/functions/v1',
      apiKey: '${Deno.env.get('SUPABASE_ANON_KEY')}'
    });
  };
  document.head.appendChild(script);
})();
</script>
<!-- End Persona Chat Widget -->`;

    return new Response(
      JSON.stringify({
        persona,
        embedCode
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});