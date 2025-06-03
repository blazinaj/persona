/*
  # Update get_user_spaces function

  1. Changes
     - Update the `get_user_spaces` function to include `coordinator_instructions` column in its return type
     - This fixes the error "structure of query does not match function result type"
     - The function was previously returning 8 columns but was only defined to return 7
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_spaces(uuid);

-- Recreate the function with the correct return type including coordinator_instructions
CREATE OR REPLACE FUNCTION get_user_spaces(user_id_input uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  is_public boolean,
  coordinator_instructions text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get spaces where the user is a member or owner
  SELECT DISTINCT s.id, s.name, s.description, s.created_at, s.updated_at, s.user_id, s.is_public, s.coordinator_instructions
  FROM spaces s
  LEFT JOIN space_members sm ON s.id = sm.space_id
  WHERE s.user_id = user_id_input
  OR sm.user_id = user_id_input
  OR s.is_public = true
  ORDER BY s.updated_at DESC;
$$;