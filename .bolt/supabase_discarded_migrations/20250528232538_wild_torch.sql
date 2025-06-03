/*
  # Fix get_space_messages function
  
  1. Changes
    - Drop existing function first to avoid return type error
    - Recreate function with explicit column aliasing
    - Fix ambiguous column references
    - Change order to chronological (ASC)
  
  2. Security
    - Maintain SECURITY DEFINER attribute
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      WHEN sm.user_id IS NOT NULL THEN COALESCE(pr.display_name, u.email, 'Unknown User')
      ELSE 'Unknown'
    END as sender_name,
    CASE 
      WHEN sm.persona_id IS NOT NULL THEN p.avatar
      WHEN sm.user_id IS NOT NULL THEN pr.avatar_url
      ELSE NULL
    END as sender_avatar,
    (sm.persona_id IS NOT NULL) as is_persona
  FROM space_messages sm
  LEFT JOIN personas p ON sm.persona_id = p.id
  LEFT JOIN auth.users u ON sm.user_id = u.id
  LEFT JOIN profiles pr ON sm.user_id = pr.id
  WHERE sm.space_id = space_id_input
  ORDER BY sm.created_at ASC
  LIMIT limit_count;
END;
$$;