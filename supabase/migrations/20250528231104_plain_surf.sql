/*
  # Fix space coordinator functions
  
  1. New Functions
    - `get_space_persona_members`: Gets all persona members of a space with their details
    - `get_space_user_members`: Gets all user members of a space with their details
  
  2. Security
    - Functions use SECURITY DEFINER to ensure proper access control
    - Validate space access before retrieving members
*/

-- Function to get all persona members of a space
CREATE OR REPLACE FUNCTION get_space_persona_members(
  space_id_input UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  personality TEXT[],
  knowledge TEXT[],
  tone TEXT,
  instructions TEXT,
  avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space members';
  END IF;

  -- Return all persona members with their details
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.personality,
    p.knowledge,
    p.tone,
    p.instructions,
    p.avatar
  FROM space_members sm
  JOIN personas p ON sm.persona_id = p.id
  WHERE sm.space_id = space_id_input
  AND sm.persona_id IS NOT NULL;
END;
$$;

-- Function to get all user members of a space
CREATE OR REPLACE FUNCTION get_space_user_members(
  space_id_input UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space members';
  END IF;

  -- Return all user members with their details
  RETURN QUERY
  SELECT 
    sm.user_id,
    p.display_name,
    u.email,
    p.avatar_url,
    sm.role
  FROM space_members sm
  JOIN auth.users u ON sm.user_id = u.id
  LEFT JOIN profiles p ON sm.user_id = p.id
  WHERE sm.space_id = space_id_input
  AND sm.user_id IS NOT NULL;
END;
$$;

-- Fix the get_space_messages function to return proper data
DROP FUNCTION IF EXISTS get_space_messages(uuid, integer);

CREATE OR REPLACE FUNCTION get_space_messages(
  space_id_input uuid,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
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
  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space messages';
  END IF;

  -- Return messages with sender information
  RETURN QUERY
  SELECT 
    m.id,
    m.space_id,
    m.content,
    m.persona_id,
    m.user_id,
    m.created_at,
    CASE
      WHEN m.persona_id IS NOT NULL THEN p.name
      WHEN m.user_id IS NOT NULL THEN COALESCE(pr.display_name, u.email)
      ELSE 'Unknown'
    END AS sender_name,
    CASE
      WHEN m.persona_id IS NOT NULL THEN p.avatar
      WHEN m.user_id IS NOT NULL THEN pr.avatar_url
      ELSE NULL
    END AS sender_avatar,
    (m.persona_id IS NOT NULL) AS is_persona
  FROM 
    space_messages m
    LEFT JOIN personas p ON m.persona_id = p.id
    LEFT JOIN auth.users u ON m.user_id = u.id
    LEFT JOIN profiles pr ON m.user_id = pr.id
  WHERE 
    m.space_id = space_id_input
  ORDER BY 
    m.created_at DESC
  LIMIT limit_count;
END;
$$;