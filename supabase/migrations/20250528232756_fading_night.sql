/*
  # Add voice column to personas table
  
  1. Changes
    - Add a JSONB column named 'voice' to the personas table
    - This column will store voice customization settings like gender, age, accent, pitch, and rate
    - Set default value to empty JSON object
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add voice column to personas table
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS voice JSONB DEFAULT '{}'::jsonb;

-- Comment on the column to document its purpose
COMMENT ON COLUMN personas.voice IS 'Voice settings for text-to-speech, including gender, age, accent, pitch, and rate';