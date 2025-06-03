/*
  # Fix get_user_spaces function and spaces policies
  
  1. Changes
    - Drop existing get_user_spaces function before recreating it
    - Fix return type of get_user_spaces function
    - Ensure no circular references in policies
  
  2. Security
    - Maintain proper access controls
    - Avoid infinite recursion in policies
*/

-- Drop the existing function before recreating it
DROP FUNCTION IF EXISTS get_user_spaces(UUID);

-- Recreate get_user_spaces function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_spaces(user_id_input UUID)
RETURNS SETOF spaces
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return spaces owned by the user
  RETURN QUERY
  SELECT s.*
  FROM spaces s
  WHERE s.user_id = user_id_input
  
  UNION
  
  -- Return public spaces
  SELECT s.*
  FROM spaces s
  WHERE s.is_public = true
  
  UNION
  
  -- Return spaces where the user is a member
  SELECT s.*
  FROM spaces s
  JOIN space_members sm ON s.id = sm.space_id
  WHERE sm.user_id = user_id_input
  
  ORDER BY updated_at DESC;
END;
$$;

-- Ensure we have the right policies for spaces
-- First drop any existing policies
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can view owned spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view public spaces" ON spaces;

-- Create separate policies for viewing spaces to avoid recursion
CREATE POLICY "Users can view owned spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can view spaces they are members of"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
      AND space_members.user_id = auth.uid()
    )
  );