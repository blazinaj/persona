/*
  # Fix infinite recursion in spaces policies

  1. Changes
    - Drop existing policies on spaces table
    - Create new policies that avoid recursive checks
    - Simplify policy logic to prevent infinite loops
    
  2. Security
    - Maintain same level of access control
    - Ensure users can only access appropriate spaces
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view owned spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view public spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Create new policies without recursion
CREATE POLICY "Users can view spaces"
ON spaces
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR user_id = auth.uid()
);

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

-- Create separate policy for members to view spaces
CREATE POLICY "Members can view spaces"
ON spaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM space_members 
    WHERE space_members.space_id = spaces.id 
    AND space_members.user_id = auth.uid()
  )
);