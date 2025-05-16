import React, { useState, useEffect, useContext } from 'react';
import { CreditCard, Package, Zap, Check, Loader2, Sparkles, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  tokens: number;
  features: string[];
  price_id: string;
}

interface Subscription {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  tokens_used: number;
  tokens_limit: number;
  stripe_customer_id: string | null;
}

interface TokenUsage {
  date: string;
  tokens: number;
}

export const Billing = () => {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [canClaimTrial, setCanClaimTrial] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlansAndSubscription();
      fetchTokenUsage();
      checkTrialEligibility();
    }
  }, [user]);

  const fetchTokenUsage = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('role', 'user')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by date and calculate token usage
      const usage = messages?.reduce((acc: Record<string, number>, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString();
        const tokens = Math.ceil(msg.content.split(/\s+/).length * 1.3);
        acc[date] = (acc[date] || 0) + tokens;
        return acc;
      }, {});

      // Convert to array format
      const usageArray = Object.entries(usage || {}).map(([date, tokens]) => ({
        date,
        tokens
      }));

      setTokenUsage(usageArray);
    } catch (error) {
      console.error('Error fetching token usage:', error);
    }
  };

  const checkTrialEligibility = async () => {
    try {
      const { data: canClaim, error } = await supabase
        .rpc('can_claim_free_trial', { user_id_input: user.id });
        
      if (error) throw error;
      setCanClaimTrial(canClaim);
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
    }
  };

  const handleClaimTrial = async () => {
    if (!user) return;
    
    setClaimingTrial(true);
    try {
      const { data: claimed, error } = await supabase
        .rpc('claim_free_trial', { user_id_input: user.id });
        
      if (error) throw error;
      
      if (claimed) {
        await fetchPlansAndSubscription();
        setCanClaimTrial(false);
      }
    } catch (error) {
      console.error('Error claiming trial:', error);
    } finally {
      setClaimingTrial(false);
    }
  };

  const fetchPlansAndSubscription = async () => {
    try {
      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      
      // Validate that plans have valid price_ids
      const validPlans = plansData?.filter(plan => plan.price_id?.startsWith('price_'));
      if (!validPlans?.length) {
        throw new Error('No valid subscription plans available');
      }
      
      setPlans(validPlans);

      // Fetch user's subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Unable to load subscription plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;
    setError(null);
    setProcessingPlan(planId);
    
    try {
      // Find the plan and validate price_id
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan?.price_id) {
        throw new Error('Selected plan is not properly configured');
      }
      
      // Don't pass the stripe_customer_id if it starts with 'trial_'
      const stripeCustomerId = subscription?.stripe_customer_id?.startsWith('trial_') 
        ? null 
        : subscription?.stripe_customer_id;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            planId,
            userId: user.id,
            stripeCustomerId,
            email: user.email,
            customerUpdate: {
              address: 'auto'
            }
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error instanceof Error ? error.message : 'Unable to process your request. Please try again later.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id
          }),
        }
      );

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      setError('Unable to access billing portal. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading billing information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing Settings</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and token usage</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {subscription?.plan_id === 'trial' ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Free Trial Active</h2>
                <p className="text-sm text-gray-600">
                  You're currently on a free trial with 100,000 tokens
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.tokens_used.toLocaleString()} / {subscription.tokens_limit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trial Ends</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(100, (subscription.tokens_used / subscription.tokens_limit) * 100)}%`
                  }}
                />
              </div>
              {subscription.tokens_used / subscription.tokens_limit > 0.8 && (
                <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                  <AlertCircle size={14} />
                  <span>You're approaching your trial limit. Consider upgrading to continue using the service.</span>
                </div>
              )}
            </div>
          </div>
        ) : subscription ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
                  <p className="text-gray-600 mt-1">
                    Your subscription will {subscription.status === 'active' ? 'renew' : 'expire'} on{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={subscription.status === 'active' ? 'success' : 'warning'}
                  className="capitalize"
                >
                  {subscription.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Zap size={16} />
                    <span className="font-medium">Token Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {subscription.tokens_used.toLocaleString()} / {subscription.tokens_limit.toLocaleString()}
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (subscription.tokens_used / subscription.tokens_limit) * 100)}%`
                      }}
                    />
                  </div>
                  {subscription.tokens_used / subscription.tokens_limit > 0.8 && (
                    <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs">
                      <AlertCircle size={12} />
                      <span>Approaching limit</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <CreditCard size={16} />
                    <span className="font-medium">Price</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${(plans.find(p => p.id === subscription.plan_id)?.price || 0) / 100}/mo
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.id !== 'trial').map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-sm border ${
                subscription?.plan_id === plan.id
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200'
              } overflow-hidden`}
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-1">{plan.description}</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">${plan.price / 100}</span>
                  <span className="text-gray-600 ml-1">/mo</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={subscription?.plan_id === plan.id ? 'outline' : 'primary'}
                  fullWidth
                  className="mt-6"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={processingPlan === plan.id || !plan.price_id?.startsWith('price_')}
                  leftIcon={processingPlan === plan.id ? <Loader2 className="animate-spin" /> : undefined}
                >
                  {subscription?.plan_id === plan.id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Billing;