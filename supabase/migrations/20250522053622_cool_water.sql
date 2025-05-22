/*
  # Add custom functions support for personas
  
  1. New Tables
    - `persona_functions`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `name` (text)
      - `description` (text)
      - `code` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on persona_functions table
    - Add policies for managing functions
*/

-- Create persona_functions table
CREATE TABLE IF NOT EXISTS persona_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT name_length CHECK (char_length(name) <= 50),
  CONSTRAINT description_length CHECK (char_length(description) <= 200)
);

-- Enable RLS
ALTER TABLE persona_functions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own functions"
  ON persona_functions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own functions"
  ON persona_functions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = persona_functions.persona_id
      AND personas.visibility = 'public'
    )
  );

CREATE POLICY "Users can update their own functions"
  ON persona_functions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own functions"
  ON persona_functions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_persona_functions_updated_at
  BEFORE UPDATE ON persona_functions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();