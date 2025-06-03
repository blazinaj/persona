-- First drop existing functions to avoid naming conflicts
DROP FUNCTION IF EXISTS is_message_directed_at_persona(text, text);
DROP FUNCTION IF EXISTS message_relates_to_persona(text, uuid);
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