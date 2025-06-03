import Stripe from 'npm:stripe@14.19.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

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
    const signature = req.headers.get('stripe-signature');
    if (!signature || !endpointSecret) {
      throw new Error('Missing Stripe signature or endpoint secret');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Get customer's email
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        
        if (!email) throw new Error('Customer email not found');

        // Get user by email
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', email)
          .single();

        if (userError) throw userError;
        
        // Get subscription plan
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('tokens')
          .eq('price_id', subscription.items.data[0].price.id)
          .single();

        if (planError) throw planError;

        // Update subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: users.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            tokens_limit: plan.tokens,
            tokens_used: 0 // Reset on renewal
          });

        if (updateError) throw updateError;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) throw error;
        break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});