'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, TrashIcon, DocumentDuplicateIcon, Bars3Icon } from '@heroicons/react/24/outline';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) || 
      project.baseUrl.toLowerCase().includes(query) ||
      project.endpoints.some(endpoint => 
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.method.toLowerCase().includes(query) ||
        (endpoint.description && endpoint.description.toLowerCase().includes(query))
      )
    );
  }, [projects, searchQuery]);

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
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-black"></div>
              </div>
              <h2 className="text-lg font-semibold text-yellow-400">Mock Servers</h2>
            </div>
          
            <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="p-2 bg-black text-white font-bold text-md rounded-md hover:bg-slate-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          data-aos="zoom-in"
          data-aos-delay="300"
        >
          Create Project
        </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Bars3Icon className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-yellow-400"
                >
                  <span className="text-xs">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="space-y-3 p-3 bg-slate-800 rounded-lg border border-slate-600 mb-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="My API Server"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Base URL</label>
                <input
                  type="text"
                  placeholder="/api/v1"
                  value={newProjectBaseUrl}
                  onChange={(e) => setNewProjectBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    newProjectName.trim()
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Create Server
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                    setNewProjectBaseUrl('/api/v1');
                  }}
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
              <div className="animate-pulse">Loading servers...</div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <div className="mx-auto bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-600"></div>
              </div>
              <h3 className="font-medium text-slate-300 mb-1">
                {searchQuery ? 'No matching servers found' : 'No mock servers yet'}
              </h3>
              <p className="text-sm">
                {searchQuery 
                  ? `No servers match your search for "${searchQuery}"` 
                  : 'Create your first mock API server'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors text-sm font-medium"
                >
                  Create Server
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-3">
              <div className="text-xs text-slate-500 px-2 flex items-center">
                YOUR SERVERS ({filteredProjects.length})
              </div>
              {filteredProjects.map((project) => (
                <div
                  key={project._id}
                  className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-slate-600"
                  onClick={() => onProjectClick(project)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <h3 className="font-medium text-white truncate text-sm">{project.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1 flex items-center">
                        <span className="bg-slate-700 px-1.5 py-0.5 rounded mr-1">{project.baseUrl}</span>
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-slate-500">
                          {project.endpoints.length} endpoint{project.endpoints.length !== 1 ? 's' : ''}
                        </span>
                        {project.authentication?.enabled && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-900 text-green-300 rounded" title="Authentication enabled">
                            🔒
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete the server "${project.name}"? This will permanently delete all ${project.endpoints.length} endpoint${project.endpoints.length !== 1 ? 's' : ''} and cannot be undone.`)) {
                          onDeleteProject(project._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all"
                      title="Delete server"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick endpoint preview */}
                  {project.endpoints.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700 space-y-1.5">
                      {project.endpoints.slice(0, 2).map((endpoint) => (
                        <div key={endpoint._id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                              endpoint.method === 'GET' ? 'bg-green-900 text-green-300' :
                              endpoint.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                              endpoint.method === 'PUT' ? 'bg-orange-900 text-orange-300' :
                              endpoint.method === 'PATCH' ? 'bg-purple-900 text-purple-300' :
                              'bg-red-900 text-red-300'
                            }`}>
                              {endpoint.method}
                            </span>
                            <span className="text-slate-300 truncate max-w-[80px]">{endpoint.path}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-500">{endpoint.statusCode}</span>
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
        
        {/* Footer */}
        <div className="p-3 border-t border-slate-700 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Mock API Servers</span>
            <span>{projects.length} total</span>
          </div>
        </div>
      </div>
    </>
  );
}