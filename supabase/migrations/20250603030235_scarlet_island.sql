/*
  # Increase memory value length limit
  
  1. Changes
    - Increase the maximum length of memory_value in space_memories from 2000 to 5000 characters
    - This allows for longer, more detailed memories to be stored
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
ALTER TABLE space_memories
DROP CONSTRAINT IF EXISTS memory_value_length;

-- Add the new constraint with increased length
ALTER TABLE space_memories
ADD CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 5000);

-- Also increase the limit for persona_memories for consistency
ALTER TABLE persona_memories
DROP CONSTRAINT IF EXISTS memory_value_length;

ALTER TABLE persona_memories
ADD CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 5000);