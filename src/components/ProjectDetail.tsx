'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import { defaultJsonTemplates, generateRandomJson } from '@/lib/jsonGenerator';
import { generateEndpointUrl } from '@/lib/urlUtils';
import { generateReadableToken, formatAuthHeader } from '@/lib/tokenUtils';
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
  endpoints: Endpoint[];
  user: string;
  createdAt: string;
}

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseBody: string;
  statusCode: number;
  description?: string;
  requiresAuth?: boolean | null;
}

interface ProjectDetailProps {
  project: ApiProject;
  onUpdateProject: (project: ApiProject) => void;
}

export default function ProjectDetail({ project, onUpdateProject }: ProjectDetailProps) {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    path: '',
    method: 'GET' as const,
    responseBody: '{"message": "Hello World"}',
    statusCode: 200,
    description: '',
    requiresAuth: null as boolean | null
  });

  // Helper function to ensure endpoint has requiresAuth property
  const ensureEndpointAuth = (endpoint: any) => ({
    ...endpoint,
    requiresAuth: endpoint.requiresAuth !== undefined ? endpoint.requiresAuth : null
  });

  const handleAddEndpoint = () => {
    if (!newEndpoint.path.trim()) return;

    const cleanPath = newEndpoint.path.startsWith('/') ? newEndpoint.path : `/${newEndpoint.path}`;
    
    // Check for duplicate endpoint (same method + path)
    const isDuplicate = project.endpoints.some(ep => 
      ep.method === newEndpoint.method && ep.path === cleanPath
    );
    
    if (isDuplicate) {
      alert(`Endpoint ${newEndpoint.method} ${cleanPath} already exists in this project!`);
      return;
    }

    const endpoint = {
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID with prefix
      ...newEndpoint,
      path: cleanPath
    };

    const updatedProject = {
      ...project,
      endpoints: [...project.endpoints, endpoint]
    };

    onUpdateProject(updatedProject);
    
    // Reset form
    setNewEndpoint({
      path: '',
      method: 'GET',
      responseBody: '{"message": "Hello World"}',
      statusCode: 200,
      description: '',
      requiresAuth: null
    });
    setShowAddEndpoint(false);
  };

  const handleUpdateEndpoint = (endpointId: string, updates: Partial<Endpoint>) => {
    // If updating path or method, check for duplicates
    if (updates.path || updates.method) {
      const currentEndpoint = project.endpoints.find(ep => ep._id === endpointId);
      if (currentEndpoint) {
        const newPath = updates.path || currentEndpoint.path;
        const newMethod = updates.method || currentEndpoint.method;
        
        // Check if this would create a duplicate (excluding the current endpoint)
        const isDuplicate = project.endpoints.some(ep => 
          ep._id !== endpointId && ep.method === newMethod && ep.path === newPath
        );
        
        if (isDuplicate) {
          alert(`Endpoint ${newMethod} ${newPath} already exists in this project!`);
          return;
        }
      }
    }

    const updatedProject = {
      ...project,
      endpoints: project.endpoints.map(ep => 
        ep._id === endpointId ? { ...ep, ...updates } : ep
      )
    };
    onUpdateProject(updatedProject);
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    const endpoint = project.endpoints.find(ep => ep._id === endpointId);
    const endpointName = endpoint ? `${endpoint.method} ${endpoint.path}` : 'this endpoint';
    
    if (window.confirm(`Are you sure you want to delete ${endpointName}? This action cannot be undone.`)) {
      const updatedProject = {
        ...project,
        endpoints: project.endpoints.filter(ep => ep._id !== endpointId)
      };
      onUpdateProject(updatedProject);
    }
  };

  const copyEndpointUrl = (endpoint: Endpoint) => {
    const fullUrl = generateEndpointUrl(project.name, project.baseUrl, endpoint.path);
    navigator.clipboard.writeText(fullUrl);
  };

  const testEndpoint = async (endpoint: Endpoint) => {
    const fullUrl = generateEndpointUrl(project.name, project.baseUrl, endpoint.path);
    
    // Check if authentication is required for this endpoint
    const requiresAuth = endpoint.requiresAuth !== null ? endpoint.requiresAuth : project.authentication?.enabled;
    
    const headers: Record<string, string> = {};
    
    if (requiresAuth && project.authentication?.token) {
      const headerName = project.authentication.headerName || 'Authorization';
      const tokenPrefix = project.authentication.tokenPrefix || 'Bearer';
      headers[headerName] = formatAuthHeader(project.authentication.token, tokenPrefix);
    }
    
    try {
      const response = await fetch(fullUrl, { 
        method: endpoint.method,
        headers 
      });
      const data = await response.text();
      
      let message = `Response (${response.status}):\n${data}`;
      if (requiresAuth) {
        message = `🔒 Authenticated Request\n${message}`;
      }
      
      alert(message);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const generateJsonFromTemplate = (templateName: string) => {
    const template = defaultJsonTemplates.find(t => t.name === templateName);
    if (template) {
      return generateRandomJson(template);
    }
    return '{"message": "Hello World"}';
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">{project.name}</h1>
            <p className="text-slate-400 mt-1">Base URL: {project.baseUrl}</p>
            {project.authentication?.enabled && (
              <div className="flex items-center mt-2 text-sm">
                <span className="flex items-center px-2 py-1 bg-green-900 text-green-300 rounded text-xs mr-3">
                  🔒 Authentication Enabled
                </span>
                <span className="text-slate-400">
                  Token: {showToken ? project.authentication.token : '••••••••••••'}
                </span>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="ml-2 p-1 text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  {showToken ? (
                    <EyeSlashIcon className="h-3 w-3" />
                  ) : (
                    <EyeIcon className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddEndpoint(!showAddEndpoint)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Endpoint</span>
            </button>
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-yellow-400">Authentication Settings</h3>
              <p className="text-xs text-slate-400 mt-1">
                Current state: <span className={`font-bold ${project.authentication?.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {project.authentication?.enabled ? '✅ ENABLED' : '❌ DISABLED'}
                </span>
                {project.authentication?.token && ` | Token: ${project.authentication.token.substring(0, 8)}...`}
                <button
                  onClick={() => {
                    console.log('Current project state:', project);
                    console.log('Authentication object:', project.authentication);
                    console.log('Authentication enabled:', project.authentication?.enabled);
                  }}
                  className="ml-2 px-1 py-0.5 bg-gray-600 text-white text-xs rounded"
                >
                  Debug
                </button>
                <button
                  onClick={() => {
                    console.log('Manual toggle test - current enabled:', project.authentication?.enabled);
                    const testProject = {
                      ...project,
                      authentication: {
                        ...project.authentication,
                        enabled: !project.authentication?.enabled,
                        token: project.authentication?.token || 'test-token-123',
                        headerName: 'Authorization',
                        tokenPrefix: 'Bearer'
                      }
                    };
                    console.log('Manual toggle test - sending:', testProject.authentication);
                    onUpdateProject(testProject);
                  }}
                  className="ml-2 px-1 py-0.5 bg-blue-600 text-white text-xs rounded"
                >
                  Manual Toggle
                </button>
              </p>
            </div>
            <div className="flex items-center space-x-3">
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
                    console.log('Initializing authentication for project:', updatedProject);
                    onUpdateProject(updatedProject);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                  Initialize Auth
                </button>
              )}
              <span className="text-slate-300 font-medium">Enable Authentication</span>
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
                  console.log('Toggling auth from', currentAuth.enabled, 'to', newEnabled);
                  
                  // Always generate a new token when enabling authentication
                  const newToken = newEnabled ? generateReadableToken() : (currentAuth.token || generateReadableToken());
                  console.log('Generated token:', newToken);
                  
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
                  console.log('Updated project:', updatedProject);
                  onUpdateProject(updatedProject);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                  project.authentication?.enabled 
                    ? 'bg-yellow-600' 
                    : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    project.authentication?.enabled 
                      ? 'translate-x-6' 
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {project.authentication?.enabled && (
            <div className="space-y-4">
              {/* Token Display */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">API Token</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showToken ? "text" : "password"}
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
                      className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Enter token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-yellow-400 transition-colors"
                    >
                      {showToken ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const newToken = generateReadableToken();
                      console.log('Manually generating new token:', newToken);
                      const updatedProject = {
                        ...project,
                        authentication: {
                          enabled: project.authentication?.enabled || false,
                          token: newToken,
                          headerName: project.authentication?.headerName || 'Authorization',
                          tokenPrefix: project.authentication?.tokenPrefix || 'Bearer'
                        }
                      };
                      console.log('Updating with new token:', updatedProject);
                      onUpdateProject(updatedProject);
                    }}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors text-sm font-medium"
                  >
                    Generate New
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(project.authentication?.token || '');
                      toast.success('Token copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Header Name</label>
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Token Prefix</label>
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

          
            </div>
          )}
        </div>

        {/* Add Endpoint Form */}
        {showAddEndpoint && (
          <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Path</label>
                <input
                  type="text"
                  placeholder="/users"
                  value={newEndpoint.path}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, path: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Method</label>
                <select
                  value={newEndpoint.method}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, method: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status Code</label>
                <input
                  type="number"
                  value={newEndpoint.statusCode}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, statusCode: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Generate JSON</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewEndpoint({ ...newEndpoint, responseBody: generateJsonFromTemplate(e.target.value) });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Select template...</option>
                  {defaultJsonTemplates.map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
              <input
                type="text"
                placeholder="Endpoint description"
                value={newEndpoint.description}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Authentication</label>
              <select
                value={newEndpoint.requiresAuth === null ? 'inherit' : newEndpoint.requiresAuth ? 'required' : 'none'}
                onChange={(e) => {
                  console.log('Auth dropdown changed to:', e.target.value);
                  const value = e.target.value === 'inherit' ? null : e.target.value === 'required';
                  console.log('Setting requiresAuth to:', value);
                  setNewEndpoint({ ...newEndpoint, requiresAuth: value });
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="inherit">Inherit from project ({project.authentication?.enabled ? 'Enabled' : 'Disabled'})</option>
                <option value="required">Always require authentication</option>
                <option value="none">No authentication required</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Response Body (JSON)</label>
              <textarea
                value={newEndpoint.responseBody}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, responseBody: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder='{"message": "Hello World"}'
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddEndpoint}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors font-medium"
              >
                Add Endpoint
              </button>
              <button
                onClick={() => setShowAddEndpoint(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto p-6">
        {project.endpoints.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <PlayIcon className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No endpoints yet</h3>
            <p className="text-slate-400">Add your first API endpoint to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {project.endpoints.map((endpoint) => (
              <div key={endpoint._id} className="bg-slate-900 border border-slate-700 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => setExpandedEndpoint(
                    expandedEndpoint === endpoint._id ? null : endpoint._id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {expandedEndpoint === endpoint._id ? (
                          <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                        )}
                        <span className={`px-3 py-1 rounded text-sm font-mono font-medium ${
                          endpoint.method === 'GET' ? 'bg-green-900 text-green-300' :
                          endpoint.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                          endpoint.method === 'PUT' ? 'bg-orange-900 text-orange-300' :
                          endpoint.method === 'PATCH' ? 'bg-purple-900 text-purple-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {endpoint.method}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono text-white">{project.baseUrl}{endpoint.path}</div>
                        {endpoint.description && (
                          <div className="text-sm text-slate-400 mt-1">{endpoint.description}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">{endpoint.statusCode}</span>
                      {/* Authentication indicator */}
                      {(() => {
                        // Use helper to ensure endpoint has requiresAuth property
                        const safeEndpoint = ensureEndpointAuth(endpoint);
                        const authEnabled = project.authentication?.enabled || false;
                        const endpointAuth = safeEndpoint.requiresAuth;
                        const requiresAuth = endpointAuth !== null ? endpointAuth : authEnabled;
                        
                        console.log('Endpoint auth check:', {
                          endpointId: endpoint._id,
                          endpointRequiresAuth: safeEndpoint.requiresAuth,
                          projectAuthEnabled: project.authentication?.enabled,
                          projectAuthObject: project.authentication,
                          finalRequiresAuth: requiresAuth
                        });
                        
                        if (requiresAuth) {
                          return (
                            <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded" title="Authentication required">
                              🔒 Auth
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded" title="No authentication required">
                              🔓 No Auth
                            </span>
                          );
                        }
                      })()}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testEndpoint(endpoint);
                        }}
                        className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                        title="Test endpoint"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyEndpointUrl(endpoint);
                        }}
                        className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                        title="Copy URL"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEndpoint(endpoint._id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete endpoint"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded endpoint details */}
                {expandedEndpoint === endpoint._id && (
                  <div className="border-t border-slate-700 p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Endpoint Configuration</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Path</label>
                            <input
                              type="text"
                              value={endpoint.path}
                              onChange={(e) => handleUpdateEndpoint(endpoint._id, { path: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Method</label>
                              <select
                                value={endpoint.method}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, { method: e.target.value as any })}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Status Code</label>
                              <input
                                type="number"
                                value={endpoint.statusCode}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, { statusCode: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={endpoint.description || ''}
                              onChange={(e) => handleUpdateEndpoint(endpoint._id, { description: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                              placeholder="Optional description"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Authentication</label>
                            <select
                              value={endpoint.requiresAuth === null ? 'inherit' : endpoint.requiresAuth ? 'required' : 'none'}
                              onChange={(e) => {
                                const value = e.target.value === 'inherit' ? null : e.target.value === 'required';
                                handleUpdateEndpoint(endpoint._id, { requiresAuth: value });
                              }}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            >
                              <option value="inherit">Inherit ({project.authentication?.enabled ? 'Enabled' : 'Disabled'})</option>
                              <option value="required">Always require</option>
                              <option value="none">No auth required</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-300">Response Body</h4>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleUpdateEndpoint(endpoint._id, { 
                                  responseBody: generateJsonFromTemplate(e.target.value) 
                                });
                              }
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          >
                            <option value="">Generate JSON...</option>
                            {defaultJsonTemplates.map((template) => (
                              <option key={template.name} value={template.name}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={endpoint.responseBody}
                          onChange={(e) => handleUpdateEndpoint(endpoint._id, { responseBody: e.target.value })}
                          rows={8}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
