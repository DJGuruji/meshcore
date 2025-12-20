'use client';

import { useState, useEffect } from 'react';

type AggregatorType = '' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'total';

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
  required: boolean;
  description?: string;
  // For nested object validation
  nestedFields?: EndpointField[];
  // For array validation
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
}

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

const aggregatorOptions = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'total', label: 'Total' }
];

export default function CustomApiOptions({
  mode,
  fields,
  aggregator,
  availableFields,
  onModeChange,
  onFieldsChange,
  onAggregatorChange
}: CustomApiOptionsProps) {
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