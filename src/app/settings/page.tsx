'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { KeyIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-300 shadow-xl shadow-black/60">
          Preparing settings…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030712] text-white">
      <Toaster position="top-right" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-300">
            Manage your account preferences and security from here.
          </p>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-indigo-500/10 p-3">
              <KeyIcon className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Security</p>
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
              <p className="text-sm text-slate-300">
                Update your password regularly to help keep your account secure.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  placeholder="Create a new password"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
