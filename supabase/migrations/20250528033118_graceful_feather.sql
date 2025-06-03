/*
  # Fix persona views RLS policies

  1. Changes
    - Update RLS policies for persona_views table to allow proper view tracking
    - Add policy for inserting views when viewing public/unlisted personas
    - Add policy for viewing own view history
    - Add policy for persona owners to view their persona's view history

  2. Security
    - Ensure users can only track views for public/unlisted personas or their own personas
    - Maintain data privacy by limiting view history access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view view history" ON persona_views;

-- Create new policies
CREATE POLICY "Users can track views of accessible personas"
ON persona_views
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_views.persona_id
    AND (
      personas.visibility IN ('public', 'unlisted')
      OR personas.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view their own view history"
ON persona_views
FOR SELECT
TO authenticated
USING (
  viewer_id = auth.uid()
);

CREATE POLICY "Persona owners can view their personas' view history"
ON persona_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_views.persona_id
    AND personas.user_id = auth.uid()
  )
);