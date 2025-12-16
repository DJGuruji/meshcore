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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#050915]/95 p-6 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Create Mock Server</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Server Name</label>
            <input
              type="text"
              placeholder="My API Server"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Base URL</label>
            <input
              type="text"
              placeholder="/api/v1"
              value={newProjectBaseUrl}
              onChange={(e) => setNewProjectBaseUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={!newProjectName.trim()}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                newProjectName.trim()
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.01]'
                  : 'cursor-not-allowed border border-white/5 bg-white/5 text-slate-400'
              }`}
            >
              Create Server
            </button>
            <button
              onClick={() => {
                setNewProjectName('');
                setNewProjectBaseUrl('/api/v1');
                onClose();
              }}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}