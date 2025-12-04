'use client';

import Link from 'next/link';

const CancellationRefundPage = () => {
  const policies = [
    {
      title: "Cancellation Policy",
      content: [
        "You can cancel your subscription at any time. No questions asked.",
        "To cancel your subscription, log into your account and navigate to the subscription settings.",
        "Upon cancellation, you will retain access to paid features until the end of your current billing period.",
        "We believe in providing flexibility to our users, which is why we offer hassle-free cancellations."
      ]
    },
    {
      title: "Refund Policy",
      content: [
        "We offer refunds on a case-by-case basis within 14 days of purchase.",
        "Refunds are calculated based on the remaining unused portion of your subscription.",
        "For monthly subscriptions, refunds are prorated based on the number of days used in the billing cycle.",
        "For annual subscriptions, refunds are calculated based on the remaining months of service.",
        "Processing of refunds typically takes 7-10 business days to appear in your account.",
        "Refunds are issued to the original payment method used for the purchase.",
        "Certain promotional offers or discounted subscriptions may have different refund terms."
      ]
    },
    {
      title: "Refund Calculation Formula",
      content: [
        "Monthly Subscription Refund = (Total Price / 30 days) × Remaining Days",
        "Annual Subscription Refund = (Total Price / 365 days) × Remaining Days",
        "Enterprise Plans: Please contact our support team for specific refund calculations."
      ]
    },
    {
      title: "Non-Refundable Items",
      content: [
        "Setup fees (if applicable)",
        "Custom development or implementation services already delivered",
        "Consultation hours already utilized",
        "Domain registration fees",
        "Third-party service fees"
      ]
    },
    {
      title: "How to Request a Refund",
      content: [
        "Contact our support team at anytimerequest@gmail.com with your request",
        "Include your account details and reason for the refund request",
        "Our team will review your request and respond within 2-3 business days",
        "Approved refunds will be processed within 7-10 business days"
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#030712]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Cancellation & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">Refund Policy</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Our flexible policy ensures you have complete control over your subscription
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-8">
              At AnyTimeRequest, we strive to provide exceptional service and value to our customers. 
              We understand that circumstances may change, and we've designed our cancellation and refund 
              policies to be fair and transparent.
            </p>

            <div className="space-y-10">
              {policies.map((policy, index) => (
                <div key={index} className="border-b border-white/10 pb-10 last:border-0 last:pb-0">
                  <h2 className="text-2xl font-semibold text-white mb-4">{policy.title}</h2>
                  <ul className="space-y-3">
                    {policy.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="flex-shrink-0 mt-1.5 mr-3">
                          <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                        </div>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold text-white mb-3">Contact Us</h3>
              <p className="text-slate-300 mb-4">
                If you have any questions about our Cancellation & Refund Policy, please contact us:
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="mailto:anytimerequest@gmail.com" 
                  className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  anytimerequest@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPage;