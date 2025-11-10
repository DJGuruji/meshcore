'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieConsentProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
    onReject();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#050915]/95 p-6 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="mt-4 text-2xl font-bold">We Value Your Privacy</h2>
          
          <div className="mt-4 text-slate-300">
            <p className="mb-4">
              This website uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              By clicking "Accept All Cookies", you consent to our use of cookies in accordance with our{' '}
              <Link href="/privacy" className="text-indigo-300 hover:text-white underline">
                Privacy Policy
              </Link>.
            </p>
            
            <p className="text-sm">
              Cookies help us provide you with a better experience and allow us to understand how visitors interact with our website. 
              You can choose to reject cookies, but this may limit your ability to use certain features of our site.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleAccept}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
            >
              Accept All Cookies
            </button>
            
            <button
              onClick={handleReject}
              className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Reject Non-Essential Cookies
            </button>
          </div>
          
          <div className="mt-6 text-xs text-slate-400">
            <p>
              By using our website, you agree to our{' '}
              <Link href="/terms" className="text-indigo-300 hover:text-white underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-indigo-300 hover:text-white underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}