-- Add additional functions to improve space coordination

-- Function to determine message complexity based on content
CREATE OR REPLACE FUNCTION get_message_complexity(message_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  word_count INTEGER;
  question_count INTEGER;
  sentence_count INTEGER;
  complexity TEXT;
BEGIN
  -- Count words
  word_count := array_length(regexp_split_to_array(message_text, '\s+'), 1);
  
  -- Count questions (question marks)
  question_count := length(message_text) - length(replace(message_text, '?', ''));
  
  -- Count sentences (rough estimate)
  sentence_count := length(message_text) - length(replace(replace(replace(message_text, '.', ''), '!', ''), '?', '')) + 1;
  
  -- Determine complexity
  IF word_count > 50 OR question_count > 2 OR sentence_count > 5 THEN
    complexity := 'high';
  ELSIF word_count > 20 OR question_count > 0 OR sentence_count > 2 THEN
    complexity := 'medium';
  ELSE
    complexity := 'low';
  END IF;
  
  RETURN complexity;
END;
$$;

-- Function to check if a message is a command or instruction
CREATE OR REPLACE FUNCTION is_command_message(message_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for command patterns
  RETURN 
    message_text ~* '^/[a-z]+' OR -- /command style
    message_text ~* '^![a-z]+' OR -- !command style
    message_text ~* '^(create|generate|make|list|show|search)' OR -- imperative verbs
    message_text ~* '(please|could you|would you|can you).*(\?|$)'; -- polite requests
END;
$$;

-- Function to determine role-play participants
CREATE OR REPLACE FUNCTION get_roleplay_participants(
  space_id_input UUID,
  message_text TEXT
)
RETURNS TABLE (
  persona_id UUID,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Find personas that match roleplay keywords in the message
  RETURN QUERY
  WITH roleplay_indicators AS (
    SELECT 
      unnest(ARRAY[
        'roleplay', 'role play', 'pretend', 'act as', 'simulate',
        'scenario', 'imagination', 'fantasy', 'game', 'let''s say'
      ]) AS keyword
  ),
  message_matches AS (
    SELECT 
      keyword,
      message_text ILIKE '%' || keyword || '%' AS is_match
    FROM roleplay_indicators
  ),
  is_roleplay AS (
    SELECT EXISTS (
      SELECT 1 FROM message_matches WHERE is_match
    ) AS roleplay_detected
  )
  SELECT 
    sm.persona_id,
    CASE
      WHEN p.personality @> ARRAY['creative'] THEN 0.8
      WHEN p.personality @> ARRAY['humorous'] THEN 0.7
      ELSE 0.5
    END AS relevance_score
  FROM space_members sm
  JOIN personas p ON sm.persona_id = p.id
  WHERE sm.space_id = space_id_input
  AND sm.persona_id IS NOT NULL
  AND (SELECT roleplay_detected FROM is_roleplay);
END;
$$;

-- Function to get coordinator instructions for a space
CREATE OR REPLACE FUNCTION get_coordinator_context(space_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_record RECORD;
  member_count INTEGER;
  persona_count INTEGER;
  coordinator_context TEXT;
BEGIN
  -- Get space details
  SELECT name, description, coordinator_instructions
  INTO space_record
  FROM spaces
  WHERE id = space_id_input;
  
  IF NOT FOUND THEN
    RETURN 'Space not found';
  END IF;
  
  -- Get member counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE persona_id IS NOT NULL)
  INTO 
    member_count,
    persona_count
  FROM space_members
  WHERE space_id = space_id_input;
  
  -- Generate coordinator context
  coordinator_context := format(
    'Space Name: %s
Description: %s
Total Members: %s
AI Personas: %s

%s',
    space_record.name,
    COALESCE(space_record.description, 'No description'),
    member_count,
    persona_count,
    COALESCE(space_record.coordinator_instructions, 'No special instructions.')
  );
  
  RETURN coordinator_context;
END;
$$;

-- Function to select appropriate personas based on message content and context
CREATE OR REPLACE FUNCTION select_responding_personas(
  space_id_input UUID,
  message_id_input UUID,
  max_responders INTEGER DEFAULT 1
)
RETURNS TABLE (
  persona_id UUID,
  reason TEXT,
  score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  message_complexity TEXT;
  is_command BOOLEAN;
  message_text TEXT;
  last_user_message RECORD;
  coordinator_context TEXT;
BEGIN
  -- Get the message
  SELECT id, content, persona_id, user_id, created_at
  INTO message_record
  FROM space_messages
  WHERE id = message_id_input;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get message characteristics
  message_text := message_record.content;
  message_complexity := get_message_complexity(message_text);
  is_command := is_command_message(message_text);
  
  -- Get coordinator context
  coordinator_context := get_coordinator_context(space_id_input);
  
  -- Different strategies based on message source
  IF message_record.persona_id IS NULL AND message_record.user_id IS NOT NULL THEN
    -- User message - handle based on message characteristics
    
    -- Check if any personas were directly mentioned
    RETURN QUERY
    WITH mentioned_personas AS (
      SELECT 
        sm.persona_id,
        'Directly mentioned by name' AS reason,
        1.0 AS score
      FROM space_members sm
      JOIN personas p ON sm.persona_id = p.id
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND message_text ILIKE '%' || p.name || '%'
    ),
    knowledge_matches AS (
      SELECT 
        sm.persona_id,
        'Has relevant knowledge: ' || k AS reason,
        0.8 AS score
      FROM space_members sm
      JOIN personas p ON sm.persona_id = p.id,
      LATERAL unnest(p.knowledge) AS k
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND message_text ILIKE '%' || k || '%'
    ),
    roleplay_participants AS (
      SELECT 
        persona_id,
        'Selected for roleplay scenario' AS reason,
        relevance_score AS score
      FROM get_roleplay_participants(space_id_input, message_text)
    ),
    command_handlers AS (
      SELECT
        sm.persona_id,
        'Best suited for handling command/request' AS reason,
        0.9 AS score
      FROM space_members sm
      JOIN personas p ON sm.persona_id = p.id
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND is_command
      AND (
        p.personality @> ARRAY['helpful'] OR
        p.personality @> ARRAY['analytical'] OR
        p.personality @> ARRAY['professional']
      )
      ORDER BY 
        CASE WHEN p.personality @> ARRAY['helpful'] THEN 1 ELSE 0 END +
        CASE WHEN p.personality @> ARRAY['analytical'] THEN 1 ELSE 0 END +
        CASE WHEN p.personality @> ARRAY['professional'] THEN 1 ELSE 0 END DESC
      LIMIT 1
    ),
    random_selection AS (
      SELECT
        sm.persona_id,
        'Selected to maintain conversation flow' AS reason,
        0.5 AS score
      FROM space_members sm
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      ORDER BY random()
      LIMIT 1
    )
    SELECT persona_id, reason, score
    FROM (
      SELECT * FROM mentioned_personas
      UNION ALL
      SELECT * FROM knowledge_matches
      UNION ALL
      SELECT * FROM roleplay_participants
      UNION ALL
      SELECT * FROM command_handlers
      UNION ALL
      SELECT * FROM random_selection
    ) AS combined
    ORDER BY score DESC
    LIMIT max_responders;
  ELSE
    -- Persona message - handle persona-to-persona interactions
    -- Only generate responses to persona messages if they're directed at another persona
    -- or are questions/discussion starters
    
    -- Find personas that might respond to another persona's message
    RETURN QUERY
    WITH mentioned_personas AS (
      SELECT 
        sm.persona_id,
        'Directly mentioned by other persona' AS reason,
        1.0 AS score
      FROM space_members sm
      JOIN personas p ON sm.persona_id = p.id
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND sm.persona_id != message_record.persona_id
      AND message_text ILIKE '%' || p.name || '%'
    ),
    question_responders AS (
      SELECT
        sm.persona_id,
        'Responding to question from another persona' AS reason,
        0.7 AS score
      FROM space_members sm
      JOIN personas p ON sm.persona_id = p.id,
      LATERAL unnest(p.knowledge) AS k
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND sm.persona_id != message_record.persona_id
      AND message_text LIKE '%?%'
      AND message_text ILIKE '%' || k || '%'
      ORDER BY random()
      LIMIT 1
    ),
    random_interaction AS (
      SELECT
        sm.persona_id,
        'Continuing persona conversation' AS reason,
        0.3 AS score
      FROM space_members sm
      WHERE sm.space_id = space_id_input
      AND sm.persona_id IS NOT NULL
      AND sm.persona_id != message_record.persona_id
      AND message_text LIKE '%?%'  -- Only respond to questions
      ORDER BY random()
      LIMIT 1
    )
    SELECT persona_id, reason, score
    FROM (
      SELECT * FROM mentioned_personas
      UNION ALL
      SELECT * FROM question_responders
      UNION ALL
      SELECT * FROM random_interaction
    ) AS combined
    ORDER BY score DESC
    LIMIT CASE 
      -- More personas can respond to messages with high complexity or questions
      WHEN message_complexity = 'high' OR message_text LIKE '%?%' THEN 2
      ELSE 1
    END;
  END IF;
END;
$$;

-- Function to check if a specific persona should engage in the conversation
CREATE OR REPLACE FUNCTION should_persona_engage(
  space_id_input UUID,
  persona_id_input UUID,
  message_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  engagement_score FLOAT;
  message_record RECORD;
  has_spoken_recently BOOLEAN;
  is_mentioned BOOLEAN;
  is_relevant_topic BOOLEAN;
  persona_name TEXT;
  persona_knowledge TEXT[];
  knowledge_item TEXT;
  i INTEGER;
BEGIN
  -- Get persona details
  SELECT name, knowledge
  INTO persona_name, persona_knowledge
  FROM personas
  WHERE id = persona_id_input;
  
  IF NOT FOUND THEN
    RETURN FALSE; -- Persona doesn't exist
  END IF;
  
  -- Get message details
  SELECT content, persona_id, user_id
  INTO message_record
  FROM space_messages
  WHERE id = message_id_input;
  
  IF NOT FOUND THEN
    RETURN FALSE; -- Message doesn't exist
  END IF;
  
  -- Don't respond to self
  IF message_record.persona_id = persona_id_input THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate base engagement score
  engagement_score := 0.0;
  
  -- Check if persona has spoken in the last 3 messages
  SELECT EXISTS (
    SELECT 1 
    FROM space_messages
    WHERE space_id = space_id_input
    AND persona_id = persona_id_input
    AND id != message_id_input
    ORDER BY created_at DESC
    LIMIT 3
  ) INTO has_spoken_recently;
  
  -- Check if persona is mentioned
  is_mentioned := message_record.content ILIKE '%' || persona_name || '%';
  
  -- Check if message relates to persona's knowledge
  is_relevant_topic := FALSE;
  IF persona_knowledge IS NOT NULL AND array_length(persona_knowledge, 1) > 0 THEN
    FOR i IN 1..array_length(persona_knowledge, 1) LOOP
      knowledge_item := persona_knowledge[i];
      IF message_record.content ILIKE '%' || knowledge_item || '%' THEN
        is_relevant_topic := TRUE;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate engagement score
  IF is_mentioned THEN
    engagement_score := engagement_score + 0.8; -- High score for direct mention
  END IF;
  
  IF is_relevant_topic THEN
    engagement_score := engagement_score + 0.6; -- Good score for relevant topic
  END IF;
  
  IF NOT has_spoken_recently THEN
    engagement_score := engagement_score + 0.3; -- Bonus for personas that haven't spoken recently
  END IF;
  
  -- Add some randomness
  engagement_score := engagement_score + (random() * 0.2);
  
  -- Different thresholds for user vs. persona messages
  IF message_record.user_id IS NOT NULL THEN
    RETURN engagement_score > 0.5; -- Lower threshold for user messages
  ELSE
    RETURN engagement_score > 0.7; -- Higher threshold for persona messages
  END IF;
END;
$$;