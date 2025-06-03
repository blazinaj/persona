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