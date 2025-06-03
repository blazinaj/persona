/*
  # Fix infinite recursion in RLS policies
  
  1. Changes
    - Simplify RLS policies for spaces and space_members tables
    - Remove circular references between policies
    - Create separate, non-recursive policies for different operations
    - Fix the get_user_spaces function to avoid policy recursion
  
  2. Security
    - Maintain the same security model with proper access controls
    - Ensure users can only access spaces they own, are members of, or are public
*/

-- First, drop all existing policies on spaces table
DROP POLICY IF EXISTS "Users can view spaces" ON spaces;
DROP POLICY IF EXISTS "Members can view spaces" ON spaces;
DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Create simplified policies for spaces
CREATE POLICY "Users can view owned spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a separate function to check space membership
-- This avoids the recursive policy evaluation
CREATE OR REPLACE FUNCTION is_space_member(space_id_input UUID, user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM space_members
    WHERE space_id = space_id_input
    AND user_id = user_id_input
  );
END;
$$;

-- Create a policy for members to view spaces using the helper function
CREATE POLICY "Members can view spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (is_space_member(id, auth.uid()));

-- Drop existing policies on space_members
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

-- Create a function to check if a user is a space admin
CREATE OR REPLACE FUNCTION is_space_admin(space_id_input UUID, user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM space_members
    WHERE space_id = space_id_input
    AND user_id = user_id_input
    AND role = 'admin'
  );
END;
$$;

-- Create policy for admins using the helper function
CREATE POLICY "Space admins can manage members"
  ON space_members
  FOR ALL
  TO authenticated
  USING (is_space_admin(space_id, auth.uid()))
  WITH CHECK (is_space_admin(space_id, auth.uid()));

-- Create policy for viewing members
CREATE POLICY "Members can view other members"
  ON space_members
  FOR SELECT
  TO authenticated
  USING (
    is_space_member(space_id, auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.is_public = true
    )
  );

-- Fix the get_user_spaces function to avoid recursion
DROP FUNCTION IF EXISTS get_user_spaces(UUID);

CREATE OR REPLACE FUNCTION get_user_spaces(user_id_input UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  is_public BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function bypasses RLS and directly queries the tables
  -- to avoid the infinite recursion issue
  RETURN QUERY
  SELECT DISTINCT s.*
  FROM spaces s
  LEFT JOIN space_members sm ON s.id = sm.space_id
  WHERE 
    s.user_id = user_id_input
    OR s.is_public = true
    OR sm.user_id = user_id_input
  ORDER BY s.updated_at DESC;
END;
$$;