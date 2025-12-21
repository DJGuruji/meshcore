'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, DocumentDuplicateIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { generateEndpointUrl } from '@/lib/urlUtils';
import UsageIndicators from '@/components/UsageIndicators';

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
  fields?: any[];
  dataSource?: string;
  dataSourceMode?: 'full' | 'field' | 'aggregator';
  dataSourceField?: string;
  dataSourceFields?: string[];
  aggregator?: string;
}

interface UsageData {
  storageUsed: number;
  storageLimit: number;
  requestsUsed: number;
  requestsLimit: number;
  accountType: string;
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
  isCreatingProject?: boolean;
  usageData?: UsageData | null;
  isUsageLoading?: boolean;
  onOpenCreateModal?: () => void;
}

export default function ProjectPanel({
  projects,
  onProjectClick,
  onCreateProject,
  onDeleteProject,
  isOpen,
  setIsOpen,
  isMobile,
  isLoading,
  isCreatingProject = false,
  usageData,
  isUsageLoading = true,
  onOpenCreateModal
}: ProjectPanelProps) {
  const PAGE_SIZE = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredProjects.length, PAGE_SIZE]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (visibleCount >= filteredProjects.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredProjects.length)
          );
        }
      },
      { rootMargin: '0px 0px 120px 0px' }
    );

    const node = loadMoreRef.current;
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [visibleCount, filteredProjects.length, PAGE_SIZE]);

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMoreProjects = visibleCount < filteredProjects.length;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div
        className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        z-50
        transition-transform duration-300 ease-in-out
        w-80 h-full bg-[#050915]/95 border-r border-white/5 flex flex-col shadow-[20px_0_60px_rgba(3,7,18,0.65)] backdrop-blur-2xl
      `}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">AnyTimeRequest</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Mock Servers</h2>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="group/btn relative flex items-center space-x-1 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 px-3 py-2 text-xs font-bold text-white shadow-xl shadow-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/60 hover:scale-105"
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              <PlusIcon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Create</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Bars3Icon className="h-4 w-4 text-white/40" />
              </div>
              <input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 hover:border-white/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white"
                >
                  <span className="text-xs">×</span>
                </button>
              )}
            </div>
          </div>

          {usageData && (
            <div className="">
              <UsageIndicators
                storageUsed={usageData.storageUsed}
                storageLimit={usageData.storageLimit}
                requestsUsed={usageData.requestsUsed}
                requestsLimit={usageData.requestsLimit}
                accountType={usageData.accountType}
                isLoading={isUsageLoading}
              />
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-2">
          {isLoading ? (
            <div className="p-4 text-center text-slate-400">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                Loading servers…
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/40">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
                  ⚙️
                </div>
                <h3 className="mb-1 font-medium text-white">
                  {searchQuery ? 'No matching servers found' : 'No mock servers yet'}
                </h3>
                <p className="text-sm text-slate-400">
                  {searchQuery ? `No servers match “${searchQuery}”` : 'Craft your first mock API server to begin.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={onOpenCreateModal}
                    className="group/create relative mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-xl shadow-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/60 hover:scale-105"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/create:translate-x-full" />
                    <span className="relative z-10">Create Server</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              <div className="px-2 text-xs uppercase tracking-[0.4em] text-indigo-200">
                Servers ({filteredProjects.length})
              </div>
              {/* Show loading indicator for new project creation */}
              {isCreatingProject && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
                    <span className="text-sm text-slate-300">Creating new server...</span>
                  </div>
                </div>
              )}
              {visibleProjects.map((project) => (
                <div
                  key={project._id}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                  onClick={() => onProjectClick(project)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 group-hover:opacity-100" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                      </div>
                      <p className="mt-1 flex items-center truncate text-xs text-slate-400">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white">
                          {project.baseUrl}
                        </span>
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-slate-400">
                          {project.endpoints.length} endpoint{project.endpoints.length !== 1 ? 's' : ''}
                        </span>
                        {project.authentication?.enabled && (
                          <span
                            className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-200"
                            title="Authentication enabled"
                          >
                            🔒 Secure
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
                      className="opacity-0 transition-all duration-200 group-hover:opacity-100"
                      title="Delete server"
                    >
                      <TrashIcon className="h-4 w-4 text-slate-500 hover:text-rose-400" />
                    </button>
                  </div>

                  {/* Quick endpoint preview */}
                  {project.endpoints.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2">
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
                            <span className="text-slate-400">{endpoint.statusCode}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyProjectUrl(project, endpoint);
                              }}
                              className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                              title="Copy URL"
                            >
                              <DocumentDuplicateIcon className="h-3 w-3" />
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
              <div ref={loadMoreRef} className="h-6">
                {hasMoreProjects && (
                  <div className="px-4 text-center text-xs text-slate-500">
                    Loading more servers…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/5 p-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Mock API Servers</span>
            <span>{projects.length} total</span>
          </div>
        </div>
      </div>
    </>
  );
}