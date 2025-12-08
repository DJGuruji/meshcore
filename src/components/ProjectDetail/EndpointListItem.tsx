'use client';

import { 
  ChevronDownIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { generateEndpointUrl } from '@/lib/urlUtils';
import { formatAuthHeader } from '@/lib/tokenUtils';
import { defaultJsonTemplates, generateRandomJson, getTemplateByName, generateJsonFromFields } from '@/lib/jsonGenerator';
import CustomApiOptions from './CustomApiOptions';

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  // For nested object validation
  nestedFields?: EndpointField[];
  // For array validation
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

type AggregatorType = '' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'total';

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
  dataSourceMode?: 'full' | 'field' | 'aggregator';
  dataSourceField?: string;
  dataSourceFields?: string[];
  aggregator?: AggregatorType;
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

interface EndpointListItemProps {
  endpoint: Endpoint;
  project: ApiProject;
  expandedEndpoint: string | null;
  setExpandedEndpoint: (id: string | null) => void;
  handleUpdateEndpoint: (endpointId: string, updates: Partial<Endpoint>) => void;
  handleDeleteEndpoint: (endpointId: string) => void;
  testEndpoint: (endpoint: Endpoint) => void;
  copyEndpointUrl: (endpoint: Endpoint) => void;
  editingConditions: {[key: string]: any[]};
  setEditingConditions: (conditions: {[key: string]: any[]}) => void;
  newEditCondition: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  };
  setNewEditCondition: (condition: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  }) => void;
  handleAddEditCondition: (endpointId: string) => void;
  handleRemoveEditCondition: (endpointId: string, index: number) => void;
  handleSaveConditions: (endpointId: string) => void;
  handleCancelEditConditions: (endpointId: string) => void;
}

// Helper function to ensure endpoint has requiresAuth property
const ensureEndpointAuth = (endpoint: any) => ({
  ...endpoint,
  requiresAuth: endpoint.requiresAuth !== undefined ? endpoint.requiresAuth : null
});

const getSourceFields = (sourceId: string | undefined, project: ApiProject) => {
  if (!sourceId) return [];
  const source = project.endpoints.find(ep => ep._id === sourceId);
  return source?.fields || [];
};

