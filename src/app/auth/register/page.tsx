'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Register the user
      await axios.post('/api/auth/register', {
        name,
        email,
        password,
      });
      
      // Redirect to sign in page after successful registration
      router.push('/auth/signin?registered=true');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', error);
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
        <div className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(147,51,234,0.12),_transparent_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-indigo-300">Create Account</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Join the community</h1>
            <p className="mt-2 text-sm text-slate-400">
              Unlock the full experience with a free account.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
            <div>
              <label htmlFor="name" className={labelStyles}>
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="How should we address you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyles}
                required
              />
            </div>

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

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={labelStyles}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyles}
                  required
                  minLength={6}
                />
                <p className="mt-2 text-xs text-slate-400">At least 6 characters.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelStyles}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputStyles}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{loading ? 'Creating account…' : 'Create account'}</span>
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
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-semibold text-white hover:text-indigo-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
