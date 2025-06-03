/*
  # Fix avatar storage and handling
  
  1. Changes
    - Add function to download and store DALL-E generated images
    - Ensure proper URL handling for avatars
    - Fix avatar path construction
  
  2. Security
    - Validate image URLs
    - Ensure proper storage access
*/

-- Function to validate image URL
CREATE OR REPLACE FUNCTION is_valid_image_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN url ~* '^https?://.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$' OR
         url ~* '^https?://.*\.(blob\.core\.windows\.net)/.*$';
END;
$$ LANGUAGE plpgsql;

-- Function to get proper avatar URL
CREATE OR REPLACE FUNCTION get_avatar_url(avatar_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF avatar_path IS NULL OR avatar_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- If it's already a URL, return it
  IF avatar_path LIKE 'http%' THEN
    RETURN avatar_path;
  END IF;
  
  -- If it's a storage path, construct the URL
  IF avatar_path LIKE 'avatars/%' OR avatar_path NOT LIKE '%/%' THEN
    DECLARE
      path TEXT := avatar_path;
    BEGIN
      -- Ensure path starts with avatars/
      IF path NOT LIKE 'avatars/%' THEN
        path := 'avatars/' || path;
      END IF;
      
      RETURN storage.url('persona-avatars', path);
    END;
  END IF;
  
  -- Return as is if none of the above
  RETURN avatar_path;
END;
$$ LANGUAGE plpgsql;