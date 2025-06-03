/*
  # Add coordinator_instructions to spaces table
  
  1. Changes
    - Add coordinator_instructions text column to spaces table
    - This allows space owners to provide custom instructions for the room coordinator
    - These instructions affect how the coordinator determines which personas respond
  
  2. Security
    - No changes to RLS policies needed, existing space update policies apply
*/

-- Add coordinator_instructions column to spaces table
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS coordinator_instructions TEXT;

-- Add comment for documentation
COMMENT ON COLUMN spaces.coordinator_instructions IS 'Custom instructions for the space coordinator to guide how personas interact';