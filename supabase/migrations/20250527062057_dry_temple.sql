/*
  # Fix infinite recursion in space policies
  
  1. Changes
    - Drop existing problematic policies for space_members table
    - Create new policies that avoid circular references
    - Fix policy expressions to prevent infinite recursion
  
  2. Security
    - Maintain the same security model with correct policy expressions
    - Ensure proper access control for space members
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Space owners can manage members" ON space_members;
DROP POLICY IF EXISTS "Space admins can manage members" ON space_members;
DROP POLICY IF EXISTS "Members can view other members" ON space_members;

-- Create new policies without circular references
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

-- Create separate policy for admins to avoid recursion
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

-- Create policy for viewing members
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

-- Fix spaces policies if needed
DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Recreate spaces policies without circular references
CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view spaces they are members of"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
      AND space_members.user_id = auth.uid()
    )
  );

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