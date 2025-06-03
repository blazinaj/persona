/*
  # Add community features and public profiles
  
  1. Changes
    - Add public profile fields
    - Add profile visibility settings
    - Add profile stats tracking
    - Add profile followers support
    - Add profile bio and social links
  
  2. Security
    - Enable RLS on all tables
    - Add policies for profile visibility
*/

-- Add new fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add profile stats
CREATE TABLE IF NOT EXISTS profile_stats (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_personas integer DEFAULT 0,
  public_personas integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_favorites integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add profile followers
CREATE TABLE IF NOT EXISTS profile_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, follower_id)
);

-- Enable RLS
ALTER TABLE profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_stats
CREATE POLICY "Anyone can view public profile stats"
  ON profile_stats
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stats.profile_id
      AND (profiles.is_public = true OR profiles.id = auth.uid())
    )
  );

-- Create policies for profile_followers
CREATE POLICY "Users can follow/unfollow profiles"
  ON profile_followers
  FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Anyone can view followers"
  ON profile_followers
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_followers.profile_id
      AND (profiles.is_public = true OR profiles.id = auth.uid())
    )
  );

-- Function to toggle following status
CREATE OR REPLACE FUNCTION toggle_profile_follow(
  profile_id_input uuid
) RETURNS boolean AS $$
DECLARE
  was_following boolean;
BEGIN
  -- Check if already following
  DELETE FROM profile_followers
  WHERE profile_id = profile_id_input 
  AND follower_id = auth.uid()
  RETURNING true INTO was_following;
  
  -- If not following, add new follow
  IF was_following IS NULL THEN
    INSERT INTO profile_followers (profile_id, follower_id)
    VALUES (profile_id_input, auth.uid());
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats(
  profile_id_input uuid
) RETURNS void AS $$
BEGIN
  -- Insert or update stats
  INSERT INTO profile_stats (
    profile_id,
    total_personas,
    public_personas,
    total_views,
    total_favorites
  )
  SELECT
    profile_id_input,
    COUNT(p.id),
    COUNT(p.id) FILTER (WHERE p.visibility = 'public'),
    COALESCE(SUM((SELECT COUNT(*) FROM persona_views WHERE persona_id = p.id)), 0),
    COALESCE(SUM((SELECT COUNT(*) FROM persona_favorites WHERE persona_id = p.id)), 0)
  FROM personas p
  WHERE p.user_id = profile_id_input
  ON CONFLICT (profile_id)
  DO UPDATE SET
    total_personas = EXCLUDED.total_personas,
    public_personas = EXCLUDED.public_personas,
    total_views = EXCLUDED.total_views,
    total_favorites = EXCLUDED.total_favorites,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats when personas change
CREATE OR REPLACE FUNCTION update_profile_stats_trigger()
RETURNS trigger AS $$
BEGIN
  -- Update stats for affected profile
  PERFORM update_profile_stats(
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER persona_stats_update
  AFTER INSERT OR UPDATE OR DELETE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats_trigger();

-- Initialize stats for existing profiles
INSERT INTO profile_stats (profile_id)
SELECT id FROM profiles
ON CONFLICT (profile_id) DO NOTHING;

-- Update stats for all profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM profiles
  LOOP
    PERFORM update_profile_stats(profile_record.id);
  END LOOP;
END $$;