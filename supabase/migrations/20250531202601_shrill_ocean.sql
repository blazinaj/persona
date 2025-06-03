/*
  # Fix space_messages RLS policies

  1. Changes
     - Replace the existing INSERT policy for space_messages with a simplified policy
     - This allows users to insert messages in spaces where they are members
     - Also adds a policy for users to insert messages in public spaces

  2. Security
     - Maintains security by ensuring users can only post to spaces they are members of
     - Adds ability to post in public spaces for better user experience
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Space members can post messages" ON public.space_messages;

-- Create new INSERT policy for members
CREATE POLICY "Users can insert messages in spaces they are members of"
ON public.space_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.space_members
    WHERE space_members.space_id = space_messages.space_id
      AND space_members.user_id = auth.uid()
  )
);

-- Create policy for public spaces
CREATE POLICY "Users can insert messages in public spaces"
ON public.space_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.spaces
    WHERE spaces.id = space_messages.space_id
      AND spaces.is_public = true
  )
);