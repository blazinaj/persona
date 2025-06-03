/*
  # Add persona knowledge entries
  
  1. New Tables
    - `persona_knowledge_entries`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `title` (text, max 50 characters)
      - `description` (text, max 500 characters)
      - `category` (text)
      - `source` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on persona_knowledge_entries table
    - Add policies for managing knowledge entries
*/

-- Create persona_knowledge_entries table
CREATE TABLE IF NOT EXISTS persona_knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT title_length CHECK (char_length(title) <= 50),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Enable RLS
ALTER TABLE persona_knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own knowledge entries"
  ON persona_knowledge_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view knowledge entries"
  ON persona_knowledge_entries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_knowledge_entries.persona_id
      AND (personas.visibility = 'public' OR personas.visibility = 'unlisted')
    )
  );

CREATE POLICY "Users can update their own knowledge entries"
  ON persona_knowledge_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge entries"
  ON persona_knowledge_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_persona_knowledge_entries_updated_at
  BEFORE UPDATE ON persona_knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();