'use client';

import Link from 'next/link';

const ShippingPage = () => {
  const shippingInfo = [
    {
      title: "Digital Delivery",
      content: [
        "All our services are delivered digitally through our platform.",
        "Access to our tools is provided immediately after successful payment processing.",
        "No physical shipping is required as all products are software-based services.",
        "You will receive an email confirmation with access instructions upon purchase."
      ]
    },
    {
      title: "Payment Processing",
      content: [
        "We use Razorpay as our primary payment processor for secure transactions.",
        "Payments are processed in real-time upon checkout completion.",
        "All major credit/debit cards and digital wallets are accepted.",
        "Payment confirmations are sent to your registered email address."
      ]
    },
    {
      title: "Instant Access",
      content: [
        "Upon successful payment verification, you gain immediate access to your purchased services.",
        "Log in to your account to access all subscribed features.",
        "No waiting period or shipping delays apply to digital services.",
        "Your subscription activates instantly after payment processing."
      ]
    },
    {
      title: "Service Availability",
      content: [
        "Our services are available globally 24/7.",
        "No geographical restrictions apply to our digital offerings.",
        "Services can be accessed from any device with internet connectivity.",
        "Multiple simultaneous sessions are supported based on your subscription tier."
      ]
    }
  ];

  const razorpayInfo = [
    {
      title: "About Razorpay",
      content: [
        "Razorpay is India's leading payment gateway trusted by millions of businesses.",
        "Provides secure, PCI-compliant payment processing.",
        "Supports multiple payment methods including cards, net banking, and wallets.",
        "Ensures encrypted transactions with advanced fraud protection mechanisms."
      ]
    },
    {
      title: "Payment Security",
      content: [
        "All transactions are encrypted using 256-bit SSL technology.",
        "PCI DSS Level 1 compliant payment infrastructure.",
        "Two-factor authentication for high-value transactions.",
        "Real-time fraud detection and prevention systems."
      ]
    },
    {
      title: "Supported Payment Methods",
      content: [
        "Credit and Debit Cards (Visa, MasterCard, American Express, RuPay)",
        "Net Banking (All major Indian banks)",
        "Digital Wallets (Paytm, PhonePe, Amazon Pay, etc.)",
        "Unified Payments Interface (UPI)",
        "Buy Now, Pay Later options (LazyPay, Simpl, etc.)"
      ]
    }
  ];

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
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Digital delivery with instant access through our secure payment partner
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-8">
              As a digital service provider, our shipping and delivery process is entirely online. 
              Upon successful payment, you gain immediate access to all purchased services through 
              our platform. We've partnered with Razorpay to ensure secure and seamless transactions.
            </p>

            <div className="space-y-10 mb-12">
              <h2 className="text-3xl font-semibold text-white">Shipping Information</h2>
              
              {shippingInfo.map((info, index) => (
                <div key={index} className="border-b border-white/10 pb-10 last:border-0 last:pb-0">
                  <h3 className="text-xl font-semibold text-white mb-4">{info.title}</h3>
                  <ul className="space-y-3">
                    {info.content.map((item, itemIndex) => (
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

            <div className="space-y-10">
              <h2 className="text-3xl font-semibold text-white">Razorpay Integration</h2>
              
              {razorpayInfo.map((info, index) => (
                <div key={index} className="border-b border-white/10 pb-10 last:border-0 last:pb-0">
                  <h3 className="text-xl font-semibold text-white mb-4">{info.title}</h3>
                  <ul className="space-y-3">
                    {info.content.map((item, itemIndex) => (
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
              <h3 className="text-xl font-semibold text-white mb-3">Need Help?</h3>
              <p className="text-slate-300 mb-4">
                If you have any questions about our shipping and delivery process or payment methods, please contact us:
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="mailto:nath93266@gmail.com" 
                  className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  nath93266@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;