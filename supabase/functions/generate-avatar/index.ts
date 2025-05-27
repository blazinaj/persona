import { OpenAI } from 'npm:openai@4.29.1';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Buffer } from 'npm:buffer@6.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate prompt for safety and quality
function validatePrompt(prompt: string): { isValid: boolean; reason?: string } {
  if (!prompt || prompt.trim().length < 10) {
    return { isValid: false, reason: 'Prompt is too short. Please provide more details.' };
  }

  if (prompt.length > 1000) {
    return { isValid: false, reason: 'Prompt is too long. Please keep it under 1000 characters.' };
  }

  // Check for prohibited content
  const prohibitedTerms = [
    'nude', 'naked', 'nsfw', 'porn', 'explicit', 'sexual',
    'gore', 'blood', 'violent', 'gruesome',
    'hate speech', 'racist', 'offensive'
  ];

  for (const term of prohibitedTerms) {
    if (prompt.toLowerCase().includes(term)) {
      return { 
        isValid: false, 
        reason: `Prompt contains prohibited content. Please ensure your request follows our content guidelines.` 
      };
    }
  }

  return { isValid: true };
}

// Enhance prompt for better avatar generation
async function enhancePrompt(prompt: string, style: string): Promise<string> {
  try {
    // Create a system prompt that guides the model to create a good avatar prompt
    const systemPrompt = `You are an expert at crafting prompts for AI avatar generation. 
Your task is to enhance the user's description into a detailed prompt that will generate a high-quality avatar image.

Guidelines:
- Focus on facial features, expressions, and upper body details
- Ensure the avatar has a clean background (preferably transparent or simple gradient)
- Add details about lighting, perspective (front-facing for avatars), and composition
- Maintain the requested style: ${style}
- Keep the prompt concise but descriptive
- Ensure the avatar is appropriate and professional
- DO NOT include any inappropriate or offensive content
- DO NOT include full body descriptions as this is for a profile avatar
- Format as a single paragraph with no special characters

Output only the enhanced prompt with no additional text or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content?.trim() || prompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return prompt; // Fall back to original prompt if enhancement fails
  }
}

// Function to download image from URL and upload to Supabase Storage
async function downloadAndStoreImage(imageUrl: string): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get image data as ArrayBuffer
    const imageData = await response.arrayBuffer();
    
    // Generate a unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
    const filePath = `avatars/${fileName}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('persona-avatars')
      .upload(filePath, Buffer.from(imageData), {
        contentType: 'image/png',
        cacheControl: '3600'
      });
    
    if (error) {
      throw error;
    }
    
    // Return just the path - the frontend will handle URL construction
    return filePath;
  } catch (error) {
    console.error('Error storing image:', error);
    throw new Error(`Failed to store image: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, style = 'realistic' } = await req.json();

    // Validate the prompt
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.reason }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Enhance the prompt for better results
    const enhancedPrompt = await enhancePrompt(prompt, style);
    console.log('Enhanced prompt:', enhancedPrompt);

    // Generate the image
    const styleModifier = style === 'realistic' ? 'photorealistic' : style;
    const finalPrompt = `${enhancedPrompt}, ${styleModifier} style, professional avatar, high quality, detailed facial features, portrait, headshot, clean background`;

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: finalPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: style === 'realistic' ? 'natural' : 'vivid',
      response_format: 'url'
    });

    // Get the image URL from OpenAI
    const openaiImageUrl = image.data[0].url;
    if (!openaiImageUrl) {
      throw new Error('No image URL received from OpenAI');
    }
    
    // Download and store the image in Supabase
    const storedImagePath = await downloadAndStoreImage(openaiImageUrl);
        
    // Return the Supabase Storage URL
    return new Response(
      JSON.stringify({ 
        imageUrl: storedImagePath,
        prompt: enhancedPrompt
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Avatar generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate avatar'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});