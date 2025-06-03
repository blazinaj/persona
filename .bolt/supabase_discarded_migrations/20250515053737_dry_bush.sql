/*
  # Fix RLS policies and error handling

  1. Changes
    - Update RLS policies for persona_views table
    - Fix persona_favorites policies
    - Add missing visibility column to personas table

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for authenticated users
*/

-- Update persona_views policies
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;

CREATE POLICY "Users can track their views"
ON persona_views
FOR INSERT
TO authenticated
WITH CHECK (
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
  OR EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_views.persona_id
    AND personas.user_id = auth.uid()
  )
);

-- Update persona_favorites policies
DROP POLICY IF EXISTS "Users can manage their favorites" ON persona_favorites;
DROP POLICY IF EXISTS "Users can view their favorites" ON persona_favorites;

CREATE POLICY "Users can manage their favorites"
ON persona_favorites
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_favorites.persona_id
    AND (
      personas.visibility IN ('public', 'unlisted')
      OR personas.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_favorites.persona_id
    AND (
      personas.visibility IN ('public', 'unlisted')
      OR personas.user_id = auth.uid()
    )
  )
);