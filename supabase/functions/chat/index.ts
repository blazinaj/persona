import { OpenAI } from 'npm:openai@4.29.1';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { encode } from 'npm:gpt-3-encoder@1.1.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface Integration {
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
}

interface CustomFunction {
  name: string;
  description?: string;
  code: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  personaId: string;
  personality: string[];
  knowledge: string[];
  tone: string;
  functions?: CustomFunction[];
  userId: string;
  tokensNeeded: number;
  integrations?: Integration[];
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

// Token estimation helper
const estimateTokens = (text: string): number => {
  return encode(text).length;
};

// Check if message contains image generation request
const containsImageRequest = (message: string): boolean => {
  const imageKeywords = [
    // Direct image requests
    'generate an image',
    'create an image',
    'make an image',
    'create a picture',
    'generate a picture',
    'make a picture',
    
    // Artistic actions
    'draw',
    'paint',
    'sketch',
    'illustrate',
    'design',
    
    // Visualization requests
    'visualize',
    'imagine',
    'envision',
    'picture',
    
    // Common user phrases
    'show me',
    'can you show',
    'what would it look like',
    'create art',
    'make art',
    
    // Style-specific requests
    'in the style of',
    'photorealistic',
    'digital art',
    'concept art',
    
    // Action words with visual context
    'depicting',
    'portraying',
    'featuring',
    'displaying',
    
    // Scene descriptions
    'scene of',
    'picture of',
    'image of',
    'photo of',
    'create art',
    'design',
    'illustrate',
    'paint',
    'render'
  ];
  
  const message_lower = message.toLowerCase();
  
  // Check for direct matches
  if (imageKeywords.some(keyword => message_lower.includes(keyword))) {
    return true;
  }
  
  // Check for implied image requests
  const impliedPatterns = [
    /how .* looks?/i,
    /can .* visual/i,
    /create .* scene/i,
    /make .* look like/i,
    /generate .* visual/i
  ];
  
  return impliedPatterns.some(pattern => pattern.test(message));
};

// Enhanced prompt validation with more specific checks and feedback
const validateImagePrompt = (prompt: string): { isValid: boolean; reason?: string } => {
  // Check prompt length
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, reason: 'Prompt cannot be empty.' };
  }

  if (prompt.length > 4000) {
    return { 
      isValid: false, 
      reason: 'Prompt is too long. Please keep it under 4000 characters.' 
    };
  }

  if (prompt.length < 10) {
    return {
      isValid: false,
      reason: 'Prompt is too short. Please provide more details for better results.'
    };
  }

  // List of prohibited content keywords with categories
  const prohibitedContent = {
    adult: ['nude', 'naked', 'nsfw', 'porn', 'explicit', 'sexual'],
    violence: ['gore', 'blood', 'violent', 'gruesome', 'mutilation'],
    hate: ['hate speech', 'racist', 'discrimination', 'bigotry', 'offensive'],
    illegal: ['illegal', 'drugs', 'controlled substances'],
    identity: ['personal information', 'private data', 'confidential'],
    harmful: ['harmful', 'dangerous', 'suicide', 'self-harm']
  };

  // Check for prohibited content with specific feedback
  for (const [category, keywords] of Object.entries(prohibitedContent)) {
    for (const keyword of keywords) {
      if (prompt.toLowerCase().includes(keyword)) {
        return { 
          isValid: false, 
          reason: `Prompt contains prohibited ${category}-related content ("${keyword}"). Please ensure your request follows our content guidelines.`
        };
      }
    }
  }

  // Check for potential trademark/copyright issues
  const copyrightKeywords = ['trademark', 'copyright', 'brand logo', 'company logo'];
  for (const keyword of copyrightKeywords) {
    if (prompt.toLowerCase().includes(keyword)) {
      return {
        isValid: false,
        reason: 'Prompt may involve trademark or copyright issues. Please avoid requesting copyrighted content.'
      };
    }
  }

  // Check for balanced description
  if (!/\s/.test(prompt)) {
    return {
      isValid: false,
      reason: 'Prompt should contain multiple words for better results.'
    };
  }

  return { isValid: true };
};

