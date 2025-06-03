/*
  # Fix ambiguous user_id reference in get_space_messages function
  
  1. Changes
    - Drop existing function
    - Recreate with fully qualified column references
    - Use subqueries instead of joins to avoid ambiguity
    - Ensure proper error handling
  
  2. Security
    - Maintain SECURITY DEFINER to ensure proper access control
    - Keep access checks intact
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_space_messages;

-- Recreate the function with explicit column references
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
  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      spaces.user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_members.space_id = space_id_input
        AND space_members.user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space messages';
  END IF;

  RETURN QUERY
  SELECT 
    sm.id as space_messages_id,
    sm.space_id,
    sm.content,
    sm.persona_id,
    sm.user_id,
    sm.created_at,
    CASE
      WHEN sm.persona_id IS NOT NULL THEN 
        (SELECT name FROM personas WHERE personas.id = sm.persona_id)
      WHEN sm.user_id IS NOT NULL THEN 
        COALESCE(
          (SELECT display_name FROM profiles WHERE profiles.id = sm.user_id),
          (SELECT email FROM auth.users WHERE auth.users.id = sm.user_id),
          'Unknown User'
        )
      ELSE 'Unknown'
    END as sender_name,
    CASE
      WHEN sm.persona_id IS NOT NULL THEN 
        (SELECT avatar FROM personas WHERE personas.id = sm.persona_id)
      WHEN sm.user_id IS NOT NULL THEN 
        (SELECT avatar_url FROM profiles WHERE profiles.id = sm.user_id)
      ELSE NULL
    END as sender_avatar,
    (sm.persona_id IS NOT NULL) as is_persona
  FROM space_messages sm
  WHERE sm.space_id = space_id_input
  ORDER BY sm.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;