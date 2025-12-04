'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  // Auto redirect to home after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-16 left-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white">404</h1>
          <h2 className="text-3xl font-semibold text-slate-200">Page Not Found</h2>
        </div>

        <p className="mb-8 text-lg text-slate-400">
          Sorry, we couldn't find the page you're looking for. The link might be broken or the page may have been removed.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
          >
            Go Home
          </Link>
          
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
          >
            Go Back
          </button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          You'll be automatically redirected to the homepage in 10 seconds...
        </p>
      </div>
    </div>
  );
}