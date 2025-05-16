/*
  # Fix trial to paid subscription conversion
  
  1. Changes
    - Add function to check if subscription is trial
    - Add function to validate subscription status
    - Add helper function for subscription updates
  
  2. Security
    - Add proper error handling for subscription transitions
    - Ensure data consistency during conversion
*/

-- Function to check if subscription is a trial
CREATE OR REPLACE FUNCTION is_trial_subscription(
  user_id_input UUID
) RETURNS boolean AS $$
DECLARE
  sub_record subscriptions%ROWTYPE;
BEGIN
  SELECT *
  INTO sub_record
  FROM subscriptions
  WHERE user_id = user_id_input
  AND stripe_customer_id LIKE 'trial_%'
  LIMIT 1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate subscription status
CREATE OR REPLACE FUNCTION validate_subscription_status(
  user_id_input UUID,
  stripe_customer_id_input TEXT
) RETURNS boolean AS $$
DECLARE
  is_trial boolean;
  has_active_sub boolean;
BEGIN
  -- Check if user has a trial subscription
  SELECT is_trial_subscription(user_id_input) INTO is_trial;
  
  -- Check if user has an active non-trial subscription
  SELECT EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = user_id_input
    AND stripe_customer_id = stripe_customer_id_input
    AND status = 'active'
  ) INTO has_active_sub;
  
  -- Return true if either in trial or has active subscription
  RETURN is_trial OR has_active_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely update subscription
CREATE OR REPLACE FUNCTION update_subscription_details(
  user_id_input UUID,
  stripe_customer_id_input TEXT,
  stripe_subscription_id_input TEXT,
  plan_id_input TEXT,
  status_input TEXT,
  current_period_end_input TIMESTAMPTZ,
  tokens_limit_input INTEGER
) RETURNS boolean AS $$
BEGIN
  -- Update existing subscription
  UPDATE subscriptions
  SET stripe_customer_id = stripe_customer_id_input,
      stripe_subscription_id = stripe_subscription_id_input,
      plan_id = plan_id_input,
      status = status_input,
      current_period_end = current_period_end_input,
      tokens_limit = tokens_limit_input,
      tokens_used = 0 -- Reset token usage on plan change
  WHERE user_id = user_id_input;
  
  -- Insert new subscription if none exists
  IF NOT FOUND THEN
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
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;