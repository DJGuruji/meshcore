'use client';

import Link from 'next/link';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  stats: {
    label: string;
    value: string;
  }[];
  tags: string[];
}

const useCases: UseCase[] = [
  {
    id: 'frontend-development',
    title: 'Frontend Development Without Backend Delays',
    description: 'Build and test your frontend applications without waiting for backend APIs to be ready. Create realistic mock endpoints that match your API contracts perfectly.',
    icon: '⚡',
    benefits: [
      'Start frontend development immediately',
      'No dependency on backend team schedules',
      'Test edge cases and error scenarios easily',
      'Prototype faster with realistic data'
    ],
    stats: [
      { label: 'Time Saved', value: '40%' },
      { label: 'Faster Iterations', value: '3x' }
    ],
    tags: ['React', 'Vue', 'Angular', 'Frontend']
  },
  {
    id: 'api-testing',
    title: 'Comprehensive API Testing & Validation',
    description: 'Test your APIs thoroughly with our powerful testing playground. Send requests, inspect responses, validate schemas, and ensure your APIs work perfectly.',
    icon: '🧪',
    benefits: [
      'Test all HTTP methods and headers',
      'Validate response schemas automatically',
      'Debug authentication flows easily',
      'Share test collections with team'
    ],
    stats: [
      { label: 'Bug Detection', value: '85%' },
      { label: 'Test Coverage', value: '95%' }
    ],
    tags: ['Testing', 'QA', 'Automation', 'CI/CD']
  },
  {
    id: 'team-collaboration',
    title: 'Seamless Team Collaboration',
    description: 'Enable your entire team to work in parallel. Share mock APIs, test collections, and API documentation instantly with teammates across different time zones.',
    icon: '👥',
    benefits: [
      'Share working endpoints instantly',
      'Collaborate on API design in real-time',
      'Reduce communication overhead',
      'Align frontend and backend teams'
    ],
    stats: [
      { label: 'Team Productivity', value: '+60%' },
      { label: 'Meetings Reduced', value: '50%' }
    ],
    tags: ['Collaboration', 'Agile', 'Remote Work']
  },
  {
    id: 'graphql-development',
    title: 'GraphQL Query Testing & Development',
    description: 'Explore GraphQL APIs with schema introspection, run queries and mutations, test with variables, and see real-time results in an intuitive interface.',
    icon: '🔷',
    benefits: [
      'Automatic schema introspection',
      'Test queries with variables',
      'Validate mutations safely',
      'Explore API documentation interactively'
    ],
    stats: [
      { label: 'Query Accuracy', value: '99%' },
      { label: 'Development Speed', value: '2.5x' }
    ],
    tags: ['GraphQL', 'API', 'Development']
  },
  {
    id: 'mobile-app-development',
    title: 'Mobile App Backend Prototyping',
    description: 'Build mobile apps faster by creating mock backends that your iOS and Android apps can consume immediately. Test offline scenarios and edge cases.',
    icon: '📱',
    benefits: [
      'Develop mobile apps without backend',
      'Test offline and error scenarios',
      'Prototype user flows quickly',
      'Demo apps to stakeholders early'
    ],
    stats: [
      { label: 'Launch Speed', value: '45%' },
      { label: 'Stakeholder Demos', value: '10x' }
    ],
    tags: ['Mobile', 'iOS', 'Android', 'React Native']
  },
  {
    id: 'integration-testing',
    title: 'Third-Party API Integration Testing',
    description: 'Test integrations with external APIs safely. Create mock versions of third-party services to develop and test without hitting rate limits or incurring costs.',
    icon: '🔗',
    benefits: [
      'Avoid third-party API rate limits',
      'Test without production costs',
      'Simulate various API responses',
      'Develop offline without internet'
    ],
    stats: [
      { label: 'Cost Savings', value: '$500/mo' },
      { label: 'Test Reliability', value: '100%' }
    ],
    tags: ['Integration', 'Testing', 'Third-Party']
  },
  {
    id: 'api-documentation',
    title: 'Interactive API Documentation',
    description: 'Create living documentation for your APIs. Let developers test endpoints directly from the docs, see real responses, and understand your API faster.',
    icon: '📚',
    benefits: [
      'Generate interactive documentation',
      'Let users test APIs in-browser',
      'Reduce support requests',
      'Improve developer onboarding'
    ],
    stats: [
      { label: 'Onboarding Time', value: '-70%' },
      { label: 'Support Tickets', value: '-40%' }
    ],
    tags: ['Documentation', 'Developer Experience']
  },
  {
    id: 'microservices',
    title: 'Microservices Development & Testing',
    description: 'Develop and test microservices independently. Mock dependencies, test service interactions, and ensure your distributed system works seamlessly.',
    icon: '🏗️',
    benefits: [
      'Develop services independently',
      'Mock service dependencies',
      'Test service interactions',
      'Validate contracts between services'
    ],
    stats: [
      { label: 'Development Speed', value: '55%' },
      { label: 'Integration Issues', value: '-80%' }
    ],
    tags: ['Microservices', 'Architecture', 'DevOps']
  },
  {
    id: 'education',
    title: 'Teaching & Learning API Development',
    description: 'Perfect for educators and students learning API development. Create safe environments to experiment, learn HTTP concepts, and practice API design.',
    icon: '🎓',
    benefits: [
      'Safe learning environment',
      'Hands-on API practice',
      'No infrastructure setup needed',
      'Instant feedback on requests'
    ],
    stats: [
      { label: 'Student Engagement', value: '+90%' },
      { label: 'Learning Speed', value: '2x' }
    ],
    tags: ['Education', 'Learning', 'Training']
  }
];

