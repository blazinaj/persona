/*
  # Fix subscription plans
  
  1. Changes
    - Update hobby and pro plan configurations
    - Add proper Stripe price IDs
    - Ensure plans are active
*/

-- Update subscription plans with correct price IDs
UPDATE subscription_plans
SET is_active = false
WHERE id NOT IN ('hobby', 'pro', 'trial');

-- Upsert hobby plan
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
  'hobby',
  'Hobby',
  'Perfect for personal projects and experimentation',
  'price_hobby',
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

-- Upsert pro plan
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
  'pro',
  'Pro',
  'For power users and professionals',
  'price_pro',
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