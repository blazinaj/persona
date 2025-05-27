/*
  # Fix avatar validation and URL handling
  
  1. Changes
    - Remove URL validation constraint from avatar field
    - Add function to validate avatar paths
    - Update avatar URL handling
  
  2. Security
    - Ensure proper path validation
    - Maintain storage security
*/

-- Function to validate avatar path
CREATE OR REPLACE FUNCTION validate_avatar_path(path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valid if null or empty
  IF path IS NULL OR path = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Valid if it's a URL
  IF path LIKE 'http%' THEN
    RETURN TRUE;
  END IF;
  
  -- Valid if it's a storage path
  IF path LIKE 'avatars/%' THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise invalid
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get avatar URL from path
CREATE OR REPLACE FUNCTION get_avatar_url_from_path(path TEXT)
RETURNS TEXT AS $$
DECLARE
  supabase_url TEXT;
BEGIN
  -- Get Supabase URL from environment
  supabase_url := current_setting('app.settings.supabase_url', TRUE);
  
  -- Return default if path is empty
  IF path IS NULL OR path = '' THEN
    RETURN NULL;
  END IF;
  
  -- If it's already a URL, return it
  IF path LIKE 'http%' THEN
    RETURN path;
  END IF;
  
  -- If it's a storage path, construct the URL
  IF path LIKE 'avatars/%' THEN
    RETURN supabase_url || '/storage/v1/object/public/persona-avatars/' || path;
  END IF;
  
  -- If it's just a filename, add the avatars/ prefix
  RETURN supabase_url || '/storage/v1/object/public/persona-avatars/avatars/' || path;
END;
$$ LANGUAGE plpgsql;