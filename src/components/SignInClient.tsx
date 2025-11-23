'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Turnstile } from '@marsidev/react-turnstile';

interface SignInClientProps {
  verified?: boolean;
  error?: string;
}

export default function SignInClient({ verified, error: errorParam }: SignInClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Redirect authenticated users to home page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Handle query parameters for verification messages
  useEffect(() => {
    if (verified) {
      setSuccess('Email verified successfully! You can now sign in.');
    }
    
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
  }, [verified, errorParam]);

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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });
      
      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect to home page on successful login
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred during Google sign in');
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    'mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60';
  const labelStyles = 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-300';

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-xl shadow-black/50">
          Checking authentication status…
        </div>
      </div>
    );
  }

  // Don't render the sign in form if user is authenticated
  if (status === 'authenticated') {
    return null;
  }

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

          {/* Google Sign In Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-900/70 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>

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