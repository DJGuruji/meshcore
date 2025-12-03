'use client';

import Link from 'next/link';

const ShippingPage = () => {

  return (
    <div className="min-h-screen bg-[#030712] py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Shipping & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">Delivery Policy</span>
          </h1>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
          <div className="prose prose-invert max-w-none">


            <div className="space-y-6 text-slate-300">
              <p className="text-lg">
                We provide a software-based digital service. No physical goods are shipped.
              </p>
              
              <p>
                After successful payment, your subscription/plan is activated automatically and you can access features by logging into your account.
              </p>
              
              <p>
                <span className="font-semibold">Delivery timeline:</span> instant activation; in rare cases it may take up to 15 minutes.
              </p>
              
              <p>
                If access is not enabled after payment, contact <a href="mailto:nath93266@gmail.com" className="text-indigo-300 hover:text-white">nath93266@gmail.com</a> with your payment ID/order ID.
              </p>
              
              <p>
                No shipping charges apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;