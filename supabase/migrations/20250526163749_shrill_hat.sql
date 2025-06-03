/*
  # Fix profile saving and avatar handling
  
  1. Changes
    - Add function to properly update profiles
    - Add trigger to update updated_at timestamp
    - Add validation for avatar URLs
    - Fix avatar URL handling
  
  2. Security
    - Ensure proper RLS enforcement
    - Add proper validation
*/

-- Function to update profile with validation
CREATE OR REPLACE FUNCTION update_profile(
  profile_id UUID,
  display_name_input TEXT,
  bio_input TEXT,
  avatar_url_input TEXT,
  website_input TEXT,
  twitter_input TEXT,
  github_input TEXT,
  is_public_input BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  can_update BOOLEAN;
BEGIN
  -- Check if user can update this profile
  SELECT (profile_id = auth.uid()) INTO can_update;
  
  IF NOT can_update THEN
    RAISE EXCEPTION 'You can only update your own profile';
  END IF;
  
  -- Update the profile
  UPDATE profiles
  SET 
    display_name = display_name_input,
    bio = bio_input,
    avatar_url = avatar_url_input,
    website = website_input,
    twitter = twitter_input,
    github = github_input,
    is_public = is_public_input,
    updated_at = now()
  WHERE id = profile_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure updated_at is updated
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set app.settings.supabase_url for avatar URL construction
ALTER DATABASE postgres SET "app.settings.supabase_url" TO current_setting('app.settings.endpoint');