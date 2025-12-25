'use client';

import { useState } from 'react';
import Link from 'next/link';

const seoPillStyles = 'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 uppercase tracking-[0.25em] transition-all duration-300 hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-200';

const headlineItems = [
  {
    title: 'Build APIs without writing backend code',
    description:
      'Create realistic mock servers with custom endpoints, authentication, and JSON responses in seconds. Perfect for frontend developers who want to move fast without waiting for backend teams. Support for REST, GraphQL, and custom response formats.',
    keywords: ['mock server online', 'fake API generator', 'generate dummy API', 'JSON API generator'],
    icon: '⚡',
    stats: { label: 'Setup Time', value: '< 30 sec' }
  },
  {
    title: 'Test APIs like a pro developer',
    description:
      'Send real HTTP requests, inspect responses, and debug issues with our powerful API testing playground. Supports all HTTP methods, custom headers, authentication flows, and advanced response validation with schema testing.',
    keywords: ['API playground', 'HTTP testing tool', 'request builder tool', 'REST API tester'],
    icon: '🧪',
    stats: { label: 'Test Coverage', value: '95%+' }
  },
  {
    title: 'Prototype faster with your team',
    description:
      'Share working API endpoints with teammates instantly. Collaborate on API design, test together, and iterate without deploying anything to production. Real-time collaboration features keep everyone in sync.',
    keywords: ['JSON response tester', 'fake JSON API', 'backend-less API tool', 'API testing tool'],
    icon: '🚀',
    stats: { label: 'Team Speed', value: '3x faster' }
  },
];

const additionalFeatures = [
  {
    title: 'GraphQL Testing Made Simple',
    description: 'Explore GraphQL APIs with automatic schema introspection, query validation, and real-time results.',
    icon: '🔷',
    link: '/graphql-tester'
  },
  {
    title: 'Enterprise-Grade Security',
    description: 'JWT authentication, API key management, and role-based access control built-in.',
    icon: '🔒',
    link: '/docs'
  },
  {
    title: 'Comprehensive Documentation',
    description: 'Step-by-step guides, API references, and video tutorials to get you started quickly.',
    icon: '📚',
    link: '/docs'
  },
  {
    title: 'Real-World Use Cases',
    description: 'See how teams use AnyTimeRequest for mobile development, microservices, and more.',
    icon: '💼',
    link: '/use-cases'
  }
];

const faqs = [
  {
    q: 'How can I test my frontend without waiting for backend?',
    a: 'Create a mock API in seconds with AnyTimeRequest. Define your endpoints, set up authentication, and start making real HTTP requests from your frontend code immediately. No backend needed! Our mock servers support custom response bodies, status codes, headers, and even authentication flows.',
  },
  {
    q: 'Can my whole team use the same mock APIs?',
    a: 'Absolutely. Share working HTTPS URLs with your teammates so everyone can test against the same mock endpoints. Perfect for frontend/backend collaboration during development. Changes are synced in real-time across all team members.',
  },
  {
    q: 'Is this as powerful as Postman or Insomnia?',
    a: 'Yes! Our API testing playground supports all HTTP methods, custom headers, authentication flows, and response inspection. Plus, you get instant mock servers that your whole team can use. We also support GraphQL testing, collection management, and environment variables.',
  },
  {
    q: 'Do you offer free plans?',
    a: 'Yes, we offer a generous free tier that includes mock server creation, API testing, GraphQL playground, and collaboration features. Perfect for individuals and small teams getting started. Upgrade anytime for advanced features and higher limits.',
  },
  {
    q: 'How secure is my data?',
    a: 'We take security seriously. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Authentication uses industry-standard protocols including JWT and OAuth 2.0. We regularly audit our systems for vulnerabilities and maintain SOC 2 compliance.',
  },
  {
    q: 'Can I integrate with my existing tools?',
    a: 'Absolutely. Our platform offers robust API integration capabilities, webhooks, and export options that work seamlessly with popular development tools like VS Code, GitHub, Slack, and CI/CD pipelines. Import collections from Postman or export to OpenAPI format.',
  },
  {
    q: 'What makes AnyTimeRequest different from other tools?',
    a: 'Unlike traditional API testing tools, we combine mock server creation, API testing, and GraphQL support in one platform. You can create, test, and share APIs without any infrastructure setup. Plus, our real-time collaboration features make team workflows seamless.',
  },
  {
    q: 'How fast can I get started?',
    a: 'You can create your first mock API and start testing in under 30 seconds. No credit card required for the free tier. Our intuitive interface and comprehensive documentation make onboarding effortless.',
  }
];

