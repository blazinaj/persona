/*
  # Add push notification support
  
  1. New Tables
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subscription_object` (jsonb, the browser subscription)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `space_notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `space_id` (uuid, references spaces)
      - `enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for managing subscriptions
*/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_object jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create space_notification_settings table
CREATE TABLE IF NOT EXISTS space_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, space_id)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_space_notification_settings_updated_at
  BEFORE UPDATE ON space_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for space_notification_settings
CREATE POLICY "Users can manage their own notification settings"
  ON space_notification_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to upsert a push subscription
CREATE OR REPLACE FUNCTION upsert_push_subscription(
  subscription_object_input jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Delete existing subscriptions for this user with the same endpoint
  DELETE FROM push_subscriptions
  WHERE user_id = auth.uid()
  AND subscription_object->>'endpoint' = subscription_object_input->>'endpoint';

  -- Insert new subscription
  INSERT INTO push_subscriptions (
    user_id,
    subscription_object
  ) VALUES (
    auth.uid(),
    subscription_object_input
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Function to toggle space notification settings
CREATE OR REPLACE FUNCTION toggle_space_notifications(
  space_id_input uuid,
  enabled_input boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_id uuid;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user has access to this space
  IF NOT EXISTS (
    SELECT 1 FROM spaces
    WHERE id = space_id_input
    AND (
      user_id = auth.uid() OR
      is_public = true OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = space_id_input
        AND user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to space';
  END IF;

  -- Upsert notification settings
  INSERT INTO space_notification_settings (
    user_id,
    space_id,
    enabled
  ) VALUES (
    auth.uid(),
    space_id_input,
    enabled_input
  )
  ON CONFLICT (user_id, space_id)
  DO UPDATE SET
    enabled = enabled_input,
    updated_at = now()
  RETURNING id INTO setting_id;

  RETURN setting_id IS NOT NULL;
END;
$$;

-- Function to get user's notification settings
CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  has_subscription boolean;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  -- Check if user has any push subscriptions
  SELECT EXISTS (
    SELECT 1 FROM push_subscriptions
    WHERE user_id = auth.uid()
  ) INTO has_subscription;

  -- Get space notification settings
  WITH space_settings AS (
    SELECT 
      s.id as space_id,
      s.name as space_name,
      COALESCE(sns.enabled, true) as notifications_enabled
    FROM spaces s
    LEFT JOIN space_notification_settings sns ON 
      s.id = sns.space_id AND
      sns.user_id = auth.uid()
    WHERE 
      s.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM space_members
        WHERE space_id = s.id
        AND user_id = auth.uid()
      )
    ORDER BY s.updated_at DESC
  )
  SELECT 
    jsonb_build_object(
      'has_subscription', has_subscription,
      'spaces', COALESCE(jsonb_agg(ss.*), '[]'::jsonb)
    ) INTO result
  FROM space_settings ss;

  RETURN result;
END;
$$;

-- Update the space_message_webhook_trigger function to include notification handling
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
      'created_at', NEW.created_at,
      'should_notify', true
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;