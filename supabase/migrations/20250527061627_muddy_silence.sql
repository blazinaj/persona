/*
  # Fix space message trigger
  
  1. Changes
    - Drop existing trigger if it exists before creating it
    - Keep the handle_new_space_message function
  
  2. Security
    - No changes to security model
*/

-- Function to handle new space messages (recreate for completeness)
CREATE OR REPLACE FUNCTION handle_new_space_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process user messages (not persona messages)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Send notification about new message
  PERFORM pg_notify(
    'new_space_message',
    json_build_object(
      'space_id', NEW.space_id,
      'message_id', NEW.id,
      'user_id', NEW.user_id,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists before creating it
DROP TRIGGER IF EXISTS space_message_webhook_trigger ON space_messages;

-- Create trigger for new space messages
CREATE TRIGGER space_message_webhook_trigger
AFTER INSERT ON space_messages
FOR EACH ROW
EXECUTE FUNCTION handle_new_space_message();