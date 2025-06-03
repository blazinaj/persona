/*
  # Fix persona views RLS policies and tracking function
  
  1. Changes
    - Drop existing policies on persona_views table
    - Create new policies with proper permissions
    - Update track_persona_view function to handle conflicts properly
    - Fix upsert functionality
  
  2. Security
    - Ensure users can only track views for accessible personas
    - Maintain proper access controls for view history
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can track views of accessible personas" ON persona_views;
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;
DROP POLICY IF EXISTS "Persona owners can view their personas' view history" ON persona_views;

-- Create new policies with proper visibility checks
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
      personas.visibility IN ('public', 'unlisted') OR 
      personas.user_id = auth.uid()
    )
  )
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

CREATE POLICY "Users can view their own view history"
ON persona_views
FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

-- Update track_persona_view function to handle conflicts
CREATE OR REPLACE FUNCTION track_persona_view(
  persona_id_input UUID,
  viewer_id_input UUID
) RETURNS boolean AS $$
DECLARE
  can_view boolean;
BEGIN
  -- Check if the user can view this persona
  SELECT EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND (
      visibility IN ('public', 'unlisted') OR
      user_id = viewer_id_input
    )
  ) INTO can_view;

  -- Only track view if user has permission
  IF can_view THEN
    -- Use ON CONFLICT to handle the unique constraint
    INSERT INTO persona_views (persona_id, viewer_id)
    VALUES (persona_id_input, viewer_id_input)
    ON CONFLICT (persona_id, viewer_id) 
    DO UPDATE SET viewed_at = now();
    
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add UPDATE policy to allow updating existing views
CREATE POLICY "Users can update their own views"
ON persona_views
FOR UPDATE
TO authenticated
USING (viewer_id = auth.uid())
WITH CHECK (viewer_id = auth.uid());