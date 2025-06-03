import { OpenAI } from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { text, voice = 'alloy', speed = 1.0, pitch = 1.0, personaId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Clean up text for better speech synthesis
    const cleanText = cleanTextForSpeech(text);
    
    // Create speech
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: cleanText,
      // Note: OpenAI TTS API doesn't support pitch adjustment directly
      speed: speed
    });

    // Convert to ArrayBuffer
    const buffer = await mp3.arrayBuffer();

    // Return audio data
    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"'
      }
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate speech'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Function to clean text for speech synthesis
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, 'Image') // Replace image markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Replace links with just the text
    .replace(/```[\s\S]*?```/g, 'Code block') // Replace code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
    .replace(/#+ (.*)/g, '$1') // Remove heading formatting
    .replace(/\n\n/g, '. ') // Replace double newlines with period and space
    .replace(/\n/g, ' ') // Replace single newlines with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
}