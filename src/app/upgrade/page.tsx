'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function UpgradePageContent({ planParam }: { planParam: string | null }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set selected plan from URL param
  useEffect(() => {
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Available plans
  const plans = [
    {
      id: 'plus',
      name: 'plus',
      price: 42900, // ₹429
      dollarPrice: '\u20B9429',
      description: 'Great for small projects',
      features: [
        '200 MB Storage',
        'Advanced Mock Servers',
        'API Tester',
        'Email Support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 149900, // ₹1499
      dollarPrice: '\u20B91499',
      description: 'Ideal for professionals',
      features: [
        '1 GB Storage',
        'All Features',
        'GraphQL Tester',
        'Priority Support',
        'Custom Domains',
      ],
    },
    {
      id: 'ultra-pro',
      name: 'Ultra Pro',
      price: 429900, // ₹4299
      dollarPrice: '\u20B94299',
      description: 'For teams and enterprises',
      features: [
        '5 GB Storage',
        'All Features',
        'Team Collaboration',
        '24/7 Priority Support',
        'Custom Domains',
        'Analytics Dashboard',
      ],
    },
  ];

  // Map URL plan param to plan ID
  const getPlanIdFromParam = (param: string | null) => {
    if (!param) return null;
    
    const planMap: Record<string, string> = {
      'plus': 'plus',
      'pro': 'pro',
      'ultra-pro': 'ultra-pro'
    };
    
    return planMap[param] || null;
  };

  // Get selected plan
  const selectedPlanId = getPlanIdFromParam(planParam);
  const selectedPlanData = selectedPlanId ? plans.find(plan => plan.id === selectedPlanId) : null;

  // Load Razorpay script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle payment
  const handlePayment = async (planId: string) => {
    if (!session?.user?.email) {
      setError('User information not available');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      setError('Invalid plan selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        setError('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // Create order on backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            userId: session.user.id,
            email: session.user.email,
            planId: plan.id,
            planName: plan.name,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Log the full error in development
       
        throw new Error(result.message || 'Failed to create payment order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: result.order.amount,
        currency: result.order.currency,
        name: 'AnytimeRequest',
        description: `Upgrade to ${plan.name} Plan`,
        image: '/logo.png', // Replace with your logo path
        order_id: result.order.id,
        handler: async function (response: any) {
          // Verify payment on backend
          try {
            const verifyResponse = await fetch('/api/payment/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              // Payment successful - redirect to success page
              router.push('/upgrade/success');
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (verifyError: any) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: session.user.name || '',
          email: session.user.email,
        },
        theme: {
          color: '#6366f1', // Indigo color to match your branding
        },
        modal: {
          ondismiss: function() {
            // Payment cancelled or closed
            router.push('/upgrade/cancel');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect to pricing page if no valid plan selected
  if (!selectedPlanData) {
    router.push('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#030712] py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/pricing" 
            className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Pricing
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Upgrade to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">{selectedPlanData.name}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            {selectedPlanData.description}
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div
            className="relative rounded-3xl border border-indigo-400/50 bg-gradient-to-b from-white/5 to-white/2 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.5)]"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{selectedPlanData.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">{selectedPlanData.dollarPrice}</span>
                <span className="text-lg text-slate-300">/month</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{selectedPlanData.description}</p>
            </div>

            <ul className="mt-8 space-y-4">
              {selectedPlanData.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-3 text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={() => {
                  setSelectedPlan(selectedPlanData.id);
                  handlePayment(selectedPlanData.id);
                }}
                disabled={loading}
                className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/40'
                }`}
              >
                {loading && selectedPlan === selectedPlanData.id ? 'Processing...' : `Pay ${selectedPlanData.dollarPrice}`}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-300">
            Need a custom solution?{' '}
            <Link href="/contact" className="font-semibold text-indigo-300 hover:text-white">
              Contact our sales team
            </Link>{' '}
            for enterprise plans.
          </p>
        </div>
      </div>
    </div>
  );
};

export default async function UpgradePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const planParam = params?.plan || null;
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">Loading...</div>}>
      <UpgradePageContent planParam={planParam} />
    </Suspense>
  );
}