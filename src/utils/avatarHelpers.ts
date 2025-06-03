import { DEFAULT_PERSONA_AVATAR } from './constants';

interface PersonaWithAvatar {
  avatar?: string | null;
  name?: string;
}

/**
 * Get the avatar URL, handling different formats and providing a default
 * 
 * @param persona The persona object or avatar string
 * @returns A valid URL for the avatar
 */
export const getAvatarUrl = (persona?: PersonaWithAvatar | string | null): string => {
  // Handle null/undefined input
  if (!persona) {
    return DEFAULT_PERSONA_AVATAR;
  }

  // If persona is an object, extract the avatar
  const avatarValue = typeof persona === 'object' ? persona.avatar : persona;

  // Handle null/undefined avatar or non-string values
  if (!avatarValue || typeof avatarValue !== 'string') {
    return DEFAULT_PERSONA_AVATAR;
  }
  
  // If it's already a full URL, return it
  if (avatarValue.startsWith('http')) {
    return avatarValue;
  }
  
  // If it's a storage path, construct the URL
  if (avatarValue.startsWith('avatars/') || avatarValue.includes('/avatars/')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/persona-avatars/${avatarValue}`;
  }
  
  // Fallback to default
  return DEFAULT_PERSONA_AVATAR;
};