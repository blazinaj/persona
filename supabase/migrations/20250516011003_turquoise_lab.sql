/*
  # Fix Stripe price handling

  1. Changes
    - Add constraint to ensure price_id is not null
    - Add trigger to validate price_id format
    - Add function to check price_id format

  2. Security
    - No changes to RLS policies
*/

-- Create function to validate Stripe price ID format
CREATE OR REPLACE FUNCTION validate_stripe_price_id()
RETURNS trigger AS $$
BEGIN
  -- Check if price_id follows Stripe's format (starts with 'price_')
  IF NEW.price_id IS NOT NULL AND NEW.price_id NOT LIKE 'price_%' THEN
    RAISE EXCEPTION 'Invalid Stripe price ID format. Must start with "price_"';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate price_id format
DO $$ BEGIN
  CREATE TRIGGER validate_stripe_price_id_trigger
    BEFORE INSERT OR UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION validate_stripe_price_id();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add NOT NULL constraint to price_id if it doesn't exist
DO $$ BEGIN
  ALTER TABLE subscription_plans
    ALTER COLUMN price_id SET NOT NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;