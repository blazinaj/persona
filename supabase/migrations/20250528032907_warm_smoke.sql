/*
  # Fix persona views RLS policy
  
  1. Changes
    - Drop existing policies for persona_views table
    - Create new policies that properly handle view tracking
    - Fix policy expressions to allow proper access
  
  2. Security
    - Ensure users can only track views for accessible personas
    - Allow viewing stats for public/unlisted personas
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;
DROP POLICY IF EXISTS "Users can view view history" ON persona_views;

-- Create new INSERT policy
CREATE POLICY "Users can track their views"
ON persona_views
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only set their own ID as viewer_id
  viewer_id = auth.uid()
  AND
  -- Allow viewing if:
  -- 1. The persona is public/unlisted OR
  -- 2. The user owns the persona
  EXISTS (
    SELECT 1
    FROM personas
    WHERE personas.id = persona_views.persona_id
    AND (
      personas.visibility IN ('public', 'unlisted')
      OR personas.user_id = auth.uid()
    )
  )
);

-- Create new SELECT policy
CREATE POLICY "Users can view view history"
ON persona_views
FOR SELECT
TO authenticated
USING (
  -- Users can see:
  -- 1. Their own view history OR
  -- 2. Views on their personas
  viewer_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM personas
    WHERE personas.id = persona_views.persona_id
    AND personas.user_id = auth.uid()
  )
);