/*
  # Fix space_messages RLS policy to allow personas to post
  
  1. Changes
    - Drop existing INSERT policies for space_messages
    - Add a new policy that allows both:
      - Users to post their own messages
      - Users to post messages via their personas
    - Fix issues with persona message permission checks
  
  2. Security
    - Maintain proper access control
    - Ensure personas can post in spaces they're members of
*/

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Space members can post messages" ON space_messages;
DROP POLICY IF EXISTS "Users can insert messages in spaces they are members of" ON space_messages;
DROP POLICY IF EXISTS "Users can insert messages in public spaces" ON space_messages;

-- Create a new comprehensive policy that allows both user messages and persona messages
CREATE POLICY "Users can insert messages in spaces"
ON space_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow direct user messages in spaces they are members of
  (user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_messages.space_id
      AND space_members.user_id = auth.uid()
    )
  )
  OR
  -- Allow direct user messages in public spaces
  (user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_messages.space_id
      AND spaces.is_public = true
    )
  )
  OR
  -- Allow persona messages for personas owned by the user
  (persona_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = space_messages.persona_id
      AND personas.user_id = auth.uid()
    )
  )
);

-- Update should_persona_respond function to make personas more likely to respond
CREATE OR REPLACE FUNCTION should_persona_respond(
  space_id_input UUID,
  persona_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_last_message TIMESTAMPTZ;
  last_user_message TIMESTAMPTZ;
  last_user_message_id UUID;
  persona_probability FLOAT := 0.75; -- Increased from default value to make responses more likely
BEGIN
  -- Get when this persona last sent a message
  SELECT MAX(created_at) INTO persona_last_message
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id = persona_id_input;
  
  -- Get the most recent user message
  SELECT created_at, id INTO last_user_message, last_user_message_id
  FROM space_messages
  WHERE space_id = space_id_input
  AND persona_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no user messages or last message is too old, don't respond
  IF last_user_message IS NULL OR 
     (now() - last_user_message) > interval '5 minutes' THEN
    RETURN FALSE;
  END IF;
  
  -- If persona has already responded to this message (based on timing), don't respond again
  IF persona_last_message IS NOT NULL AND 
     persona_last_message > last_user_message THEN
    RETURN FALSE;
  END IF;

  -- Make personas more likely to respond to questions
  IF EXISTS (
    SELECT 1 FROM space_messages 
    WHERE id = last_user_message_id AND content LIKE '%?%'
  ) THEN
    persona_probability := 0.9;
  END IF;
  
  -- Use persona knowledge areas to determine if they should respond
  IF EXISTS (
    SELECT 1 
    FROM personas p
    JOIN space_messages m ON m.id = last_user_message_id
    WHERE p.id = persona_id_input
    AND EXISTS (
      SELECT 1 
      FROM unnest(p.knowledge) k
      WHERE m.content ILIKE '%' || k || '%'
    )
  ) THEN
    persona_probability := 0.95;
  END IF;

  -- Return true with the calculated probability
  RETURN random() <= persona_probability;
END;
$$;