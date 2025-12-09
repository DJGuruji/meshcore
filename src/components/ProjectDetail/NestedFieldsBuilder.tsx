'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

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

interface NestedFieldsBuilderProps {
  fields: EndpointField[];
  onChange: (fields: EndpointField[]) => void;
  depth?: number;
  title?: string;
  subtitle?: string;
}

const createEmptyFieldDefinition = (): EndpointField => ({
  name: '',
  type: 'string',
  required: false,
  description: '',
  nestedFields: [],
  arrayItemType: undefined
});

export default function NestedFieldsBuilder({ fields, onChange, depth = 0, title, subtitle }: NestedFieldsBuilderProps) {
  const [draftField, setDraftField] = useState<EndpointField>(createEmptyFieldDefinition());
  const optionClasses = 'text-slate-900';

  const handleDraftTypeChange = (value: EndpointField['type']) => {
    setDraftField((prev) => ({
      ...prev,
      type: value,
      nestedFields: value === 'object' ? prev.nestedFields : [],
      arrayItemType: value === 'array' ? prev.arrayItemType || 'object' : undefined
    }));
  };

  const handleAddNestedField = () => {
    if (!draftField.name.trim()) {
      alert('Nested field name is required');
      return;
    }

    if (fields.some((field) => field.name === draftField.name)) {
      alert(`Field "${draftField.name}" already exists in this level`);
      return;
    }

    if (draftField.type === 'array' && !draftField.arrayItemType) {
      alert('Please select an item type for the array');
      return;
    }

    const normalizedDraft: EndpointField = {
      ...draftField,
      nestedFields:
        draftField.type === 'object' || (draftField.type === 'array' && draftField.arrayItemType === 'object')
          ? draftField.nestedFields || []
          : [],
      arrayItemType: draftField.type === 'array' ? draftField.arrayItemType : undefined
    };

    onChange([...fields, normalizedDraft]);
    setDraftField(createEmptyFieldDefinition());
  };

  const updateFieldAtIndex = (index: number, updatedField: EndpointField) => {
    const updated = fields.map((field, idx) => (idx === index ? updatedField : field));
    onChange(updated);
  };

  const handleRemoveNestedField = (index: number) => {
    const updated = [...fields];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleNestedFieldsChange = (index: number, nested: EndpointField[]) => {
    const target = fields[index];
    updateFieldAtIndex(index, {
      ...target,
      nestedFields: nested
    });
  };

  const handleArrayItemTypeChange = (index: number, value: EndpointField['type']) => {
    const target = fields[index];
    updateFieldAtIndex(index, {
      ...target,
      arrayItemType: value,
      nestedFields: value === 'object' ? target.nestedFields || [] : []
    });
  };

  return (
    <div className={`${depth === 0 ? 'mt-2' : 'mt-3'} rounded-2xl border border-dashed border-white/10 bg-white/5 p-3`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">
          {title || (depth === 0 ? 'Nested Fields' : 'Child Fields')}
        </p>
        {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Field Name</label>
          <input
            type="text"
            placeholder="e.g., street"
            value={draftField.name}
            onChange={(e) => setDraftField({ ...draftField, name: e.target.value })}
            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
          <select
            value={draftField.type}
            onChange={(e) => handleDraftTypeChange(e.target.value as EndpointField['type'])}
            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            <option className={optionClasses} value="string">String</option>
            <option className={optionClasses} value="number">Number</option>
            <option className={optionClasses} value="boolean">Boolean</option>
            <option className={optionClasses} value="object">Object</option>
            <option className={optionClasses} value="array">Array</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Required</label>
          <select
            value={draftField.required ? 'required' : 'optional'}
            onChange={(e) => setDraftField({ ...draftField, required: e.target.value === 'required' })}
            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            <option className={optionClasses} value="optional">Optional</option>
            <option className={optionClasses} value="required">Required</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddNestedField}
            className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
        <input
          type="text"
          placeholder="Nested field description"
          value={draftField.description}
          onChange={(e) => setDraftField({ ...draftField, description: e.target.value })}
          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
        />
      </div>

      {fields.length > 0 && (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={`${field.name}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-mono text-white">{field.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">{field.type}</span>
                    {field.type === 'array' && field.arrayItemType && (
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
                        items: {field.arrayItemType}
                      </span>
                    )}
                    {field.required && (
                      <span className="px-1.5 py-0.5 bg-red-900 text-red-300 rounded">required</span>
                    )}
                    {field.description && <span className="italic">{field.description}</span>}
                    {field.nestedFields && field.nestedFields.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
                        {field.nestedFields.length} nested
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNestedField(index)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {field.type === 'array' && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Array Item Type</label>
                    <select
                      value={field.arrayItemType || 'string'}
                      onChange={(e) => handleArrayItemTypeChange(index, e.target.value as EndpointField['type'])}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    >
                      <option className={optionClasses} value="string">String</option>
                      <option className={optionClasses} value="number">Number</option>
                      <option className={optionClasses} value="boolean">Boolean</option>
                      <option className={optionClasses} value="object">Object</option>
                      <option className={optionClasses} value="array">Array</option>
                    </select>
                  </div>
                  {field.arrayItemType === 'object' && (
                    <NestedFieldsBuilder
                      fields={field.nestedFields || []}
                      onChange={(nested) => handleNestedFieldsChange(index, nested)}
                      depth={depth + 1}
                    />
                  )}
                </div>
              )}

              {field.type === 'object' && (
                <NestedFieldsBuilder
                  fields={field.nestedFields || []}
                  onChange={(nested) => handleNestedFieldsChange(index, nested)}
                  depth={depth + 1}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};