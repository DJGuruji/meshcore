'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const PricingPage = () => {
  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);
  const { data: session } = useSession();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '\u20B90',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '10 MB Storage',
        'Max 2 Projects',
        '300 Requests/Day',
   
      ],
      buttonText: 'Current Plan',
      buttonVariant: 'secondary',
      popular: false,
    },
    {
      name: 'plus',
      price: '\u20B9429',
      period: '/month',
      description: 'Great for small projects',
      features: [
        '200 MB Storage',
        'Max 5 Projects',
        '3,000 Requests/Day',
      
      ],
      buttonText: 'Upgrade Now',
      buttonVariant: 'primary',
      popular: false,
    },
    {
      name: 'Pro',
      price: '\u20B91499',
      period: '/month',
      description: 'Ideal for professionals',
      features: [
        '1 GB Storage',
        'Max 10 Projects',
        '20,000 Requests/Day',
        'Image, Video, Audio and & File Upload',
      
      ],
      buttonText: 'Upgrade Now',
      buttonVariant: 'primary',
      popular: true,
    },
    {
      name: 'Ultra Pro',
      price: '\u20B94299',
      period: '/month',
      description: 'For teams and enterprises',
      features: [
        '5 GB Storage',
        'Unlimited Projects',
        '200,000 Requests/Day',
        'Image, Video, Audio and & File Upload',
       
      ],
      buttonText: 'Upgrade Now',
      buttonVariant: 'primary',
      popular: false,
    },
    {
      name: 'Custom',
      price: 'Contact Us',
      period: '',
      description: 'Tailored for your business',
      features: [
        'Unlimited Storage',
        'Unlimited Projects',
        'Custom Request Limits',
        'Image, Video, Audio and & File Upload',
      
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary',
      popular: false,
    },
  ];

  const getButtonClass = (variant: string) => {
    if (variant === 'primary') {
      return 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform';
    }
    return 'border border-white/10 text-white hover:border-indigo-400/40 hover:text-white';
  };

  // Define account hierarchy for determining upgrades/downgrades
  const accountHierarchy: { [key: string]: number } = {
    'free': 0,
    'plus': 1,
    'pro': 2,
    'ultra-pro': 3,
    'custom': 4
  };

  // Convert plan name to account type
  const planNameToAccountType = (planName: string) => {
    switch (planName) {
      case 'Free': return 'free';
      case 'plus': return 'plus';
      case 'Pro': return 'pro';
      case 'Ultra Pro': return 'ultra-pro';
      case 'Custom': return 'custom';
      default: return 'free';
    }
  };

  // Determine if a plan is a downgrade from the user's current plan
  const isDowngrade = (planName: string) => {
    if (!session || !session.user) return false;
    const userAccountType = (session.user as any).accountType as string;
    const currentUserLevel = accountHierarchy[userAccountType] || 0;
    const planLevel = accountHierarchy[planNameToAccountType(planName)] || 0;
    return planLevel < currentUserLevel;
  };

  // Check if this is the user's current plan
  const isCurrentPlan = (planName: string) => {
    if (!session || !session.user) return false;
    const userAccountType = (session.user as any).accountType as string;
    return userAccountType === planNameToAccountType(planName);
  };

  return (
    <div className="min-h-screen bg-[#030712]" style={{ scrollPaddingTop: '5rem' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Simple, transparent <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">pricing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Choose the perfect plan for your mock server needs. API Tester and GraphQL Tester are completely free to use!
          </p>
         
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/cancellation-refund" className="text-indigo-300 hover:text-white transition">
              Cancellation & Refund Policy
            </Link>
            <span className="text-slate-500">•</span>
            <Link href="/shipping" className="text-indigo-300 hover:text-white transition">
              Shipping & Delivery Policy
            </Link>
          </div>
        </div>

        {/* Toggle for annual billing */}
        {/* <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                !isAnnual
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                isAnnual
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Annual billing
            </button>
          </div>
        </div> */}

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              id={`plan-${index}`}
              className={`relative rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${
                isCurrentPlan(plan.name)
                  ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/10 via-white/5 to-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/20'
                  : plan.popular
                  ? 'border-indigo-400/50 bg-gradient-to-b from-white/5 to-white/2 shadow-[0_20px_50px_rgba(15,23,42,0.5)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.7)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_20px_40px_rgba(15,23,42,0.4)]'
              }`}
            >
              {isCurrentPlan(plan.name) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/30">
                    ✓ Current Plan
                  </span>
                </div>
              )}
              {!isCurrentPlan(plan.name) && plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className={`text-xl font-semibold ${
                  isCurrentPlan(plan.name) 
                    ? 'text-emerald-300' 
                    : 'text-white'
                }`}>{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-lg text-slate-300">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
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
                {session ? (
                  plan.name === 'Free' && (session.user as any).accountType === 'free' ? (
                    // User is viewing Free plan and is on Free tier
                    <button
                      disabled
                      className="block w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-sm font-semibold text-emerald-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isDowngrade(plan.name) ? (
                    // Show downgrade button for plans below current account type
                    <button
                      disabled
                      className="block w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3 text-center text-sm font-semibold text-amber-400 cursor-not-allowed"
                    >
                      Downgrade (Expires Automatically)
                    </button>
                  ) : (session.user as any).accountType === planNameToAccountType(plan.name) ? (
                    // User is on this exact plan
                    <button
                      disabled
                      className="block w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-sm font-semibold text-emerald-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    // User is viewing a different plan (upgrade)
                    <Link
                      href={plan.name === 'Custom' ? '/contact' : `/upgrade?plan=${plan.name === 'Ultra Pro' ? 'ultra-pro' : plan.name.toLowerCase()}`}
                      className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all duration-300 ${
                        plan.buttonVariant === 'primary'
                          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/40'
                          : 'border border-white/10 text-white hover:border-indigo-400/40 hover:text-white hover:bg-white/5 hover:scale-[1.02]'
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  )
                ) : (
                  <Link
                    href="/auth/signin"
                    className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all duration-300 ${
                      plan.buttonVariant === 'primary'
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/40'
                        : 'border border-white/10 text-white hover:border-indigo-400/40 hover:text-white hover:bg-white/5 hover:scale-[1.02]'
                    }`}
                  >
                    Sign In to Upgrade
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
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

export default PricingPage;