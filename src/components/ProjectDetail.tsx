'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PlayIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { defaultJsonTemplates, generateRandomJson, generateJsonFromFields, buildSampleObjectFromFields } from '@/lib/jsonGenerator';
import { generateEndpointUrl } from '@/lib/urlUtils';
import { generateReadableToken, formatAuthHeader } from '@/lib/tokenUtils';
import { toast } from 'react-hot-toast';
import AuthenticationSettings from './ProjectDetail/AuthenticationSettings';
import AddEndpointForm from './ProjectDetail/AddEndpointForm';
import EndpointListItem from './ProjectDetail/EndpointListItem';
import EndpointList from './ProjectDetail/EndpointList';
import NestedFieldsBuilder from './ProjectDetail/NestedFieldsBuilder';

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

interface ProjectDetailProps {
  project: ApiProject;
  onUpdateProject: (project: ApiProject) => void;
  refreshUsage?: () => void;
}

const createEmptyFieldDefinition = (): EndpointField => ({
  name: '',
  type: 'string',
  required: false,
  description: '',
  nestedFields: [],
  arrayItemType: undefined
});



export default function ProjectDetail({ project, onUpdateProject, refreshUsage }: ProjectDetailProps) {
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
    dataSourceMode: 'full' as 'full' | 'field' | 'aggregator',
    dataSourceField: '',
    dataSourceFields: [] as string[],
    aggregator: '' as AggregatorType,
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

  const aggregatorOptions = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'total', label: 'Total' }
  ];

  type CustomApiMode = 'full' | 'field' | 'aggregator';
  type CustomApiOptionsProps = {
    mode: CustomApiMode;
    fields: string[];
    aggregator: AggregatorType;
    availableFields: EndpointField[];
    onModeChange: (value: CustomApiMode) => void;
    onFieldsChange: (value: string[]) => void;
    onAggregatorChange: (value: AggregatorType) => void;
  };

  const CustomApiOptions = ({
    mode,
    fields,
    aggregator,
    availableFields,
    onModeChange,
    onFieldsChange,
    onAggregatorChange
  }: CustomApiOptionsProps) => {
    const [selectedFields, setSelectedFields] = useState<string[]>(fields || []);

    useEffect(() => {
      setSelectedFields(fields || []);
    }, [fields]);

    useEffect(() => {
      if (mode === 'full') {
        setSelectedFields([]);
      }
    }, [mode]);

    const handleToggleField = (fieldName: string, checked: boolean) => {
      setSelectedFields((prev) => {
        const updated = checked
          ? Array.from(new Set([...prev, fieldName]))
          : prev.filter((name) => name !== fieldName);
        onFieldsChange(updated);
        return updated;
      });
    };
    const options: { value: CustomApiMode; label: string; description: string }[] = [
      { value: 'full', label: 'Full dataset', description: 'Return the complete records from the linked POST endpoint.' },
      { value: 'field', label: 'Select column', description: 'Return only specific fields/columns for each record.' },
      { value: 'aggregator', label: 'Aggregator', description: 'Return the count, sum, average, min, or max for a column.' }
    ];

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Custom API Mode</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onModeChange(option.value)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
                  mode === option.value
                    ? 'border-yellow-400/60 bg-yellow-400/10 text-white'
                    : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                <p className="font-semibold uppercase tracking-[0.3em] text-[10px]">{option.label}</p>
                <p className="mt-2 text-[11px] text-slate-400">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {mode !== 'full' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Columns</label>
            {availableFields.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5 p-3 space-y-2 max-h-56 overflow-y-auto">
                {availableFields.map((endpointField, idx) => {
                  const isChecked = selectedFields.includes(endpointField.name);
                  return (
                    <label
                      key={`${endpointField.name}-${idx}`}
                      className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleField(endpointField.name, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-yellow-500 focus:ring-yellow-400 dark:border-white/20 dark:bg-white/5 dark:text-yellow-400"
                        />
                        <span className="font-mono text-slate-900 dark:text-white">{endpointField.name}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {endpointField.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Define fields in the selected POST endpoint to enable column-level responses.</p>
            )}
            {selectedFields.length > 0 && (
              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                Returning columns: {selectedFields.join(', ')}
              </p>
            )}
          </div>
        )}

        {mode === 'aggregator' && (
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Aggregator</label>
              <select
                value={aggregator || ''}
                disabled={selectedFields.length === 0}
                onChange={(e) => onAggregatorChange(e.target.value as AggregatorType)}
                className={`w-full px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-yellow-400 dark:border-white/10 dark:bg-white/5 dark:text-white ${
                  selectedFields.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select aggregator</option>
                {aggregatorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-100 p-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {selectedFields.length > 0
                ? 'Returns the selected aggregate (count, sum, etc.) for each chosen column instead of the entire dataset.'
                : 'Select at least one column to enable aggregations.'}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSourceEndpoint = (sourceId: string | undefined) => {
    if (!sourceId) return undefined;
    return project.endpoints.find(ep => ep._id === sourceId);
  };

  const getSourceFields = (sourceId: string | undefined) => {
    const source = getSourceEndpoint(sourceId);
    return source?.fields || [];
  };

  const selectedSourceFields = getSourceFields(newEndpoint.dataSource);
  
  // Validation state for highlighting required fields
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Add state for new field in the form
  const [newField, setNewField] = useState<EndpointField>(() => createEmptyFieldDefinition());  // Add state for new condition
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
    // Reset validation errors
    setValidationErrors({});
    
    // Validate required fields
    const errors: Record<string, boolean> = {};
    
    // Path is always required
    if (!newEndpoint.path.trim()) {
      errors.path = true;
    }
    
    // Status code is always required
    if (!newEndpoint.statusCode) {
      errors.statusCode = true;
    }
    
    // For GET endpoints, if using data source, validate it
    if (newEndpoint.method === 'GET' && newEndpoint.dataSource) {
      // Data source is selected, no additional validation needed
    }
    
    // For POST endpoints, if fields are defined, validate them
    if (newEndpoint.method === 'POST' && newEndpoint.fields.length > 0) {
      // Validate that fields have names
      for (let i = 0; i < newEndpoint.fields.length; i++) {
        const field = newEndpoint.fields[i];
        if (!field.name.trim()) {
          errors[`field-${i}-name`] = true;
        }
      }
    }
    
    // For GET, PUT, PATCH, DELETE endpoints with data source, validate conditions
    if ((newEndpoint.method === 'GET' || newEndpoint.method === 'PUT' || newEndpoint.method === 'PATCH' || newEndpoint.method === 'DELETE') && 
        newEndpoint.dataSource && newEndpoint.conditions.length > 0) {
      // Validate that conditions have fields
      for (let i = 0; i < newEndpoint.conditions.length; i++) {
        const condition = newEndpoint.conditions[i];
        if (!condition.field.trim()) {
          errors[`condition-${i}-field`] = true;
        }
      }
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const cleanPath = newEndpoint.path.startsWith('/') ? newEndpoint.path : `/${newEndpoint.path}`;
    
    // Check for duplicate endpoint (same method + path)
    const isDuplicate = project.endpoints.some(ep => 
      ep.method === newEndpoint.method && ep.path === cleanPath
    );
    
    if (isDuplicate) {
      alert(`Endpoint ${newEndpoint.method} ${cleanPath} already exists in this project!`);
      return;
    }

    if (newEndpoint.method === 'GET' && newEndpoint.dataSource) {
      if (newEndpoint.dataSourceMode !== 'full' && newEndpoint.dataSourceFields.length === 0) {
        alert('Please select a column when using Custom API modes.');
        return;
      }
      if (newEndpoint.dataSourceMode === 'aggregator' && !newEndpoint.aggregator) {
        alert('Please select an aggregator function.');
        return;
      }
    }

    // For POST endpoints, validate that required fields are defined if any fields exist
    if (newEndpoint.method === 'POST' && newEndpoint.fields && newEndpoint.fields.length > 0) {
      const requiredFields = newEndpoint.fields.filter(field => field.required);
      if (requiredFields.length > 0) {
        // We'll validate request body when the endpoint is actually used
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
      delete endpoint.dataSourceField;
      delete endpoint.dataSourceFields;
      delete endpoint.aggregator;
    }

    if (endpoint.dataSourceField === '') {
      delete endpoint.dataSourceField;
    }
    if (!endpoint.dataSourceFields || endpoint.dataSourceFields.length === 0) {
      delete endpoint.dataSourceFields;
    }

    if (!endpoint.aggregator) {
      delete endpoint.aggregator;
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
      dataSourceMode: 'full',
      dataSourceField: '',
      dataSourceFields: [],
      aggregator: '',
      conditions: [],
      // Pagination settings
      pagination: {
        enabled: false,
        defaultLimit: 10,
        maxLimit: 100
      }
    });
    
    // Reset field form
    setNewField(createEmptyFieldDefinition());
    
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
      cleanUpdates.dataSourceMode = 'full';
      cleanUpdates.dataSourceField = '';
      cleanUpdates.dataSourceFields = [];
      cleanUpdates.aggregator = '';
    }
    if (cleanUpdates.dataSourceMode === 'full') {
      cleanUpdates.dataSourceField = '';
      cleanUpdates.dataSourceFields = [];
      cleanUpdates.aggregator = '';
    }
    if (cleanUpdates.dataSourceField === '') {
      delete cleanUpdates.dataSourceField;
    }
    if (Array.isArray(cleanUpdates.dataSourceFields) && cleanUpdates.dataSourceFields.length === 0) {
      delete cleanUpdates.dataSourceFields;
    }
    if (cleanUpdates.aggregator === '') {
      delete cleanUpdates.aggregator;
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
            const requestBody = buildSampleObjectFromFields(endpoint.fields || [], { includeMeta: false });
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
      // Refresh usage data after making an API call
      if (refreshUsage) {
        refreshUsage();
      }
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

    if (newField.type === 'array' && !newField.arrayItemType) {
      alert('Please select an item type for the array field');
      return;
    }

    // Check for duplicate field name
    if (newEndpoint.fields.some(field => field.name === newField.name)) {
      alert(`Field "${newField.name}" already exists`);
      return;
    }

    const normalizedField: EndpointField = {
      ...newField,
      arrayItemType: newField.type === 'array' ? newField.arrayItemType : undefined,
      nestedFields:
        newField.type === 'object'
          ? newField.nestedFields || []
          : newField.type === 'array' && newField.arrayItemType === 'object'
            ? newField.nestedFields || []
            : []
    };

    const updatedFields = [...newEndpoint.fields, normalizedField];
    setNewEndpoint({ ...newEndpoint, fields: updatedFields });
    
    // Clear validation error for this field if it exists
    const fieldErrorKey = `field-${newEndpoint.fields.length}-name`;
    if (validationErrors[fieldErrorKey]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldErrorKey];
      setValidationErrors(newErrors);
    }
    
    // Reset field form
    setNewField(createEmptyFieldDefinition());
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
    
    // Clear validation error for this condition if it exists
    const conditionErrorKey = `condition-${newEndpoint.conditions.length}-field`;
    if (validationErrors[conditionErrorKey]) {
      const newErrors = { ...validationErrors };
      delete newErrors[conditionErrorKey];
      setValidationErrors(newErrors);
    }
    
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
        <AuthenticationSettings 
          project={project} 
          onUpdateProject={onUpdateProject} 
          showToken={showToken} 
          setShowToken={setShowToken} 
        />

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
                  onChange={(e) => {
                    setNewEndpoint({ ...newEndpoint, path: e.target.value });
                    // Clear validation error when user starts typing
                    if (validationErrors.path) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.path;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={`${inputStyles} ${validationErrors.path ? 'border-red-500' : ''}`}
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
                  onChange={(e) => {
                    setNewEndpoint({ ...newEndpoint, statusCode: parseInt(e.target.value) || 0 });
                    // Clear validation error when user starts typing
                    if (validationErrors.statusCode) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.statusCode;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={`${inputStyles} ${validationErrors.statusCode ? 'border-red-500' : ''}`}
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
                  const value = e.target.value === 'inherit' ? null : e.target.value === 'required';
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
                      onChange={(e) => {
                        setNewField({ ...newField, name: e.target.value });
                        // Clear validation error when user starts typing
                        const fieldErrorKey = `field-${newEndpoint.fields.length}-name`;
                        if (validationErrors[fieldErrorKey]) {
                          const newErrors = { ...validationErrors };
                          delete newErrors[fieldErrorKey];
                          setValidationErrors(newErrors);
                        }
                      }}
                      className={`w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 ${validationErrors['field-' + newEndpoint.fields.length + '-name'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => {
                        const selectedType = e.target.value as EndpointField['type'];
                        setNewField((prev) => ({
                          ...prev,
                          type: selectedType,
                          nestedFields: selectedType === 'object' || selectedType === 'array' ? prev.nestedFields || [] : [],
                          arrayItemType: selectedType === 'array' ? 'object' : undefined
                        }));
                      }}
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

                {newField.type === 'object' && (
                  <NestedFieldsBuilder
                    title="JSON 1"
                    subtitle="Define keys that live inside this object"
                    fields={newField.nestedFields || []}
                    onChange={(nested: EndpointField[]) => setNewField({ ...newField, nestedFields: nested })}
                  />
                )}

                {newField.type === 'array' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Array Item Type</label>
                      <select
                        value={newField.arrayItemType || 'object'}
                        onChange={(e) => {
                          const value = e.target.value as EndpointField['type'];
                          setNewField((prev) => ({
                            ...prev,
                            arrayItemType: value,
                            nestedFields: value === 'object' ? prev.nestedFields || [] : []
                          }));
                        }}
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      >
                        <option className={optionStyles} value="string">String</option>
                        <option className={optionStyles} value="number">Number</option>
                        <option className={optionStyles} value="boolean">Boolean</option>
                        <option className={optionStyles} value="object">Object</option>
                        <option className={optionStyles} value="array">Array</option>
                      </select>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Choose <span className="font-semibold text-slate-200">Object</span> to build nested JSON (JSON 1) for each array item.
                      </p>
                    </div>
                    {newField.arrayItemType === 'object' && (
                      <NestedFieldsBuilder
                        title="JSON 1"
                        subtitle="Fields that belong to every array item"
                        fields={newField.nestedFields || []}
                        onChange={(nested: EndpointField[]) => setNewField({ ...newField, nestedFields: nested })}
                      />
                    )}
                  </div>
                )}
                
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
                            {field.type === 'array' && field.arrayItemType && (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded">
                                items: {field.arrayItemType}
                              </span>
                            )}
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
                            {field.nestedFields && field.nestedFields.length > 0 && (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                                {field.nestedFields.length} nested
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
                    onChange={(e) => setNewEndpoint({
                      ...newEndpoint,
                      dataSource: e.target.value,
                      dataSourceField: '',
                      dataSourceFields: [],
                      dataSourceMode: 'full',
                      aggregator: ''
                    })}
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

                {newEndpoint.dataSource && (
                  <CustomApiOptions
                    mode={newEndpoint.dataSourceMode}
                    fields={newEndpoint.dataSourceMode === 'full' ? [] : newEndpoint.dataSourceFields}
                    aggregator={newEndpoint.aggregator}
                    availableFields={selectedSourceFields}
                    onModeChange={(value) =>
                      setNewEndpoint({
                        ...newEndpoint,
                        dataSourceMode: value,
                        dataSourceField: value === 'full' ? '' : newEndpoint.dataSourceField,
                        dataSourceFields: value === 'full' ? [] : newEndpoint.dataSourceFields,
                        aggregator: value === 'aggregator' ? newEndpoint.aggregator : ''
                      })
                    }
                    onFieldsChange={(values) =>
                      setNewEndpoint({
                        ...newEndpoint,
                        dataSourceFields: values,
                        dataSourceField: values[0] || '',
                        aggregator: values.length ? newEndpoint.aggregator : ''
                      })
                    }
                    onAggregatorChange={(value) =>
                      setNewEndpoint({
                        ...newEndpoint,
                        aggregator: value
                      })
                    }
                  />
                )}
                
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
                          onChange={(e) => {
                            setNewCondition({ ...newCondition, field: e.target.value });
                            // Clear validation error when user starts typing
                            const conditionErrorKey = `condition-${newEndpoint.conditions.length}-field`;
                            if (validationErrors[conditionErrorKey]) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[conditionErrorKey];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={`w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 ${validationErrors['condition-' + newEndpoint.conditions.length + '-field'] ? 'border-red-500' : ''}`}
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
                onClick={() => {
                  setShowAddEndpoint(false);
                  // Clear validation errors when closing the form
                  setValidationErrors({});
                }}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
            </div>
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-3 text-sm text-red-400">
                Please fill in all required fields (highlighted in red)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto p-6">
        <EndpointList
          project={project}
          expandedEndpoint={expandedEndpoint}
          setExpandedEndpoint={setExpandedEndpoint}
          handleUpdateEndpoint={handleUpdateEndpoint}
          handleDeleteEndpoint={handleDeleteEndpoint}
          testEndpoint={testEndpoint}
          copyEndpointUrl={copyEndpointUrl}
          editingConditions={editingConditions}
          setEditingConditions={setEditingConditions}
          newEditCondition={newEditCondition}
          setNewEditCondition={setNewEditCondition}
          handleAddEditCondition={handleAddEditCondition}
          handleRemoveEditCondition={handleRemoveEditCondition}
          handleSaveConditions={handleSaveConditions}
          handleCancelEditConditions={handleCancelEditConditions}
        />
      </div>
    </div>
  );
}
