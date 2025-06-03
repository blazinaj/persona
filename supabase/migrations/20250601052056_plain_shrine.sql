-- Update coordinator_instructions column to allow larger instructions
ALTER TABLE spaces
ALTER COLUMN coordinator_instructions TYPE TEXT;

-- Add constraint to limit to 10000 characters
ALTER TABLE spaces
ADD CONSTRAINT coordinator_instructions_length 
CHECK (coordinator_instructions IS NULL OR LENGTH(coordinator_instructions) <= 10000);

-- Update comment to reflect the new character limit
COMMENT ON COLUMN spaces.coordinator_instructions IS 'Custom instructions for the space coordinator to guide how personas interact (max 10000 characters)';