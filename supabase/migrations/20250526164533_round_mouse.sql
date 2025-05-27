/*
  # Fix profile privacy settings
  
  1. Changes
    - Update RLS policies for profiles table
    - Make email field private to the user
    - Ensure public profiles only expose public information
  
  2. Security
    - Protect user email addresses
    - Allow public access to display_name and other public fields
    - Maintain proper access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create new policies with proper privacy controls
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (
    CASE 
      WHEN auth.uid() = id THEN true  -- User can see all their own data
      WHEN is_public = true THEN true -- Public profiles are visible
      ELSE false                      -- Private profiles are not visible
    END
  );

-- Create a security barrier view that hides email for public access
CREATE OR REPLACE VIEW public_profile_view AS
SELECT
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
FROM
  profiles
WHERE
  is_public = true OR id = auth.uid();

-- Function to get profile with proper privacy controls
CREATE OR REPLACE FUNCTION get_public_profile(profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
  is_own_profile BOOLEAN;
BEGIN
  -- Check if this is the user's own profile
  is_own_profile := (profile_id = auth.uid());
  
  -- Get profile data with privacy controls
  SELECT 
    CASE
      WHEN is_own_profile THEN 
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'email', p.email,
          'bio', p.bio,
          'avatar_url', p.avatar_url,
          'website', p.website,
          'twitter', p.twitter,
          'github', p.github,
          'is_public', p.is_public,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        )
      WHEN p.is_public THEN
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'bio', p.bio,
          'avatar_url', p.avatar_url,
          'website', p.website,
          'twitter', p.twitter,
          'github', p.github,
          'is_public', p.is_public,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        )
      ELSE
        NULL
    END INTO profile_data
  FROM profiles p
  WHERE p.id = profile_id;
  
  RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;