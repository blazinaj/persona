import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, personaId, personality, knowledge, tone } = await req.json();

  const systemPrompt = `You are an AI assistant with the following characteristics:
- Personality traits: ${personality.join(', ')}
- Knowledge areas: ${knowledge.join(', ')}
- Communication style: ${tone}

Respond to user queries while maintaining these traits and expertise areas. Keep responses focused and relevant.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}