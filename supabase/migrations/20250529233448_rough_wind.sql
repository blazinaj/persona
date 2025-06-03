/*
  # Add function to check if user has a valid Stripe customer ID
  
  1. New Functions
    - `check_stripe_customer`: Checks if a user has a valid Stripe customer ID
    - `get_user_subscription_details`: Gets detailed subscription information
  
  2. Security
    - Functions use SECURITY DEFINER to ensure proper access control
    - Validate user access before retrieving subscription details
*/

-- Function to check if a user has a valid Stripe customer ID
CREATE OR REPLACE FUNCTION check_stripe_customer(
  user_id_input UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record subscriptions%ROWTYPE;
  plan_record subscription_plans%ROWTYPE;
  result jsonb;
BEGIN
  -- Check if user has a subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE user_id = user_id_input;
  
  -- If no subscription found, return empty result
  IF subscription_record IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'customer_id', null,
      'subscription', null
    );
  END IF;
  
  -- Get plan details if available
  IF subscription_record.plan_id IS NOT NULL THEN
    SELECT * INTO plan_record
    FROM subscription_plans
    WHERE id = subscription_record.plan_id;
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'exists', subscription_record.stripe_customer_id IS NOT NULL AND NOT subscription_record.stripe_customer_id LIKE 'trial_%',
    'customer_id', subscription_record.stripe_customer_id,
    'subscription', jsonb_build_object(
      'id', subscription_record.stripe_subscription_id,
      'status', subscription_record.status,
      'current_period_end', subscription_record.current_period_end,
      'cancel_at', subscription_record.cancel_at,
      'plan', CASE WHEN plan_record IS NOT NULL THEN
        jsonb_build_object(
          'id', plan_record.id,
          'name', plan_record.name,
          'price', plan_record.price,
          'interval', plan_record.interval,
          'tokens', plan_record.tokens
        )
      ELSE
        jsonb_build_object(
          'id', subscription_record.plan_id
        )
      END,
      'tokens_used', subscription_record.tokens_used,
      'tokens_limit', subscription_record.tokens_limit
    )
  );
  
  RETURN result;
END;
$$;

-- Function to get detailed subscription information
CREATE OR REPLACE FUNCTION get_user_subscription_details(
  user_id_input UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record subscriptions%ROWTYPE;
  plan_record subscription_plans%ROWTYPE;
  result jsonb;
BEGIN
  -- Check if user is requesting their own subscription
  IF user_id_input != auth.uid() THEN
    RETURN jsonb_build_object(
      'error', 'Unauthorized'
    );
  END IF;

  -- Get subscription details
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE user_id = user_id_input;
  
  -- If no subscription found, return empty result
  IF subscription_record IS NULL THEN
    RETURN jsonb_build_object(
      'has_subscription', false
    );
  END IF;
  
  -- Get plan details if available
  IF subscription_record.plan_id IS NOT NULL THEN
    SELECT * INTO plan_record
    FROM subscription_plans
    WHERE id = subscription_record.plan_id;
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'has_subscription', true,
    'subscription', jsonb_build_object(
      'id', subscription_record.id,
      'stripe_subscription_id', subscription_record.stripe_subscription_id,
      'stripe_customer_id', subscription_record.stripe_customer_id,
      'status', subscription_record.status,
      'current_period_end', subscription_record.current_period_end,
      'cancel_at', subscription_record.cancel_at,
      'tokens_used', subscription_record.tokens_used,
      'tokens_limit', subscription_record.tokens_limit,
      'plan', CASE WHEN plan_record IS NOT NULL THEN
        jsonb_build_object(
          'id', plan_record.id,
          'name', plan_record.name,
          'price', plan_record.price,
          'interval', plan_record.interval,
          'tokens', plan_record.tokens,
          'features', plan_record.features
        )
      ELSE
        jsonb_build_object(
          'id', subscription_record.plan_id
        )
      END
    )
  );
  
  RETURN result;
END;
$$;