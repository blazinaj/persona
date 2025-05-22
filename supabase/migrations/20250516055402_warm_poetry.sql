/*
  # Add widget support
  
  1. Changes
    - Add widget_sessions table for anonymous chat sessions
    - Add widget_messages table for widget chat history
    - Add functions and policies for widget access
*/

-- Create widget_sessions table
CREATE TABLE IF NOT EXISTS widget_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

-- Create widget_messages table
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
  USING (true);

-- Create policies for widget_messages
CREATE POLICY "Anyone can insert widget messages"
  ON widget_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view widget messages"
  ON widget_messages
  FOR SELECT
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