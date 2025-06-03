-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS persona_message_memory_trigger CASCADE;

-- Create a new function that doesn't save entire conversations
CREATE OR REPLACE FUNCTION persona_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process assistant messages (AI responses)
  IF NEW.role = 'assistant' AND NEW.persona_id IS NOT NULL THEN
    -- Only extract explicitly tagged memories in the format [MEMORY: key=value, importance=X]
    -- We're no longer saving the entire conversation content
    INSERT INTO persona_memories (
      persona_id,
      memory_key,
      memory_value,
      importance,
      user_id
    )
    SELECT 
      NEW.persona_id,
      trim(matches[1]) AS memory_key,
      trim(matches[2]) AS memory_value,
      COALESCE(NULLIF(trim(matches[3]), '')::integer, 3) AS importance,
      (SELECT user_id FROM personas WHERE id = NEW.persona_id)
    FROM (
      SELECT
        regexp_matches(
          NEW.content, 
          '\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]',
          'g'
        ) AS matches
    ) AS extracted_memories
    WHERE trim(matches[1]) IS NOT NULL AND trim(matches[2]) IS NOT NULL
    ON CONFLICT (persona_id, memory_key) DO UPDATE SET
      memory_value = EXCLUDED.memory_value,
      importance = EXCLUDED.importance,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER chat_message_memory_extraction
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION persona_message_memory_trigger();