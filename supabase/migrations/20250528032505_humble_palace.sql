/*
  # Fix persona views RLS policy

  1. Changes
    - Update RLS policy for persona_views table to allow users to:
      - Insert views for public and unlisted personas
      - Insert views for their own personas
      - View their own view history
      - View views on their own personas

  2. Security
    - Enable RLS on persona_views table
    - Add policies for INSERT and SELECT operations
    - Ensure users can only view their own view history
    - Allow persona owners to see who viewed their personas
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;

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