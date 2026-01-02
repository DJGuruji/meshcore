'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon';
import LockClosedIcon from '@heroicons/react/24/outline/LockClosedIcon';
import LightBulbIcon from '@heroicons/react/24/outline/LightBulbIcon';
import { toast } from 'react-hot-toast';

interface ApiProject {
  _id: string;
  name: string;
  baseUrl: string;
  emailConfig?: {
    enabled: boolean;
    email?: string;
    appPassword?: string;
  };
  endpoints: any[];
  user: string;
  createdAt: string;
}

interface EmailSettingsProps {
  project: ApiProject;
  onUpdateProject: (project: ApiProject) => void;
  accountType?: string;
}
export default function EmailSettings({ 
  project, 
  onUpdateProject,
  accountType = 'free'
}: EmailSettingsProps) {
  // Helper function to check if email settings are allowed
  const canUseEmailSettings = () => {
    const tier = accountType.toLowerCase();
    return tier !== 'free' && tier !== 'plus';
  };

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(project.emailConfig?.email || '');
  const [appPassword, setAppPassword] = useState(project.emailConfig?.appPassword || '');

  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';
  const inputStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!appPassword.trim()) {
      toast.error('Please enter an app password');
      return;
    }

    try {
      // Only send the emailConfig field, not the entire project
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailConfig: {
            enabled: true,
            email: email.trim(),
            appPassword: appPassword.trim()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save email configuration');
      }

      const updatedProject = await response.json();
      onUpdateProject(updatedProject);
      toast.success('Email configuration saved successfully!');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save email configuration');
      console.error('Email config save error:', error);
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove email configuration?')) {
      try {
        // Only send the emailConfig field
        const response = await fetch(`/api/projects/${project._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailConfig: {
              enabled: false,
              email: '',
              appPassword: ''
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove email configuration');
        }

        const updatedProject = await response.json();
        onUpdateProject(updatedProject);
        setEmail('');
        setAppPassword('');
        toast.success('Email configuration removed');
        setShowModal(false);
      } catch (error) {
        toast.error('Failed to remove email configuration');
        console.error('Email config remove error:', error);
      }
    }
  };

  return (
    <>
      {/* Add Email Button */}
      <div>
        <button
          onClick={() => {
            if (!canUseEmailSettings()) {
              toast.error('Email configuration is only available from Pro accounts');
              return;
            }
            // Load existing values when opening modal
            setEmail(project.emailConfig?.email || '');
            setAppPassword(project.emailConfig?.appPassword || '');
            setShowModal(true);
          }}
          className={`group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 text-sm font-semibold transition-all duration-300 ${
            project.emailConfig?.enabled && project.emailConfig?.email
              ? 'border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 hover:border-emerald-400/50 hover:from-emerald-500/15 hover:to-teal-500/10'
              : 'border-white/10 bg-white/5 hover:border-indigo-400/40 hover:bg-white/10'
          } hover:scale-[1.01] hover:shadow-lg`}
          disabled={!canUseEmailSettings()}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-orange-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center gap-3">
            {/* Icon */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
              project.emailConfig?.enabled && project.emailConfig?.email
                ? 'bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30'
            }`}>
              <EnvelopeIcon className="h-5 w-5" />
            </div>
            
            {/* Text */}
            <div className="flex flex-col items-start">
              <span className={`font-semibold ${
                project.emailConfig?.enabled && project.emailConfig?.email
                  ? 'text-emerald-200'
                  : 'text-white'
              }`}>
                {project.emailConfig?.enabled && project.emailConfig?.email 
                  ? 'Email Configuration' 
                  : canUseEmailSettings() ? 'Add Email' : 'Email (Upgrade Account to Pro or above)'}
              </span>
              {project.emailConfig?.enabled && project.emailConfig?.email && (
                <span className="text-xs text-emerald-300/70">
                  {project.emailConfig.email}
                </span>
              )}
              {!canUseEmailSettings() && (
                <span className="text-xs text-red-300/70">
                 Upgrade to Pro or above
                </span>
              )}
            </div>
          </div>
          
          {/* Status badge */}
          <div className="relative">
            {project.emailConfig?.enabled && project.emailConfig?.email ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Configured
              </span>
            ) : !canUseEmailSettings() ? (
              <span className="flex items-center gap-1 text-xs text-red-300 group-hover:text-red-200 transition-colors">
                <LockClosedIcon className="h-3 w-3" />
                Pro Feature
              </span>
            ) : (
              <span className="text-xs text-slate-400 group-hover:text-indigo-300 transition-colors">
                Click to configure →
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#050915] p-6 shadow-[0_25px_80px_rgba(2,6,23,0.9)]">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Email Configuration</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Configure Email Settings</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className={labelStyles}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputStyles}
                  placeholder="your.email@gmail.com"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter the email address you want to use for sending emails
                </p>
              </div>

              {/* App Password Input */}
              <div>
                <label className={labelStyles}>App Password</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      className={`${inputStyles} pr-10 font-mono`}
                      placeholder="Enter app password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white"
                    >
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (appPassword) {
                        navigator.clipboard.writeText(appPassword);
                        toast.success('App password copied to clipboard!');
                      }
                    }}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Generate an app password from your email provider's security settings
                </p>
              </div>

              {/* Help Text */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-xs text-blue-200 flex gap-2">
                  <LightBulbIcon className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>
                    <span className="font-semibold">How to get an App Password:</span>
                    <br />
                    <span className="font-semibold">Gmail:</span> Google Account → Security → 2-Step Verification → App passwords
                    <br />
                    <span className="font-semibold">Outlook:</span> Account Settings → Security → App passwords
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
              >
                Save Configuration
              </button>
              {project.emailConfig?.enabled && project.emailConfig?.email && (
                <button
                  onClick={handleRemove}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
