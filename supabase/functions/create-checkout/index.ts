import Stripe from 'npm:stripe@14.19.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId, userId, email } = await req.json();

    if (!planId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Get plan details with explicit price_id check
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) throw planError;
    if (!plan) throw new Error('Plan not found');
    if (!plan.price_id) throw new Error('Plan is not properly configured: missing price ID');
    if (!plan.price_id.startsWith('price_')) throw new Error('Invalid Stripe price ID format');

    try {
      // Verify the price exists in Stripe
      await stripe.prices.retrieve(plan.price_id);
    } catch (stripeError) {
      console.error('Stripe price verification failed:', stripeError);
      throw new Error('Selected plan is currently unavailable. Please try a different plan or contact support.');
    }

    // Check if user has an existing subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId) 
      .maybeSingle();

    let customerId: string | undefined;
    
    try {
      // Check if user has a trial subscription
      const { data: isTrial } = await supabase
        .rpc('is_trial_subscription', { user_id_input: userId });

      // Create new customer if needed
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });
      customerId = customer.id;

      // If user is on trial, handle conversion
      if (isTrial) {
        const { data: converted, error: conversionError } = await supabase
          .rpc('handle_trial_conversion', {
            user_id_input: userId,
            stripe_customer_id_input: customerId,
            stripe_subscription_id_input: 'pending'
          });

        if (conversionError) throw conversionError;
      }
    } catch (error) {
      console.error('Error handling customer creation:', error);
      throw new Error('Failed to prepare checkout session');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: plan.price_id,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings/billing?success=true`,
      cancel_url: `${req.headers.get('origin')}/settings/billing?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto'
      }
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});