export default function UseCasesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute left-1/2 bottom-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[180px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-indigo-200 mb-6">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" />
            Real-World Applications
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl mb-6">
            Use Cases for <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">Every Team</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-300 sm:text-xl">
            Discover how development teams, QA engineers, educators, and enterprises use AnyTimeRequest to accelerate their API workflows
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {useCases.map((useCase, index) => (
            <article
              key={useCase.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_30px_70px_rgba(15,23,42,0.8)] hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-orange-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-orange-500/10 group-hover:opacity-100" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-4xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-white/20">
                  {useCase.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-4 transition-colors duration-300 group-hover:text-indigo-300">
                  {useCase.title}
                </h2>

                {/* Description */}
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Benefits */}
                <div className="mb-6 space-y-2">
                  {useCase.benefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-sm text-slate-300 transition-all duration-300 group-hover:text-slate-200"
                    >
                      <svg className="h-5 w-5 flex-shrink-0 text-indigo-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {useCase.stats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10"
                    >
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {useCase.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-slate-400 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 group-hover:ring-indigo-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/60 p-12 text-center shadow-[0_25px_80px_rgba(2,6,23,0.9)] backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your API Workflow?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 mb-8">
            Join thousands of developers, teams, and enterprises using AnyTimeRequest to build, test, and ship APIs faster than ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:scale-105"
            >
              Start Building Free
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-gray-800/50 px-8 py-3 text-base font-semibold text-gray-200 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-gray-800/70 hover:text-white hover:-translate-y-0.5 hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Pricing
            </Link>
          </div>
        </div>

        {/* Additional SEO Content */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.65)] backdrop-blur">
          <h3 className="text-2xl font-bold text-white mb-6">Why Choose AnyTimeRequest?</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-3xl">🚀</div>
              <h4 className="text-lg font-semibold text-white">Lightning Fast</h4>
              <p className="text-sm text-slate-300">Create mock APIs in seconds, not hours. Start testing immediately without complex setup.</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🔒</div>
              <h4 className="text-lg font-semibold text-white">Enterprise Security</h4>
              <p className="text-sm text-slate-300">Bank-level encryption, SOC 2 compliance, and advanced authentication options.</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">💎</div>
              <h4 className="text-lg font-semibold text-white">Premium Support</h4>
              <p className="text-sm text-slate-300">Get help when you need it with our dedicated support team and comprehensive documentation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
