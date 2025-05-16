/*
  # Fix persona views RLS policies

  1. Changes
    - Drop existing RLS policies for persona_views
    - Add new policies that properly handle view tracking
    - Fix policy expressions to allow proper access

  2. Security
    - Ensure users can only track views for accessible personas
    - Allow viewing stats for public/unlisted personas
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;

-- Create new policies
CREATE POLICY "Users can track their views"
ON persona_views
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_views.persona_id
    AND (
      personas.user_id = auth.uid()
      OR personas.visibility IN ('public', 'unlisted')
    )
  )
);

CREATE POLICY "Users can view their own view history"
ON persona_views
FOR SELECT
TO authenticated
USING (
  viewer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_views.persona_id
    AND personas.user_id = auth.uid()
  )
);