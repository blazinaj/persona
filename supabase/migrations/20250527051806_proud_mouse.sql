/*
  # Update knowledge entry description length constraint
  
  1. Changes
    - Increase the maximum length of knowledge entry descriptions from 500 to 5000 characters
    - This allows for more detailed knowledge to be stored in each entry
  
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Drop the existing constraint
ALTER TABLE persona_knowledge_entries
DROP CONSTRAINT IF EXISTS description_length;

-- Add the new constraint with increased length
ALTER TABLE persona_knowledge_entries
ADD CONSTRAINT description_length CHECK (char_length(description) <= 5000);