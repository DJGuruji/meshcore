'use client';

import Link from 'next/link';
import SEOContent from '@/components/SEOContent';
import BoltIcon from '@heroicons/react/24/outline/BoltIcon';
import BeakerIcon from '@heroicons/react/24/outline/BeakerIcon';
import CubeIcon from '@heroicons/react/24/outline/CubeIcon';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-indigo-200">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" />
          Build. Test. Iterate.
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Ship APIs faster with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">AnyTimeRequest</span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300 sm:text-xl">
          Spin up mock servers, validate payloads, explore GraphQL, and stress test your workflows—everything you need to
          move from idea to production without friction.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BoltIcon, title: 'Mock Server', desc: 'Design endpoints with auth, payloads, and status codes instantly.' },
            { icon: BeakerIcon, title: 'API Tester', desc: 'Send requests, inspect responses, and share collections effortlessly.' },
            { icon: CubeIcon, title: 'GraphQL tester', desc: 'Run GraphQL queries and mutations with schema introspection, variables, and real-time results.' },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-[0_20px_50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(15,23,42,0.7)] hover:-translate-y-1 group transform-gpu backface-hidden perspective-1000"
            >
              <div className="text-indigo-400 transform transition-transform duration-300 group-hover:scale-110 transform-gpu backface-hidden">
                <card.icon className="h-10 w-10" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/mockserver"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-y-1 hover:scale-105 transform-gpu backface-hidden perspective-1000"
          >
            <span className="relative z-10">Enter Workspace</span>
            <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="none">
              <path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href="/auth/register"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-gray-200 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/50 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 hover:scale-105 transform-gpu backface-hidden perspective-1000"
          >
            <span className="relative z-10">Create free account</span>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/pricing"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 backdrop-blur-xl transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-1 hover:scale-105 transform-gpu backface-hidden perspective-1000"
          >
            <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 transform-gpu backface-hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="relative z-10">View Pricing</span>
          </Link>
        </div>

      </div>

      <SEOContent />
    </div>
  );
}
