/*
  # Further increase character limits for space messages and memories
  
  1. Changes
    - Increase memory_value length limit to 10000 characters for both space_memories and persona_memories
    - Remove any length limitation on space_messages content column
    - Ensure persona responses in spaces aren't truncated
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraints
ALTER TABLE space_memories
DROP CONSTRAINT IF EXISTS memory_value_length;

ALTER TABLE persona_memories
DROP CONSTRAINT IF EXISTS memory_value_length;

-- Add new constraints with significantly increased length
ALTER TABLE space_memories
ADD CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 10000);

ALTER TABLE persona_memories
ADD CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 10000);

-- Update the space_messages table to allow longer messages
-- This directly affects the length of persona responses in spaces
ALTER TABLE space_messages
ALTER COLUMN content TYPE TEXT; -- Remove any length limitation

-- Also increase the limit for chat_messages for consistency
ALTER TABLE chat_messages
ALTER COLUMN content TYPE TEXT; -- Remove any length limitation