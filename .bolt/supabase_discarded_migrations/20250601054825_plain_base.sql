-- Add coordinator_instructions column to spaces table if it doesn't exist
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS coordinator_instructions TEXT;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN spaces.coordinator_instructions IS 'Custom instructions for the space coordinator to guide how personas interact (max 10000 characters)';

-- Add constraint to limit the length of coordinator_instructions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coordinator_instructions_length'
  ) THEN
    ALTER TABLE spaces
    ADD CONSTRAINT coordinator_instructions_length CHECK (
      coordinator_instructions IS NULL OR length(coordinator_instructions) <= 10000
    );
  END IF;
END $$;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS is_message_directed_at_persona(text, text);
DROP FUNCTION IF EXISTS message_relates_to_persona_expertise(text, uuid);
DROP FUNCTION IF EXISTS should_persona_respond(uuid, uuid);

-- Function to analyze message context and determine response likelihood
CREATE OR REPLACE FUNCTION should_persona_respond(
  space_id_input UUID,
  persona_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_data RECORD;
  latest_message RECORD;
  is_user_message BOOLEAN;
  last_persona_message TIMESTAMPTZ;
  recent_persona_response BOOLEAN;
  response_probability FLOAT;
  direct_mention BOOLEAN := FALSE;
  topic_relevance BOOLEAN := FALSE;
  is_question BOOLEAN := FALSE;
  i INTEGER;
  knowledge_item TEXT;
BEGIN
  -- Get persona data for context
  SELECT name, personality, knowledge, tone
  INTO persona_data
  FROM personas
  WHERE id = persona_id_input;
  
  IF NOT FOUND THEN
    RETURN FALSE; -- Persona not found
  END IF;

  -- Get latest message in the space
  SELECT id, content, persona_id, user_id, created_at
  INTO latest_message
  FROM space_messages
  WHERE space_id = space_id_input
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE; -- No messages in space
  END IF;
  
  -- Determine if the latest message is from a user (not a persona)
  is_user_message := (latest_message.persona_id IS NULL AND latest_message.user_id IS NOT NULL);
  
  -- Check when this persona last sent a message
  SELECT MAX(created_at)
  INTO last_persona_message
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id = persona_id_input;
  
  -- Check if persona has already responded recently (in the last 10 seconds)
  recent_persona_response := (last_persona_message IS NOT NULL AND 
                             last_persona_message > latest_message.created_at - interval '10 seconds');
  
  -- Don't respond to our own messages or if we've already responded
  IF latest_message.persona_id = persona_id_input OR recent_persona_response THEN
    RETURN FALSE;
  END IF;
  
  -- Initialize response probability
  response_probability := 0.0;
  
  -- 1. Check for direct mention of persona name
  direct_mention := (latest_message.content ILIKE '%' || persona_data.name || '%');
  IF direct_mention THEN
    response_probability := response_probability + 0.6;
  END IF;
  
  -- 2. Check if message is a question
  is_question := (latest_message.content LIKE '%?%');
  IF is_question THEN
    response_probability := response_probability + 0.3;
  END IF;
  
  -- 3. Check for topic relevance to persona's knowledge
  IF persona_data.knowledge IS NOT NULL AND array_length(persona_data.knowledge, 1) > 0 THEN
    FOR i IN 1..array_length(persona_data.knowledge, 1) LOOP
      knowledge_item := persona_data.knowledge[i];
      IF latest_message.content ILIKE '%' || knowledge_item || '%' THEN
        topic_relevance := TRUE;
        response_probability := response_probability + 0.4;
        EXIT; -- Found a match, no need to check more
      END IF;
    END LOOP;
  END IF;
  
  -- 4. If message is from user (not another persona), higher probability for the first response
  IF is_user_message THEN
    -- Check if any persona has already responded to this message
    IF EXISTS (
      SELECT 1
      FROM space_messages
      WHERE space_id = space_id_input
      AND persona_id IS NOT NULL 
      AND created_at > latest_message.created_at
    ) THEN
      -- Another persona already responded to user, reduce probability
      response_probability := response_probability - 0.4;
    ELSE
      -- First response to user message, increase probability
      response_probability := response_probability + 0.2;
    END IF;
  ELSE
    -- Message is from another persona - only respond if directly mentioned or topic is very relevant
    IF NOT (direct_mention OR topic_relevance) THEN
      response_probability := response_probability - 0.3;
    END IF;
  END IF;
  
  -- 5. Random factor to add variety
  response_probability := response_probability + (random() * 0.2);
  
  -- Decision threshold - 0.5 is our baseline
  RETURN response_probability >= 0.5;
END;
$$;

-- Improved function to identify if a message mentions a specific persona
CREATE OR REPLACE FUNCTION is_message_directed_at_persona(
  message_text TEXT, 
  persona_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct mention patterns
  RETURN 
    message_text ILIKE '%@' || persona_name || '%' OR  -- @Name mention
    message_text ILIKE 'hey ' || persona_name || '%' OR -- Hey Name
    message_text ILIKE 'hi ' || persona_name || '%' OR -- Hi Name
    message_text ILIKE 'hello ' || persona_name || '%' OR -- Hello Name
    message_text ILIKE '%what does ' || persona_name || ' think%' OR -- What does Name think
    message_text ILIKE '%' || persona_name || ', %' OR -- Name, [rest of message]
    message_text ILIKE '%' || persona_name || '?%' OR -- Name? [question]
    message_text ILIKE '%ask ' || persona_name || '%' OR -- ask Name
    message_text ILIKE '%tell ' || persona_name || '%'; -- tell Name
END;
$$;

-- Function to match message content to a persona's expertise
CREATE OR REPLACE FUNCTION message_relates_to_persona_expertise(
  message_text TEXT,
  persona_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  knowledge_areas TEXT[];
  persona_tone TEXT;
  persona_name TEXT;
  relevance BOOLEAN := FALSE;
  area TEXT;
  i INTEGER;
BEGIN
  -- Get persona data
  SELECT knowledge, tone, name INTO knowledge_areas, persona_tone, persona_name
  FROM personas
  WHERE id = persona_id_input;
  
  -- Check for direct mention
  IF is_message_directed_at_persona(message_text, persona_name) THEN
    RETURN TRUE;
  END IF;
  
  -- If no knowledge areas defined, check only tone and personality
  IF knowledge_areas IS NULL OR array_length(knowledge_areas, 1) IS NULL THEN
    -- Basic check for tone relevance
    CASE
      WHEN persona_tone = 'technical' AND message_text ~* 'how|why|what|explain|help' THEN
        RETURN TRUE;
      WHEN persona_tone = 'creative' AND message_text ~* 'idea|imagine|create|design|suggest' THEN
        RETURN TRUE;
      WHEN persona_tone = 'supportive' AND message_text ~* 'feel|help|support|advice' THEN
        RETURN TRUE;
      ELSE
        -- Check for question patterns
        IF message_text LIKE '%?%' THEN
          RETURN random() < 0.3; -- 30% chance to respond to any question
        ELSE
          RETURN FALSE;
        END IF;
    END CASE;
  END IF;
  
  -- Check knowledge areas
  FOR i IN 1..array_length(knowledge_areas, 1) LOOP
    area := knowledge_areas[i];
    IF message_text ILIKE '%' || area || '%' THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  -- If it's a question, there's a small chance to respond regardless
  IF message_text LIKE '%?%' THEN
    RETURN random() < 0.2; -- 20% chance to respond to any question
  END IF;
  
  RETURN FALSE;
END;
$$;

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