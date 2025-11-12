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
import { defaultJsonTemplates, generateRandomJson, generateJsonFromFields } from '@/lib/jsonGenerator';
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

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseBody: string;
  statusCode: number;
  description?: string;
  requiresAuth?: boolean | null;
  fields?: EndpointField[]; // Add this for POST endpoint field definitions
  // New properties for GET endpoints to reference POST data
  dataSource?: string; // ID of the POST endpoint to get data from
  conditions?: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string | number | boolean;
  }[];
  // Pagination settings
  pagination?: {
    enabled: boolean;
    defaultLimit: number;
    maxLimit: number;
  };
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
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    responseBody: '{"message": "Hello World"}',
    statusCode: 200,
    description: '',
    requiresAuth: null as boolean | null,
    fields: [] as EndpointField[],
    dataSource: '',
    conditions: [] as {
      field: string;
      operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
      value: string | number | boolean;
    }[],
    // Pagination settings
    pagination: {
      enabled: false,
      defaultLimit: 10,
      maxLimit: 100
    }
  });

  // Add state for new field in the form
  const [newField, setNewField] = useState({
    name: '',
    type: 'string' as const,
    required: false,
    description: ''
  });

  // Add state for new condition
  const [newCondition, setNewCondition] = useState({
    field: '',
    operator: '=' as '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: ''
  });

  // Add state for editing conditions
  const [editingConditions, setEditingConditions] = useState<{[key: string]: any[]}>({});
  const [newEditCondition, setNewEditCondition] = useState({
    field: '',
    operator: '=' as '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: ''
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

    // For POST endpoints, validate that required fields are defined if any fields exist
    if (newEndpoint.method === 'POST' && newEndpoint.fields && newEndpoint.fields.length > 0) {
      const requiredFields = newEndpoint.fields.filter(field => field.required);
      if (requiredFields.length > 0) {
        // We'll validate request body when the endpoint is actually used
        console.log('POST endpoint with required fields defined:', requiredFields);
      }
    }

    // Create endpoint object, excluding dataSource if it's empty
    const endpoint: any = {
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID with prefix
      ...newEndpoint,
      path: cleanPath
    };

    // Remove dataSource if it's empty
    if (endpoint.dataSource === '') {
      delete endpoint.dataSource;
    }

    const updatedProject = {
      ...project,
      endpoints: [...project.endpoints, endpoint]
    };

    onUpdateProject(updatedProject);
    
    // Reset form
    setNewEndpoint({
      path: '',
      method: 'GET' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      responseBody: '{"message": "Hello World"}',
      statusCode: 200,
      description: '',
      requiresAuth: null as boolean | null,
      fields: [] as EndpointField[],
      dataSource: '',
      conditions: [],
      // Pagination settings
      pagination: {
        enabled: false,
        defaultLimit: 10,
        maxLimit: 100
      }
    });
    
    // Reset field form
    setNewField({
      name: '',
      type: 'string',
      required: false,
      description: ''
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

    // Remove dataSource if it's empty
    const cleanUpdates: any = { ...updates };
    if (cleanUpdates.dataSource === '') {
      delete cleanUpdates.dataSource;
    }

    const updatedProject = {
      ...project,
      endpoints: project.endpoints.map(ep => 
        ep._id === endpointId ? { ...ep, ...cleanUpdates } : ep
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
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (requiresAuth && project.authentication?.token) {
      const headerName = project.authentication.headerName || 'Authorization';
      const tokenPrefix = project.authentication.tokenPrefix || 'Bearer';
      headers[headerName] = formatAuthHeader(project.authentication.token, tokenPrefix);
    }
    
    try {
      // For POST, PUT, PATCH endpoints with defined fields, we can show a form to test
      let body = undefined;
      if ((endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') && endpoint.fields && endpoint.fields.length > 0) {
        // Show a prompt to let user enter data for testing
        const userResponse = prompt(`Enter JSON data for ${endpoint.method} request (or leave empty for sample data):`, '');
        
        if (userResponse !== null) {
          if (userResponse.trim() === '') {
            // Create sample data with all fields
            const requestBody: any = {};
            endpoint.fields.forEach(field => {
              switch (field.type) {
                case 'string':
                  requestBody[field.name] = field.name === 'email' ? 'test@example.com' : `sample ${field.name}`;
                  break;
                case 'number':
                  requestBody[field.name] = field.name === 'id' ? 1 : field.name === 'age' ? 25 : 0;
                  break;
                case 'boolean':
                  requestBody[field.name] = true;
                  break;
                case 'object':
                  requestBody[field.name] = {};
                  break;
                case 'array':
                  requestBody[field.name] = [];
                  break;
                default:
                  requestBody[field.name] = `sample ${field.name}`;
              }
            });
            body = JSON.stringify(requestBody);
          } else {
            // Use user-provided data
            body = userResponse;
          }
        } else {
          // User cancelled
          return;
        }
      }
      
      const response = await fetch(fullUrl, { 
        method: endpoint.method,
        headers,
        body: body ? body : undefined
      });
      
      // Get response details
      const responseText = await response.text();
      const contentType = response.headers.get('content-type');
      let responseData;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = JSON.parse(responseText);
        } else {
          responseData = responseText;
        }
      } catch {
        responseData = responseText;
      }
      
      let message = `Response (${response.status}):\n${JSON.stringify(responseData, null, 2)}`;
      if (requiresAuth) {
        message = `🔒 Authenticated Request\n${message}`;
      }
      
      // Show alert with response details
      alert(message);
      
      // Also log to console for debugging
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      });
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  // Function to validate POST request body against defined fields
  const validatePostRequestBody = (endpoint: Endpoint, requestBody: any): { isValid: boolean; errors: string[] } => {
    // Only validate POST endpoints with defined fields
    if (endpoint.method !== 'POST' || !endpoint.fields || endpoint.fields.length === 0) {
      return { isValid: true, errors: [] };
    }
    
    const errors: string[] = [];
    const requiredFields = endpoint.fields.filter(field => field.required);
    
    // Check if all required fields are present
    for (const field of requiredFields) {
      if (!(field.name in requestBody)) {
        errors.push(`Required field '${field.name}' is missing`);
      } else if (requestBody[field.name] === null || requestBody[field.name] === undefined || requestBody[field.name] === '') {
        errors.push(`Required field '${field.name}' cannot be null or empty`);
      }
    }
    
    // Check field types if present
    for (const field of endpoint.fields) {
      if (field.name in requestBody && requestBody[field.name] !== null && requestBody[field.name] !== undefined) {
        const value = requestBody[field.name];
        switch (field.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`Field '${field.name}' should be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number') {
              errors.push(`Field '${field.name}' should be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Field '${field.name}' should be a boolean`);
            }
            break;
          case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
              errors.push(`Field '${field.name}' should be an object`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`Field '${field.name}' should be an array`);
            }
            break;
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const generateJsonFromTemplate = (templateName: string) => {
    const template = defaultJsonTemplates.find(t => t.name === templateName);
    if (template) {
      return generateRandomJson(template);
    }
    return '{"message": "Hello World"}';
  };

  const handleAddField = () => {
    if (!newField.name.trim()) {
      alert('Field name is required');
      return;
    }

    // Check for duplicate field name
    if (newEndpoint.fields.some(field => field.name === newField.name)) {
      alert(`Field "${newField.name}" already exists`);
      return;
    }

    const updatedFields = [...newEndpoint.fields, { ...newField }];
    setNewEndpoint({ ...newEndpoint, fields: updatedFields });
    
    // Reset field form
    setNewField({
      name: '',
      type: 'string',
      required: false,
      description: ''
    });
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = [...newEndpoint.fields];
    updatedFields.splice(index, 1);
    setNewEndpoint({ ...newEndpoint, fields: updatedFields });
  };

  const handleAddCondition = () => {
    // Validate condition
    if (!newCondition.field.trim()) {
      alert('Field name is required for condition');
      return;
    }

    const updatedConditions = [...newEndpoint.conditions, { ...newCondition }];
    setNewEndpoint({ ...newEndpoint, conditions: updatedConditions });
    
    // Reset condition form
    setNewCondition({
      field: '',
      operator: '=',
      value: ''
    });
  };

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = [...newEndpoint.conditions];
    updatedConditions.splice(index, 1);
    setNewEndpoint({ ...newEndpoint, conditions: updatedConditions });
  };

  // Functions for editing conditions
  const handleAddEditCondition = (endpointId: string) => {
    // Validate condition
    if (!newEditCondition.field.trim()) {
      alert('Field name is required for condition');
      return;
    }

    const currentConditions = editingConditions[endpointId] || [];
    const updatedConditions = [...currentConditions, { ...newEditCondition }];
    
    setEditingConditions({
      ...editingConditions,
      [endpointId]: updatedConditions
    });
    
    // Reset condition form
    setNewEditCondition({
      field: '',
      operator: '=',
      value: ''
    });
  };

  const handleRemoveEditCondition = (endpointId: string, index: number) => {
    const currentConditions = editingConditions[endpointId] || [];
    const updatedConditions = [...currentConditions];
    updatedConditions.splice(index, 1);
    
    setEditingConditions({
      ...editingConditions,
      [endpointId]: updatedConditions
    });
  };

  const handleSaveConditions = (endpointId: string) => {
    const conditions = editingConditions[endpointId] || [];
    handleUpdateEndpoint(endpointId, { conditions });
    
    // Clear editing state for this endpoint
    const newEditingConditions = { ...editingConditions };
    delete newEditingConditions[endpointId];
    setEditingConditions(newEditingConditions);
  };

  const handleCancelEditConditions = (endpointId: string) => {
    // Clear editing state for this endpoint
    const newEditingConditions = { ...editingConditions };
    delete newEditingConditions[endpointId];
    setEditingConditions(newEditingConditions);
  };

  const generateResponseBodyWithFields = () => {
    return generateJsonFromFields(newEndpoint.fields);
  };

  const inputStyles =
    'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const textareaStyles =
    'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const optionStyles = 'text-slate-900';
  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';
  const sectionCardStyles = 'rounded-[28px] border border-white/10 bg-white/5 p-5';

  return (
    <div className="relative flex h-full flex-col bg-[#050915]/80 text-white shadow-[0_25px_80px_rgba(2,6,23,0.75)] backdrop-blur-2xl">
      {/* Header */}
      <div className="border-b border-white/5 bg-white/5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{project.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
              Base URL:
              <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-white">{project.baseUrl}</span>
            </p>
            {project.authentication?.enabled && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-200">🔒 Auth enabled</span>
                <span className="font-mono">
                  Token: {showToken ? project.authentication.token : '••••••••••••'}
                </span>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="rounded-full border border-white/10 px-2 py-1 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                >
                  {showToken ? <EyeSlashIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddEndpoint(!showAddEndpoint)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Endpoint</span>
            </button>
          </div>
        </div>

        {/* Authentication Settings */}
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
                    console.log('Initializing authentication for project:', updatedProject);
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

        {/* Add Endpoint Form */}
        {showAddEndpoint && (
          <div className="mt-4 p-4 rounded-[28px] border border-white/10 bg-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Path</label>
                <input
                  type="text"
                  placeholder="/users"
                  value={newEndpoint.path}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, path: e.target.value })}
                  className={inputStyles}
                />
                {(newEndpoint.method === 'PUT' || newEndpoint.method === 'PATCH' || newEndpoint.method === 'DELETE') && (
                  <p className="mt-1 text-xs text-slate-400">
                    Note: Path will automatically include '/:id' parameter for identifying resources
                  </p>
                )}
              </div>
              <div>
                <label className={labelStyles}>Method</label>
                <select
                  value={newEndpoint.method}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, method: e.target.value as any })}
                  className={inputStyles}
                >
                  <option className={optionStyles} value="GET">GET</option>
                  <option className={optionStyles} value="POST">POST</option>
                  <option className={optionStyles} value="PUT">PUT</option>
                  <option className={optionStyles} value="PATCH">PATCH</option>
                  <option className={optionStyles} value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Status Code</label>
                <input
                  type="number"
                  value={newEndpoint.statusCode}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, statusCode: parseInt(e.target.value) })}
                  className={inputStyles}
                />
              </div>
              {/* Show Generate JSON option only for GET methods */}
              {newEndpoint.method === 'GET' && (
                <div>
                  <label className={labelStyles}>Generate JSON</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value === 'fields') {
                        // Generate from defined fields
                        setNewEndpoint({ 
                          ...newEndpoint, 
                          responseBody: generateResponseBodyWithFields()
                        });
                      } else if (e.target.value) {
                        setNewEndpoint({ 
                          ...newEndpoint, 
                          responseBody: generateJsonFromTemplate(e.target.value) 
                        });
                      }
                    }}
                    className={inputStyles}
                  >
                    <option className={optionStyles} value="">Select template...</option>
                    {newEndpoint.fields && newEndpoint.fields.length > 0 && (
                      <option className={optionStyles} value="fields">Generate from defined fields</option>
                    )}
                    {defaultJsonTemplates.map((template) => (
                      <option className={optionStyles} key={template.name} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Show Response Body input only for GET methods */}
            {newEndpoint.method === 'GET' && (
              <div className="mt-4">
                <label className={labelStyles}>Response Body (JSON)</label>
                <textarea
                  value={newEndpoint.responseBody}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, responseBody: e.target.value })}
                  rows={6}
                  className={textareaStyles}
                  placeholder='{"message": "Hello World"}'
                />
              </div>
            )}
            
            <div className="mt-4">
              <label className={labelStyles}>Description (optional)</label>
              <input
                type="text"
                placeholder="Endpoint description"
                value={newEndpoint.description}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
                className={inputStyles}
              />
            </div>

            <div className="mt-4">
              <label className={labelStyles}>Authentication</label>
              <select
                value={newEndpoint.requiresAuth === null ? 'inherit' : newEndpoint.requiresAuth ? 'required' : 'none'}
                onChange={(e) => {
                  console.log('Auth dropdown changed to:', e.target.value);
                  const value = e.target.value === 'inherit' ? null : e.target.value === 'required';
                  console.log('Setting requiresAuth to:', value);
                  setNewEndpoint({ ...newEndpoint, requiresAuth: value });
                }}
                className={inputStyles}
              >
                <option className={optionStyles} value="inherit">Inherit from project ({project.authentication?.enabled ? 'Enabled' : 'Disabled'})</option>
                <option className={optionStyles} value="required">Always require authentication</option>
                <option className={optionStyles} value="none">No authentication required</option>
              </select>
            </div>

            {/* Fields section for POST endpoints */}
            {newEndpoint.method === 'POST' && (
              <div className="mt-4 p-3 rounded-[24px] border border-white/10 bg-white/5">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Request Body Fields</h3>
                
                {/* Add new field form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Field Name</label>
                    <input
                      type="text"
                      placeholder="e.g., name"
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    >
                      <option className={optionStyles} value="string">String</option>
                      <option className={optionStyles} value="number">Number</option>
                      <option className={optionStyles} value="boolean">Boolean</option>
                      <option className={optionStyles} value="object">Object</option>
                      <option className={optionStyles} value="array">Array</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Required</label>
                    <select
                      value={newField.required ? 'required' : 'optional'}
                      onChange={(e) => setNewField({ ...newField, required: e.target.value === 'required' })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    >
                      <option className={optionStyles} value="optional">Optional</option>
                      <option className={optionStyles} value="required">Required</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-sm font-medium"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
                
                {/* Field description */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    placeholder="Field description"
                    value={newField.description}
                    onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
                
                {/* Fields list */}
                {newEndpoint.fields.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-slate-400 mb-2">Defined Fields:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {newEndpoint.fields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-white text-sm font-mono">{field.name}</span>
                            <span className="text-xs px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-900 text-red-300 rounded">
                                required
                              </span>
                            )}
                            {field.description && (
                              <span className="text-xs text-slate-400 italic">
                                {field.description}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(index)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Auto-generate response body button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const generatedBody = generateResponseBodyWithFields();
                      setNewEndpoint({ ...newEndpoint, responseBody: generatedBody });
                    }}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
                  >
                    Generate Response from Fields
                  </button>
                </div>
              </div>
            )}

            {/* Data source and conditions section for GET, PUT, PATCH, DELETE endpoints */}
            {(newEndpoint.method === 'GET' || newEndpoint.method === 'PUT' || newEndpoint.method === 'PATCH' || newEndpoint.method === 'DELETE') && (
              <div className="mt-4 p-3 rounded-[24px] border border-white/10 bg-white/5">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Data Source</h3>
                
                {/* Data source selection */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Source POST Endpoint (optional)</label>
                  <select
                    value={newEndpoint.dataSource}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, dataSource: e.target.value })}
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  >
                    <option className={optionStyles} value="">Use custom response body</option>
                    {project.endpoints
                      .filter(ep => ep.method === 'POST')
                      .map(ep => (
                        <option className={optionStyles} key={ep._id} value={ep._id}>
                          {ep.path} ({ep.description || 'No description'})
                        </option>
                      ))}
                  </select>
                </div>
                
                {/* Conditions section */}
                {newEndpoint.dataSource && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-slate-400 mb-2">Filter Conditions</h4>
                    
                    {/* Add new condition form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Field</label>
                        <input
                          type="text"
                          placeholder="e.g., id"
                          value={newCondition.field}
                          onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                        <select
                          value={newCondition.operator}
                          onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as any })}
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        >
                          <option className={optionStyles} value="=">=</option>
                          <option className={optionStyles} value="!=">!=</option>
                          <option className={optionStyles} value=">">&gt;</option>
                          <option className={optionStyles} value="<">&lt;</option>
                          <option className={optionStyles} value=">=">&gt;=</option>
                          <option className={optionStyles} value="<=">&lt;=</option>
                          <option className={optionStyles} value="contains">contains</option>
                          <option className={optionStyles} value="startsWith">starts with</option>
                          <option className={optionStyles} value="endsWith">ends with</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                        <input
                          type="text"
                          placeholder="Value"
                          value={newCondition.value}
                          onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddCondition}
                          className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-sm font-medium"
                        >
                          Add Condition
                        </button>
                      </div>
                    </div>
                    
                    {/* Conditions list */}
                    {newEndpoint.conditions.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-slate-400 mb-2">Defined Conditions:</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {newEndpoint.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-white text-sm font-mono">{condition.field}</span>
                                <span className="text-xs px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded">
                                  {condition.operator}
                                </span>
                                <span className="text-white text-sm font-mono">{String(condition.value)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCondition(index)}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pagination settings for GET endpoints */}
                {newEndpoint.method === 'GET' && newEndpoint.dataSource && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-medium text-slate-300 mb-3">Pagination Settings</h4>
                    
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="paginationEnabled"
                        checked={newEndpoint.pagination.enabled}
                        onChange={(e) => setNewEndpoint({
                          ...newEndpoint,
                          pagination: {
                            ...newEndpoint.pagination,
                            enabled: e.target.checked
                          }
                        })}
                        className="mr-2 h-4 w-4 rounded border-white/10 bg-white/5 text-yellow-400 focus:ring-yellow-400"
                      />
                      <label htmlFor="paginationEnabled" className="text-sm text-slate-300">
                        Enable Pagination & Infinite Loading
                      </label>
                    </div>
                    
                    {newEndpoint.pagination.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Default Items Per Page</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newEndpoint.pagination.defaultLimit}
                            onChange={(e) => setNewEndpoint({
                              ...newEndpoint,
                              pagination: {
                                ...newEndpoint.pagination,
                                defaultLimit: parseInt(e.target.value) || 10
                              }
                            })}
                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Maximum Items Per Page</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={newEndpoint.pagination.maxLimit}
                            onChange={(e) => setNewEndpoint({
                              ...newEndpoint,
                              pagination: {
                                ...newEndpoint.pagination,
                                maxLimit: parseInt(e.target.value) || 100
                              }
                            })}
                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAddEndpoint}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
              >
                Add Endpoint
              </button>
              <button
                onClick={() => setShowAddEndpoint(false)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
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
              <div key={endpoint._id} className="rounded-[28px] border border-white/10 bg-white/5">
                <div 
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
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
                        <div className="font-mono text-white">{project.baseUrl}{endpoint.path}{(endpoint.method === 'PUT' || endpoint.method === 'PATCH' || endpoint.method === 'DELETE') ? '/:id' : ''}</div>
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
                      {/* Add validation test button for POST, PUT, PATCH endpoints with fields */}
                      {(endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') && endpoint.fields && endpoint.fields.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show a dialog to test with missing required fields
                            const requiredFields = endpoint.fields!.filter(field => field.required);
                            if (requiredFields.length > 0) {
                              const fieldList = requiredFields.map(f => `- ${f.name} (${f.type})`).join('\n');
                              alert(`This endpoint requires the following fields:\n${fieldList}\n\nWhen you make a real ${endpoint.method} request missing any of these fields, you'll get a 400 error with validation details.`);
                            } else {
                              alert(`This ${endpoint.method} endpoint has no required fields, so any valid JSON will be accepted.`);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                          title="Field validation info"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
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
                  <div className="border-t border-white/5 p-4">
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
                              className={inputStyles}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Method</label>
                              <select
                                value={endpoint.method}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, { method: e.target.value as any })}
                                className={inputStyles}
                              >
                                <option className={optionStyles} value="GET">GET</option>
                                <option className={optionStyles} value="POST">POST</option>
                                <option className={optionStyles} value="PUT">PUT</option>
                                <option className={optionStyles} value="PATCH">PATCH</option>
                                <option className={optionStyles} value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Status Code</label>
                              <input
                                type="number"
                                value={endpoint.statusCode}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, { statusCode: parseInt(e.target.value) })}
                                className={inputStyles}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={endpoint.description || ''}
                              onChange={(e) => handleUpdateEndpoint(endpoint._id, { description: e.target.value })}
                              className={inputStyles}
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
                              className={inputStyles}
                            >
                              <option className={optionStyles} value="inherit">Inherit ({project.authentication?.enabled ? 'Enabled' : 'Disabled'})</option>
                              <option className={optionStyles} value="required">Always require</option>
                              <option className={optionStyles} value="none">No auth required</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        {/* Show response body configuration only for GET methods */}
                        {endpoint.method === 'GET' && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-slate-300">Response Body</h4>
                              <select
                                onChange={(e) => {
                                  if (e.target.value === 'fields') {
                                    // Generate from defined fields if available
                                    const fields = endpoint.fields || [];
                                    handleUpdateEndpoint(endpoint._id, { 
                                      responseBody: generateJsonFromFields(fields) 
                                    });
                                  } else if (e.target.value) {
                                    handleUpdateEndpoint(endpoint._id, { 
                                      responseBody: generateJsonFromTemplate(e.target.value) 
                                    });
                                  }
                                }}
                                className="rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400/40"
                              >
                                <option className={optionStyles} value="">Generate JSON...</option>
                                {endpoint.fields && endpoint.fields.length > 0 && (
                                  <option className={optionStyles} value="fields">From defined fields</option>
                                )}
                                {defaultJsonTemplates.map((template) => (
                                  <option className={optionStyles} key={template.name} value={template.name}>
                                    {template.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <textarea
                              value={endpoint.responseBody}
                              onChange={(e) => handleUpdateEndpoint(endpoint._id, { responseBody: e.target.value })}
                              rows={8}
                              className={`${textareaStyles} text-xs`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Fields section for POST endpoints in edit mode */}
                    {endpoint.method === 'POST' && endpoint.fields && endpoint.fields.length > 0 && (
                      <div className="mt-4 p-3 rounded-[24px] border border-white/10 bg-white/5">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Request Body Fields</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {endpoint.fields.map((field, index) => (
                            <div key={index} className="flex items-center space-x-3 text-xs">
                              <span className="font-mono text-white">{field.name}</span>
                              <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
                                {field.type}
                              </span>
                              {field.required && (
                                <span className="px-1.5 py-0.5 bg-red-900 text-red-300 rounded">
                                  required
                                </span>
                              )}
                              {field.description && (
                                <span className="text-slate-400 italic">
                                  {field.description}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data source and conditions section for GET, PUT, PATCH, DELETE endpoints in edit mode */}
                    {(endpoint.method === 'GET' || endpoint.method === 'PUT' || endpoint.method === 'PATCH' || endpoint.method === 'DELETE') && (
                      <div className="mt-4 p-3 rounded-[24px] border border-white/10 bg-white/5">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Data Source Configuration</h4>
                        
                        {/* Data source selection */}
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">Source POST Endpoint</label>
                          <select
                            value={endpoint.dataSource || ''}
                            onChange={(e) => handleUpdateEndpoint(endpoint._id, { dataSource: e.target.value || undefined })}
                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          >
                            <option className={optionStyles} value="">Use custom response body</option>
                            {project.endpoints
                              .filter(ep => ep.method === 'POST')
                              .map(ep => (
                                <option className={optionStyles} key={ep._id} value={ep._id}>
                                  {ep.path} ({ep.description || 'No description'})
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        {/* Conditions section */}
                        {endpoint.dataSource && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-medium text-slate-400">Filter Conditions</h5>
                              <button
                                onClick={() => {
                                  // Initialize editing state with current conditions
                                  const currentConditions = endpoint.conditions || [];
                                  setEditingConditions({
                                    ...editingConditions,
                                    [endpoint._id]: [...currentConditions]
                                  });
                                }}
                                className="text-xs text-yellow-400 hover:text-yellow-300"
                              >
                                Edit Conditions
                              </button>
                            </div>
                            
                            {editingConditions[endpoint._id] ? (
                              // Editing mode
                              <div className="space-y-2">
                                {/* Add new condition form */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                                  <input
                                    type="text"
                                    placeholder="Field"
                                    value={newEditCondition.field}
                                    onChange={(e) => setNewEditCondition({ ...newEditCondition, field: e.target.value })}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                  />
                                  <select
                                    value={newEditCondition.operator}
                                    onChange={(e) => setNewEditCondition({ ...newEditCondition, operator: e.target.value as any })}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                  >
                                    <option className={optionStyles} value="=">=</option>
                                    <option className={optionStyles} value="!=">!=</option>
                                    <option className={optionStyles} value=">">&gt;</option>
                                    <option className={optionStyles} value="<">&lt;</option>
                                    <option className={optionStyles} value=">=">&gt;=</option>
                                    <option className={optionStyles} value="<=">&lt;=</option>
                                    <option className={optionStyles} value="contains">contains</option>
                                    <option className={optionStyles} value="startsWith">starts with</option>
                                    <option className={optionStyles} value="endsWith">ends with</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Value"
                                    value={newEditCondition.value}
                                    onChange={(e) => setNewEditCondition({ ...newEditCondition, value: e.target.value })}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                  />
                                  <button
                                    onClick={() => handleAddEditCondition(endpoint._id)}
                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-xs font-medium"
                                  >
                                    Add
                                  </button>
                                </div>
                                
                                {/* Current conditions being edited */}
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {(editingConditions[endpoint._id] || []).map((condition, index) => (
                                    <div key={index} className="flex items-center justify-between p-1 bg-slate-700 rounded">
                                      <div className="flex items-center space-x-2 text-xs">
                                        <span className="font-mono text-white">{condition.field}</span>
                                        <span className="px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded">
                                          {condition.operator}
                                        </span>
                                        <span className="font-mono text-white">{String(condition.value)}</span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveEditCondition(endpoint._id, index)}
                                        className="text-slate-400 hover:text-red-400"
                                      >
                                        <TrashIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Save/Cancel buttons */}
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveConditions(endpoint._id)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                  >
                                    Save Conditions
                                  </button>
                                  <button
                                    onClick={() => handleCancelEditConditions(endpoint._id)}
                                    className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div>
                                {endpoint.conditions && endpoint.conditions.length > 0 ? (
                                  <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {endpoint.conditions.map((condition, index) => (
                                      <div key={index} className="flex items-center space-x-2 text-xs">
                                        <span className="font-mono text-white">{condition.field}</span>
                                        <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
                                          {condition.operator}
                                        </span>
                                        <span className="font-mono text-white">{String(condition.value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">No conditions defined</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Pagination settings for GET endpoints in edit mode */}
                    {endpoint.method === 'GET' && endpoint.dataSource && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Pagination Settings</h4>
                        
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id={`paginationEnabled-${endpoint._id}`}
                            checked={endpoint.pagination?.enabled || false}
                            onChange={(e) => handleUpdateEndpoint(endpoint._id, {
                              pagination: {
                                enabled: e.target.checked,
                                defaultLimit: endpoint.pagination?.defaultLimit || 10,
                                maxLimit: endpoint.pagination?.maxLimit || 100
                              }
                            })}
                            className="mr-2 h-4 w-4 rounded border-white/10 bg-white/5 text-yellow-400 focus:ring-yellow-400"
                          />
                          <label htmlFor={`paginationEnabled-${endpoint._id}`} className="text-sm text-slate-300">
                            Enable Pagination & Infinite Loading
                          </label>
                        </div>
                        
                        {endpoint.pagination?.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Default Items Per Page</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={endpoint.pagination.defaultLimit || 10}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, {
                                  pagination: {
                                    enabled: endpoint.pagination?.enabled || false,
                                    defaultLimit: parseInt(e.target.value) || 10,
                                    maxLimit: endpoint.pagination?.maxLimit || 100
                                  }
                                })}
                                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Maximum Items Per Page</label>
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={endpoint.pagination.maxLimit || 100}
                                onChange={(e) => handleUpdateEndpoint(endpoint._id, {
                                  pagination: {
                                    enabled: endpoint.pagination?.enabled || false,
                                    defaultLimit: endpoint.pagination?.defaultLimit || 10,
                                    maxLimit: parseInt(e.target.value) || 100
                                  }
                                })}
                                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
