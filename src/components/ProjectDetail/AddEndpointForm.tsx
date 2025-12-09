'use client';

import { useState } from 'react';
import { 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import { defaultJsonTemplates, generateRandomJson, generateJsonFromFields } from '@/lib/jsonGenerator';
import NestedFieldsBuilder from './NestedFieldsBuilder';
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

interface AddEndpointFormProps {
  project: ApiProject;
  showAddEndpoint: boolean;
  newEndpoint: any;
  setNewEndpoint: (endpoint: any) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  handleAddEndpoint: () => void;
  setShowAddEndpoint: (show: boolean) => void;
}

const createEmptyFieldDefinition = (): EndpointField => ({
  name: '',
  type: 'string',
  required: false,
  description: '',
  nestedFields: [],
  arrayItemType: undefined
});

export default function AddEndpointForm({ 
  project, 
  showAddEndpoint, 
  newEndpoint, 
  setNewEndpoint, 
  validationErrors, 
  setValidationErrors, 
  handleAddEndpoint, 
  setShowAddEndpoint 
}: AddEndpointFormProps) {
  // Add state for new field in the form
  const [newField, setNewField] = useState<EndpointField>(() => createEmptyFieldDefinition());  
  // Add state for new condition
  const [newCondition, setNewCondition] = useState({
    field: '',
    operator: '=' as '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: ''
  });

  const getSourceEndpoint = (sourceId: string | undefined) => {
    if (!sourceId) return undefined;
    return project.endpoints.find(ep => ep._id === sourceId);
  };

  const getSourceFields = (sourceId: string | undefined) => {
    const source = getSourceEndpoint(sourceId);
    return source?.fields || [];
  };

  const selectedSourceFields = getSourceFields(newEndpoint.dataSource);

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
    if (newEndpoint.fields.some((field: EndpointField) => field.name === newField.name)) {
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

  const generateResponseBodyWithFields = () => {
    return generateJsonFromFields(newEndpoint.fields);
  };

  const inputStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const textareaStyles = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
  const optionStyles = 'text-slate-900';
  const labelStyles = 'mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300';

  if (!showAddEndpoint) return null;

  return (
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
              onChange={(nested) => setNewField({ ...newField, nestedFields: nested })}
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
                  onChange={(nested) => setNewField({ ...newField, nestedFields: nested })}
                />
              )}
            </div>
          )}
          
          {/* Fields list */}
          {newEndpoint.fields.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-slate-400 mb-2">Defined Fields:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {newEndpoint.fields.map((field: EndpointField, index: number) => (
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
                .filter((ep: Endpoint) => ep.method === 'POST')
                .map((ep: Endpoint) => (
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
                    {newEndpoint.conditions.map((condition: any, index: number) => (
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
  );
};