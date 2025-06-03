/*
  # Fix set-returning function in COALESCE error

  1. Changes
     - Fixes the persona_message_memory_trigger function to avoid using set-returning functions inside COALESCE
     - Restructures the query to use LATERAL joins instead, as suggested by PostgreSQL error hint
     
  2. Why This Fix Works
     - Set-returning functions (like array_agg, unnest, etc.) cannot be used within COALESCE
     - This migration restructures the function to use proper LATERAL joins for set-returning functions
*/

-- Drop and recreate the function with the fixed implementation
CREATE OR REPLACE FUNCTION persona_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process assistant messages
  IF NEW.role = 'assistant' AND NEW.persona_id IS NOT NULL THEN
    -- Extract meaningful information from the message
    -- Using LATERAL join instead of set-returning functions in COALESCE
    INSERT INTO persona_memories (
      persona_id,
      memory_key,
      memory_value,
      importance,
      user_id
    )
    SELECT 
      NEW.persona_id,
      memory_data.key,
      memory_data.value,
      COALESCE(memory_data.importance, 3),
      (SELECT user_id FROM personas WHERE id = NEW.persona_id)
    FROM (
      -- Get conversation information to provide context
      SELECT 
        c.title as conversation_title,
        c.user_id
      FROM conversations c
      WHERE c.id = NEW.conversation_id
    ) conv
    CROSS JOIN LATERAL (
      -- Here we use a subquery to generate memory entries
      -- This replaces any previous COALESCE with set-returning functions
      SELECT 
        'Conversation: ' || conv.conversation_title AS key,
        substring(NEW.content, 1, 1000) AS value,
        3 AS importance
    ) memory_data
    WHERE memory_data.key IS NOT NULL AND memory_data.value IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;