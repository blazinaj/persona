/*
  # Create personas schema

  1. New Tables
    - `personas`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `avatar` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `tags` (text[])
      - `personality` (text[])
      - `knowledge` (text[])
      - `tone` (text)
      - `examples` (text[])
      - `is_public` (boolean)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `personas` table
    - Add policies for CRUD operations
*/

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}',
  personality text[] DEFAULT '{}',
  knowledge text[] DEFAULT '{}',
  tone text,
  examples text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT name_length CHECK (char_length(name) <= 50),
  CONSTRAINT description_length CHECK (char_length(description) <= 200)
);

-- Enable RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own personas"
  ON personas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own personas"
  ON personas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update their own personas"
  ON personas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas"
  ON personas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();