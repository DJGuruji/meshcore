'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import MoonIcon from '@heroicons/react/24/outline/MoonIcon';
import SunIcon from '@heroicons/react/24/outline/SunIcon';
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon';
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon';

type SettingsView = 'menu' | 'change-password' | 'delete-account' | 'theme';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  
  // View state
  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Account deletion state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handlePasswordChange = async (event: React.FormEvent) => {
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
      setCurrentView('menu');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!deletePassword) {
      toast.error('Please enter your password to confirm account deletion');
      return;
    }
    
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    if (!confirm('This is your final warning. Are you 100% sure you want to permanently delete your account?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.delete('/api/auth/delete-account', {
        data: { password: deletePassword }
      });
      toast.success('Account deleted successfully');
      signOut({ callbackUrl: '/auth/signin' });
    } catch (error: any) {
      console.error('Account deletion error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || 'Failed to delete account';
      toast.error(errorMessage);
      setDeletePassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThemeToggle = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    // TODO: Implement actual theme switching logic
    toast.success(`Theme switched to ${selectedTheme} mode`);
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
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {currentView === 'menu' ? 'Settings' :
             currentView === 'change-password' ? 'Change Password' :
             currentView === 'delete-account' ? 'Delete Account' :
             'Theme Settings'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {currentView === 'menu' 
              ? 'Manage your account preferences and security from here.'
              : 'Configure your account settings.'}
          </p>
        </div>

        {currentView !== 'menu' && (
          <button
            onClick={() => setCurrentView('menu')}
            className="mb-6 flex items-center gap-2 text-sm text-indigo-300 transition hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to settings
          </button>
        )}

        {/* Settings Menu */}
        {currentView === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('change-password')}
              className="w-full rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl transition hover:border-indigo-400/40 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-white/10 bg-indigo-500/10 p-3">
                    <KeyIcon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Change Password</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
              </div>
            </button>

            <button
              onClick={() => setCurrentView('delete-account')}
              className="w-full rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl transition hover:border-rose-400/40 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-white/10 bg-rose-500/10 p-3">
                    <TrashIcon className="h-6 w-6 text-rose-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Permanently remove your account and all data
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
              </div>
            </button>

            <button
              onClick={() => setCurrentView('theme')}
              className="w-full rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl transition hover:border-indigo-400/40 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-white/10 bg-indigo-500/10 p-3">
                    {theme === 'dark' ? (
                      <MoonIcon className="h-6 w-6 text-indigo-300" />
                    ) : (
                      <SunIcon className="h-6 w-6 text-indigo-300" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Theme</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Choose your preferred color scheme
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
              </div>
            </button>
          </div>
        )}

        {/* Change Password Form */}
        {currentView === 'change-password' && (
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

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">Current Password</label>
                <div className="relative mt-2">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">New Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                      placeholder="Create a new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">Confirm Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
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
        )}

        {/* Delete Account Form */}
        {currentView === 'delete-account' && (
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-rose-500/10 p-3">
                <TrashIcon className="h-6 w-6 text-rose-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-rose-200">Danger Zone</p>
                <h2 className="text-xl font-semibold text-white">Delete Account</h2>
                <p className="text-sm text-slate-300">
                  This action cannot be undone. Please be certain.
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="rounded-2xl border border-rose-500/50 bg-rose-900/20 p-4">
                <h4 className="font-semibold text-rose-300">Warning</h4>
                <p className="mt-2 text-sm text-slate-300">
                  Deleting your account is permanent and cannot be undone. All your data will be permanently deleted, including:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400 list-disc list-inside ml-4">
                  <li>API collections and requests</li>
                  <li>GraphQL queries and history</li>
                  <li>Environment variables</li>
                  <li>Account settings and preferences</li>
                </ul>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-rose-200">Confirm Password</label>
                <div className="relative mt-2">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-400 focus:border-rose-400/40 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                    placeholder="Enter your password to confirm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showDeletePassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">
                  To confirm deletion, you'll need to confirm twice in the following dialogs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Theme Settings */}
        {currentView === 'theme' && (
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-indigo-500/10 p-3">
                {theme === 'dark' ? (
                  <MoonIcon className="h-6 w-6 text-indigo-200" />
                ) : (
                  <SunIcon className="h-6 w-6 text-indigo-200" />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Appearance</p>
                <h2 className="text-xl font-semibold text-white">Theme Settings</h2>
                <p className="text-sm text-slate-300">
                  Choose your preferred color scheme for the application.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <button
                  onClick={() => handleThemeToggle('dark')}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    theme === 'dark'
                      ? 'border-indigo-400/50 bg-indigo-900/30 text-white'
                      : 'border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MoonIcon className="h-5 w-5 text-indigo-300" />
                    Dark Mode
                  </span>
                  {theme === 'dark' && (
                    <svg className="h-5 w-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleThemeToggle('light')}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    theme === 'light'
                      ? 'border-indigo-400/50 bg-indigo-900/30 text-white'
                      : 'border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <SunIcon className="h-5 w-5 text-indigo-300" />
                    Light Mode
                  </span>
                  {theme === 'light' && (
                    <svg className="h-5 w-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Note: Theme switching is currently in development. The selected theme will be applied in a future update.
                </p>
              </div>

              <div className="flex items-center justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
