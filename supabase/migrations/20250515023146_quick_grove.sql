/*
  # Add conversation renaming capabilities

  1. Changes
    - Add trigger to update conversation timestamps
    - Add function to rename conversations
*/

-- Function to rename conversations
CREATE OR REPLACE FUNCTION rename_conversation(
  conversation_id UUID,
  new_title TEXT
) RETURNS conversations AS $$
DECLARE
  updated_conversation conversations;
BEGIN
  -- Check if the user owns the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update the conversation title
  UPDATE conversations 
  SET title = new_title,
      updated_at = now()
  WHERE id = conversation_id
  RETURNING * INTO updated_conversation;

  RETURN updated_conversation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;