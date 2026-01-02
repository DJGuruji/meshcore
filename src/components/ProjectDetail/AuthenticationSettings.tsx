'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LockClosedIcon from '@heroicons/react/24/outline/LockClosedIcon';
import LightBulbIcon from '@heroicons/react/24/outline/LightBulbIcon';
import { generateReadableToken } from '@/lib/tokenUtils';
import { toast } from 'react-hot-toast';

interface ApiProject {
  _id: string;
  name: string;
  baseUrl: string;
  authentication?: {
    enabled: boolean;
    token?: string | null;
    headerName?: string;
    tokenPrefix?: string;
  };
  endpoints: any[];
  user: string;
  createdAt: string;
}

interface AuthenticationSettingsProps {
  project: ApiProject;
  onUpdateProject: (project: ApiProject) => void;
  showToken: boolean;
  setShowToken: (show: boolean) => void;
}

// Helper function to ensure endpoint has requiresAuth property
const ensureEndpointAuth = (endpoint: any) => ({
  ...endpoint,
  requiresAuth: endpoint.requiresAuth !== undefined ? endpoint.requiresAuth : null
});

export default function AuthenticationSettings({ 
  project, 
  onUpdateProject, 
  showToken, 
  setShowToken 
}: AuthenticationSettingsProps) {
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState(project.authentication?.enabled || false);
  const [token, setToken] = useState(project.authentication?.token || '');
  const [headerName, setHeaderName] = useState(project.authentication?.headerName || 'Authorization');
  const [tokenPrefix, setTokenPrefix] = useState(project.authentication?.tokenPrefix || 'Bearer');

  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';
  const inputStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';

  const handleSave = async () => {
    if (enabled && !token.trim()) {
      toast.error('Please enter a token or generate one');
      return;
    }

    try {
      // Ensure all endpoints have requiresAuth property
      const updatedEndpoints = project.endpoints.map(ensureEndpointAuth);

      // Only send the authentication field
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authentication: {
            enabled,
            token: enabled ? token.trim() : null,
            headerName: headerName.trim() || 'Authorization',
            tokenPrefix: tokenPrefix.trim() || 'Bearer'
          },
          endpoints: updatedEndpoints
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save authentication settings');
      }

      const updatedProject = await response.json();
      onUpdateProject(updatedProject);
      toast.success('Authentication settings saved successfully!');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save authentication settings');
      console.error('Auth settings save error:', error);
    }
  };

  const handleGenerateToken = () => {
    const newToken = generateReadableToken();
    setToken(newToken);
    toast.success('New token generated!');
  };

  const handleDisable = async () => {
    if (window.confirm('Are you sure you want to disable authentication?')) {
      try {
        const response = await fetch(`/api/projects/${project._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authentication: {
              enabled: false,
              token: null,
              headerName: 'Authorization',
              tokenPrefix: 'Bearer'
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to disable authentication');
        }

        const updatedProject = await response.json();
        onUpdateProject(updatedProject);
        setEnabled(false);
        setToken('');
        toast.success('Authentication disabled');
        setShowModal(false);
      } catch (error) {
        toast.error('Failed to disable authentication');
        console.error('Auth disable error:', error);
      }
    }
  };

  return (
    <>
      {/* Authentication Button */}
      <div>
        <button
          onClick={() => {
            // Load existing values when opening modal
            setEnabled(project.authentication?.enabled || false);
            setToken(project.authentication?.token || '');
            setHeaderName(project.authentication?.headerName || 'Authorization');
            setTokenPrefix(project.authentication?.tokenPrefix || 'Bearer');
            setShowModal(true);
          }}
          className={`group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 text-sm font-semibold transition-all duration-300 ${
            project.authentication?.enabled
              ? 'border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 hover:border-indigo-400/50 hover:from-indigo-500/15 hover:to-purple-500/10'
              : 'border-white/10 bg-white/5 hover:border-indigo-400/40 hover:bg-white/10'
          } hover:scale-[1.01] hover:shadow-lg`}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-orange-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center gap-3">
            {/* Icon */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
              project.authentication?.enabled
                ? 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30'
                : 'bg-slate-500/20 text-slate-300 group-hover:bg-slate-500/30'
            }`}>
              <LockClosedIcon className="h-5 w-5" />
            </div>
            
            {/* Text */}
            <div className="flex flex-col items-start">
              <span className={`font-semibold ${
                project.authentication?.enabled
                  ? 'text-indigo-200'
                  : 'text-white'
              }`}>
                {project.authentication?.enabled 
                  ? 'Authentication Settings' 
                  : 'Add Authentication'}
              </span>
              {project.authentication?.enabled && project.authentication?.token && (
                <span className="text-xs text-indigo-300/70 font-mono">
                  Token: {project.authentication.token.substring(0, 12)}...
                </span>
              )}
            </div>
          </div>
          
          {/* Status badge */}
          <div className="relative">
            {project.authentication?.enabled ? (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Enabled
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
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Security</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Authentication Settings</h3>
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
              {/* Enable Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <span className="text-sm font-semibold text-white">Enable Authentication</span>
                  <p className="mt-0.5 text-xs text-slate-400">Require token for API access</p>
                </div>
                <button
                  onClick={() => {
                    const newEnabled = !enabled;
                    setEnabled(newEnabled);
                    if (newEnabled && !token) {
                      setToken(generateReadableToken());
                    }
                  }}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full border border-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-400/40 ${
                    enabled ? 'bg-gradient-to-r from-indigo-500 to-purple-400' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enabled && (
                <>
                  {/* Token Input */}
                  <div>
                    <label className={labelStyles}>API Token</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className={`${inputStyles} pr-10 font-mono`}
                          placeholder="Enter token"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white"
                        >
                          {showToken ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        onClick={handleGenerateToken}
                        className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(token);
                          toast.success('Token copied to clipboard!');
                        }}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyles}>Header Name</label>
                      <input
                        type="text"
                        value={headerName}
                        onChange={(e) => setHeaderName(e.target.value)}
                        className={inputStyles}
                        placeholder="Authorization"
                      />
                    </div>

                    <div>
                      <label className={labelStyles}>Token Prefix</label>
                      <input
                        type="text"
                        value={tokenPrefix}
                        onChange={(e) => setTokenPrefix(e.target.value)}
                        className={inputStyles}
                        placeholder="Bearer"
                      />
                    </div>
                  </div>

                  {/* Help Text */}
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-200 flex gap-2">
                      <LightBulbIcon className="h-4 w-4 text-blue-400 shrink-0" />
                      <span>
                        <span className="font-semibold">How to use:</span>
                        <br />
                        Include the token in your API requests as: <code className="font-mono text-blue-100">{headerName}: {tokenPrefix} {token.substring(0, 8)}...</code>
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
              >
                Save Settings
              </button>
              {project.authentication?.enabled && (
                <button
                  onClick={handleDisable}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20"
                >
                  Disable
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