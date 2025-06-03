import { Persona } from '../types';

// Function to get the best voice for a persona
export function getVoiceForPersona(persona: Persona | undefined): string {
  // Map persona traits to appropriate voices
  // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
  
  // Default to alloy
  let voice = 'alloy';
  
  // Check if persona has explicit voice settings
  if (persona && persona.voice && persona.voice.gender) {
    // Map gender preference to appropriate voice
    if (persona.voice.gender === 'female') {
      voice = 'nova'; // Female voice
    } else if (persona.voice.gender === 'male') {
      voice = 'onyx'; // Male voice
    } else if (persona.voice.gender === 'neutral') {
      voice = 'alloy'; // Neutral voice
    }
  } else if (persona) {
    // Otherwise infer from personality and tone
    const isFormal = persona.personality?.includes('professional') || 
                    persona.tone === 'formal';
    
    const isCreative = persona.personality?.includes('creative') ||
                      persona.personality?.includes('humorous');
                      
    const isFriendly = persona.personality?.includes('friendly') ||
                      persona.tone === 'casual';
    
    // Select voice based on personality traits
    if (isFormal) {
      voice = 'onyx'; // More formal, deeper voice
    } else if (isCreative) {
      voice = 'fable'; // More expressive, good for creative content
    } else if (isFriendly) {
      voice = 'nova'; // Warm, friendly voice
    }
  }
  
  return voice;
}

// Function to determine speech speed based on persona
export function getSpeechSpeed(persona: Persona | undefined): number {
  // Default speed
  let speed = 1.0;
  
  // Use explicit settings if available
  if (persona && persona.voice && persona.voice.rate) {
    return persona.voice.rate;
  }
  
  if (persona) {
    // Otherwise infer from personality and tone
    const isEnthusiastic = persona.personality?.includes('enthusiastic') || 
                          persona.tone === 'enthusiastic';
    
    const isFormal = persona.personality?.includes('professional') || 
                    persona.tone === 'formal';
    
    const isAnalytical = persona.personality?.includes('analytical');
    
    // Adjust speed based on personality
    if (isEnthusiastic) {
      speed = 1.1; // Slightly faster for enthusiastic personas
    } else if (isFormal || isAnalytical) {
      speed = 0.9; // Slightly slower for formal or analytical personas
    }
  }
  
  return speed;
}

// Function to get pitch for speech synthesis
export function getSpeechPitch(persona: Persona | undefined): number {
  // Default pitch
  let pitch = 1.0;
  
  // Use explicit settings if available
  if (persona && persona.voice && persona.voice.pitch) {
    return persona.voice.pitch;
  }
  
  // Otherwise infer from personality, tone, and age
  const isYoung = persona && persona.voice && persona.voice.age === 'young';
  const isElderly = persona && persona.voice && persona.voice.age === 'elderly';
  
  // Adjust pitch based on age
  if (isYoung) {
    pitch = 1.2; // Higher pitch for younger voices
  } else if (isElderly) {
    pitch = 0.8; // Lower pitch for elderly voices
  }
  
  return pitch;
}

// Function to clean text for speech synthesis
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image markdown
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