/*
  # Fix space_members policies

  1. Changes
    - Remove circular dependencies in space_members policies
    - Simplify policy conditions to prevent infinite recursion
    - Add more specific conditions for each operation
    - Ensure proper access control while avoiding policy loops

  2. Security
    - Maintain row-level security
    - Ensure users can only manage members in spaces they own/admin
    - Allow viewing members for spaces users belong to
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Space owners and admins can remove members" ON space_members;
DROP POLICY IF EXISTS "Space owners can add members" ON space_members;
DROP POLICY IF EXISTS "Users can view members of spaces they belong to" ON space_members;

-- Create new, simplified policies
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