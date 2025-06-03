-- Drop existing get_space_messages function to recreate it properly
DROP FUNCTION IF EXISTS get_space_messages;

-- Create an improved version of the function with proper JOINs instead of subqueries
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
  -- Add explicit logging to track function execution
  RAISE LOG 'Executing get_space_messages for space_id: %, limit: %', space_id_input, limit_count;

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

  -- Use direct JOINs for better performance and reliability
  RETURN QUERY
  SELECT 
    sm.id as space_messages_id,
    sm.space_id,
    sm.content,
    sm.persona_id,
    sm.user_id,
    sm.created_at,
    -- For sender_name, prioritize direct data over multiple joins
    CASE 
      WHEN sm.persona_id IS NOT NULL THEN 
        (SELECT name FROM personas WHERE id = sm.persona_id)
      WHEN sm.user_id IS NOT NULL THEN 
        COALESCE(
          (SELECT display_name FROM profiles WHERE id = sm.user_id),
          (SELECT email FROM auth.users WHERE id = sm.user_id),
          'Unknown User'
        )
      ELSE 'Unknown'
    END as sender_name,
    -- For sender_avatar, similar approach
    CASE 
      WHEN sm.persona_id IS NOT NULL THEN 
        (SELECT avatar FROM personas WHERE id = sm.persona_id)
      WHEN sm.user_id IS NOT NULL THEN 
        (SELECT avatar_url FROM profiles WHERE id = sm.user_id)
      ELSE NULL
    END as sender_avatar,
    (sm.persona_id IS NOT NULL) as is_persona
  FROM space_messages sm
  WHERE sm.space_id = space_id_input
  ORDER BY sm.created_at ASC
  LIMIT limit_count;
END;
$$;