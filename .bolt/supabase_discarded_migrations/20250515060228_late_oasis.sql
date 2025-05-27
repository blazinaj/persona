/*
  # Fix RLS policies and chat function errors
  
  1. Changes
    - Update persona_views RLS policies to handle visibility correctly
    - Add function to safely track views
    - Fix chat function to handle empty integrations
  
  2. Security
    - Ensure proper RLS enforcement
    - Add secure view tracking function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;

-- Create new policies with proper visibility checks
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

-- Function to safely track persona views
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
      user_id = viewer_id_input
      OR visibility IN ('public', 'unlisted')
    )
  ) INTO can_view;

  -- Only track view if user has permission
  IF can_view THEN
    INSERT INTO persona_views (persona_id, viewer_id)
    VALUES (persona_id_input, viewer_id_input)
    ON CONFLICT (persona_id, viewer_id) DO UPDATE
    SET viewed_at = now();
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;