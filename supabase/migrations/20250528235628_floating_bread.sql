/*
  # Fix voice settings storage and retrieval
  
  1. Changes
    - Ensure voice column exists on personas table
    - Add default empty JSONB object for voice settings
    - Add documentation comment for the column
  
  2. Security
    - No changes to RLS policies
*/

-- Add voice column to personas table if it doesn't exist
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS voice JSONB DEFAULT '{}'::jsonb;

-- Comment on the column to document its purpose
COMMENT ON COLUMN personas.voice IS 'Voice settings for text-to-speech, including gender, age, accent, pitch, and rate';