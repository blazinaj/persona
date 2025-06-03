/*
  # Fix ambiguous user_id reference in get_space_messages function

  1. Changes
    - Drop and recreate get_space_messages function with explicit table aliases
    - Qualify ambiguous user_id references with table aliases
    - Maintain existing functionality while fixing the column ambiguity

  2. Technical Details
    - Use explicit table aliases throughout the query
    - Qualify all column references that exist in multiple tables
    - Preserve the existing return type and parameters
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_space_messages;

-- Recreate the function with explicit table aliases
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
    sm.id as space_messages_id,
    sm.space_id,
    sm.content,
    sm.persona_id,
    sm.user_id,
    sm.created_at,
    CASE
      WHEN sm.persona_id IS NOT NULL THEN p.name
      WHEN sm.user_id IS NOT NULL THEN COALESCE(prof.display_name, 'Unknown User')
    END as sender_name,
    CASE
      WHEN sm.persona_id IS NOT NULL THEN p.avatar
      WHEN sm.user_id IS NOT NULL THEN prof.avatar_url
    END as sender_avatar,
    (sm.persona_id IS NOT NULL) as is_persona
  FROM space_messages sm
  LEFT JOIN personas p ON sm.persona_id = p.id
  LEFT JOIN profiles prof ON sm.user_id = prof.id
  WHERE sm.space_id = space_id_input
  ORDER BY sm.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;