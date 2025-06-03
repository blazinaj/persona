/*
  # Update subscription plans with new pricing
  
  1. Changes
    - Update subscription plans with correct prices and names
    - Add monthly and yearly options for all plans
    - Ensure proper Stripe price IDs
  
  2. Security
    - No changes to RLS policies
*/

-- Update subscription plans with correct price IDs and amounts
UPDATE subscription_plans
SET is_active = false
WHERE id NOT IN ('hobby', 'pro', 'team', 'trial');

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
  'price_1RPprod_SJqKHobby',
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
  'price_1RTzprod_SJqKHobby',
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
  'price_1RPprod_SJqLIPro',
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
  'price_1RTzprod_SJqLIPro',
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
  'price_1RPprod_SJqLTeam',
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
  'price_1RTzprod_SJqLTeam',
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
  'price_1RPprod_SJqIE30DayTrial',
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