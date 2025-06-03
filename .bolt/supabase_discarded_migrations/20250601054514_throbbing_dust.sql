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

-- Function to generate default coordinator instructions based on space characteristics
CREATE OR REPLACE FUNCTION generate_default_coordinator_instructions(
  space_id_input UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_record RECORD;
  persona_count INTEGER;
  user_count INTEGER;
  instructions TEXT;
BEGIN
  -- Get space details
  SELECT name, description INTO space_record
  FROM spaces
  WHERE id = space_id_input;
  
  -- Count personas and users in the space
  SELECT 
    COUNT(*) FILTER (WHERE persona_id IS NOT NULL) AS persona_count,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS user_count
  INTO
    persona_count,
    user_count
  FROM space_members
  WHERE space_id = space_id_input;
  
  -- Generate default instructions based on space characteristics
  instructions := 'Space Coordinator Instructions for "' || space_record.name || '"' || E'\n\n';
  
  -- Add description-based context if available
  IF space_record.description IS NOT NULL AND space_record.description != '' THEN
    instructions := instructions || 'Space Description: ' || space_record.description || E'\n\n';
  END IF;
  
  -- Add general guidelines
  instructions := instructions || 'General Guidelines:' || E'\n';
  instructions := instructions || '- Ensure conversations remain focused and on-topic' || E'\n';
  instructions := instructions || '- Allow only one persona to respond to each user message unless multiple personas are directly addressed' || E'\n';
  instructions := instructions || '- Personas should respond to each other naturally to create engaging conversations' || E'\n';
  instructions := instructions || '- Select the most relevant persona to respond based on message content and persona expertise' || E'\n';
  
  -- Add persona-specific guidelines based on count
  IF persona_count > 3 THEN
    instructions := instructions || '- With ' || persona_count || ' personas in this space, ensure balanced participation' || E'\n';
    instructions := instructions || '- Avoid having the same personas respond repeatedly' || E'\n';
  ELSIF persona_count > 0 THEN
    instructions := instructions || '- With only ' || persona_count || ' personas, encourage all to participate regularly' || E'\n';
  END IF;
  
  -- Add interaction style guidelines
  instructions := instructions || E'\nInteraction Style:' || E'\n';
  instructions := instructions || '- Maintain a conversational and natural dialogue flow' || E'\n';
  instructions := instructions || '- Personas should stay in character based on their defined traits' || E'\n';
  instructions := instructions || '- Encourage knowledge sharing and collaborative problem-solving' || E'\n';
  
  -- Add default role-play guidance
  instructions := instructions || E'\nRole-Play Scenarios:' || E'\n';
  instructions := instructions || '- When users initiate role-play scenarios, select appropriate personas to participate' || E'\n';
  instructions := instructions || '- Maintain consistent character traits throughout role-play interactions' || E'\n';
  instructions := instructions || '- Allow creative and imaginative scenarios while keeping interactions appropriate' || E'\n';
  
  -- Add task handling guidance
  instructions := instructions || E'\nTask Handling:' || E'\n';
  instructions := instructions || '- When users request specific tasks, select personas with relevant expertise' || E'\n';
  instructions := instructions || '- For complex tasks, allow multiple personas to collaborate with different perspectives' || E'\n';
  instructions := instructions || '- Ensure task responses are helpful, accurate, and complete' || E'\n';
  
  RETURN instructions;
END;
$$;

-- Function to get or generate coordinator instructions
CREATE OR REPLACE FUNCTION get_space_coordinator_instructions(
  space_id_input UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  instructions TEXT;
BEGIN
  -- Get custom instructions if they exist
  SELECT coordinator_instructions INTO instructions
  FROM spaces
  WHERE id = space_id_input;
  
  -- If no custom instructions, generate default ones
  IF instructions IS NULL OR instructions = '' THEN
    instructions := generate_default_coordinator_instructions(space_id_input);
  END IF;
  
  RETURN instructions;
END;
$$;