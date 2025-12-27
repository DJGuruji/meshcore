'use client';

import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import { 
  DocumentTextIcon, 
  ServerStackIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ApiMode {
  id: 'static' | 'crud' | 'custom';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const API_MODES: ApiMode[] = [
  {
    id: 'static',
    title: 'Static GET API',
    description: 'Simple read-only endpoint with predefined JSON response',
    icon: DocumentTextIcon,
    features: [
      'Single GET endpoint',
      'JSON template or custom response',
      'Perfect for mockups and prototypes',
      'No database needed'
    ]
  },
  {
    id: 'crud',
    title: 'CRUD API',
    description: 'Complete Create, Read, Update, Delete endpoints',
    icon: ServerStackIcon,
    features: [
      'Auto-generates 5 endpoints',
      'POST, GET, GET/:id, PUT/:id, DELETE/:id',
      'Field definitions with validation',
      'Full database functionality'
    ]
  },
  {
    id: 'custom',
    title: 'Custom API',
    description: 'Advanced endpoint with data source and transformations',
    icon: Cog6ToothIcon,
    features: [
      'Link to existing POST endpoint',
      'Select specific fields',
      'Aggregations (count, sum, avg)',
      'Filters and conditions'
    ]
  }
];

interface ApiModeSelectorProps {
  onSelectMode: (mode: 'static' | 'crud' | 'custom') => void;
  onCancel: () => void;
}

export default function ApiModeSelector({ onSelectMode, onCancel }: ApiModeSelectorProps) {
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
          className="relative w-full max-w-5xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 p-8 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Choose API Type</h2>
            <p className="text-slate-400">Select the type of API endpoint you want to create</p>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {API_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="group relative bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-indigo-400/40 transition-all duration-300 cursor-pointer"
                  onClick={() => onSelectMode(mode.id)}
                >
                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                      <Icon className="w-8 h-8 text-indigo-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {mode.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 text-center min-h-[40px]">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-300">
                        <span className="mr-2 text-indigo-400">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <button
                    className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white font-semibold hover:scale-[1.02] transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMode(mode.id);
                    }}
                  >
                    Select
                  </button>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all pointer-events-none" />
                </div>
              );
            })}
          </div>

          {/* Cancel Button */}
          <div className="mt-8 text-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-xl border border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