// Enhanced prompt extraction with better guidance and fallback options
const extractImagePrompt = async (message: string, maxRetries = 3): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at crafting DALL-E image generation prompts. Create a detailed, vivid prompt that will generate high-quality, artistic images.

Guidelines:
- Focus on visual details, composition, lighting, and style
- Include artistic style references when appropriate
- Specify camera angles or viewpoints if relevant
- Add descriptive adjectives for mood and atmosphere
- Keep the prompt clear, focused, and family-friendly
- Avoid any inappropriate, offensive, or prohibited content
- Maximum length: 4000 characters
- Minimum length: 10 characters
- Do not include any trademarked or copyrighted content
- Ensure the description is balanced and coherent

Example good prompts:
- "A serene mountain landscape at sunset, with golden light filtering through pine trees, painted in a impressionistic style"
- "A futuristic city skyline with floating gardens and crystal spires, viewed from street level, digital art style"
- "A whimsical cafe interior with vintage decor, warm lighting, and steaming coffee cups on wooden tables"

Respond with just the prompt, no additional text.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const prompt = completion.choices[0].message.content || message;
      
      // Log the generated prompt for debugging
      console.log('Generated image prompt:', prompt);
      
      // Validate the generated prompt
      const validation = validateImagePrompt(prompt);
      if (!validation.isValid) {
        throw new Error(`Invalid prompt: ${validation.reason}`);
      }

      return prompt;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
      }
    }
  }

  // If all attempts fail, try a simplified version of the user's request
  try {
    const simplifiedPrompt = message
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(' ')
      .filter(word => word.length > 2) // Remove short words
      .slice(0, 10) // Take first 10 words
      .join(' ');
    
    const validation = validateImagePrompt(simplifiedPrompt);
    if (validation.isValid) {
      console.log('Using simplified fallback prompt:', simplifiedPrompt);
      return simplifiedPrompt;
    }
  } catch (error) {
    console.error('Fallback prompt generation failed:', error);
  }

  throw lastError || new Error('Failed to generate valid image prompt after multiple attempts');
};

// Calculate total tokens for all messages
const calculateTotalTokens = (messages: ChatMessage[], systemPrompt: string): number => {
  const allText = messages.map(m => m.content).join(' ') + systemPrompt;
  return estimateTokens(allText);
};

// Error handling helper
const handleError = (error: any) => {
  console.error('Chat error:', error);
  
  const isDev = Deno.env.get('DENO_ENV') === 'development';
  const errorMessage = error.message || 'Unknown error occurred';
  
  // Check for specific error types
  if (!openai.apiKey) {
    return {
      error: 'OpenAI API key is not configured',
      details: isDev ? 'Missing OPENAI_API_KEY environment variable' : undefined,
      status: 503
    };
  }
  
  if (errorMessage.includes('OpenAI')) {
    // Parse OpenAI error details if available
    let details = '';
    try {
      if (typeof error.response?.data === 'object') {
        details = JSON.stringify(error.response.data);
      }
    } catch (e) {
      details = errorMessage;
    }
    
    return {
      error: 'OpenAI API error: ' + details,
      details: isDev ? error.stack : undefined,
      status: error.status || 503
    };
  }
  
  if (errorMessage.includes('Validation')) {
    return {
      error: 'Invalid request data: ' + errorMessage,
      details: isDev ? error.stack : undefined,
      status: 400
    };
  }

  if (errorMessage.includes('Token limit exceeded')) {
    return {
      error: 'Token limit exceeded. Please start a new conversation or upgrade your plan.',
      details: isDev ? error.stack : undefined,
      status: 403
    };
  }

  if (errorMessage.includes('Failed to check token usage')) {
    return {
      error: 'Failed to verify token usage. Please try again.',
      details: isDev ? error.stack : undefined,
      status: 500
    };
  }

  if (errorMessage.includes('Failed to call integration')) {
    return {
      error: 'Integration error: ' + errorMessage,
      details: isDev ? error.stack : undefined,
      status: 500
    };
  }

  if (errorMessage.includes('Failed to generate image')) {
    // Check for specific DALL-E error patterns
    if (errorMessage.includes('invalid_request_error')) {
      return {
        error: 'Invalid image generation request. Please try a different description.',
        details: isDev ? error.stack : undefined,
        status: 400
      };
    }
    if (errorMessage.includes('content_policy_violation')) {
      return {
        error: 'Image generation request violated content policy. Please ensure your request follows our guidelines.',
        details: isDev ? error.stack : undefined,
        status: 400
      };
    }
    return {
      error: 'Image generation failed. Please try again with a different description.',
      details: isDev ? error.stack : undefined,
      status: 500
    };
  }
  
  return {
    error: 'An internal error occurred: ' + errorMessage,
    details: isDev ? error.stack : undefined,
    status: 500
  };
};

