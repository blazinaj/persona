/*
  # Add free trial support
  
  1. New Tables
    - `user_trials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `claimed_at` (timestamptz)
  
  2. Functions
    - `can_claim_free_trial`: Checks if user is eligible
    - `claim_free_trial`: Activates free trial for user
*/

-- Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trial status"
  ON user_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if user can claim free trial
CREATE OR REPLACE FUNCTION can_claim_free_trial(user_id_input UUID)
RETURNS boolean AS $$
DECLARE
  has_used_trial boolean;
  has_subscription boolean;
BEGIN
  -- Check if user has already used trial
  SELECT EXISTS (
    SELECT 1 FROM user_trials
    WHERE user_id = user_id_input
  ) INTO has_used_trial;

  -- Check if user has an active subscription
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_id_input
    AND status = 'active'
  ) INTO has_subscription;

  -- Can claim if hasn't used trial and no active subscription
  RETURN NOT (has_used_trial OR has_subscription);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim free trial
CREATE OR REPLACE FUNCTION claim_free_trial(user_id_input UUID)
RETURNS boolean AS $$
DECLARE
  can_claim boolean;
BEGIN
  -- Check if user can claim trial
  SELECT can_claim_free_trial(user_id_input) INTO can_claim;
  
  IF NOT can_claim THEN
    RETURN false;
  END IF;

  -- Record trial claim
  INSERT INTO user_trials (user_id)
  VALUES (user_id_input);

  -- Create trial subscription
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
    'trial_' || user_id_input,
    'trial_sub_' || user_id_input,
    'trial',
    'active',
    now() + interval '30 days',
    100000, -- 100k tokens
    0
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert trial plan if it doesn't exist
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features
) VALUES (
  'trial',
  'Free Trial',
  'Try out our service with 100,000 tokens',
  'price_trial',
  100000,
  0,
  'month',
  ARRAY[
    '100,000 tokens',
    'Valid for 30 days',
    'All basic features included'
  ]
)
ON CONFLICT (id) DO NOTHING;