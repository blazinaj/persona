-- First, let's drop the existing problematic trigger function
DROP FUNCTION IF EXISTS persona_message_memory_trigger CASCADE;
DROP FUNCTION IF EXISTS space_message_memory_trigger CASCADE;

-- Create table for persona memories if it doesn't exist
CREATE TABLE IF NOT EXISTS persona_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  importance integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT memory_key_length CHECK (char_length(memory_key) <= 100),
  CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 2000)
);

-- Create table for space memories if it doesn't exist
CREATE TABLE IF NOT EXISTS space_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  importance integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT memory_key_length CHECK (char_length(memory_key) <= 100),
  CONSTRAINT memory_value_length CHECK (char_length(memory_value) <= 2000),
  CONSTRAINT creator_check CHECK (
    (created_by_persona_id IS NOT NULL AND created_by_user_id IS NULL) OR
    (created_by_persona_id IS NULL AND created_by_user_id IS NOT NULL) OR
    (created_by_persona_id IS NULL AND created_by_user_id IS NULL)
  )
);

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
  persona_owner_id uuid;
BEGIN
  -- Get the persona owner's user ID
  SELECT user_id INTO persona_owner_id
  FROM personas
  WHERE id = persona_id_input;
  
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
      persona_owner_id
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
DO $$ 
BEGIN
  -- Check if the constraint exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'persona_memories_persona_id_memory_key_key'
  ) THEN
    -- If it exists, drop it
    ALTER TABLE persona_memories 
    DROP CONSTRAINT persona_memories_persona_id_memory_key_key;
  END IF;
  
  -- Now create the constraint
  ALTER TABLE persona_memories 
  ADD CONSTRAINT persona_memories_persona_id_memory_key_key 
  UNIQUE (persona_id, memory_key);
  
  -- Same for space_memories
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'space_memories_space_id_memory_key_key'
  ) THEN
    ALTER TABLE space_memories 
    DROP CONSTRAINT space_memories_space_id_memory_key_key;
  END IF;
  
  ALTER TABLE space_memories 
  ADD CONSTRAINT space_memories_space_id_memory_key_key 
  UNIQUE (space_id, memory_key);
END $$;