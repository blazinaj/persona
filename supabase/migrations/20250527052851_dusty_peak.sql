/*
  # Update knowledge description length constraint
  
  1. Changes
    - Increase the maximum length of knowledge entry descriptions from 5000 to 10000 characters
    - This allows for more detailed knowledge entries to be stored
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
ALTER TABLE persona_knowledge_entries
DROP CONSTRAINT IF EXISTS description_length;

-- Add the new constraint with increased length
ALTER TABLE persona_knowledge_entries
ADD CONSTRAINT description_length CHECK (char_length(description) <= 10000);