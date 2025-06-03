/*
  # Add API keys support
  
  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `key` (text)
      - `last_used` (timestamptz)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
  
  2. Security
    - Enable RLS on api_keys table
    - Add policies for managing API keys
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  CONSTRAINT name_length CHECK (char_length(name) <= 50)
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate a secure API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
DECLARE
  key_bytes bytea;
  key_string text;
BEGIN
  -- Generate 32 random bytes
  key_bytes := gen_random_bytes(32);
  -- Convert to base64 and remove padding
  key_string := encode(key_bytes, 'base64');
  key_string := replace(key_string, '=', '');
  -- Add prefix
  RETURN 'pk_' || key_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new API key
CREATE OR REPLACE FUNCTION create_api_key(
  name_input text,
  expires_at_input timestamptz DEFAULT NULL
)
RETURNS api_keys AS $$
DECLARE
  new_key text;
  result api_keys;
BEGIN
  -- Generate new API key
  new_key := generate_api_key();
  
  -- Insert new key
  INSERT INTO api_keys (
    user_id,
    name,
    key,
    expires_at
  ) VALUES (
    auth.uid(),
    name_input,
    new_key,
    expires_at_input
  )
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;