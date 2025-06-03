/*
  # Add space message webhook trigger
  
  1. New Functions
    - `handle_new_space_message`: Trigger function that fires when a new message is added to a space
    - `notify_space_message`: Function to send notification about new messages
  
  2. Changes
    - Add trigger on space_messages table
    - Use pg_notify for message notifications instead of direct webhook calls
*/

-- Function to handle new space messages
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

-- Create trigger for new space messages
CREATE TRIGGER space_message_webhook_trigger
AFTER INSERT ON space_messages
FOR EACH ROW
EXECUTE FUNCTION handle_new_space_message();

-- Function to manually notify about a space message (for testing)
CREATE OR REPLACE FUNCTION notify_space_message(message_id uuid)
RETURNS boolean AS $$
DECLARE
  message_data record;
BEGIN
  -- Get message data
  SELECT * INTO message_data
  FROM space_messages
  WHERE id = message_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Send notification
  PERFORM pg_notify(
    'new_space_message',
    json_build_object(
      'space_id', message_data.space_id,
      'message_id', message_data.id,
      'user_id', message_data.user_id,
      'content', message_data.content,
      'created_at', message_data.created_at
    )::text
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;