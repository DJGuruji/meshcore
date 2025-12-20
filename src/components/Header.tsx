'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  CodeBracketSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import GiftIcon from '@heroicons/react/24/outline/GiftIcon';
import BugAntIcon from '@heroicons/react/24/outline/BugAntIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import ArrowTopRightOnSquareIcon from '@heroicons/react/24/outline/ArrowTopRightOnSquareIcon';
import SparklesIcon from '@heroicons/react/24/outline/SparklesIcon';
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Mockserver', href: '/' },
  { name: 'Rest API Tester', href: '/api-tester' },
  { name: 'CodeQL', href: '/graphql-tester' },

];

const utilityLinks = [
  { name: 'Terms & Conditions', href: '/terms', icon: DocumentTextIcon },
  { name: 'Privacy Policy', href: '/privacy', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const BrandMark = ({ priority = false }: { priority?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className="relative  flex h-11 w-11 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-1 shadow-[0_12px_35px_rgba(8,8,20,0.65)]">
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-orange-400 opacity-70 blur-2xl"
        aria-hidden
      />
      <div className="absolute inset-0 rounded-3xl border border-white/20 opacity-60" aria-hidden />
      <Image
        src="/anytime.jpg"
        alt="AnyTimeRequest logo"
        width={42}
        height={42}
        priority={priority}
        className="relative z-10 h-9 w-9 object-contain"
      />
    </div>
    <div className="leading-tight">
      <p className="text-lg font-semibold tracking-wide text-white">AnyTimeRequest</p>
      <p className="text-[10px] uppercase tracking-[0.55em] text-indigo-200/90">Collective</p>
    </div>
  </div>
);

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUtilityPanelOpen, setIsUtilityPanelOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsSidePanelOpen(event.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const handleSidebarToggle = () => {
    const newState = !isSidePanelOpen;
    setIsSidePanelOpen(newState);

    window.dispatchEvent(
      new CustomEvent('openSidebar', {
        detail: { isOpen: newState },
      }),
    );
  };

  const isMainPage = pathname === '/';

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear navigation state when signing out
      localStorage.removeItem('navigationState');
      await signOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      // Silently handle sign out errors in production
      setIsSigningOut(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNavLink = (item: { name: string; href: string }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative overflow-hidden rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-300 ${
          isActive
            ? 'border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_0_10px_rgba(0,0,0,0.5)] bg-black/30 backdrop-blur-sm'
            : 'border-white/5 text-slate-300 hover:border-indigo-400/40 hover:text-white'
        }`}
      >
        <span
          className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
            isActive
              ? 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0.3)_100%)] opacity-100'
              : 'bg-white/5 opacity-0 group-hover:opacity-60'
          }`}
        />
        <span className="relative z-10">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 isolate border-b border-white/10 bg-[#040714]/90 backdrop-blur-3xl shadow-xl">
        <div className="absolute inset-0">
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-4 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
        </div>
        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {isMainPage && isMobile && !isSidePanelOpen && (
              <button
                onClick={handleSidebarToggle}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:border-indigo-400/40 hover:text-white"
                aria-label="Open sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            <Link href="/" className="group" aria-label="Go to AnyTimeRequest home">
              <BrandMark priority />
            </Link>

            {status === 'authenticated' && (
              <nav className="hidden items-center gap-2 md:flex">{navigation.map(renderNavLink)}</nav>
            )}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {status === 'loading' ? (
              // Show skeleton loader while checking auth status
              <div className="flex items-center gap-3">
                <div className="h-10 w-20 animate-pulse rounded-2xl bg-white/10"></div>
                <div className="h-10 w-24 animate-pulse rounded-2xl bg-white/10"></div>
              </div>
            ) : status === 'authenticated' ? (
              <>
                <nav className="flex items-center gap-2">
                  <Link
                    href="/pricing"
                    className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/docs"
                    className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    Docs
                  </Link>
                </nav>
                <div className="relative">
                  <button
                    onClick={() => setIsUtilityPanelOpen(true)}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30">
                      <UserIcon className="h-5 w-5" />
                    </span>
                    <span className="text-left">{session?.user?.name || 'Member'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link
                  href="/auth/signin"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:border-indigo-400/40 hover:text-white"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <Dialog
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        className="fixed inset-0 z-50 md:hidden"
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-hidden border-l border-white/10 bg-[#050915]/95 text-white shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} aria-label="Go to AnyTimeRequest home">
              <BrandMark />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            {status === 'loading' ? (
              // Show skeleton loader while checking auth status
              <div className="space-y-4">
                <div className="h-12 animate-pulse rounded-2xl bg-white/10"></div>
                <div className="h-12 animate-pulse rounded-2xl bg-white/10"></div>
                <div className="h-12 animate-pulse rounded-2xl bg-white/10"></div>
              </div>
            ) : status === 'authenticated' ? (
              <>
             <nav className="space-y-2">
  {navigation.map((item: { name: string; href: string; icon?: React.ComponentType<{className?: string}> }) => {
    const active = pathname === item.href;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`
          group relative block rounded-2xl px-4 py-3 text-base font-medium
          transition-all duration-300 overflow-hidden backdrop-blur-sm
          ${active
            ? `
            text-white border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.5)]
            scale-[1.02]
          `
            : `
            text-slate-300 border border-white/5 hover:text-white
            hover:border-indigo-400/40 hover:scale-[1.015]
          `}
        `}
      >
        {/* Gradient background */}
        <span
          className={`
            absolute inset-0 rounded-2xl transition-all duration-500
            ${active
              ? `bg-gradient-to-r from-indigo-600/70 via-purple-600/70 to-pink-500/70 opacity-100`
              : `bg-white/5 opacity-0 group-hover:opacity-60`
            }
          `}
        />

        {/* Soft inner glowing border */}
        <span
          className={`
            absolute inset-0 rounded-2xl pointer-events-none
            transition-all duration-500
            ${active ? "ring-2 ring-indigo-400/50" : "group-hover:ring-1 group-hover:ring-indigo-300/40"}
          `}
        />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {'icon' in item && item.icon && <item.icon className="h-5 w-5 opacity-80 group-hover:opacity-100" />}
          {item.name}
        </span>
      </Link>
    );
  })}
</nav>


                <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-orange-400 text-gray-950">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{session?.user?.name}</p>
                      <p className="text-xs text-slate-300">{session?.user?.email}</p>
                      {/* Display account type in mobile menu */}
                      <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                        <p className="text-xs font-semibold capitalize text-white">
                          {session?.user?.accountType || 'free'}
                        </p>
                      </div>
                    </div>
                  </div>
                
                  {/* Upgrade Account Button */}
                  <div className="flex justify-center">
                    <Link
                      href="/pricing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-orange-400/20 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.01] hover:shadow-indigo-500/40 w-full max-w-[200px]"
                    >
                      <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-orange-400/40 opacity-0 transition-opacity duration-1000 hover:opacity-100" />
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <SparklesIcon className="h-5 w-5 animate-pulse" />
                        <span>Upgrade Account</span>
                      </div>
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      setIsUtilityPanelOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    <Cog6ToothIcon className="h-5 w-5 text-indigo-300" />
                    Open Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsPasswordModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    <KeyIcon className="h-5 w-5 text-indigo-300" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isSigningOut}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left font-semibold text-rose-300 transition hover:border-rose-400/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSigningOut ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-transparent"></div>
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        <span>Sign out</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-2xl border border-white/10 px-4 py-3 text-center text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-3 text-center text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isUtilityPanelOpen}
        onClose={() => setIsUtilityPanelOpen(false)}
        className="fixed inset-0 z-50"
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-hidden border-l border-white/10 bg-[#050915]/95 text-white shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Control Center</p>
              <h3 className="text-lg font-semibold text-white">Workspace</h3>
            </div>
            <button
              onClick={() => setIsUtilityPanelOpen(false)}
              className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              aria-label="Close quick panel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Signed in</p>
              <p className="mt-2 text-lg font-semibold">{session?.user?.name || 'Member'}</p>
              <p className="text-sm text-slate-300">{session?.user?.email || 'No email'}</p>
              {/* Display account type */}
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Account Type</p>
                <p className="mt-1 font-semibold capitalize text-white">
                  {session?.user?.accountType || 'free'}
                </p>
                {session?.user?.accountType === 'free' && (
                  <p className="mt-1 text-xs text-slate-400">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>

              {/* Upgrade Account Button */}
              <div className="flex justify-center mt-4">
                <Link
                  href="/pricing"
                  onClick={() => setIsUtilityPanelOpen(false)}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-orange-400/20 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] hover:shadow-indigo-500/40 w-full max-w-[200px]"
                >
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-orange-400/40 opacity-0 transition-opacity duration-1000 hover:opacity-100" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <SparklesIcon className="h-5 w-5 animate-pulse" />
                    <span>Upgrade Account</span>
                  </div>
                </Link>
              </div>
            </div>

            <nav className="space-y-3">
              <Link
                href="/settings"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <Cog6ToothIcon className="h-5 w-5 text-indigo-300" />
                  Settings
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

       

              <Link
                href="/terms"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-300" />
                  Terms & Conditions
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/privacy"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-300" />
                  Privacy Policy
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/cancellation-refund"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-300" />
                  Cancellation & Refund
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/shipping"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-300" />
                  Shipping Policy
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/contact"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-300" />
                  Contact Us
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>

              <a
                href="https://buymeacoffee.com/krishnanaths"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <GiftIcon className="h-5 w-5 text-indigo-300" />
                  Donate
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>

              <a
                href="mailto:nath93266@gmail.com?subject=Bug%20Report%20-%20AnyTimeRequest"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <BugAntIcon className="h-5 w-5 text-indigo-300" />
                  Report a bug
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>

              <a
                href="https://krishnanaths.deno.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <CodeBracketSquareIcon className="h-5 w-5 text-indigo-300" />
                  Developer
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
{/* 
              <div className="rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-200">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-indigo-200">
                  <Squares2X2Icon className="h-4 w-4" />
                  Other tools
                </div>
                <div className="mt-4 space-y-3">
                  <a
                    href="https://kncopypaste.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/5 px-3 py-2 text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                    onClick={() => setIsUtilityPanelOpen(false)}
                  >
                    <span>Copy Cat</span>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                  <a
                    href="https://knnote.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/5 px-3 py-2 text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                    onClick={() => setIsUtilityPanelOpen(false)}
                  >
                    <span>Todo</span>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <a
                href="https://fmc.deno.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                onClick={() => setIsUtilityPanelOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <SparklesIcon className="h-5 w-5 text-indigo-300" />
                  Join AnyTimeRequest community
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a> */}

              <button
                onClick={() => {
                  handleSignOut();
                  setIsUtilityPanelOpen(false);
                }}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-transparent"></div>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </nav>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="fixed inset-0 bg-black/70 backdrop-blur" aria-hidden="true" />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#050915]/95 p-6 text-white shadow-2xl shadow-black/70 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Security</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Change Password</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Current Password</label>
                <div className="relative mt-2">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
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
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">New Password</label>
                <div className="relative mt-2">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
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
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Confirm New Password</label>
                <div className="relative mt-2">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
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
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </>
  );
}
