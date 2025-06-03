/*
  # Fix get_space_messages function to resolve ambiguous column references
  
  1. Changes
    - Drop existing function before redefining it
    - Use explicit table references for all columns
    - Rename id column to space_messages_id to avoid ambiguity
    - Improve join conditions and result formatting
  
  2. Security
    - Maintain SECURITY DEFINER to ensure proper access control
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS get_space_messages(uuid, integer);

-- Then recreate with the new return type and implementation
CREATE OR REPLACE FUNCTION get_space_messages(
  space_id_input uuid,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  space_messages_id uuid,
  space_id uuid,
  content text,
  persona_id uuid,
  user_id uuid,
  created_at timestamptz,
  sender_name text,
  sender_avatar text,
  is_persona boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    space_messages.id as space_messages_id,
    space_messages.space_id,
    space_messages.content,
    space_messages.persona_id,
    space_messages.user_id,
    space_messages.created_at,
    COALESCE(
      personas.name,
      profiles.display_name,
      'Unknown User'
    ) as sender_name,
    COALESCE(
      personas.avatar,
      profiles.avatar_url
    ) as sender_avatar,
    (space_messages.persona_id IS NOT NULL) as is_persona
  FROM space_messages
  LEFT JOIN personas ON space_messages.persona_id = personas.id
  LEFT JOIN profiles ON space_messages.user_id = profiles.id
  WHERE space_messages.space_id = space_id_input
  ORDER BY space_messages.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;