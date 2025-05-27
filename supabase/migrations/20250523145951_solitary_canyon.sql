/*
  # Add avatar storage support
  
  1. Changes
    - Create storage bucket for persona avatars
    - Add RLS policies for avatar access
    - Add helper functions for avatar management
*/

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('persona-avatars', 'persona-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'persona-avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'persona-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'persona-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'persona-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Function to get avatar URL
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
  
  -- Otherwise, construct the storage URL
  RETURN storage.url('persona-avatars', avatar_path);
END;
$$ LANGUAGE plpgsql;