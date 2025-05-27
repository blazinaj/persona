/*
  # Add persona feedback table

  1. New Tables
    - `persona_feedback`
      - `id` (uuid, primary key)
      - `persona_id` (uuid, foreign key to personas)
      - `user_id` (uuid, foreign key to auth.users)
      - `rating` (integer, 1-5 star rating)
      - `comment` (text, optional feedback comment)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `persona_feedback` table
    - Add policies for authenticated users to manage their own feedback
    - Add policy for public viewing of feedback on public personas
    
  3. Constraints
    - Ensure rating is between 1 and 5
    - Ensure each user can only provide one feedback per persona
*/

-- Create persona_feedback table
CREATE TABLE IF NOT EXISTS persona_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(persona_id, user_id)
);

-- Enable row level security
ALTER TABLE persona_feedback ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_persona_feedback_updated_at
BEFORE UPDATE ON persona_feedback
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policies
-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback"
  ON persona_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
  ON persona_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
  ON persona_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view their own feedback and feedback for public personas
CREATE POLICY "Users can view feedback"
  ON persona_feedback
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_feedback.persona_id 
      AND personas.visibility = 'public'
    )
  );

-- Create function to get average rating for a persona
CREATE OR REPLACE FUNCTION get_persona_rating(persona_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'average_rating', COALESCE(AVG(rating), 0),
    'total_ratings', COUNT(*)
  ) INTO result
  FROM persona_feedback
  WHERE persona_id = persona_id_input;
  
  RETURN result;
END;
$$;

-- Create function to update profile stats when feedback is added/removed
CREATE OR REPLACE FUNCTION update_persona_stats_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_user_id uuid;
BEGIN
  -- Get the user_id of the persona
  SELECT user_id INTO persona_user_id
  FROM personas
  WHERE id = COALESCE(NEW.persona_id, OLD.persona_id);
  
  -- Update profile stats
  IF persona_user_id IS NOT NULL THEN
    -- Trigger update of profile stats
    PERFORM update_profile_stats(persona_user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for feedback changes
CREATE TRIGGER persona_feedback_stats_update
AFTER INSERT OR UPDATE OR DELETE ON persona_feedback
FOR EACH ROW EXECUTE FUNCTION update_persona_stats_on_feedback();