/*
  # Fix widget session policies and tables

  1. Changes
    - Drop existing policies before recreating
    - Ensure clean policy creation
    - Fix widget session validation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create widget sessions for public personas" ON widget_sessions;
DROP POLICY IF EXISTS "Anyone can view widget sessions" ON widget_sessions;
DROP POLICY IF EXISTS "Anyone can insert widget messages" ON widget_messages;
DROP POLICY IF EXISTS "Anyone can view widget messages" ON widget_messages;

-- Create widget_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS widget_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

-- Create widget_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS widget_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES widget_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE widget_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for widget_sessions
CREATE POLICY "Anyone can create widget sessions for public personas"
  ON widget_sessions
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = widget_sessions.persona_id
      AND personas.visibility = 'public'
    )
  );

CREATE POLICY "Anyone can view widget sessions"
  ON widget_sessions
  FOR SELECT
  TO public
  USING (true);

-- Create policies for widget_messages
CREATE POLICY "Anyone can insert widget messages"
  ON widget_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view widget messages"
  ON widget_messages
  FOR SELECT
  TO public
  USING (true);

-- Function to validate widget session
CREATE OR REPLACE FUNCTION validate_widget_session(
  session_id_input text,
  persona_id_input uuid
) RETURNS boolean AS $$
DECLARE
  session_record widget_sessions%ROWTYPE;
BEGIN
  -- Get session if it exists
  SELECT * INTO session_record
  FROM widget_sessions
  WHERE session_id = session_id_input
  AND persona_id = persona_id_input;
  
  -- Update last_active if session exists
  IF FOUND THEN
    UPDATE widget_sessions
    SET last_active = now()
    WHERE id = session_record.id;
    RETURN true;
  END IF;
  
  -- Create new session if persona is public
  IF EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND visibility = 'public'
  ) THEN
    INSERT INTO widget_sessions (persona_id, session_id)
    VALUES (persona_id_input, session_id_input);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;