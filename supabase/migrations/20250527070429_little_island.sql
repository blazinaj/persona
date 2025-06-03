/*
  # Fix space message coordinator flow
  
  1. Changes
    - Add function to determine which personas should respond to a message
    - Improve should_persona_respond function to check if persona is in responders list
    - Fix add_persona_message function to properly return the created message
  
  2. Security
    - Maintain existing security model
    - Use SECURITY DEFINER for controlled execution
*/

-- Function to determine which personas should respond to a message
CREATE OR REPLACE FUNCTION get_responding_personas(
  space_id_input UUID,
  message_id_input UUID
)
RETURNS TABLE (
  persona_id UUID,
  name TEXT,
  avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  persona_count INTEGER;
  max_responders INTEGER := 2; -- Maximum number of personas that should respond
  random_threshold FLOAT := 0.4; -- Threshold for random selection
BEGIN
  -- Get the message that triggered this function
  SELECT * INTO message_record
  FROM space_messages
  WHERE id = message_id_input;
  
  -- Only process user messages
  IF message_record.persona_id IS NOT NULL OR message_record.user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Count total personas in the space
  SELECT COUNT(*) INTO persona_count
  FROM space_members
  WHERE space_id = space_id_input
  AND persona_id IS NOT NULL;
  
  -- If no personas in the space, return empty
  IF persona_count = 0 THEN
    RETURN;
  END IF;
  
  -- Randomly determine how many personas should respond (0 to max_responders)
  -- More complex messages or questions are more likely to get responses
  DECLARE
    message_length INTEGER := length(message_record.content);
    is_question BOOLEAN := message_record.content LIKE '%?%';
    response_count INTEGER;
  BEGIN
    -- Calculate response count based on message characteristics
    IF is_question THEN
      -- Questions are more likely to get responses
      response_count := LEAST(1 + floor(random() * max_responders)::INTEGER, max_responders);
    ELSE
      -- Regular messages might get 0-2 responses
      response_count := floor(random() * (max_responders + 1))::INTEGER;
    END IF;
    
    -- Return personas that should respond
    RETURN QUERY
    SELECT 
      sm.persona_id,
      p.name,
      p.avatar
    FROM space_members sm
    JOIN personas p ON sm.persona_id = p.id
    WHERE sm.space_id = space_id_input
    AND sm.persona_id IS NOT NULL
    -- Add some randomization to persona selection
    AND random() > random_threshold
    -- Limit to the calculated number of responders
    LIMIT response_count;
  END;
END;
$$;

-- Improved function to determine if a specific persona should respond
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
  last_user_message TIMESTAMPTZ;
  last_user_message_id UUID;
  should_respond BOOLEAN := FALSE;
BEGIN
  -- Get when this persona last sent a message
  SELECT MAX(created_at) INTO persona_last_message
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id = persona_id_input;
  
  -- Get the most recent user message
  SELECT created_at, id INTO last_user_message, last_user_message_id
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no user messages or last message is too old, don't respond
  IF last_user_message IS NULL OR 
     (now() - last_user_message) > interval '5 minutes' THEN
    RETURN FALSE;
  END IF;
  
  -- If persona has already responded to this message (based on timing), don't respond again
  IF persona_last_message IS NOT NULL AND 
     persona_last_message > last_user_message THEN
    RETURN FALSE;
  END IF;
  
  -- Check if this persona is in the list of personas that should respond
  SELECT EXISTS (
    SELECT 1 FROM get_responding_personas(space_id_input, last_user_message_id)
    WHERE persona_id = persona_id_input
  ) INTO should_respond;
  
  RETURN should_respond;
END;
$$;

-- Fix add_persona_message function to properly return the created message
DROP FUNCTION IF EXISTS add_persona_message(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION add_persona_message(
  space_id_input UUID,
  persona_id_input UUID,
  content_input TEXT
)
RETURNS space_messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_message space_messages;
BEGIN
  -- Check if persona exists in the space
  IF NOT EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = space_id_input
    AND persona_id = persona_id_input
  ) THEN
    RAISE EXCEPTION 'Persona is not a member of this space';
  END IF;

  -- Insert the message and return it
  INSERT INTO space_messages (
    space_id,
    persona_id,
    content
  ) VALUES (
    space_id_input,
    persona_id_input,
    content_input
  )
  RETURNING * INTO new_message;

  -- Update the space's updated_at timestamp
  UPDATE spaces
  SET updated_at = now()
  WHERE id = space_id_input;
  
  RETURN new_message;
END;
$$;