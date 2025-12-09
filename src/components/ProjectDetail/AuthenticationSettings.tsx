'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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
  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';
  const inputStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';

  return (
    <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Security</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Authentication Settings</h3>
          <p className="mt-1 text-xs text-slate-300">
            Current state:{' '}
            <span
              className={`font-semibold ${
                project.authentication?.enabled ? 'text-green-300' : 'text-rose-300'
              }`}
            >
              {project.authentication?.enabled ? 'Enabled' : 'Disabled'}
            </span>
            {project.authentication?.token && ` · Token: ${project.authentication.token.substring(0, 8)}…`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!project.authentication && (
            <button
              onClick={() => {
                const updatedProject = {
                  ...project,
                  authentication: {
                    enabled: false,
                    token: null,
                    headerName: 'Authorization',
                    tokenPrefix: 'Bearer'
                  }
                };
                onUpdateProject(updatedProject);
              }}
              className="rounded-2xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Initialize Auth
            </button>
          )}
          <span className="text-xs font-semibold text-slate-300">Enable Authentication</span>
          <button
            onClick={() => {
              // Initialize authentication object if it doesn't exist
              const currentAuth = project.authentication || {
                enabled: false,
                token: null,
                headerName: 'Authorization',
                tokenPrefix: 'Bearer'
              };
              
              const newEnabled = !currentAuth.enabled;
              
              // Always generate a new token when enabling authentication
              const newToken = newEnabled ? generateReadableToken() : (currentAuth.token || generateReadableToken());
              
              // Ensure all endpoints have requiresAuth property
              const updatedEndpoints = project.endpoints.map(ensureEndpointAuth);
              
              const updatedProject = {
                ...project,
                endpoints: updatedEndpoints,
                authentication: {
                  enabled: newEnabled,
                  token: newToken,
                  headerName: currentAuth.headerName || 'Authorization',
                  tokenPrefix: currentAuth.tokenPrefix || 'Bearer'
                }
              };
              onUpdateProject(updatedProject);
            }}
            className={`relative inline-flex h-6 w-12 items-center rounded-full border border-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-400/40 ${
              project.authentication?.enabled ? 'bg-gradient-to-r from-indigo-500 to-orange-400' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                project.authentication?.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {project.authentication?.enabled && (
        <div className="space-y-4">
          {/* Token Display */}
          <div>
            <label className={labelStyles}>API Token</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={project.authentication.token || ''}
                  onChange={(e) => {
                    const updatedProject = {
                      ...project,
                      authentication: {
                        enabled: project.authentication?.enabled || false,
                        token: e.target.value,
                        headerName: project.authentication?.headerName || 'Authorization',
                        tokenPrefix: project.authentication?.tokenPrefix || 'Bearer'
                      }
                    };
                    onUpdateProject(updatedProject);
                  }}
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
                onClick={() => {
                  const newToken = generateReadableToken();
                  const updatedProject = {
                    ...project,
                    authentication: {
                      enabled: project.authentication?.enabled || false,
                      token: newToken,
                      headerName: project.authentication?.headerName || 'Authorization',
                      tokenPrefix: project.authentication?.tokenPrefix || 'Bearer'
                    }
                  };
                  onUpdateProject(updatedProject);
                }}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
              >
                Generate New
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(project.authentication?.token || '');
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
                value={project.authentication.headerName || 'Authorization'}
                onChange={(e) => {
                  const updatedProject = {
                    ...project,
                    authentication: {
                      enabled: project.authentication?.enabled || false,
                      token: project.authentication?.token || '',
                      headerName: e.target.value,
                      tokenPrefix: project.authentication?.tokenPrefix || 'Bearer'
                    }
                  };
                  onUpdateProject(updatedProject);
                }}
                className={inputStyles}
              />
            </div>

            <div>
              <label className={labelStyles}>Token Prefix</label>
              <input
                type="text"
                value={project.authentication.tokenPrefix || 'Bearer'}
                onChange={(e) => {
                  const updatedProject = {
                    ...project,
                    authentication: {
                      enabled: project.authentication?.enabled || false,
                      token: project.authentication?.token || '',
                      headerName: project.authentication?.headerName || 'Authorization',
                      tokenPrefix: e.target.value
                    }
                  };
                  onUpdateProject(updatedProject);
                }}
                className={inputStyles}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};