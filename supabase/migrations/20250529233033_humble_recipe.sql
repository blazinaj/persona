/*
  # Add cancel_at column to subscriptions table
  
  1. Changes
    - Add cancel_at column to subscriptions table to track when a subscription will be canceled
    - This allows us to show users when their subscription will end if they've canceled
  
  2. Security
    - No changes to RLS policies
*/

-- Add cancel_at column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS cancel_at timestamptz;

-- Update finalize_subscription function to include cancel_at
CREATE OR REPLACE FUNCTION finalize_subscription(
  user_id_input UUID,
  stripe_customer_id_input TEXT,
  stripe_subscription_id_input TEXT,
  plan_id_input TEXT,
  status_input TEXT,
  current_period_end_input TIMESTAMPTZ,
  tokens_limit_input INTEGER,
  cancel_at_input TIMESTAMPTZ DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  existing_subscription_id UUID;
BEGIN
  -- Find the user's subscription (either trial or pending)
  SELECT id INTO existing_subscription_id
  FROM subscriptions
  WHERE user_id = user_id_input
  AND (
    stripe_customer_id LIKE 'trial_%' OR
    stripe_subscription_id LIKE 'pending_%' OR
    stripe_subscription_id = stripe_subscription_id_input
  );
  
  -- If subscription found, update it
  IF existing_subscription_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      stripe_customer_id = stripe_customer_id_input,
      stripe_subscription_id = stripe_subscription_id_input,
      plan_id = plan_id_input,
      status = status_input,
      current_period_end = current_period_end_input,
      tokens_limit = tokens_limit_input,
      cancel_at = cancel_at_input,
      tokens_used = 0 -- Reset token usage on plan change
    WHERE id = existing_subscription_id;
    
    RETURN true;
  ELSE
    -- Insert new subscription if none exists
    INSERT INTO subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan_id,
      status,
      current_period_end,
      tokens_limit,
      tokens_used,
      cancel_at
    ) VALUES (
      user_id_input,
      stripe_customer_id_input,
      stripe_subscription_id_input,
      plan_id_input,
      status_input,
      current_period_end_input,
      tokens_limit_input,
      0,
      cancel_at_input
    );
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;