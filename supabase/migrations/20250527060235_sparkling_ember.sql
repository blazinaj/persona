/*
  # Add Spaces feature for Slack-like conversations
  
  1. New Tables
    - `spaces`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)
      - `is_public` (boolean)
    
    - `space_members`
      - `id` (uuid, primary key)
      - `space_id` (uuid, references spaces)
      - `persona_id` (uuid, references personas, nullable)
      - `user_id` (uuid, references auth.users, nullable)
      - `role` (text, check constraint for valid roles)
      - `joined_at` (timestamptz)
    
    - `space_messages`
      - `id` (uuid, primary key)
      - `space_id` (uuid, references spaces)
      - `content` (text, required)
      - `persona_id` (uuid, references personas, nullable)
      - `user_id` (uuid, references auth.users, nullable)
      - `created_at` (timestamptz)
    
    - `space_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references space_messages)
      - `emoji` (text, required)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for space management
    - Add policies for message management
*/

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  CONSTRAINT name_length CHECK (char_length(name) <= 50),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Create space_members table
CREATE TABLE IF NOT EXISTS space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT member_type_check CHECK (
    (persona_id IS NOT NULL AND user_id IS NULL) OR
    (persona_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Create space_messages table
CREATE TABLE IF NOT EXISTS space_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  content text NOT NULL,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT message_sender_check CHECK (
    (persona_id IS NOT NULL AND user_id IS NULL) OR
    (persona_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Create space_reactions table
CREATE TABLE IF NOT EXISTS space_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES space_messages(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_reaction UNIQUE (message_id, emoji, user_id)
);

-- Enable RLS
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_reactions ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for spaces
CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view spaces they are members of"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
      AND space_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for space_members
CREATE POLICY "Space owners can add members"
  ON space_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_members.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view members of spaces they belong to"
  ON space_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND (
        spaces.user_id = auth.uid() OR
        spaces.is_public = true OR
        EXISTS (
          SELECT 1 FROM space_members sm
          WHERE sm.space_id = space_members.space_id
          AND sm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Space owners and admins can remove members"
  ON space_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
      AND spaces.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_members.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role IN ('owner', 'admin')
    )
  );

-- Create policies for space_messages
CREATE POLICY "Space members can post messages"
  ON space_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_messages.space_id
      AND space_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages in spaces they belong to"
  ON space_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_messages.space_id
      AND (
        spaces.user_id = auth.uid() OR
        spaces.is_public = true OR
        EXISTS (
          SELECT 1 FROM space_members
          WHERE space_members.space_id = space_messages.space_id
          AND space_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON space_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for space_reactions
CREATE POLICY "Users can add reactions"
  ON space_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view reactions"
  ON space_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_messages
      WHERE space_messages.id = space_reactions.message_id
      AND EXISTS (
        SELECT 1 FROM spaces
        WHERE spaces.id = space_messages.space_id
        AND (
          spaces.user_id = auth.uid() OR
          spaces.is_public = true OR
          EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = spaces.id
            AND space_members.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON space_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to get all spaces for a user
CREATE OR REPLACE FUNCTION get_user_spaces(user_id_input UUID)
RETURNS SETOF spaces
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM spaces s
  WHERE s.user_id = user_id_input
  OR s.is_public = true
  OR EXISTS (
    SELECT 1 FROM space_members sm
    WHERE sm.space_id = s.id
    AND sm.user_id = user_id_input
  )
  ORDER BY s.updated_at DESC;
END;
$$;

-- Function to get all messages for a space
CREATE OR REPLACE FUNCTION get_space_messages(space_id_input UUID, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  space_id UUID,
  content TEXT,
  persona_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_avatar TEXT,
  is_persona BOOLEAN
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
    RAISE EXCEPTION 'Access denied to space messages';
  END IF;

  -- Return messages with sender information
  RETURN QUERY
  SELECT 
    m.id,
    m.space_id,
    m.content,
    m.persona_id,
    m.user_id,
    m.created_at,
    CASE
      WHEN m.persona_id IS NOT NULL THEN p.name
      WHEN m.user_id IS NOT NULL THEN COALESCE(pr.display_name, u.email)
      ELSE 'Unknown'
    END AS sender_name,
    CASE
      WHEN m.persona_id IS NOT NULL THEN p.avatar
      WHEN m.user_id IS NOT NULL THEN pr.avatar_url
      ELSE NULL
    END AS sender_avatar,
    (m.persona_id IS NOT NULL) AS is_persona
  FROM 
    space_messages m
    LEFT JOIN personas p ON m.persona_id = p.id
    LEFT JOIN auth.users u ON m.user_id = u.id
    LEFT JOIN profiles pr ON m.user_id = pr.id
  WHERE 
    m.space_id = space_id_input
  ORDER BY 
    m.created_at ASC
  LIMIT limit_count;
END;
$$;

-- Function to add a persona message to a space
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
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space';
  END IF;

  -- Insert the message
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

-- Function to determine which personas should respond
CREATE OR REPLACE FUNCTION should_persona_respond(
  space_id_input UUID,
  persona_id_input UUID,
  recent_messages_count INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_last_message TIMESTAMPTZ;
  recent_user_messages INTEGER;
  persona_count INTEGER;
  active_persona_count INTEGER;
  random_factor FLOAT;
  persona_probability FLOAT;
BEGIN
  -- Get when this persona last sent a message
  SELECT MAX(created_at) INTO persona_last_message
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id = persona_id_input;
  
  -- Count recent user messages (non-persona messages)
  SELECT COUNT(*) INTO recent_user_messages
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id IS NULL
  AND created_at > COALESCE(persona_last_message, '1970-01-01'::TIMESTAMPTZ);
  
  -- Count total personas in the space
  SELECT COUNT(*) INTO persona_count
  FROM space_members
  WHERE space_id = space_id_input
  AND persona_id IS NOT NULL;
  
  -- Count active personas (those who have sent messages)
  SELECT COUNT(DISTINCT persona_id) INTO active_persona_count
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id IS NOT NULL
  AND created_at > (now() - interval '1 hour');
  
  -- Add some randomness
  random_factor := random();
  
  -- Calculate probability based on factors
  -- Higher if:
  -- - Persona hasn't spoken recently
  -- - There are recent user messages
  -- - There are fewer active personas
  persona_probability := 
    (CASE WHEN persona_last_message IS NULL THEN 0.8 ELSE 0.4 END) +
    (CASE WHEN recent_user_messages > 0 THEN 0.3 ELSE 0 END) +
    (CASE WHEN active_persona_count < persona_count THEN 0.2 ELSE 0 END);
  
  -- Return true if random factor is less than calculated probability
  RETURN random_factor < persona_probability;
END;
$$;