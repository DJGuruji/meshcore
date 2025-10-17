'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { generateEndpointUrl } from '@/lib/urlUtils';

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

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseBody: string;
  statusCode: number;
  description?: string;
  requiresAuth?: boolean | null;
}

interface ProjectPanelProps {
  projects: ApiProject[];
  onProjectClick: (project: ApiProject) => void;
  onCreateProject: (name: string, baseUrl: string) => void;
  onDeleteProject: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  isLoading: boolean;
}

export default function ProjectPanel({
  projects,
  onProjectClick,
  onCreateProject,
  onDeleteProject,
  isOpen,
  setIsOpen,
  isMobile,
  isLoading
}: ProjectPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBaseUrl, setNewProjectBaseUrl] = useState('/api/v1');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectBaseUrl.trim());
      setNewProjectName('');
      setNewProjectBaseUrl('/api/v1');
      setShowCreateForm(false);
    }
  };

  const copyProjectUrl = (project: ApiProject, endpoint: Endpoint) => {
    const fullUrl = generateEndpointUrl(project.name, project.baseUrl, endpoint.path);
    navigator.clipboard.writeText(fullUrl);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isMobile ? 'z-50' : 'z-10'}
        transition-transform duration-300 ease-in-out
        w-80 h-full bg-slate-900 border-r border-slate-700 flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-yellow-400">API Projects</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="space-y-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <input
                type="text"
                placeholder="Base URL (e.g., /api/v1)"
                value={newProjectBaseUrl}
                onChange={(e) => setNewProjectBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-400">
              <div className="animate-pulse">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <p>No projects yet</p>
              <p className="text-sm mt-1">Create your first API project</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-3 cursor-pointer transition-colors"
                  onClick={() => onProjectClick(project)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{project.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{project.baseUrl}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {project.endpoints.length} endpoint{project.endpoints.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This will permanently delete all ${project.endpoints.length} endpoint${project.endpoints.length !== 1 ? 's' : ''} and cannot be undone.`)) {
                          onDeleteProject(project._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick endpoint preview */}
                  {project.endpoints.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {project.endpoints.slice(0, 2).map((endpoint) => (
                        <div key={endpoint._id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${
                              endpoint.method === 'GET' ? 'bg-green-900 text-green-300' :
                              endpoint.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                              endpoint.method === 'PUT' ? 'bg-orange-900 text-orange-300' :
                              endpoint.method === 'PATCH' ? 'bg-purple-900 text-purple-300' :
                              'bg-red-900 text-red-300'
                            }`}>
                              {endpoint.method}
                            </span>
                            <span className="text-slate-300 truncate">{endpoint.path}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyProjectUrl(project, endpoint);
                            }}
                            className="p-1 text-slate-500 hover:text-yellow-400 transition-colors"
                            title="Copy URL"
                          >
                            <DocumentDuplicateIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {project.endpoints.length > 2 && (
                        <div className="text-xs text-slate-500">
                          +{project.endpoints.length - 2} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