export default function EndpointListItem({ 
  endpoint,
  project,
  expandedEndpoint,
  setExpandedEndpoint,
  handleUpdateEndpoint,
  handleDeleteEndpoint,
  testEndpoint,
  copyEndpointUrl,
  editingConditions,
  setEditingConditions,
  newEditCondition,
  setNewEditCondition,
  handleAddEditCondition,
  handleRemoveEditCondition,
  handleSaveConditions,
  handleCancelEditConditions
}: EndpointListItemProps) {
  const endpointMode = endpoint.dataSourceMode || 'full';
  const endpointAggregator = endpoint.aggregator || '';
  const endpointFields = getSourceFields(endpoint.dataSource, project);
  const endpointSelectedFields =
    (endpoint.dataSourceFields && endpoint.dataSourceFields.length > 0)
      ? endpoint.dataSourceFields
      : endpoint.dataSourceField
        ? [endpoint.dataSourceField]
        : [];
  const isEditingConditions = Boolean(editingConditions[endpoint._id]);
  
  const inputStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const textareaStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const optionStyles = 'text-slate-900';
  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';

  return (
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
              {endpoint.dataSource && endpointMode !== 'full' && (
                <div className="text-[11px] text-slate-400 mt-1">
                  {endpointMode === 'field'
                    ? `Custom API · Columns: ${endpointSelectedFields.length ? endpointSelectedFields.join(', ') : 'not set'}`
                    : `Custom API · ${endpointAggregator || 'Aggregator not set'} on ${endpointSelectedFields.length ? endpointSelectedFields.join(', ') : 'no columns selected'}`}
                </div>
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
                        if (e.target.value === 'fields' && endpoint.fields) {
                          // Generate from defined fields if available
                          const fields = endpoint.fields || [];
                          handleUpdateEndpoint(endpoint._id, { 
                            responseBody: generateJsonFromFields(fields)
                          });
                        } else if (e.target.value) {
                          const template = defaultJsonTemplates.find(t => t.name === e.target.value);
                          if (template) {
                            handleUpdateEndpoint(endpoint._id, { 
                              responseBody: generateRandomJson(template)
                            });
                          }
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
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    handleUpdateEndpoint(endpoint._id, {
                      dataSource: value,
                      dataSourceField: '',
                      dataSourceFields: [],
                      dataSourceMode: 'full',
                      aggregator: ''
                    });
                  }}
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

              {endpoint.dataSource && (
                <div className="mb-4 space-y-4">
                  <CustomApiOptions
                    mode={endpointMode}
                    fields={endpointMode === 'full' ? [] : endpointSelectedFields}
                    aggregator={(endpointAggregator || '') as AggregatorType}
                    availableFields={endpointFields}
                    onModeChange={(value) =>
                      handleUpdateEndpoint(endpoint._id, {
                        dataSourceMode: value,
                        dataSourceField: value === 'full' ? '' : endpointSelectedFields[0] || '',
                        dataSourceFields: value === 'full' ? [] : endpointSelectedFields,
                        aggregator: value === 'aggregator' ? endpoint.aggregator || '' : ''
                      })
                    }
                    onFieldsChange={(values) =>
                      handleUpdateEndpoint(endpoint._id, {
                        dataSourceField: values[0] || '',
                        dataSourceFields: values,
                        aggregator: values.length ? endpoint.aggregator || '' : ''
                      })
                    }
                    onAggregatorChange={(value) =>
                      handleUpdateEndpoint(endpoint._id, {
                        aggregator: value || ''
                      })
                    }
                  />
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-medium text-slate-400">Filter Conditions</h5>
                      <button
                        onClick={() => {
                          if (isEditingConditions) {
                            handleCancelEditConditions(endpoint._id);
                            return;
                          }
                          const currentConditions = endpoint.conditions || [];
                          setEditingConditions({
                            ...editingConditions,
                            [endpoint._id]: [...currentConditions]
                          });
                          setNewEditCondition({
                            field: '',
                            operator: '=',
                            value: ''
                          });
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        {isEditingConditions ? 'Close Editor' : 'Edit Conditions'}
                      </button>
                    </div>
                    {isEditingConditions ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Field</label>
                            <input
                              type="text"
                              placeholder="e.g., id"
                              value={newEditCondition.field}
                              onChange={(e) =>
                                setNewEditCondition({ ...newEditCondition, field: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                            <select
                              value={newEditCondition.operator}
                              onChange={(e) =>
                                setNewEditCondition({
                                  ...newEditCondition,
                                  operator: e.target.value as any
                                })
                              }
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
                              value={newEditCondition.value}
                              onChange={(e) =>
                                setNewEditCondition({ ...newEditCondition, value: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleAddEditCondition(endpoint._id)}
                              className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-sm font-medium"
                            >
                              Add Condition
                            </button>
                          </div>
                        </div>
                        {editingConditions[endpoint._id]?.length ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {editingConditions[endpoint._id].map((condition, index) => (
                              <div
                                key={`${condition.field}-${index}`}
                                className="flex items-center justify-between p-2 bg-slate-700 rounded"
                              >
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="text-white font-mono">{condition.field}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded">
                                    {condition.operator}
                                  </span>
                                  <span className="text-white font-mono">{String(condition.value)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditCondition(endpoint._id, index)}
                                  className="text-slate-400 hover:text-red-400"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No conditions defined yet.</div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveConditions(endpoint._id)}
                            className="px-3 py-1.5 bg-yellow-500 text-black rounded-full text-xs font-semibold"
                          >
                            Save Conditions
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelEditConditions(endpoint._id)}
                            className="px-3 py-1.5 border border-white/10 text-xs text-slate-300 rounded-full hover:border-white/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        {endpoint.conditions && endpoint.conditions.length > 0 ? (
                          <div className="space-y-2">
                            {endpoint.conditions.map((condition, index) => (
                              <div
                                key={`${condition.field}-${index}`}
                                className="flex items-center space-x-2 text-xs"
                              >
                                <span className="text-white font-mono">{condition.field}</span>
                                <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
                                  {condition.operator}
                                </span>
                                <span className="text-white font-mono">{String(condition.value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>No filter conditions configured.</span>
                        )}
                      </div>
                    )}
                  </div>
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
  );
};

