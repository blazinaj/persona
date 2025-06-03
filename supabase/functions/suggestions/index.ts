import { OpenAI } from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  personaId: string;
  personality?: string[];
  knowledge?: string[];
  tone?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, personality = [], knowledge = [], tone = 'neutral' } = await req.json() as RequestBody;

    // Generate contextual suggestions based on the conversation
    let suggestions: string[];

    // If we have messages, use OpenAI to generate contextual suggestions
    if (messages.length > 0) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that generates helpful follow-up questions or prompts based on a conversation.
              
Generate 3 short, specific follow-up questions or prompts that would be natural for a user to ask next in this conversation.
The AI persona has these traits: ${personality.join(', ')}
Knowledge areas: ${knowledge.join(', ')}
Communication style: ${tone}

Format your response as a JSON array of strings, with no additional text.
Example: ["Question 1?", "Question 2?", "Can you explain more about X?"]`
            },
            ...messages.slice(-3) // Use the last 3 messages for context
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.suggestions)) {
              suggestions = parsed.suggestions;
            } else if (Array.isArray(parsed)) {
              suggestions = parsed;
            } else {
              // Fallback if the format is unexpected
              suggestions = generateFallbackSuggestions(messages, knowledge);
            }
          } catch (parseError) {
            console.error('Error parsing OpenAI response:', parseError);
            suggestions = generateFallbackSuggestions(messages, knowledge);
          }
        } else {
          suggestions = generateFallbackSuggestions(messages, knowledge);
        }
      } catch (aiError) {
        console.error('Error calling OpenAI:', aiError);
        suggestions = generateFallbackSuggestions(messages, knowledge);
      }
    } else {
      // No messages yet, use knowledge-based suggestions
      suggestions = generateFallbackSuggestions([], knowledge);
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Return fallback suggestions even on error
    const fallbackSuggestions = [
      'Could you tell me more about this topic?',
      'What are the key points I should know?',
      'Can you provide an example?'
    ];
    
    return new Response(
      JSON.stringify({ suggestions: fallbackSuggestions }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  }
});

// Function to generate fallback suggestions when OpenAI is unavailable
function generateFallbackSuggestions(messages: Message[], knowledge: string[]): string[] {
  // Get the last message for context if available
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const context = lastMessage?.content.toLowerCase() || '';

  if (context.includes('help') || context.includes('assist')) {
    return [
      'What specific assistance do you need?',
      'Could you provide more details about your request?',
      'Let me know what you\'d like help with.',
    ];
  } else if (context.includes('explain') || context.includes('how')) {
    return [
      'Could you clarify which part needs more explanation?',
      'Would you like a step-by-step breakdown?',
      'Should I provide some examples to illustrate?',
    ];
  } else if (context.includes('example') || context.includes('instance')) {
    return [
      'Would you like more examples?',
      'Should I explain this example in more detail?',
      'How about a different type of example?',
    ];
  } else if (knowledge.length > 0) {
    // Use the persona's knowledge areas for suggestions
    return [
      `Tell me more about ${knowledge[0]}`,
      `What's your approach to problems in ${knowledge[0]}?`,
      `Could you explain a concept from ${knowledge[0]}?`,
    ];
  } else {
    // Default suggestions
    return [
      'Could you elaborate on that?',
      'What are your thoughts on this?',
      'How should we proceed?',
    ];
  }
}