/*
  # Add persona visibility options
  
  1. Changes
    - Creates persona_visibility enum type with 'private', 'unlisted', 'public' options
    - Replaces is_public boolean with visibility enum column
    - Updates RLS policies to handle visibility levels
    - Adds function to safely change visibility
  
  2. Security
    - Updates RLS policies to handle new visibility levels
    - Adds secure function for changing visibility
*/

-- Create visibility enum
CREATE TYPE persona_visibility AS ENUM ('private', 'unlisted', 'public');

-- First drop the existing policy that depends on is_public
DROP POLICY IF EXISTS "Users can view their own personas" ON personas;

-- Now we can safely modify the column
ALTER TABLE personas 
DROP COLUMN IF EXISTS is_public;

ALTER TABLE personas
ADD COLUMN visibility persona_visibility NOT NULL DEFAULT 'private';

-- Create new policy with updated visibility rules
CREATE POLICY "Users can view personas"
  ON personas
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id -- Owner can view their own
    OR visibility = 'public' -- Anyone can view public
    OR visibility = 'unlisted' -- Anyone can view unlisted (for embedding)
  );

-- Function to change visibility
CREATE OR REPLACE FUNCTION change_persona_visibility(
  persona_id UUID,
  new_visibility persona_visibility
) RETURNS personas AS $$
DECLARE
  updated_persona personas;
BEGIN
  -- Check if the user owns the persona
  IF NOT EXISTS (
    SELECT 1 FROM personas 
    WHERE id = persona_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update the visibility
  UPDATE personas 
  SET visibility = new_visibility,
      updated_at = now()
  WHERE id = persona_id
  RETURNING * INTO updated_persona;

  RETURN updated_persona;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;