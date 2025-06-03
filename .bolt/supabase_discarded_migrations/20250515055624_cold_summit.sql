/*
  # Add Stripe subscription support

  1. New Tables
    - `subscription_plans`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `price_id` (text)
      - `tokens` (integer)
      - `price` (integer)
      - `interval` (text)
      - `features` (text[])
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `plan_id` (text, references subscription_plans)
      - `status` (text)
      - `current_period_end` (timestamptz)
      - `cancel_at` (timestamptz)
      - `tokens_used` (integer)
      - `tokens_limit` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - `check_token_usage`: Checks and updates token usage for a user
    - `reset_token_usage`: Resets token usage on subscription renewal

  3. Security
    - Enable RLS on both tables
    - Add policies for subscription management
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_id text NOT NULL,
  tokens integer NOT NULL,
  price integer NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  plan_id text REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_end timestamptz NOT NULL,
  cancel_at timestamptz,
  tokens_used integer DEFAULT 0,
  tokens_limit integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(stripe_subscription_id)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_id, tokens, price, interval, features) VALUES
  ('hobby', 'Hobby', 'Perfect for personal projects', 'price_hobby_monthly', 100000, 1000, 'month', ARRAY[
    '100,000 tokens per month',
    'Basic chat features',
    'Community templates'
  ]),
  ('pro', 'Pro', 'For professional developers', 'price_pro_monthly', 500000, 2500, 'month', ARRAY[
    '500,000 tokens per month',
    'Advanced chat features',
    'Custom templates',
    'API access',
    'Priority support'
  ]),
  ('enterprise', 'Enterprise', 'For teams and organizations', 'price_enterprise_monthly', 2000000, 10000, 'month', ARRAY[
    '2,000,000 tokens per month',
    'All Pro features',
    'Dedicated support',
    'Custom integrations',
    'Team management',
    'Usage analytics'
  ]);

-- Function to check token usage
CREATE OR REPLACE FUNCTION check_token_usage(user_id_input UUID, tokens_needed integer)
RETURNS boolean AS $$
DECLARE
  subscription_record subscriptions%ROWTYPE;
BEGIN
  -- Get user's active subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE user_id = user_id_input
  AND status = 'active'
  AND current_period_end > now();

  -- No active subscription
  IF subscription_record IS NULL THEN
    RETURN false;
  END IF;

  -- Check if adding tokens_needed would exceed limit
  IF (subscription_record.tokens_used + tokens_needed) > subscription_record.tokens_limit THEN
    RETURN false;
  END IF;

  -- Update token usage
  UPDATE subscriptions
  SET tokens_used = tokens_used + tokens_needed
  WHERE id = subscription_record.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset token usage
CREATE OR REPLACE FUNCTION reset_token_usage()
RETURNS trigger AS $$
BEGIN
  -- Reset tokens_used when subscription renews
  IF OLD.current_period_end < NEW.current_period_end THEN
    NEW.tokens_used := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset token usage on subscription renewal
CREATE TRIGGER reset_tokens_on_renewal
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION reset_token_usage();