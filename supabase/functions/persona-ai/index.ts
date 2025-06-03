import OpenAI from 'npm:openai@4.29.1';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create system prompt for persona creation
    const systemPrompt = `You are an AI assistant that helps users create personas. When given a description, extract and suggest relevant information for the following fields:

- name: A concise, descriptive name (max 50 chars)
- description: A clear summary of the persona's purpose (max 200 chars)
- tags: 2-4 relevant tags
- personality: 2-4 personality traits from: friendly, professional, humorous, empathetic, direct, creative, analytical, motivational
- knowledge: 2-4 knowledge areas
- tone: One of: formal, casual, technical, supportive, enthusiastic, neutral
- examples: 2-3 example interactions

Format your response as a valid JSON object with these exact fields. Do not include any other text or explanation outside of the JSON object.`;

    // Get completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    // Parse the response content as JSON
    try {
      const suggestions = JSON.parse(completion.choices[0].message.content);
      return new Response(
        JSON.stringify(suggestions),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Persona AI error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});