/*
  # Fix profile saving and avatar handling
  
  1. Changes
    - Add trigger to update profiles.updated_at
    - Add function to handle avatar URL validation
    - Fix profile data handling
  
  2. Security
    - No changes to RLS policies
*/

-- Add updated_at trigger for profiles if it doesn't exist
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to validate avatar URL or path
CREATE OR REPLACE FUNCTION validate_avatar_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valid if null or empty
  IF url IS NULL OR url = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Valid if it's a URL
  IF url LIKE 'http%' THEN
    RETURN TRUE;
  END IF;
  
  -- Valid if it's a storage path
  IF url LIKE 'avatars/%' THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise invalid
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get profile by ID with proper error handling
CREATE OR REPLACE FUNCTION get_profile_by_id(profile_id UUID)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
)
RETURNS profiles AS $$
DECLARE
  result profiles;
BEGIN
  -- Validate inputs
  IF NOT validate_avatar_url(avatar_url_input) THEN
    RAISE EXCEPTION 'Invalid avatar URL format';
  END IF;
  
  -- Update profile
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
  WHERE id = profile_id
  RETURNING * INTO result;
  
  -- If no rows were updated, insert a new profile
  IF result IS NULL THEN
    INSERT INTO profiles (
      id,
      display_name,
      bio,
      avatar_url,
      website,
      twitter,
      github,
      is_public,
      created_at,
      updated_at
    ) VALUES (
      profile_id,
      display_name_input,
      bio_input,
      avatar_url_input,
      website_input,
      twitter_input,
      github_input,
      is_public_input,
      now(),
      now()
    )
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;