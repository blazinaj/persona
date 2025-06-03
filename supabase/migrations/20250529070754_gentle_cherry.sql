/*
  # Add plan_id column to subscriptions table
  
  1. Changes
    - Add plan_id column to subscriptions table
    - Update subscription_plans with correct product IDs
    - Add foreign key constraint from subscriptions.plan_id to subscription_plans.id
  
  2. Security
    - No changes to RLS policies
*/

-- Add plan_id column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_id text REFERENCES subscription_plans(id);

-- Update subscription plans with correct product IDs
UPDATE subscription_plans
SET is_active = false
WHERE id NOT IN ('hobby_monthly', 'hobby_yearly', 'pro_monthly', 'pro_yearly', 'team_monthly', 'team_yearly', 'trial');

-- Upsert hobby plan (monthly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'hobby_monthly',
  'Hobby',
  'Perfect for personal projects and experimentation',
  'price_SJqK2ncz2efEvW',
  100000,
  1000,
  'month',
  ARRAY[
    '100,000 tokens per month',
    'Basic chat features',
    'Community templates',
    'Public persona sharing'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert hobby plan (yearly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'hobby_yearly',
  'Hobby',
  'Perfect for personal projects and experimentation',
  'price_SJqK2ncz2efEvW_yearly',
  100000,
  10000,
  'year',
  ARRAY[
    '100,000 tokens per month',
    'Basic chat features',
    'Community templates',
    'Public persona sharing',
    '2 months free with annual billing'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert pro plan (monthly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'pro_monthly',
  'Pro',
  'For power users and professionals',
  'price_SJqLLOksTlrRTw',
  500000,
  2500,
  'month',
  ARRAY[
    '500,000 tokens per month',
    'Advanced chat features',
    'Custom templates',
    'API access',
    'Priority support',
    'Advanced integrations'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert pro plan (yearly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'pro_yearly',
  'Pro',
  'For power users and professionals',
  'price_SJqLLOksTlrRTw_yearly',
  500000,
  25000,
  'year',
  ARRAY[
    '500,000 tokens per month',
    'Advanced chat features',
    'Custom templates',
    'API access',
    'Priority support',
    'Advanced integrations',
    '2 months free with annual billing'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert team plan (monthly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'team_monthly',
  'Team',
  'For teams and organizations',
  'price_SJqL1tVM7ZMH4H',
  2000000,
  3990,
  'month',
  ARRAY[
    '2,000,000 tokens per month',
    'All Pro features',
    'Team management',
    'Shared personas',
    'Usage analytics',
    'Dedicated support',
    'Custom integrations'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert team plan (yearly)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'team_yearly',
  'Team',
  'For teams and organizations',
  'price_SJqL1tVM7ZMH4H_yearly',
  2000000,
  39900,
  'year',
  ARRAY[
    '2,000,000 tokens per month',
    'All Pro features',
    'Team management',
    'Shared personas',
    'Usage analytics',
    'Dedicated support',
    'Custom integrations',
    '2 months free with annual billing'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Upsert trial plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price_id,
  tokens,
  price,
  interval,
  features,
  is_active
) VALUES (
  'trial',
  'Free Trial',
  'Try our service for 30 days',
  'price_trial',
  100000,
  0,
  'month',
  ARRAY[
    '100,000 tokens',
    'Valid for 30 days',
    'All basic features included'
  ],
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  tokens = EXCLUDED.tokens,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;