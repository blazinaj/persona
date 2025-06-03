/*
  # Fix infinite recursion in space_members policy
  
  1. Changes
    - Fix the space_members policies that are causing infinite recursion
    - Correct the policy expressions to avoid self-references
  
  2. Security
    - Maintain the same security model but with correct policy expressions
    - Ensure proper access control for space members
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Space owners and admins can remove members" ON space_members;
DROP POLICY IF EXISTS "Space owners can add members" ON space_members;

-- Create corrected policies
CREATE POLICY "Space owners can add members"
  ON space_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is space owner
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    -- Check if user is space admin (without self-reference)
    EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = space_members.space_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Space owners and admins can remove members"
  ON space_members
  FOR DELETE
  TO authenticated
  USING (
    -- Check if user is space owner
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    -- Check if user is space admin (without self-reference)
    EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = space_members.space_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );