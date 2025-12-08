import Link from 'next/link';
import { Suspense } from 'react';
import AuthErrorContent from './AuthErrorContent';

function AuthErrorFallback() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.12),_transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
            
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Loading error details...
            </div>
            
            <div className="mt-8">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
              >
                Try Again
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </Link>
              
              <div className="mt-4 text-sm text-slate-400">
                Need help?{' '}
                <Link href="/contact" className="font-semibold text-indigo-300 hover:text-white">
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<AuthErrorFallback /> }>
      <AuthErrorContent />
    </Suspense>
  );
}