const seoPillStyles = 'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 uppercase tracking-[0.25em]';

const headlineItems = [
  {
    title: 'Build APIs without writing backend code',
    description:
      'Create realistic mock servers with custom endpoints, authentication, and JSON responses in seconds. Perfect for frontend developers who want to move fast without waiting for backend.',
    keywords: ['mock server online', 'fake API generator', 'generate dummy API', 'JSON API generator'],
  },
  {
    title: 'Test APIs like a pro developer',
    description:
      'Send real HTTP requests, inspect responses, and debug issues with our powerful API testing playground. Supports all HTTP methods, headers, and authentication flows.',
    keywords: ['API playground', 'HTTP testing tool', 'request builder tool', 'REST API tester'],
  },
  {
    title: 'Prototype faster with your team',
    description:
      'Share working API endpoints with teammates instantly. Collaborate on API design, test together, and iterate without deploying anything to production.',
    keywords: ['JSON response tester', 'fake JSON API', 'backend-less API tool', 'API testing tool'],
  },
];

const faqs = [
  {
    q: 'How can I test my frontend without waiting for backend?',
    a: 'Create a mock API in seconds with AnyTimeRequest. Define your endpoints, set up authentication, and start making real HTTP requests from your frontend code immediately. No backend needed!',
  },
  {
    q: 'Can my whole team use the same mock APIs?',
    a: 'Absolutely. Share working HTTPS URLs with your teammates so everyone can test against the same mock endpoints. Perfect for frontend/backend collaboration during development.',
  },
  {
    q: 'Is this as powerful as Postman or Insomnia?',
    a: 'Yes! Our API testing playground supports all HTTP methods, custom headers, authentication flows, and response inspection. Plus, you get instant mock servers that your whole team can use.',
  },
];

export default function SEOContent() {
  return (
    <section className="relative z-10 mx-auto mt-20 w-full max-w-5xl space-y-16 px-4 pb-16 text-left text-white">
      <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.65)] backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {['mock server online', 'API playground', 'JSON response tester', 'API testing tool', 'REST API tester'].map((pill) => (
            <span key={pill} className={seoPillStyles}>
              {pill}
            </span>
          ))}
        </div>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          The fastest way to build and test APIs
        </h2>
        <p className="text-lg text-slate-200">
          Stop waiting for backend APIs to be ready. Create realistic mock servers, test HTTP requests, and collaborate with your team—all in one place. 
          Whether you're a frontend developer, QA engineer, or product manager, AnyTimeRequest helps you move faster.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {headlineItems.map((item) => (
          <article key={item.title} className="rounded-[28px] border border-white/10 bg-[#050915]/80 p-6 shadow-inner shadow-black/30">
            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-200">
                  {keyword}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/60 p-8">
        <h3 className="text-2xl font-semibold text-white">Why developers love AnyTimeRequest</h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Developers search for tools like "mock server online" and "API testing tool" because they need to solve real problems:
          building faster, testing thoroughly, and collaborating better. AnyTimeRequest addresses these needs with intuitive tools
          that just work, so you can focus on what matters—shipping great products.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
          {[
            'Create mock APIs in seconds',
            'Test HTTP requests easily',
            'Share endpoints with teammates',
            'Debug JSON responses',
            'Prototype without backend',
            'Collaborate on API design',
            'Validate API contracts',
            'Move fast as a team'
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <span className="text-indigo-300">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8">
        <h3 className="text-2xl font-semibold text-white">FAQ</h3>
        <div className="mt-6 space-y-5">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <p className="text-lg font-semibold text-white">{faq.q}</p>
              <p className="mt-2 text-sm text-slate-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
