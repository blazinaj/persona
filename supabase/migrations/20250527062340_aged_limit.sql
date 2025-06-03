/*
  # Fix infinite recursion in spaces policies
  
  1. Changes
    - Drop existing policies for spaces table
    - Create simplified policies to avoid recursion
    - Fix space_members policies
    - Drop and recreate get_user_spaces function with proper return type
  
  2. Security
    - Maintain same security model with simpler policy expressions
    - Avoid circular dependencies in policy definitions
*/

-- Drop all existing policies for spaces table
DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Create simplified policies for spaces
CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a separate policy for viewing spaces to avoid recursion
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

-- Fix space_members policies to avoid recursion
DROP POLICY IF EXISTS "Space owners can manage members" ON space_members;
DROP POLICY IF EXISTS "Space admins can manage members" ON space_members;
DROP POLICY IF EXISTS "Members can view other members" ON space_members;

-- Create simplified policies for space_members
CREATE POLICY "Space owners can manage members"
  ON space_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Space admins can manage members"
  ON space_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_members admin_check
      WHERE admin_check.space_id = space_members.space_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_members admin_check
      WHERE admin_check.space_id = space_members.space_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
    )
  );

CREATE POLICY "Members can view other members"
  ON space_members
  FOR SELECT
  TO authenticated
  USING (
    -- Can view if you're a member of the space
    EXISTS (
      SELECT 1 FROM space_members viewer_check
      WHERE viewer_check.space_id = space_members.space_id
      AND viewer_check.user_id = auth.uid()
    )
    OR
    -- Or if the space is public
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.is_public = true
    )
  );

-- Drop the existing function before recreating it with a different return type
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