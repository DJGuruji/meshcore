'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieSettings({ isOpen, onClose, onAccept, onReject }: CookieSettingsProps) {
  const [necessaryCookies, setNecessaryCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [marketingCookies, setMarketingCookies] = useState(false);

  useEffect(() => {
    // Load existing preferences
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
      setAnalyticsCookies(true);
      setMarketingCookies(true);
    } else if (consent === 'rejected') {
      setAnalyticsCookies(false);
      setMarketingCookies(false);
    }
  }, []);

  const handleAcceptAll = () => {
    setAnalyticsCookies(true);
    setMarketingCookies(true);
    localStorage.setItem('cookieConsent', 'accepted');
    onAccept();
    onClose();
  };

  const handleRejectAll = () => {
    setAnalyticsCookies(false);
    setMarketingCookies(false);
    localStorage.setItem('cookieConsent', 'rejected');
    onReject();
    onClose();
  };

  const handleSavePreferences = () => {
    if (analyticsCookies || marketingCookies) {
      localStorage.setItem('cookieConsent', 'accepted');
      onAccept();
    } else {
      localStorage.setItem('cookieConsent', 'rejected');
      onReject();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#050915]/95 p-6 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-semibold">Cookie Settings</h3>
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold text-white">About Cookies</h4>
              <p className="mt-2 text-sm text-slate-300">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                You can choose which cookies to allow below.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="necessary"
                    name="necessary"
                    type="checkbox"
                    checked={necessaryCookies}
                    disabled
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="necessary" className="font-medium text-white">
                    Necessary Cookies
                  </label>
                  <p className="mt-1 text-slate-400">
                    These cookies are essential for the website to function properly. They cannot be disabled.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="analytics"
                    name="analytics"
                    type="checkbox"
                    checked={analyticsCookies}
                    onChange={(e) => setAnalyticsCookies(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="analytics" className="font-medium text-white">
                    Analytics Cookies
                  </label>
                  <p className="mt-1 text-slate-400">
                    These cookies help us understand how visitors interact with our website and improve our services.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="marketing"
                    name="marketing"
                    type="checkbox"
                    checked={marketingCookies}
                    onChange={(e) => setMarketingCookies(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="marketing" className="font-medium text-white">
                    Marketing Cookies
                  </label>
                  <p className="mt-1 text-slate-400">
                    These cookies are used to deliver personalized advertisements and marketing content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleRejectAll}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
            >
              Accept All
            </button>
            <button
              onClick={handleSavePreferences}
              className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400/60 hover:text-white"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}