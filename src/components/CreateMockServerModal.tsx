'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateMockServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, baseUrl: string) => void;
}

export default function CreateMockServerModal({ isOpen, onClose, onCreate }: CreateMockServerModalProps) {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBaseUrl, setNewProjectBaseUrl] = useState('/api/v1');

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreate(newProjectName.trim(), newProjectBaseUrl.trim());
      setNewProjectName('');
      setNewProjectBaseUrl('/api/v1');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div 
        className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-[#050915]/95 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 group-hover:opacity-100" />
        
        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 h-24 w-24 bg-gradient-to-br from-indigo-500/20 to-transparent blur-2xl" />
        <div className="absolute bottom-0 right-0 h-24 w-24 bg-gradient-to-tl from-purple-500/20 to-transparent blur-2xl" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
              <h3 className="text-xl font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-300 via-purple-300 to-orange-300 bg-clip-text text-transparent">
                Create Mock Server
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-110 hover:rotate-90"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Server Name
              </label>
              <input
                type="text"
                placeholder="My API Server"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Base URL
              </label>
              <input
                type="text"
                placeholder="/api/v1"
                value={newProjectBaseUrl}
                onChange={(e) => setNewProjectBaseUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={!newProjectName.trim()}
                className={`group/btn relative flex-1 overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                  newProjectName.trim()
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-3xl hover:shadow-indigo-500/60 hover:scale-105'
                    : 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                }`}
              >
                {newProjectName.trim() && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                )}
                <span className="relative z-10">Create Server</span>
              </button>
              <button
                onClick={() => {
                  setNewProjectName('');
                  setNewProjectBaseUrl('/api/v1');
                  onClose();
                }}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10 hover:text-white hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}