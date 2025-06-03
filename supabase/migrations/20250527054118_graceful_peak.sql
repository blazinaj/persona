/*
  # Add instructions column to personas table
  
  1. Changes
    - Add instructions column to personas table with default empty string
    - This column stores custom instructions for the AI to follow when responding
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add instructions column if it doesn't exist
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '';