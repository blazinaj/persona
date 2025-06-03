-- Update the should_persona_respond function to include persona-to-persona interactions
CREATE OR REPLACE FUNCTION should_persona_respond(
  space_id_input UUID,
  persona_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_last_message TIMESTAMPTZ;
  last_message_timestamptz TIMESTAMPTZ;
  last_message_id UUID;
  last_message_content TEXT;
  last_message_sender_id UUID;
  last_message_is_from_persona BOOLEAN;
  persona_data RECORD;
  sender_data RECORD;
  response_probability FLOAT := 0.5; -- Base probability
  sender_name TEXT;
  knowledge_item TEXT;
  i INTEGER;
BEGIN
  -- Get persona data for context
  SELECT name, knowledge, personality, tone INTO persona_data
  FROM personas
  WHERE id = persona_id_input;
  
  -- Get when this persona last sent a message
  SELECT MAX(created_at) INTO persona_last_message
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id = persona_id_input;
  
  -- Get the most recent message (can be from user OR another persona)
  SELECT 
    id, 
    created_at, 
    content, 
    persona_id, 
    user_id,
    (persona_id IS NOT NULL) as is_from_persona
  INTO 
    last_message_id,
    last_message_timestamptz,
    last_message_content,
    last_message_sender_id,
    last_message_is_from_persona
  FROM space_messages
  WHERE space_id = space_id_input
  AND (persona_id IS NOT NULL OR user_id IS NOT NULL)
  AND (persona_id != persona_id_input) -- Don't respond to self
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no messages or last message is too old, don't respond
  IF last_message_id IS NULL OR 
     (now() - last_message_timestamptz) > interval '5 minutes' THEN
    RETURN FALSE;
  END IF;
  
  -- If persona has already responded to this message (based on timing), don't respond again
  IF persona_last_message IS NOT NULL AND 
     persona_last_message > last_message_timestamptz THEN
    RETURN FALSE;
  END IF;
  
  -- Get sender information if the message is from another persona
  IF last_message_is_from_persona AND last_message_sender_id IS NOT NULL THEN
    SELECT name INTO sender_name
    FROM personas
    WHERE id = last_message_sender_id;
  END IF;
  
  -- Increase probability for various factors
  
  -- 1. If message includes a question
  IF last_message_content LIKE '%?%' THEN
    response_probability := response_probability + 0.2;
  END IF;
  
  -- 2. If message mentions the persona by name
  IF persona_data.name IS NOT NULL AND 
     last_message_content ILIKE '%' || persona_data.name || '%' THEN
    response_probability := response_probability + 0.4;
  END IF;
  
  -- 3. If message relates to the persona's knowledge areas
  IF persona_data.knowledge IS NOT NULL AND array_length(persona_data.knowledge, 1) > 0 THEN
    -- Check each knowledge area using array iteration
    FOR i IN 1..array_length(persona_data.knowledge, 1) LOOP
      knowledge_item := persona_data.knowledge[i];
      IF last_message_content ILIKE '%' || knowledge_item || '%' THEN
        response_probability := response_probability + 0.3;
        EXIT; -- Found a match, no need to check more
      END IF;
    END LOOP;
  END IF;

  -- 4. If the message is from another persona (enable persona-to-persona interactions)
  IF last_message_is_from_persona THEN
    -- Higher chance to respond to other personas to enable conversations
    response_probability := response_probability + 0.15;
  END IF;
  
  -- 5. If this persona hasn't spoken in a while
  IF persona_last_message IS NULL OR 
     (last_message_timestamptz - persona_last_message) > interval '5 minutes' THEN
    response_probability := response_probability + 0.2;
  END IF;
  
  -- Cap probability at 0.95 to always leave some randomness
  response_probability := LEAST(response_probability, 0.95);
  
  -- Return true with the calculated probability
  RETURN random() <= response_probability;
END;
$$;

-- Create function to identify when a message is directed at a specific persona
CREATE OR REPLACE FUNCTION is_message_directed_at_persona(
  message_content TEXT,
  persona_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for direct mentions
  -- Examples: "@PersonaName", "Hey PersonaName", "PersonaName, "
  IF message_content ILIKE '@' || persona_name || '%' OR
     message_content ILIKE 'hey ' || persona_name || '%' OR
     message_content ILIKE 'hi ' || persona_name || '%' OR
     message_content ILIKE persona_name || ',%' THEN
    RETURN TRUE;
  END IF;

  -- Check for possessive forms or other reference patterns
  -- Examples: "What does PersonaName think", "Ask PersonaName"
  IF message_content ILIKE '%what does ' || persona_name || ' think%' OR
     message_content ILIKE '%ask ' || persona_name || '%' OR
     message_content ILIKE '%' || persona_name || '''s%' OR
     message_content ILIKE '%' || persona_name || ' would%' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create function to check if a message relates to a persona's knowledge areas
CREATE OR REPLACE FUNCTION message_relates_to_persona(
  message_content TEXT,
  persona_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  knowledge_areas TEXT[];
  area TEXT;
  i INTEGER;
BEGIN
  -- Get persona's knowledge areas
  SELECT knowledge INTO knowledge_areas
  FROM personas
  WHERE id = persona_id_input;
  
  -- If no knowledge areas defined, return false
  IF knowledge_areas IS NULL OR array_length(knowledge_areas, 1) IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if message content contains any of the knowledge areas
  FOR i IN 1..array_length(knowledge_areas, 1) LOOP
    area := knowledge_areas[i];
    IF message_content ILIKE '%' || area || '%' THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$;