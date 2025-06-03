/*
  # Add integrations support
  
  1. New Tables
    - `integrations`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `name` (text)
      - `description` (text)
      - `endpoint` (text)
      - `method` (text)
      - `headers` (jsonb)
      - `parameters` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_active` (boolean)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on integrations table
    - Add policies for managing integrations
*/

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  endpoint text NOT NULL,
  method text NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers jsonb DEFAULT '{}'::jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT name_length CHECK (char_length(name) <= 50),
  CONSTRAINT description_length CHECK (char_length(description) <= 200)
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own integrations"
  ON integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own integrations"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate endpoint URL
CREATE OR REPLACE FUNCTION validate_endpoint_url()
RETURNS trigger AS $$
BEGIN
  IF NOT (NEW.endpoint ~* '^https?://[^\s/$.?#].[^\s]*$') THEN
    RAISE EXCEPTION 'Invalid endpoint URL format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for endpoint validation
CREATE TRIGGER validate_endpoint_url_trigger
  BEFORE INSERT OR UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION validate_endpoint_url();