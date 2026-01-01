'use client';

import { useState } from 'react';
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import CustomApiOptions from './CustomApiOptions';

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CRUD';
  description?: string;
  fields?: any[];
}

interface CustomApiFormProps {
  project: any;
  newEndpoint: any;
  setNewEndpoint: (endpoint: any) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  handleAddEndpoint: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function CustomApiForm({
  project,
  newEndpoint,
  setNewEndpoint,
  validationErrors,
  setValidationErrors,
  handleAddEndpoint,
  onBack,
  onCancel
}: CustomApiFormProps) {
  const [newCondition, setNewCondition] = useState({
    field: '',
    operator: '=' as '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: ''
  });

  const inputStyles = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30';
  const optionStyles = 'text-slate-900 bg-white';
  const labelStyles = 'mb-2 block text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent';

  const getSourceEndpoint = (sourceId: string | undefined) => {
    if (!sourceId) return undefined;
    return project.endpoints.find((ep: Endpoint) => ep._id === sourceId);
  };

  const getSourceFields = (sourceId: string | undefined) => {
    const source = getSourceEndpoint(sourceId);
    return source?.fields || [];
  };

  const selectedSourceFields = getSourceFields(newEndpoint.dataSource);

  const handleAddCondition = () => {
    if (!newCondition.field.trim()) {
      alert('Field name is required for condition');
      return;
    }

    const updatedConditions = [...(newEndpoint.conditions || []), { ...newCondition }];
    setNewEndpoint({ ...newEndpoint, conditions: updatedConditions });
    
    setNewCondition({
      field: '',
      operator: '=',
      value: ''
    });
  };

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = [...(newEndpoint.conditions || [])];
    updatedConditions.splice(index, 1);
    setNewEndpoint({ ...newEndpoint, conditions: updatedConditions });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition z-10"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
              </button>
              <h2 className="text-2xl font-bold text-white">Custom API</h2>
            </div>
            <p className="text-sm text-slate-400 ml-14">Advanced endpoint with data source and transformations</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Path */}
            <div>
              <label className={labelStyles}>Path *</label>
              <input
                type="text"
                placeholder="/active-users"
                value={newEndpoint.path}
                onChange={(e) => {
                  setNewEndpoint({ ...newEndpoint, path: e.target.value });
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
                  Note: Path will automatically include '/:id' parameter
                </p>
              )}
            </div>

            {/* Method */}
            <div>
              <label className={labelStyles}>Method *</label>
              <select
                value={newEndpoint.method}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, method: e.target.value as any })}
                className={inputStyles}
              >
                <option className={optionStyles} value="GET">GET</option>
                <option className={optionStyles} value="PUT">PUT</option>
                <option className={optionStyles} value="PATCH">PATCH</option>
                <option className={optionStyles} value="DELETE">DELETE</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">
                POST endpoints should be created using CRUD API mode
              </p>
            </div>

            {/* Status Code */}
            <div>
              <label className={labelStyles}>Status Code *</label>
              <input
                type="number"
                value={newEndpoint.statusCode}
                onChange={(e) => {
                  setNewEndpoint({ ...newEndpoint, statusCode: parseInt(e.target.value) || 0 });
                  if (validationErrors.statusCode) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.statusCode;
                    setValidationErrors(newErrors);
                  }
                }}
                className={`${inputStyles} ${validationErrors.statusCode ? 'border-red-500' : ''}`}
              />
            </div>

            {/* Data Source */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Data Source *</h3>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Source Resource/CRUD Endpoint</label>
                <select
                  value={newEndpoint.dataSource || ''}
                  onChange={(e) => setNewEndpoint({
                    ...newEndpoint,
                    dataSource: e.target.value,
                    dataSourceField: '',
                    dataSourceFields: [],
                    dataSourceMode: 'full',
                    aggregator: ''
                  })}
                  className={inputStyles}
                >
                  <option className={optionStyles} value="">Select a Resource/POST endpoint...</option>
                  {project.endpoints
                    .filter((ep: Endpoint) => ep.method === 'POST' || (ep as any).method === 'CRUD')
                    .map((ep: Endpoint) => (
                      <option className={optionStyles} key={ep._id} value={ep._id}>
                        {ep.path} ({(ep as any).method === 'CRUD' ? 'Full Resource' : ep.description || 'POST Endpoint'})
                      </option>
                    ))}
                </select>
                {!newEndpoint.dataSource && (
                  <p className="mt-1 text-xs text-amber-400">
                    ⚠️ You need to create a POST endpoint or CRUD resource first
                  </p>
                )}
              </div>

              {newEndpoint.dataSource && (
                <CustomApiOptions
                  mode={newEndpoint.dataSourceMode || 'full'}
                  fields={newEndpoint.dataSourceMode === 'full' ? [] : newEndpoint.dataSourceFields || []}
                  aggregator={newEndpoint.aggregator || ''}
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
            </div>

            {/* Conditions */}
            {newEndpoint.dataSource && (
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Filter Conditions</h4>
                
                {/* Add Condition Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Field</label>
                    <input
                      type="text"
                      placeholder="e.g., status"
                      value={newCondition.field}
                      onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                    <select
                      value={newCondition.operator}
                      onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
                    >
                      Add Condition
                    </button>
                  </div>
                </div>

                {/* Conditions List */}
                {newEndpoint.conditions && newEndpoint.conditions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-slate-400 mb-2">Defined Conditions:</h5>
                    <div className="space-y-2">
                      {newEndpoint.conditions.map((condition: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
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

            {/* Pagination */}
            {newEndpoint.method === 'GET' && newEndpoint.dataSource && (
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Pagination Settings</h4>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="paginationEnabled"
                    checked={newEndpoint.pagination?.enabled || false}
                    onChange={(e) => setNewEndpoint({
                      ...newEndpoint,
                      pagination: {
                        enabled: e.target.checked,
                        defaultLimit: newEndpoint.pagination?.defaultLimit || 10,
                        maxLimit: newEndpoint.pagination?.maxLimit || 100
                      }
                    })}
                    className="mr-2 h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-400 focus:ring-indigo-400"
                  />
                  <label htmlFor="paginationEnabled" className="text-sm text-slate-300">
                    Enable Pagination
                  </label>
                </div>
                
                {newEndpoint.pagination?.enabled && (
                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className={labelStyles}>Description (optional)</label>
              <input
                type="text"
                placeholder="Endpoint description"
                value={newEndpoint.description || ''}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
                className={inputStyles}
              />
            </div>

            {/* Authentication */}
            <div>
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
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddEndpoint}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
            >
              Create Endpoint
            </button>
            <button
              onClick={onBack}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Back
            </button>
            <button
              onClick={onCancel}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {/* Validation Error */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-3 text-sm text-red-400">
              Please fill in all required fields (highlighted in red)
            </div>
          )}
        </div>
      </div>
    </>
  );
}
