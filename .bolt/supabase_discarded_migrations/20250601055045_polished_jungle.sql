-- Add coordinator_instructions column to spaces table
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS coordinator_instructions TEXT;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN spaces.coordinator_instructions IS 'Custom instructions for the space coordinator to guide how personas interact (max 10000 characters)';

-- Add constraint to limit the length of coordinator_instructions
ALTER TABLE spaces
ADD CONSTRAINT coordinator_instructions_length CHECK (
  coordinator_instructions IS NULL OR length(coordinator_instructions) <= 10000
);