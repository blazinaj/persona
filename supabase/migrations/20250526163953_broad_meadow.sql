/*
  # Fix profile RLS policies
  
  1. Changes
    - Add RLS policy for authenticated users to update their own profiles
    - Fix existing RLS policies for profiles table
  
  2. Security
    - Ensure users can only update their own profiles
    - Maintain public read access for profiles
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);