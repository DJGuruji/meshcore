'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 sm:px-6 lg:px-8">
    <div className="absolute inset-0">
      <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-16 left-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
    </div>
    {children}
  </div>
);

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputStyles =
    'mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60';
  const labelStyles = 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-300';

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password,
      });
      
      setMessage(response.data.message);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <PageShell>
        <div className="relative z-10 w-full max-w-xl">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 text-center text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            Loading secure reset form…
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-indigo-300">Secure Reset</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Choose a new password</h1>
            <p className="mt-2 text-sm text-slate-400">
              Make sure it&apos;s unique and only you know it.
            </p>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                Redirecting to sign in…
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {token && !message && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="password" className={labelStyles}>
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyles}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelStyles}>
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputStyles}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{loading ? 'Resetting…' : 'Reset password'}</span>
                <svg
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 10h10M10 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          )}

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-center text-sm text-slate-300">
            <Link href="/auth/signin" className="font-semibold text-white hover:text-indigo-300">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <PageShell>
        <div className="relative z-10 w-full max-w-xl">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 text-center text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            Loading secure reset form…
          </div>
        </div>
      </PageShell>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
