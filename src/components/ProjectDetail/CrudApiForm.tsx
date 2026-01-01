'use client';

import { useState } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import NestedFieldsBuilder from './NestedFieldsBuilder';

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
  required: boolean;
  description?: string;
  nestedFields?: EndpointField[];
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
}

interface CrudApiFormProps {
  project: any;
  newEndpoint: any;
  setNewEndpoint: (endpoint: any) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  handleAddEndpoint: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const createEmptyFieldDefinition = (): EndpointField => ({
  name: '',
  type: 'string',
  required: false,
  description: '',
  nestedFields: [],
  arrayItemType: undefined
});

export default function CrudApiForm({
  project,
  newEndpoint,
  setNewEndpoint,
  validationErrors,
  setValidationErrors,
  handleAddEndpoint,
  onBack,
  onCancel
}: CrudApiFormProps) {
  const [newField, setNewField] = useState<EndpointField>(createEmptyFieldDefinition());

  const inputStyles = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30';
  const optionStyles = 'text-slate-900 bg-white';
  const labelStyles = 'mb-2 block text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent';

  const handleAddField = () => {
    if (!newField.name.trim()) {
      alert('Field name is required');
      return;
    }

    if (newField.type === 'array' && !newField.arrayItemType) {
      alert('Please select an item type for the array field');
      return;
    }

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
    setNewField(createEmptyFieldDefinition());
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = [...newEndpoint.fields];
    updatedFields.splice(index, 1);
    setNewEndpoint({ ...newEndpoint, fields: updatedFields });
  };

  const resourceName = newEndpoint.resourceName || '';
  let basePath = resourceName.startsWith('/') ? resourceName : `/${resourceName}`;

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
              <h2 className="text-2xl font-bold text-white">CRUD API</h2>
            </div>
            <p className="text-sm text-slate-400 ml-14">Auto-generate 5 endpoints: POST, GET, GET/:id, PUT/:id, DELETE/:id</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Resource Name */}
            <div>
              <label className={labelStyles}>Resource Name *</label>
              <input
                type="text"
                placeholder="users"
                value={newEndpoint.resourceName || ''}
                onChange={(e) => {
                  setNewEndpoint({ ...newEndpoint, resourceName: e.target.value });
                  if (validationErrors.resourceName) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.resourceName;
                    setValidationErrors(newErrors);
                  }
                }}
                className={`${inputStyles} ${validationErrors.resourceName ? 'border-red-500' : ''}`}
              />
              {resourceName && (
                <p className="mt-2 text-xs text-slate-400">
                  Will create: <span className="text-indigo-400 font-mono">POST {basePath}</span>, <span className="text-indigo-400 font-mono">GET {basePath}</span>, <span className="text-indigo-400 font-mono">GET {basePath}/:id</span>, <span className="text-indigo-400 font-mono">PUT {basePath}/:id</span>, <span className="text-indigo-400 font-mono">DELETE {basePath}/:id</span>
                </p>
              )}
            </div>

            {/* Field Definitions */}
            <div className={`p-4 rounded-2xl border bg-white/5 ${validationErrors.fields ? 'border-red-500' : 'border-white/10'}`}>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Request Body Fields *</h3>
              
              {/* Add Field Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g., name"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option className={optionStyles} value="string">String</option>
                    <option className={optionStyles} value="number">Number</option>
                    <option className={optionStyles} value="boolean">Boolean</option>
                    <option className={optionStyles} value="object">Object</option>
                    <option className={optionStyles} value="array">Array</option>
                    <option className={optionStyles} value="image">Image Upload</option>
                    <option className={optionStyles} value="video">Video Upload</option>
                    <option className={optionStyles} value="audio">Audio Upload</option>
                    <option className={optionStyles} value="file">File Upload</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Required</label>
                  <select
                    value={newField.required ? 'required' : 'optional'}
                    onChange={(e) => setNewField({ ...newField, required: e.target.value === 'required' })}
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option className={optionStyles} value="optional">Optional</option>
                    <option className={optionStyles} value="required">Required</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Field Description */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  placeholder="Field description"
                  value={newField.description}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Nested Fields Builder */}
              {newField.type === 'object' && (
                <NestedFieldsBuilder
                  title="Object Fields"
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
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      <option className={optionStyles} value="string">String</option>
                      <option className={optionStyles} value="number">Number</option>
                      <option className={optionStyles} value="boolean">Boolean</option>
                      <option className={optionStyles} value="object">Object</option>
                    </select>
                  </div>
                  {newField.arrayItemType === 'object' && (
                    <NestedFieldsBuilder
                      title="Array Item Fields"
                      subtitle="Fields that belong to every array item"
                      fields={newField.nestedFields || []}
                      onChange={(nested) => setNewField({ ...newField, nestedFields: nested })}
                    />
                  )}
                </div>
              )}

              {/* Fields List */}
              {newEndpoint.fields && newEndpoint.fields.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-2">Defined Fields:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {newEndpoint.fields.map((field: EndpointField, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
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
            </div>

            {/* Description */}
            <div>
              <label className={labelStyles}>Description (optional)</label>
              <input
                type="text"
                placeholder="API description"
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

            {/* Pagination */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
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
                  Enable Pagination (for GET all)
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

            {/* Preview */}
            {resourceName && newEndpoint.fields && newEndpoint.fields.length > 0 && (
              <div className="p-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/10">
                <h4 className="text-sm font-medium text-indigo-300 mb-2">Will Create 5 Endpoints:</h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>✓ <span className="font-mono text-indigo-400">POST {basePath}</span> - Create new {resourceName}</li>
                  <li>✓ <span className="font-mono text-indigo-400">GET {basePath}</span> - Get all {resourceName}</li>
                  <li>✓ <span className="font-mono text-indigo-400">GET {basePath}/:id</span> - Get {resourceName} by ID</li>
                  <li>✓ <span className="font-mono text-indigo-400">PUT {basePath}/:id</span> - Update {resourceName}</li>
                  <li>✓ <span className="font-mono text-indigo-400">DELETE {basePath}/:id</span> - Delete {resourceName}</li>
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddEndpoint}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
            >
              Create 5 Endpoints
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
