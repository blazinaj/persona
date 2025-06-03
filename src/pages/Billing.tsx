import React, { useState, useEffect, useContext } from 'react';
import { CreditCard, Package, Zap, Check, Loader2, Sparkles, TrendingUp, AlertCircle, Clock, Calendar, CreditCard as CreditCardIcon, Shield, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardFooter } from '../components/ui/Card';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  tokens: number;
  features: string[];
  price_id: string;
  plan_id?: string;
}

interface Subscription {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  tokens_used: number;
  tokens_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  cancel_at?: string | null;
}

interface TokenUsage {
  date: string;
  tokens: number;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export const Billing = () => {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [canClaimTrial, setCanClaimTrial] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const [syncingWithStripe, setSyncingWithStripe] = useState(false);

  // Check URL parameters for success/canceled status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      setError(null);
      setTimeout(() => {
        refreshData();
      }, 1000);
    } else if (canceled === 'true') {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show canceled message
      setError('Checkout was canceled. Your subscription has not been changed.');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPlansAndSubscription();
      fetchTokenUsage();
      checkTrialEligibility();
      fetchPaymentMethods();
    }
  }, [user]);

  useEffect(() => {
    if (subscription && plans.length > 0) {
      const plan = plans.find(p => p.id === subscription.plan_id);
      setCurrentPlan(plan || null);
    } else {
      setCurrentPlan(null);
    }
  }, [subscription, plans]);

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

  const fetchPaymentMethods = async () => {
    if (!user || !subscription?.stripe_customer_id || subscription?.stripe_customer_id.startsWith('trial_')) {
      return;
    }

    try {
      setLoadingPaymentMethods(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-methods`,
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

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
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
        await fetchTokenUsage();
        setCanClaimTrial(false);
      }
    } catch (error) {
      console.error('Error claiming trial:', error);
    } finally {
      setClaimingTrial(false);
    }
  };

  const refreshData = async () => {
    setRefreshingData(true);
    try {
      await fetchPlansAndSubscription();
      await fetchTokenUsage();
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshingData(false);
    }
  };

  const syncWithStripe = async () => {
    if (!user || !subscription?.stripe_customer_id) return;
    
    try {
      setSyncingWithStripe(true);
      setError(null);
      
      // Call the check-stripe-customer function to sync with Stripe
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-stripe-customer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync with Stripe: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Synced subscription data:', data);
      
      // Refresh local data
      await refreshData();
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync with Stripe');
    } finally {
      setSyncingWithStripe(false);
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
      setSubscription(subData || null);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Unable to load subscription plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'primary';
      case 'canceled':
        return 'secondary';
      case 'past_due':
        return 'warning';
      case 'incomplete':
      case 'incomplete_expired':
      case 'unpaid':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;
    setError(null);
    
    // Check if this is the current plan
    if (subscription?.plan_id === planId) {
      setError('You are already subscribed to this plan.');
      return;
    }
    
    setProcessingPlan(planId);
    
    try {
      // Find the plan and validate price_id
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan?.price_id || !selectedPlan.price_id.startsWith('price_')) {
        throw new Error('Selected plan is not properly configured');
      }

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
            email: user.email
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      window.location.href = data.url || '';
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error instanceof Error ? error.message : 'Unable to process your request. Please try again later.');
    } finally {
      setProcessingPlan(null);
    }
  };

  // Function to handle managing the subscription in Stripe Customer Portal
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
      
      window.location.href = url || '';
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
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and token usage</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<CreditCardIcon size={16} />} 
              onClick={syncWithStripe} 
              disabled={syncingWithStripe || !subscription?.stripe_customer_id || subscription?.stripe_customer_id.startsWith('trial_')}
            >
              {syncingWithStripe ? "Syncing..." : "Sync with Stripe"}
            </Button>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw size={16} className={refreshingData ? "animate-spin" : ""} />} onClick={refreshData} disabled={refreshingData}>
            {refreshingData ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

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
          <div className="space-y-8 mb-8">
            {/* Current Plan Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
                    <p className="text-gray-600 mt-1">
                      Your subscription will {subscription.status === 'active' ? 'renew' : 'expire'} on{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={getStatusBadgeVariant(subscription.status)}
                      className="capitalize"
                    >
                      {subscription.status}
                    </Badge>
                    {subscription.cancel_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Cancels on {new Date(subscription.cancel_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Package size={16} />
                      <span className="font-medium">Plan</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {currentPlan?.name || 'Unknown Plan'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {currentPlan?.interval === 'month' ? 'Monthly billing' : 'Annual billing'}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Zap size={16} />
                      <span className="font-medium">Token Usage</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {subscription.tokens_used.toLocaleString()} / {subscription.tokens_limit.toLocaleString()}
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          subscription.tokens_used / subscription.tokens_limit > 0.9
                            ? 'bg-red-600'
                            : subscription.tokens_used / subscription.tokens_limit > 0.7
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.min(100, (subscription.tokens_used / subscription.tokens_limit) * 100)}%`
                        }}
                      />
                    </div>
                    {subscription.tokens_used / subscription.tokens_limit > 0.8 && (
                      <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle size={12} />
                        <span>Approaching limit</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <CreditCardIcon size={16} />
                      <span className="font-medium">Price</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ${((currentPlan?.price || 0) / 100).toFixed(2)}/{currentPlan?.interval === 'month' ? 'mo' : 'yr'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleManageSubscription}
                  >
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                  
                  {loadingPaymentMethods ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">Loading payment methods...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map(method => (
                        <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                              {method.brand === 'visa' ? (
                                <span className="text-blue-700 font-bold text-xs">VISA</span>
                              ) : method.brand === 'mastercard' ? (
                                <span className="text-red-600 font-bold text-xs">MC</span>
                              ) : method.brand === 'amex' ? (
                                <span className="text-blue-500 font-bold text-xs">AMEX</span>
                              ) : (
                                <CreditCardIcon size={16} className="text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">•••• {method.last4}</div>
                              <div className="text-xs text-gray-500">Expires {method.expMonth}/{method.expYear}</div>
                            </div>
                          </div>
                          {method.isDefault && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle size={12} />
                              <span>Default</span>
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<ExternalLink size={14} />}
                          onClick={handleManageSubscription}
                        >
                          Update Payment Method
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Token Usage Graph */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Token Usage History</h2>
                
                {tokenUsage.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <TrendingUp size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">No usage data available yet</p>
                  </div>
                ) : (
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-end">
                      {tokenUsage.map((day, i) => {
                        const height = Math.max(10, (day.tokens / Math.max(...tokenUsage.map(d => d.tokens))) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full px-1">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${day.date}: ${day.tokens.toLocaleString()} tokens`}
                            ></div>
                            <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                              {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingInterval === 'month'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingInterval === 'year'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yearly <span className="text-green-600 font-medium">Save 16%</span>
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.id !== 'trial' && p.interval === billingInterval)
              .sort((a, b) => a.price - b.price)
              .map((plan) => {
                const isCurrentPlan = subscription?.plan_id === plan.id;
                return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    isCurrentPlan
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-200'
                  } overflow-hidden`}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 mt-1">{plan.description}</p>
                    
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        ${(plan.price / 100).toFixed(plan.price % 100 === 0 ? 0 : 2)}
                      </span>
                      <span className="text-gray-600 ml-1">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
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
                      variant={isCurrentPlan ? 'outline' : 'primary'}
                      fullWidth
                      className="mt-6"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={processingPlan === plan.id || isCurrentPlan}
                      loading={processingPlan === plan.id}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Subscription FAQ */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            <div className="p-6">
              <h3 className="text-base font-medium text-gray-900 mb-2">How are tokens calculated?</h3>
              <p className="text-gray-600">
                Tokens are calculated based on the length of your messages and the AI's responses. 
                Approximately 1 token equals 4 characters or 0.75 words in English.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-base font-medium text-gray-900 mb-2">When will I be billed?</h3>
              <p className="text-gray-600">
                Your subscription will automatically renew at the end of each billing period. 
                You can see your next billing date in the Current Plan section above.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-base font-medium text-gray-900 mb-2">How do I cancel my subscription?</h3>
              <p className="text-gray-600">
                You can cancel your subscription at any time by clicking the "Manage Subscription" button. 
                Your subscription will remain active until the end of the current billing period.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-base font-medium text-gray-900 mb-2">What happens if I exceed my token limit?</h3>
              <p className="text-gray-600">
                If you reach your token limit, you'll need to upgrade to a higher plan or wait until your next billing cycle 
                when your tokens reset. We'll notify you when you're approaching your limit.
              </p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Need help with billing?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about your subscription or billing, our support team is here to help.
              </p>
              <Button
                variant="outline"
                leftIcon={<ExternalLink size={16} />}
                onClick={() => window.open('mailto:support@personify.mobi', '_blank')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;