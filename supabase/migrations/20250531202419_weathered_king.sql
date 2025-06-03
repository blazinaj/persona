/*
  # Fix space_messages RLS policy for users posting messages
  
  1. Changes
    - Drop the existing INSERT policy for space_messages
    - Create an updated policy that properly handles both:
      - Direct user messages
      - Messages sent through personas
    
  2. Security
    - Ensure users can only post messages in spaces they're members of
    - Allow users to post using their personas if the persona is a space member
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Space members can post messages" ON public.space_messages;

-- Create an updated INSERT policy that handles both direct messages and persona messages
CREATE POLICY "Space members can post messages" 
ON public.space_messages
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Check for direct user messages
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM space_members
    WHERE space_members.space_id = space_messages.space_id
    AND space_members.user_id = auth.uid()
  ))
  OR
  -- Check for persona messages (when a user posts via their persona)
  (persona_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = space_messages.persona_id
    AND personas.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_messages.space_id
      AND (
        space_members.user_id = auth.uid() OR 
        space_members.persona_id = space_messages.persona_id
      )
    )
  ))
);