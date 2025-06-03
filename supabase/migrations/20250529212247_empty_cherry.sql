/*
  # Fix trial to paid subscription conversion
  
  1. Changes
    - Update handle_trial_conversion function to properly handle existing subscriptions
    - Add check to prevent duplicate stripe_subscription_id values
    - Fix error when converting from trial to paid subscription
  
  2. Security
    - Maintain existing security model
    - Ensure proper error handling
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_trial_conversion;

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_trial_conversion(
  user_id_input UUID,
  stripe_customer_id_input TEXT,
  stripe_subscription_id_input TEXT
) RETURNS boolean AS $$
DECLARE
  existing_subscription_id UUID;
BEGIN
  -- Check if user has a trial subscription
  SELECT id INTO existing_subscription_id
  FROM subscriptions
  WHERE user_id = user_id_input
  AND stripe_customer_id LIKE 'trial_%';
  
  -- If no trial subscription found, return false
  IF existing_subscription_id IS NULL THEN
    RETURN false;
  END IF;

  -- Update the subscription with new Stripe details
  -- Use a temporary subscription ID if we're still in the checkout process
  UPDATE subscriptions
  SET 
    stripe_customer_id = stripe_customer_id_input,
    stripe_subscription_id = 
      CASE 
        WHEN stripe_subscription_id_input = 'pending' THEN 
          'pending_' || gen_random_uuid()::text
        ELSE 
          stripe_subscription_id_input
      END
  WHERE id = existing_subscription_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to finalize subscription after checkout completes
CREATE OR REPLACE FUNCTION finalize_subscription(
  user_id_input UUID,
  stripe_customer_id_input TEXT,
  stripe_subscription_id_input TEXT,
  plan_id_input TEXT,
  status_input TEXT,
  current_period_end_input TIMESTAMPTZ,
  tokens_limit_input INTEGER
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
    stripe_subscription_id LIKE 'pending_%'
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
      tokens_used
    ) VALUES (
      user_id_input,
      stripe_customer_id_input,
      stripe_subscription_id_input,
      plan_id_input,
      status_input,
      current_period_end_input,
      tokens_limit_input,
      0
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;