// Validation helper functions
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validateInput = (data: RequestBody) => {
  const errors = [];

  if (!data) {
    errors.push('Request body is missing');
    return errors;
  }

  if (!Array.isArray(data.messages) || data.messages.length === 0) {
    errors.push('Messages array is empty or missing');
  } else {
    for (const msg of data.messages) {
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        errors.push(`Invalid message role: ${msg.role}`);
      }
      if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
        errors.push('Message content is missing or invalid');
      }
    }
  }

  if (!data.personaId) {
    errors.push('PersonaId is missing');
  } else if (!isValidUUID(data.personaId)) {
    errors.push(`Invalid personaId format: ${data.personaId}`);
  }

  if (!data.userId) {
    errors.push('UserId is missing');
  } else if (!isValidUUID(data.userId)) {
    errors.push(`Invalid userId format: ${data.userId}`);
  }

  if (!Array.isArray(data.personality)) {
    errors.push('Personality must be an array');
  } else if (data.personality.length === 0) {
    errors.push('Personality array is empty');
  } else {
    for (const trait of data.personality) {
      if (typeof trait !== 'string' || trait.trim().length === 0) {
        errors.push('Invalid personality trait');
      }
    }
  }

  if (!Array.isArray(data.knowledge)) {
    errors.push('Knowledge must be an array');
  } else if (data.knowledge.length === 0) {
    errors.push('Knowledge array is empty');
  } else {
    for (const area of data.knowledge) {
      if (typeof area !== 'string' || area.trim().length === 0) {
        errors.push('Invalid knowledge area');
      }
    }
  }

  if (!data.tone || typeof data.tone !== 'string' || data.tone.trim().length === 0) {
    errors.push('Tone is missing or invalid');
  }

  if (data.integrations !== undefined) {
    if (!Array.isArray(data.integrations)) {
      errors.push('Integrations must be an array');
    } else {
      data.integrations.forEach((integration, index) => {
        if (!integration.name || typeof integration.name !== 'string') {
          errors.push(`Integration at index ${index} is missing a name or has invalid name type`);
        }
        if (!integration.endpoint || typeof integration.endpoint !== 'string') {
          errors.push(`Integration at index ${index} is missing an endpoint or has invalid endpoint type`);
        }
        if (!integration.method || typeof integration.method !== 'string') {
          errors.push(`Integration at index ${index} is missing a method or has invalid method type`);
        }
        if (!integration.headers || typeof integration.headers !== 'object') {
          errors.push(`Integration at index ${index} has invalid headers`);
        }
        if (!integration.parameters || typeof integration.parameters !== 'object') {
          errors.push(`Integration at index ${index} has invalid parameters`);
        }
      });
    }
  }

  return errors;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is configured
    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    let requestData: RequestBody;
    try {
      requestData = await req.json();
      console.log('Received request data:', JSON.stringify(requestData));
    } catch (error) {
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }

    // Validate input
    const validationErrors = validateInput(requestData);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const { messages, personaId, personality, knowledge, tone, userId, tokensNeeded, integrations = [], functions = [] } = requestData;

    // Check if the latest message contains an image generation request
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role === 'user' && containsImageRequest(latestMessage.content)) {
      try {
        // Extract and validate image prompt
        const imagePrompt = await extractImagePrompt(latestMessage.content);
        console.log('Generated image prompt:', imagePrompt);
        
        // Validate the prompt before sending to DALL-E
        const validation = validateImagePrompt(imagePrompt);
        if (!validation.isValid) {
          throw new Error(`Invalid image prompt: ${validation.reason}`);
        }
        
        // Generate image with error handling and retries
        let image;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            image = await openai.images.generate({
              model: 'dall-e-3',
              prompt: imagePrompt,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
              style: 'natural'
            });
            break; // Success, exit loop
          } catch (error) {
            retryCount++;
            console.error(`Image generation attempt ${retryCount} failed:`, error);
            
            if (retryCount === maxRetries) {
              throw error; // Rethrow if all retries failed
            }
            
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          }
        }

        if (!image?.data?.[0]?.url) {
          throw new Error('No image URL received from OpenAI');
        }

        // Get the image URL and revised prompt
        const imageUrl = image.data[0].url;
        const revisedPrompt = image.data[0].revised_prompt;

        // Generate a description of the image
        const description = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an art critic and image analyst. Describe the generated image in a concise but engaging way, highlighting its key features and artistic elements.'
            },
            {
              role: 'user',
              content: `The image was generated with this prompt: ${revisedPrompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        });

        // Return both the image URL and a description
        return new Response(
          JSON.stringify({
            message: `Here's the generated image based on your request:\n\n${description.choices[0].message.content}\n\nLet me know if you'd like any adjustments or have questions about the result.`,
            imageUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Image generation error:', error);
        throw new Error(`Failed to generate image: ${error.message}`);
      }
    }

    // Create system prompt
    let systemPrompt = `You are an AI assistant with the following characteristics:
- Personality traits: ${personality.join(', ')}
- Knowledge areas: ${knowledge.join(', ')}
- Communication style: ${tone}

You have access to the following custom functions:
${functions?.map(f => `- ${f.name}: ${f.description || 'No description'}`).join('\n') || 'No custom functions available'}`;

    if (integrations.length > 0) {
      systemPrompt += `\n\nYou have access to the following integrations:\n${integrations
        .map(i => `- ${i.name}: ${i.description || 'No description provided'}`)
        .join('\n')}`;
    }

    systemPrompt += '\n\nRespond to user queries while maintaining these traits and expertise areas. Keep responses focused and relevant.';

    // Calculate total tokens including system prompt
    const totalTokens = tokensNeeded;
    console.log('Estimated total tokens:', totalTokens);

    // Check if total tokens exceed the model's limit (assuming GPT-4 with 8k context)
    const TOKEN_LIMIT = 6000; // Leave more buffer for the response
    if (totalTokens > TOKEN_LIMIT) {
      throw new Error('Token limit exceeded. Please send a shorter message or start a new conversation.');
    }

    console.log('Checking token usage for user:', userId, 'tokens needed:', tokensNeeded);
    
    // Check token usage
    const { data: hasTokens, error: tokenError } = await supabase
      .rpc('check_token_usage', {
        user_id_input: userId,
        tokens_needed: tokensNeeded
      });

    if (tokenError) {
      console.error('Token usage check error:', tokenError);
      throw new Error(`Failed to check token usage: ${tokenError.message}`);
    }

    console.log('Token usage check result:', hasTokens);

    if (!hasTokens) {
      throw new Error('Token limit exceeded. Please upgrade your plan.');
    }

    console.log('Sending request to OpenAI with system prompt:', systemPrompt);

    // Prepare OpenAI API request options
    const requestOptions: any = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ], 
      temperature: 0.7,
      max_tokens: 400,
      functions: [
        {
          name: "generateImage",
          description: "Generate an image based on a text description",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "A detailed description of the image to generate"
              },
              style: {
                type: "string",
                enum: ["natural", "vivid"],
                description: "The style of the generated image"
              }
            },
            required: ["prompt"]
          }
        }
      ],
      function_call: "auto"
    };

    // Only include functions if integrations are present
    if (integrations.length > 0) {
      requestOptions.functions = [...requestOptions.functions, ...integrations.map(i => ({
        name: i.name,
        description: i.description || '',
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(i.parameters || {}).map(([key, value]) => [
              key,
              { type: 'string', description: value }
            ])
          )
        }
      }))];
    }

    // Add custom functions if present
    if (functions?.length > 0) {
      requestOptions.functions = [...(requestOptions.functions || []), ...functions.map(f => ({
        name: f.name,
        description: f.description || '',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'object',
              description: 'Input parameters for the function'
            }
          }
        }
      }))];
    }

    // Get completion from OpenAI
    const completion = await openai.chat.completions.create(requestOptions);

    // Handle function calls
    const message = completion.choices[0].message;
    if (message.function_call) {
      // Handle custom functions
      const customFunction = functions?.find(f => f.name === message.function_call.name);
      if (customFunction) {
        try {
          const args = JSON.parse(message.function_call.arguments);
          
          // Prepare execution context
          const { data: contextData, error: contextError } = await supabase
            .rpc('prepare_execution_context', {
              function_id: customFunction.id,
              input_params: args.input || {}
            });

          if (contextError) throw contextError;
          if (!contextData.success) throw new Error(contextData.error);
          
          // Execute the function
          const { data: result, error: execError } = await supabase
            .rpc('execute_custom_function', {
              function_code: contextData.context.function.code,
              input_params: contextData.context.input
            });

          if (execError) throw execError;
          
          return new Response(
            JSON.stringify({ 
              message: result.success 
                ? `Function executed successfully: ${JSON.stringify(result.result)}`
                : `Function execution failed: ${result.error}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Function execution error:', error);
          return new Response(
            JSON.stringify({
              error: `Failed to execute function: ${error.message}`
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      if (message.function_call.name === "generateImage") {
        // Parse the function arguments
        const { prompt, style = "natural" } = JSON.parse(message.function_call.arguments);
        
        // Generate image with DALL-E
        const image = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style
        });

        if (!image?.data?.[0]?.url) {
          throw new Error('No image URL received from OpenAI');
        }

        // Get the image URL and revised prompt
        const imageUrl = image.data[0].url;
        const revisedPrompt = image.data[0].revised_prompt;

        return new Response(
          JSON.stringify({
            message: `Here's the generated image based on your request:\n\n${revisedPrompt}`,
            imageUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (integrations.length > 0) {
        const integration = integrations.find(i => i.name === message.function_call.name);
        if (integration) {
          try {
            console.log('Calling integration:', integration.name);
            const params = JSON.parse(message.function_call.arguments);
            console.log('Integration parameters:', params);
            
            const response = await fetch(integration.endpoint, {
              method: integration.method,
              headers: {
                'Content-Type': 'application/json',
                ...integration.headers
              },
              body: JSON.stringify(params)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Integration error response:', errorText);
              throw new Error(`Integration error: ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Integration response:', data);
            
            return new Response(
              JSON.stringify({ message: data.message || JSON.stringify(data) }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            console.error('Integration error:', error);
            throw new Error(`Failed to call integration: ${error.message}`);
          }
        }
      }
    }

    console.log('Received response from OpenAI');

    return new Response(
      JSON.stringify({ message: completion.choices[0].message.content }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const { error: errorMessage, details, status } = handleError(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage, details }),
      { 
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});