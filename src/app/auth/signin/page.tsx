'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Turnstile } from '@marsidev/react-turnstile';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Handle query parameters for verification messages
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now sign in.');
    }
    
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'invalid-token':
          setError('Invalid verification token.');
          break;
        case 'invalid-or-expired-token':
          setError('Invalid or expired verification token.');
          break;
        case 'verification-failed':
          setError('Email verification failed. Please try again.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        turnstileToken,
      });
      
      if (result?.error) {
        setError(result.error);
        // Reset the Turnstile token
        setTurnstileToken('');
        return;
      }
      
      // Redirect to home page on successful login
      router.push('/');
      router.refresh();
    } catch (error) {
      setError('An error occurred during sign in');
      console.error('Sign in error:', error);
      // Reset the Turnstile token
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    'mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60';
  const labelStyles = 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-300';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-indigo-300">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to continue</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your dashboard and pick up where you left off.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className={labelStyles}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyles}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelStyles}>
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyles}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
              <span>Keep your credentials secure.</span>
              <Link
                href="/auth/forgot-password"
                className="font-semibold text-indigo-300 transition hover:text-white"
              >
                Forgot password?
              </Link>
            </div>

            {/* Turnstile CAPTCHA */}
            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token: string) => setTurnstileToken(token)}
                onError={() => {
                  setError('CAPTCHA verification failed. Please try again.');
                  setTurnstileToken('');
                }}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
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

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-center text-sm text-slate-300">
            New here?{' '}
            <Link href="/auth/register" className="font-semibold text-white hover:text-indigo-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}