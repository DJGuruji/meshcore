'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { defaultJsonTemplates, generateRandomJson } from '@/lib/jsonGenerator';

interface StaticApiFormProps {
  project: any;
  newEndpoint: any;
  setNewEndpoint: (endpoint: any) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  handleAddEndpoint: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function StaticApiForm({
  project,
  newEndpoint,
  setNewEndpoint,
  validationErrors,
  setValidationErrors,
  handleAddEndpoint,
  onBack,
  onCancel
}: StaticApiFormProps) {
  const inputStyles = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30';
  const textareaStyles = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30';
  const optionStyles = 'text-slate-900 bg-white';
  const labelStyles = 'mb-2 block text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent';

  const generateJsonFromTemplate = (templateName: string) => {
    const template = defaultJsonTemplates.find(t => t.name === templateName);
    if (template) {
      return generateRandomJson(template);
    }
    return '{"message": "Hello World"}';
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
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl pointer-events-auto"
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
              <h2 className="text-2xl font-bold text-white">Static GET API</h2>
            </div>
            <p className="text-sm text-slate-400 ml-14">Create a simple read-only endpoint with predefined JSON response</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Path */}
            <div>
              <label className={labelStyles}>Path *</label>
              <input
                type="text"
                placeholder="/users"
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

            {/* JSON Template Selector */}
            <div>
              <label className={labelStyles}>Generate JSON Template</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setNewEndpoint({ 
                      ...newEndpoint, 
                      responseBody: generateJsonFromTemplate(e.target.value) 
                    });
                  }
                }}
                className={inputStyles}
              >
                <option className={optionStyles} value="">Select template...</option>
                {defaultJsonTemplates.map((template) => (
                  <option className={optionStyles} key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom JSON */}
            <div>
              <label className={labelStyles}>Response Body (JSON) *</label>
              <textarea
                value={newEndpoint.responseBody}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, responseBody: e.target.value })}
                rows={8}
                className={textareaStyles}
                placeholder='{"message": "Hello World"}'
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelStyles}>Description (optional)</label>
              <input
                type="text"
                placeholder="Endpoint description"
                value={newEndpoint.description}
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
