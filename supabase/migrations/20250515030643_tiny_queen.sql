/*
  # Add persona interactions tracking
  
  1. New Tables
    - `persona_views`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `viewer_id` (uuid, references auth.users)
      - `viewed_at` (timestamptz)
      
    - `persona_favorites`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `user_id` (uuid, references auth.users)
      - `favorited_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for view/favorite tracking
*/

-- Create persona_views table
CREATE TABLE IF NOT EXISTS persona_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(persona_id, viewer_id)
);

-- Create persona_favorites table
CREATE TABLE IF NOT EXISTS persona_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  favorited_at timestamptz DEFAULT now(),
  UNIQUE(persona_id, user_id)
);

-- Enable RLS
ALTER TABLE persona_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_favorites ENABLE ROW LEVEL SECURITY;

-- Policies for persona_views
CREATE POLICY "Users can view their own view history"
  ON persona_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

CREATE POLICY "Users can track their views"
  ON persona_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

-- Policies for persona_favorites
CREATE POLICY "Users can view their favorites"
  ON persona_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their favorites"
  ON persona_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_persona_favorite(persona_id_input UUID)
RETURNS boolean AS $$
DECLARE
  was_favorited boolean;
BEGIN
  -- Try to delete existing favorite
  DELETE FROM persona_favorites
  WHERE persona_id = persona_id_input AND user_id = auth.uid()
  RETURNING true INTO was_favorited;
  
  -- If no row was deleted, insert new favorite
  IF was_favorited IS NULL THEN
    INSERT INTO persona_favorites (persona_id, user_id)
    VALUES (persona_id_input, auth.uid());
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;