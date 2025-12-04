'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UpgradeCancelPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-white">Payment Cancelled</h1>
          <p className="mt-4 text-slate-300">
            Your payment was cancelled. You can try again or choose a different plan.
          </p>
          
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">
              No charges have been made to your account.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/upgrade"
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
            >
              Try Again
            </Link>
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-indigo-400/40 hover:text-white"
            >
              Back to Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeCancelPage;