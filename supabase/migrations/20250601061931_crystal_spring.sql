/*
  # Add memory system for personas and spaces
  
  1. New Tables
    - `persona_memories`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `memory_key` (text, descriptive name of the memory)
      - `memory_value` (text, the content of the memory)
      - `importance` (integer, priority ranking from 1-5)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)
      
    - `space_memories`
      - `id` (uuid, primary key)
      - `space_id` (uuid, references spaces)
      - `memory_key` (text)
      - `memory_value` (text)
      - `importance` (integer, 1-5)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by_persona_id` (uuid, references personas, optional)
      - `created_by_user_id` (uuid, references auth.users, optional)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for memory management
*/

-- Create persona_memories table
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

-- Create space_memories table
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

-- Enable RLS on both tables
ALTER TABLE persona_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_memories ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_persona_memories_updated_at
  BEFORE UPDATE ON persona_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_space_memories_updated_at
  BEFORE UPDATE ON space_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for persona_memories
CREATE POLICY "Users can create memories for their personas"
  ON persona_memories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_memories.persona_id
      AND personas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view memories for their personas"
  ON persona_memories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_memories.persona_id
      AND personas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update memories for their personas"
  ON persona_memories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_memories.persona_id
      AND personas.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_memories.persona_id
      AND personas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete memories for their personas"
  ON persona_memories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_memories.persona_id
      AND personas.user_id = auth.uid()
    )
  );

-- Create policies for space_memories
CREATE POLICY "Space owners and admins can manage memories"
  ON space_memories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_memories.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_memories.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_memories.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_memories.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Space members can view memories"
  ON space_memories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_memories.space_id
      AND space_members.user_id = auth.uid()
    )
  );

-- Functions for memory management
CREATE OR REPLACE FUNCTION get_persona_memories(
  persona_id_input uuid,
  limit_count integer DEFAULT 100,
  importance_threshold integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  memory_key text,
  memory_value text,
  importance integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this persona
  IF NOT EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to persona memories';
  END IF;

  -- Return persona memories ordered by importance and recency
  RETURN QUERY
  SELECT
    pm.id,
    pm.memory_key,
    pm.memory_value,
    pm.importance,
    pm.created_at,
    pm.updated_at
  FROM persona_memories pm
  WHERE pm.persona_id = persona_id_input
  AND pm.importance >= importance_threshold
  ORDER BY pm.importance DESC, pm.updated_at DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_space_memories(
  space_id_input uuid,
  limit_count integer DEFAULT 100,
  importance_threshold integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  memory_key text,
  memory_value text,
  importance integer,
  created_at timestamptz,
  updated_at timestamptz,
  created_by_persona_name text,
  created_by_user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space memories';
  END IF;

  -- Return space memories with creator information
  RETURN QUERY
  SELECT
    sm.id,
    sm.memory_key,
    sm.memory_value,
    sm.importance,
    sm.created_at,
    sm.updated_at,
    p.name AS created_by_persona_name,
    COALESCE(pr.display_name, u.email) AS created_by_user_name
  FROM space_memories sm
  LEFT JOIN personas p ON sm.created_by_persona_id = p.id
  LEFT JOIN auth.users u ON sm.created_by_user_id = u.id
  LEFT JOIN profiles pr ON sm.created_by_user_id = pr.id
  WHERE sm.space_id = space_id_input
  AND sm.importance >= importance_threshold
  ORDER BY sm.importance DESC, sm.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to add or update a persona memory
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
  -- Check if user has access to this persona
  IF NOT EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to persona memories';
  END IF;

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

-- Function to add or update a space memory
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
  actual_user_id uuid;
BEGIN
  -- If no creator specified, use the current user
  IF created_by_user_id_input IS NULL AND created_by_persona_id_input IS NULL THEN
    actual_user_id := auth.uid();
  ELSE
    actual_user_id := created_by_user_id_input;
  END IF;

  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space memories';
  END IF;

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
      actual_user_id
    )
    RETURNING id INTO new_memory_id;
  END IF;

  RETURN new_memory_id;
END;
$$;

-- Function to extract memories from conversation messages
CREATE OR REPLACE FUNCTION extract_memories_from_text(
  text_content text
)
RETURNS TABLE (
  memory_key text,
  memory_value text,
  importance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function would ideally use an AI service to extract memories
  -- For now, we'll implement a simple pattern-based extraction
  -- In production, this would call an external AI service

  -- Extract explicit memory declarations
  -- Format: [MEMORY: key=value, importance=X]
  RETURN QUERY
  WITH memory_patterns AS (
    SELECT 
      (regexp_matches(
        text_content, 
        '\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]',
        'g'
      ))[1] AS key,
      (regexp_matches(
        text_content, 
        '\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]',
        'g'
      ))[2] AS value,
      COALESCE(
        (regexp_matches(
          text_content, 
          '\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]',
          'g'
        ))[3],
        '3'
      )::integer AS importance
  )
  SELECT 
    trim(key) AS memory_key,
    trim(value) AS memory_value,
    importance
  FROM memory_patterns;

  -- Note: In production, this would be replaced with an AI-based extractor
  -- The AI would analyze the text and identify key facts to remember
END;
$$;

-- Function to automatically extract and store memories from messages
CREATE OR REPLACE FUNCTION process_message_for_memories(
  message_id uuid,
  is_space_message boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record record;
  memory_count integer := 0;
  memory_record record;
  extracted_memories record;
BEGIN
  -- Get message details
  IF is_space_message THEN
    SELECT sm.*, sm.space_id AS context_id
    INTO message_record
    FROM space_messages sm
    WHERE sm.id = message_id;
  ELSE
    SELECT cm.*, cm.persona_id, cm.conversation_id AS context_id
    INTO message_record
    FROM chat_messages cm
    WHERE cm.id = message_id;
  END IF;
  
  -- If message not found, return 0
  IF message_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Extract memories from message content
  FOR extracted_memories IN
    SELECT * FROM extract_memories_from_text(message_record.content)
  LOOP
    -- Store the extracted memory
    IF is_space_message THEN
      -- Store as space memory
      PERFORM upsert_space_memory(
        message_record.context_id,
        extracted_memories.memory_key,
        extracted_memories.memory_value,
        extracted_memories.importance,
        message_record.persona_id,
        message_record.user_id
      );
    ELSE
      -- Store as persona memory
      PERFORM upsert_persona_memory(
        message_record.persona_id,
        extracted_memories.memory_key,
        extracted_memories.memory_value,
        extracted_memories.importance
      );
    END IF;
    
    memory_count := memory_count + 1;
  END LOOP;
  
  RETURN memory_count;
END;
$$;

-- Add trigger to automatically process persona messages for memories
CREATE OR REPLACE FUNCTION persona_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process assistant messages (AI responses)
  IF NEW.role = 'assistant' THEN
    PERFORM process_message_for_memories(NEW.id, false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_message_memory_extraction
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION persona_message_memory_trigger();

-- Add trigger to automatically process space messages for memories
CREATE OR REPLACE FUNCTION space_message_memory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process messages from personas
  IF NEW.persona_id IS NOT NULL THEN
    PERFORM process_message_for_memories(NEW.id, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER space_message_memory_extraction
AFTER INSERT ON space_messages
FOR EACH ROW
EXECUTE FUNCTION space_message_memory_trigger();