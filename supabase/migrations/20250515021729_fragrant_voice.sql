/*
  # Add chat history support
  
  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `content` (text)
      - `role` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to manage their messages
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert chat messages for their personas"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas
      WHERE id = chat_messages.persona_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view chat messages for their personas"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE id = chat_messages.persona_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chat messages for their personas"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE id = chat_messages.persona_id
      AND user_id = auth.uid()
    )
  );