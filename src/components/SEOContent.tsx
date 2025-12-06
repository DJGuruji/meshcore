const seoPillStyles = 'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 uppercase tracking-[0.25em]';

const headlineItems = [
  {
    title: 'Mock server online for lightning-fast prototyping',
    description:
      'Instantiate fully authenticated REST endpoints, enforce JSON schemas, and hand teammates a fake API generator that mirrors production without writing backend code.',
    keywords: ['mock server online', 'fake API generator', 'generate dummy API', 'JSON API generator'],
  },
  {
    title: 'Request builder tool & API playground',
    description:
      'Chain GET, POST, PUT, PATCH, and DELETE calls, attach headers, share collections, and study HTTP traces in a collaborative API request tester.',
    keywords: ['API playground', 'HTTP testing tool', 'request builder tool', 'REST API tester'],
  },
  {
    title: 'JSON response tester for frontend teams',
    description:
      'Validate payloads, craft fake JSON APIs, and wireframe UI states without waiting on backend releases. AnyTimeRequest keeps contracts self-documented.',
    keywords: ['JSON response tester', 'fake JSON API', 'backend-less API tool', 'API testing tool'],
  },
];

const faqs = [
  {
    q: 'Can I share a mock REST API online with my team?',
    a: 'Yes. Workspaces let you invite teammates, share endpoints, and expose HTTPS URLs so anyone can test or consume your fake API securely.',
  },
  {
    q: 'Does the API request tester support auth and custom headers?',
    a: 'Absolutely. Configure bearer tokens, custom headers, and environment variables, then reuse them across collections just like a full HTTP testing tool or API client.',
  },
  {
    q: 'How does AnyTimeRequest help debug JSON responses?',
    a: 'Define field-level validation rules, auto-generate JSON, and compare live responses directly in the interface. Errors are highlighted instantly within the API testing automation workflow.',
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
          Built for people searching “test my API online”
        </h2>
        <p className="text-lg text-slate-200">
          AnyTimeRequest is the all-in-one fake API generator, API request tester, and backend-less API tool that ranks for
          keywords like “mock REST API online” because it actually delivers. Generate dummy endpoints, preview JSON, and
          hand teammates a full API playground in minutes.
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
        <h3 className="text-2xl font-semibold text-white">Popular queries we optimize for</h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Whether someone searches “mock server online,” “API mock tool,” or “API debug UI,” the content on this page is
          tuned to answer that intent. We describe the workflow, highlight the request builder, and link directly to the
          HTTP testing tool so searchers find what they need without bouncing.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
          {['test my API online', 'mock REST API online', 'fake JSON API', 'API playground', 'generate dummy API', 'HTTP testing tool', 'API testing automation', 'API request tester'].map((keyword) => (
            <li key={keyword} className="flex items-center gap-2">
              <span className="text-indigo-300">•</span>
              {keyword}
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