export default function SEOContent() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };


  return (
    <section className="relative z-10 mx-auto mt-20 w-full max-w-6xl space-y-16 px-4 pb-16 text-left text-white">
      {/* Hero SEO Section */}
      <div className="group relative space-y-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-10 shadow-[0_30px_90px_rgba(2,6,23,0.65)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/30 hover:shadow-[0_35px_100px_rgba(99,102,241,0.25)]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-orange-500/0 opacity-0 transition-opacity duration-300 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-orange-500/5 group-hover:opacity-100" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-6">
            {['mock server online', 'API playground', 'JSON response tester', 'API testing tool', 'REST API tester', 'GraphQL tester'].map((pill) => (
              <span key={pill} className={seoPillStyles}>
                {pill}
              </span>
            ))}
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-4">
            The fastest way to build and test APIs
          </h2>
          <p className="text-lg text-slate-200 leading-relaxed max-w-4xl">
            Stop waiting for backend APIs to be ready. Create realistic mock servers, test HTTP requests, and collaborate with your team—all in one place. 
            Whether you're a frontend developer, QA engineer, or product manager, AnyTimeRequest helps you move faster and ship better products.
          </p>
          
          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Setup Time', value: '< 30s' },
              { label: 'Developers', value: '10K+' },
              { label: 'APIs Created', value: '50K+' },
              { label: 'Uptime', value: '99.9%' }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10 hover:scale-105">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Main Features Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {headlineItems.map((item, index) => (
          <article 
            key={item.title} 
            className="group relative rounded-[28px] border border-white/10 bg-gradient-to-br from-[#050915]/90 to-[#0a0f1e]/80 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/30 hover:shadow-[0_25px_60px_rgba(99,102,241,0.3)] hover:-translate-y-1"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 group-hover:opacity-100" />
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-4 text-4xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {item.icon}
              </div>
              
              {/* Stat Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/20 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/40">
                {item.stats.label}: <span className="text-indigo-200">{item.stats.value}</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 transition-colors duration-300 group-hover:text-indigo-200">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{item.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {item.keywords.map((keyword) => (
                  <span 
                    key={keyword} 
                    className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 group-hover:ring-indigo-500/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>


          </article>
        ))}
      </div>

      {/* Additional Features */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {additionalFeatures.map((feature) => (
          <Link
            key={feature.title}
            href={feature.link}
            className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 group-hover:opacity-100" />
            
            <div className="relative z-10">
              <div className="mb-3 text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                {feature.icon}
              </div>
              <h4 className="text-sm font-bold text-white mb-2 transition-colors duration-300 group-hover:text-indigo-200">
                {feature.title}
              </h4>
              <p className="text-xs text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                {feature.description}
              </p>
            </div>


          </Link>
        ))}
      </div>

      {/* Why Developers Love Section */}
      <div className="group relative rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/60 p-10 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/30 hover:shadow-[0_30px_80px_rgba(99,102,241,0.3)]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 group-hover:opacity-100" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-white mb-4">Why developers love AnyTimeRequest</h3>
          <p className="max-w-3xl text-base text-slate-200 leading-relaxed mb-8">
            Developers search for tools like "mock server online" and "API testing tool" because they need to solve real problems:
            building faster, testing thoroughly, and collaborating better. AnyTimeRequest addresses these needs with intuitive tools
            that just work, so you can focus on what matters—shipping great products.
          </p>
          <ul className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { text: 'Create mock APIs in seconds', icon: '⚡' },
              { text: 'Test HTTP requests easily', icon: '🧪' },
              { text: 'Share endpoints with teammates', icon: '🔗' },
              { text: 'Debug JSON responses', icon: '🔍' },
              { text: 'Prototype without backend', icon: '🚀' },
              { text: 'Collaborate on API design', icon: '👥' },
              { text: 'Validate API contracts', icon: '✅' },
              { text: 'Move fast as a team', icon: '⚡' },
              { text: 'GraphQL support built-in', icon: '🔷' }
            ].map((benefit) => (
              <li 
                key={benefit.text} 
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10 hover:text-white"
              >
                <span className="text-xl">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>


      </div>

      {/* FAQ Section */}
      <div className="group rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-10 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/30 hover:shadow-[0_30px_90px_rgba(99,102,241,0.25)]">
        <h3 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h3>
        <p className="text-slate-300 mb-8">Everything you need to know about AnyTimeRequest</p>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="group/faq relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/30 hover:bg-white/10 hover:shadow-lg"
            >
              <button
                className="flex w-full items-center justify-between p-6 text-left transition-all duration-300"
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaqIndex === index}
              >
                <h4 className="text-base font-semibold text-slate-100 pr-4 transition-colors duration-300 group-hover/faq:text-white">{faq.q}</h4>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-indigo-400 transition-all duration-300 ${openFaqIndex === index ? 'rotate-180 text-indigo-300' : ''} group-hover/faq:text-indigo-300`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-0 text-sm text-slate-300 leading-relaxed border-t border-white/10">
                  {faq.a}
                </div>
              </div>


            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="group relative rounded-[32px] border border-indigo-500/20 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-orange-600/20 p-12 text-center backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_30px_80px_rgba(99,102,241,0.4)]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 group-hover:opacity-100" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-white mb-4">Start Building Better APIs Today</h3>
          <p className="mx-auto max-w-2xl text-lg text-slate-200 mb-8">
            Join thousands of developers who trust AnyTimeRequest for their API development workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/50 hover:-translate-y-1"
            >
              Get Started Free
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:-translate-y-1"
            >
              View Documentation
            </Link>
          </div>
        </div>


      </div>
    </section>
  );
}
