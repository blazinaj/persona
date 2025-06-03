-- First, let's find and remove duplicate entries before adding constraints
DO $$ 
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Find and process duplicate persona_id, memory_key pairs
    FOR duplicate_record IN (
        SELECT 
            persona_id, 
            memory_key, 
            array_agg(id) AS ids,
            count(*) AS count
        FROM 
            persona_memories
        GROUP BY 
            persona_id, memory_key
        HAVING 
            count(*) > 1
    ) LOOP
        -- Keep the most recently updated record and delete the rest
        DELETE FROM persona_memories 
        WHERE id IN (
            SELECT id 
            FROM persona_memories
            WHERE persona_id = duplicate_record.persona_id 
              AND memory_key = duplicate_record.memory_key
            ORDER BY updated_at DESC
            OFFSET 1
        );
    END LOOP;
END $$;

-- Process duplicate entries in space_memories too
DO $$ 
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Find and process duplicate space_id, memory_key pairs
    FOR duplicate_record IN (
        SELECT 
            space_id, 
            memory_key, 
            array_agg(id) AS ids,
            count(*) AS count
        FROM 
            space_memories
        GROUP BY 
            space_id, memory_key
        HAVING 
            count(*) > 1
    ) LOOP
        -- Keep the most recently updated record and delete the rest
        DELETE FROM space_memories 
        WHERE id IN (
            SELECT id 
            FROM space_memories
            WHERE space_id = duplicate_record.space_id 
              AND memory_key = duplicate_record.memory_key
            ORDER BY updated_at DESC
            OFFSET 1
        );
    END LOOP;
END $$;

-- First, let's drop the existing problematic trigger function
DROP FUNCTION IF EXISTS persona_message_memory_trigger CASCADE;
DROP FUNCTION IF EXISTS space_message_memory_trigger CASCADE;

-- Create improved memory extraction trigger for persona messages
CREATE OR REPLACE FUNCTION persona_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process assistant messages (AI responses)
  IF NEW.role = 'assistant' AND NEW.persona_id IS NOT NULL THEN
    -- Extract memory patterns directly using regexp_matches in a safer way
    -- Format: [MEMORY: key=value, importance=X]
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

-- Create improved memory extraction trigger for space messages
CREATE OR REPLACE FUNCTION space_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process messages from personas
  IF NEW.persona_id IS NOT NULL THEN
    -- Extract memory patterns directly using regexp_matches in a safer way
    -- Format: [MEMORY: key=value, importance=X]
    INSERT INTO space_memories (
      space_id,
      memory_key,
      memory_value,
      importance,
      created_by_persona_id
    )
    SELECT 
      NEW.space_id,
      trim(matches[1]) AS memory_key,
      trim(matches[2]) AS memory_value,
      COALESCE(NULLIF(trim(matches[3]), '')::integer, 3) AS importance,
      NEW.persona_id
    FROM (
      SELECT
        regexp_matches(
          NEW.content, 
          '\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]',
          'g'
        ) AS matches
    ) AS extracted_memories
    WHERE trim(matches[1]) IS NOT NULL AND trim(matches[2]) IS NOT NULL
    ON CONFLICT (space_id, memory_key) DO UPDATE SET
      memory_value = EXCLUDED.memory_value,
      importance = EXCLUDED.importance,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add upsert function for persona memories to avoid conflicts
CREATE OR REPLACE FUNCTION upsert_persona_memory(
  persona_id_input uuid,
  memory_key_input text,
  memory_value_input text,
  importance_input integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_memory_id uuid;
  new_memory_id uuid;
BEGIN
  -- Check if a memory with this key already exists
  SELECT id INTO existing_memory_id
  FROM persona_memories
  WHERE persona_id = persona_id_input
  AND memory_key = memory_key_input;

  -- Update existing memory or insert new one
  IF existing_memory_id IS NOT NULL THEN
    UPDATE persona_memories
    SET 
      memory_value = memory_value_input,
      importance = importance_input,
      updated_at = now()
    WHERE id = existing_memory_id
    RETURNING id INTO new_memory_id;
  ELSE
    INSERT INTO persona_memories (
      persona_id,
      memory_key,
      memory_value,
      importance,
      user_id
    ) VALUES (
      persona_id_input,
      memory_key_input,
      memory_value_input,
      importance_input,
      auth.uid()
    )
    RETURNING id INTO new_memory_id;
  END IF;

  RETURN new_memory_id;
END;
$$;

-- Add upsert function for space memories
CREATE OR REPLACE FUNCTION upsert_space_memory(
  space_id_input uuid,
  memory_key_input text,
  memory_value_input text,
  importance_input integer DEFAULT 3,
  created_by_persona_id_input uuid DEFAULT NULL,
  created_by_user_id_input uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_memory_id uuid;
  new_memory_id uuid;
BEGIN
  -- Check if a memory with this key already exists
  SELECT id INTO existing_memory_id
  FROM space_memories
  WHERE space_id = space_id_input
  AND memory_key = memory_key_input;

  -- Update existing memory or insert new one
  IF existing_memory_id IS NOT NULL THEN
    UPDATE space_memories
    SET 
      memory_value = memory_value_input,
      importance = importance_input,
      updated_at = now()
    WHERE id = existing_memory_id
    RETURNING id INTO new_memory_id;
  ELSE
    INSERT INTO space_memories (
      space_id,
      memory_key,
      memory_value,
      importance,
      created_by_persona_id,
      created_by_user_id
    ) VALUES (
      space_id_input,
      memory_key_input,
      memory_value_input,
      importance_input,
      created_by_persona_id_input,
      created_by_user_id_input
    )
    RETURNING id INTO new_memory_id;
  END IF;

  RETURN new_memory_id;
END;
$$;

-- Add triggers to tables if they don't exist yet
DROP TRIGGER IF EXISTS chat_message_memory_extraction ON chat_messages;
DROP TRIGGER IF EXISTS space_message_memory_extraction ON space_messages;

CREATE TRIGGER chat_message_memory_extraction
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION persona_message_memory_trigger();

CREATE TRIGGER space_message_memory_extraction
  AFTER INSERT ON space_messages
  FOR EACH ROW
  EXECUTE FUNCTION space_message_memory_trigger();

-- Add unique constraints for upsert operations if they don't exist
ALTER TABLE persona_memories 
DROP CONSTRAINT IF EXISTS persona_memories_persona_id_memory_key_key;

ALTER TABLE persona_memories 
ADD CONSTRAINT persona_memories_persona_id_memory_key_key 
UNIQUE (persona_id, memory_key);

ALTER TABLE space_memories 
DROP CONSTRAINT IF EXISTS space_memories_space_id_memory_key_key;

ALTER TABLE space_memories 
ADD CONSTRAINT space_memories_space_id_memory_key_key 
UNIQUE (space_id, memory_key);