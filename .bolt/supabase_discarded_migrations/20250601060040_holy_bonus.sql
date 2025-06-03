-- Add coordinator_instructions length constraint
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coordinator_instructions_length') THEN
    ALTER TABLE spaces DROP CONSTRAINT coordinator_instructions_length;
  END IF;
  
  -- Add constraint with correct syntax
  ALTER TABLE spaces 
  ADD CONSTRAINT coordinator_instructions_length 
  CHECK (coordinator_instructions IS NULL OR LENGTH(coordinator_instructions) <= 10000);
END $$;

-- Improve space functions for better message analysis
CREATE OR REPLACE FUNCTION analyze_message_intent(message_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  is_question BOOLEAN;
  is_roleplay BOOLEAN;
  is_task BOOLEAN;
  is_greeting BOOLEAN;
  is_discussion BOOLEAN;
  mentioned_names TEXT[];
BEGIN
  -- Detect question
  is_question := message_text LIKE '%?%';
  
  -- Detect roleplay
  is_roleplay := message_text ~* '\*.*\*|^I am|^I''m|^Let''s|^We are|^We''re|^You are|^You''re|^Imagine|^Pretend|^Role-?play|^Scenario';
  
  -- Detect task/request
  is_task := message_text ~* '^(can you|could you|please|help me|I need|create|make|build|design|write|generate|analyze|explain|summarize)';
  
  -- Detect greeting
  is_greeting := message_text ~* '^(hi|hello|hey|greetings|good morning|good afternoon|good evening)';
  
  -- Detect discussion starter
  is_discussion := message_text ~* 'what do you think|your opinion|tell me about|what are your thoughts|discuss|let''s talk about';
  
  -- Extract potential name mentions
  SELECT ARRAY_AGG(name) INTO mentioned_names
  FROM (
    SELECT trim(regexp_replace(match, '^@|^hey |^hi |,$', '', 'gi')) AS name
    FROM (
      SELECT (regexp_matches(message_text, '@(\w+)|hey (\w+)|hi (\w+)|(\w+),', 'gi'))[1] AS match
    ) AS matches
  ) AS names
  WHERE length(name) > 0;
  
  -- Build result JSON
  result := jsonb_build_object(
    'is_question', is_question,
    'is_roleplay', is_roleplay,
    'is_task', is_task, 
    'is_greeting', is_greeting,
    'is_discussion', is_discussion,
    'mentioned_names', to_jsonb(COALESCE(mentioned_names, ARRAY[]::TEXT[]))
  );
  
  RETURN result;
END;
$$;

-- Create function to match personas for roleplay scenarios
CREATE OR REPLACE FUNCTION find_roleplay_personas(
  space_id_input UUID,
  message_text TEXT
)
RETURNS TABLE (
  persona_id UUID,
  name TEXT,
  match_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Look for keywords that might indicate roleplay requirements
  RETURN QUERY
  WITH roleplay_keywords AS (
    SELECT k.word, k.weight
    FROM (VALUES
      ('creative', 1.0),
      ('imagine', 0.9),
      ('pretend', 1.0),
      ('roleplay', 1.0),
      ('scenario', 0.8),
      ('fantasy', 0.7),
      ('story', 0.6),
      ('game', 0.5),
      ('character', 0.8),
      ('play', 0.6)
    ) AS k(word, weight)
  ),
  message_matches AS (
    SELECT 
      k.word,
      k.weight,
      message_text ILIKE '%' || k.word || '%' AS is_match
    FROM roleplay_keywords k
  ),
  message_score AS (
    SELECT SUM(CASE WHEN is_match THEN weight ELSE 0 END) AS total_weight
    FROM message_matches
  ),
  persona_matches AS (
    SELECT 
      sm.persona_id,
      p.name,
      CASE
        WHEN p.personality @> ARRAY['creative'] THEN 2.0
        WHEN p.personality @> ARRAY['humorous'] THEN 1.5
        WHEN p.personality @> ARRAY['empathetic'] THEN 1.3
        ELSE 1.0
      END * (SELECT total_weight FROM message_score) AS match_score
    FROM space_members sm
    JOIN personas p ON sm.persona_id = p.id
    WHERE sm.space_id = space_id_input
    AND sm.persona_id IS NOT NULL
    AND (SELECT total_weight FROM message_score) > 0
  )
  SELECT 
    pm.persona_id,
    pm.name,
    pm.match_score
  FROM persona_matches pm
  WHERE pm.match_score > 0
  ORDER BY pm.match_score DESC;
END;
$$;

-- Create function to find personas with relevant expertise for tasks
CREATE OR REPLACE FUNCTION find_task_experts(
  space_id_input UUID,
  message_text TEXT
)
RETURNS TABLE (
  persona_id UUID,
  name TEXT,
  match_reason TEXT,
  match_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_words TEXT[];
  expertise_needed TEXT[];
BEGIN
  -- Extract key task words from the message
  task_words := ARRAY(
    SELECT word
    FROM (
      SELECT DISTINCT lower(word) AS word
      FROM regexp_split_to_table(
        regexp_replace(
          message_text, 
          '^(can you|could you|please|help me|I need|would you)|\s+', 
          ' ', 
          'gi'
        ),
        '\s+'
      ) AS word
      WHERE length(word) > 3
    ) AS words
  );
  
  -- Find personas whose knowledge or personality matches the task
  RETURN QUERY
  WITH knowledge_matches AS (
    SELECT 
      sm.persona_id,
      p.name,
      k AS matching_knowledge,
      0.8::float AS base_score
    FROM space_members sm
    JOIN personas p ON sm.persona_id = p.id,
    LATERAL unnest(p.knowledge) AS k
    WHERE sm.space_id = space_id_input
    AND sm.persona_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM unnest(task_words) AS tw
      WHERE k ILIKE '%' || tw || '%'
    )
  ),
  personality_matches AS (
    SELECT 
      sm.persona_id,
      p.name,
      pt AS matching_trait,
      0.5::float AS base_score
    FROM space_members sm
    JOIN personas p ON sm.persona_id = p.id,
    LATERAL unnest(p.personality) AS pt
    WHERE sm.space_id = space_id_input
    AND sm.persona_id IS NOT NULL
    AND (
      (pt = 'analytical' AND message_text ~* 'analyze|examine|evaluate|assess') OR
      (pt = 'creative' AND message_text ~* 'create|design|generate|imagine') OR
      (pt = 'helpful' AND message_text ~* 'help|assist|guide|support') OR
      (pt = 'professional' AND message_text ~* 'professional|business|formal') OR
      (pt = 'technical' AND message_text ~* 'technical|code|program|implement')
    )
  ),
  combined_matches AS (
    SELECT 
      persona_id,
      name,
      'Knowledge in: ' || matching_knowledge AS match_reason,
      base_score AS match_score
    FROM knowledge_matches
    
    UNION ALL
    
    SELECT 
      persona_id,
      name,
      'Personality trait: ' || matching_trait AS match_reason,
      base_score AS match_score
    FROM personality_matches
  ),
  aggregated_scores AS (
    SELECT 
      persona_id,
      name,
      string_agg(match_reason, '; ') AS match_reason,
      sum(match_score) AS match_score
    FROM combined_matches
    GROUP BY persona_id, name
  )
  SELECT 
    persona_id,
    name,
    match_reason,
    match_score
  FROM aggregated_scores
  ORDER BY match_score DESC;
END;
$$;

-- Create function to detect topic keywords in messages
CREATE OR REPLACE FUNCTION extract_message_keywords(message_text TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  stopwords TEXT[] := ARRAY[
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 
    'by', 'about', 'as', 'in', 'of', 'is', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
    'can', 'could', 'may', 'might', 'must', 'ought', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'who', 'what', 'where', 'when',
    'why', 'how', 'which', 'there', 'here', 'that', 'this', 'these', 'those'
  ];
  keywords TEXT[];
BEGIN
  -- Extract words, convert to lowercase, and filter stopwords and short words
  SELECT ARRAY_AGG(word)
  INTO keywords
  FROM (
    SELECT word
    FROM regexp_split_to_table(
      regexp_replace(lower(message_text), '[^\w\s]', ' ', 'g'),
      '\s+'
    ) AS word
    WHERE length(word) > 3 
    AND word NOT IN (SELECT unnest FROM unnest(stopwords))
    GROUP BY word
    ORDER BY count(*) DESC
    LIMIT 10
  ) AS unique_words;

  RETURN keywords;
END;
$$;