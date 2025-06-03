/*
  # Update persona views policies

  1. Changes
    - Add policy for inserting persona views
    - Add policy for selecting persona views
  
  2. Security
    - Enable RLS on persona_views table
    - Allow authenticated users to track their own views
    - Allow users to view their own view history
*/

-- Update policies for persona_views
DROP POLICY IF EXISTS "Users can track their views" ON persona_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON persona_views;

CREATE POLICY "Users can track their views"
ON persona_views
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = viewer_id
);

CREATE POLICY "Users can view their own view history"
ON persona_views
FOR SELECT
TO authenticated
USING (
  auth.uid() = viewer_id
);