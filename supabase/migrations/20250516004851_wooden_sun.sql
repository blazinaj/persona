/*
  # Update subscriptions schema and add trial handling
  
  1. Changes
    - Make stripe_customer_id nullable in subscriptions table
    - Add function to handle trial to paid conversion
*/

-- Make stripe_customer_id nullable
ALTER TABLE subscriptions
ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Function to handle trial to paid conversion
CREATE OR REPLACE FUNCTION handle_trial_conversion(
  user_id_input UUID,
  stripe_customer_id_input TEXT,
  stripe_subscription_id_input TEXT
) RETURNS boolean AS $$
BEGIN
  -- Update subscription from trial to paid
  UPDATE subscriptions
  SET stripe_customer_id = stripe_customer_id_input,
      stripe_subscription_id = stripe_subscription_id_input
  WHERE user_id = user_id_input
  AND stripe_customer_id LIKE 'trial_%';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;