'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';

import ProjectPanel from '@/components/ProjectPanel';
import ProjectDetail from '@/components/ProjectDetail';
import { useNavigationState } from '@/contexts/NavigationStateContext';
import SEOContent from '@/components/SEOContent';
import CreateMockServerModal from '@/components/CreateMockServerModal';

// Simplified type definitions for API data
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
  aggregator?: string | null;
}

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

// Type conversion function to ensure compatibility with ProjectDetail component
const convertApiProject = (project: any): any => {
  return {
    ...project,
    endpoints: project.endpoints?.map((endpoint: any) => ({
      ...endpoint,
      aggregator: endpoint.aggregator || null,
    })) || [],
  };
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { state, updateState } = useNavigationState();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false); // New state for project creation
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [usageData, setUsageData] = useState({
    storageUsed: 0,
    storageLimit: 10 * 1024 * 1024,
    requestsUsed: 0,
    requestsLimit: 300,
    accountType: 'free'
  });
  // State for the create mock server modal
  const [showCreateMockServerModal, setShowCreateMockServerModal] = useState(false);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // We'll handle this in the render function now
    }
  }, [status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for sidebar open events from header
    const handleOpenSidebar = (event: CustomEvent) => {
      setIsSidePanelOpen(event.detail.isOpen);
    };

    window.addEventListener('openSidebar', handleOpenSidebar as EventListener);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('openSidebar', handleOpenSidebar as EventListener);
    };
  }, []);

  // Check for cookie consent when user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowCookieConsent(true);
      }
    }
  }, [status]);

  const fetchUsage = async () => {
    if (status !== 'authenticated') return;
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageData({
          storageUsed: data.storageUsed,
          storageLimit: data.storageLimit,
          requestsUsed: data.requestsUsed,
          requestsLimit: data.requestsLimit,
          accountType: data.accountType
        });
      }
    } catch (error) {
      // Silently handle errors in production
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [status]);

  // Notify header about sidebar state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
      detail: { isOpen: isSidePanelOpen } 
    }));
  }, [isSidePanelOpen]);

  useEffect(() => {
    if (status === 'authenticated' && !showCookieConsent) {
      fetchProjects();
    }
  }, [status, showCookieConsent]);

  // Restore selected project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && state.selectedProjectId) {
      const project = projects.find(p => p._id === state.selectedProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projects, state.selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (name: string, baseUrl: string) => {
    try {
      setIsCreatingProject(true); // Set loading state
      const response = await axios.post('/api/projects', { 
        name, 
        baseUrl,
        endpoints: [],
        authentication: {
          enabled: false,
          token: null,
          headerName: 'Authorization',
          tokenPrefix: 'Bearer'
        }
      });
      setProjects([response.data, ...projects]);
      setSelectedProject(response.data);
      toast.success('Project created successfully');
      // Refresh usage data after creating a project
      fetchUsage();
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreatingProject(false); // Reset loading state
      setShowCreateMockServerModal(false); // Close the modal
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await axios.delete(`/api/projects/${id}`);
      setProjects(projects.filter((project) => project._id !== id));
      if (selectedProject?._id === id) {
        setSelectedProject(null);
      }
      toast.success('Project deleted successfully');
      // Refresh usage data after deleting a project
      fetchUsage();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleUpdateProject = async (updatedProject: any) => {
    const previousProjects = projects;
    const previousSelected = selectedProject;

    setProjects((prev) =>
      prev.map((project) =>
        project._id === updatedProject._id ? updatedProject : project
      )
    );
    setSelectedProject(updatedProject);

    try {
      const response = await axios.put(`/api/projects/${updatedProject._id}`, updatedProject);
      
      if (response.data) {
        setProjects((prev) =>
          prev.map((project) =>
            project._id === updatedProject._id ? response.data : project
          )
        );
        setSelectedProject(response.data);
        updateState({ selectedProjectId: response.data._id });
        toast.success('Project updated successfully');
        // Refresh usage data after updating a project
        fetchUsage();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update project';
      toast.error(errorMessage);
      setProjects(previousProjects);
      setSelectedProject(previousSelected || null);
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
  };

  const handleRejectCookies = () => {
    // Redirect to sign out if cookies are rejected
    router.push('/auth/signin');
  };

  // Show hero section for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-4 py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" />
            Build. Test. Iterate.
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
            Ship APIs faster with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">AnyTimeRequest</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300 sm:text-xl">
            Spin up mock servers, validate payloads, explore GraphQL, and stress test your workflows—everything you need to
            move from idea to production without friction.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '⚡', title: 'Mock Server', desc: 'Design endpoints with auth, payloads, and status codes instantly.' },
              { icon: '🧪', title: 'API Tester', desc: 'Send requests, inspect responses, and share collections effortlessly.' },
              { icon: '🧰', title: 'GraphQL tester', desc: 'Run GraphQL queries and mutations with schema introspection, variables, and real-time results.' },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-[0_20px_50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(15,23,42,0.7)] hover:-translate-y-1 group"
              >
                <div className="text-3xl transform transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signin"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Enter Workspace
              <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 20 20" fill="none">
                <path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-700 bg-gray-800/50 px-8 py-3 text-base font-semibold text-gray-200 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-gray-800/70 hover:text-white hover:-translate-y-0.5"
            >
              Create free account
            </Link>
          </div>

          {/* Add Pricing button here */}
          <div className="mt-6">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Pricing
            </Link>
          </div>

          <div className="mt-12 grid gap-4 text-left text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-white/10 hover:-translate-y-1">Unlimited workspaces</div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-white/10 hover:-translate-y-1">Collaboration ready</div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-white/10 hover:-translate-y-1">Free API Tester</div>
          </div>
        </div>

        <SEOContent />
      </div>
    );
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-xl shadow-black/50">
          Preparing your workspace…
        </div>
      </div>
    );
  }

  // Show cookie consent popup
  if (status === 'authenticated' && showCookieConsent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#050915]/95 p-8 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-6">
              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold">We Use Cookies</h2>
            
            <div className="mt-6 text-slate-300">
              <p className="mb-4">
                This website uses cookies to enhance your browsing experience and provide personalized content. 
                By clicking "Accept Cookies", you consent to our use of cookies in accordance with our{' '}
                <Link href="/privacy" className="text-indigo-300 hover:text-white underline">
                  Privacy Policy
                </Link>.
              </p>
              
              <p className="text-sm">
                Cookies help us understand how you interact with our website and improve your experience. 
                You must accept cookies to use this site.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleAcceptCookies}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
              >
                Accept Cookies
              </button>
              
              <button
                onClick={handleRejectCookies}
                className="rounded-2xl border border-white/10 px-8 py-3 text-base font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Reject (Sign Out)
              </button>
            </div>
            
            <div className="mt-6 text-xs text-slate-400">
              <p>
                By using our website, you agree to our{' '}
                <Link href="/terms" className="text-indigo-300 hover:text-white underline">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-300 hover:text-white underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>
      <div className="relative m-4 flex h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-white/5 bg-white/5 p-0 shadow-[0_25px_80px_rgba(2,6,23,0.9)] backdrop-blur-2xl">
      <div 
        data-aos="fade-right" 
        data-aos-duration="800"
        className="relative z-40"
      >
        <ProjectPanel
          projects={projects.map(convertApiProject)}
          onProjectClick={(project: any) => {
            setSelectedProject(convertApiProject(project));
            // Save selected project ID to navigation state
            updateState({ selectedProjectId: project._id });
            // Close sidebar in mobile view when a project is selected
            if (isMobile) {
              setIsSidePanelOpen(false);
            }
          }}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          isMobile={isMobile}
          isOpen={isSidePanelOpen}
          setIsOpen={setIsSidePanelOpen}
          isLoading={isLoading}
          isCreatingProject={isCreatingProject} // Pass the new prop
          usageData={usageData}
          onOpenCreateModal={() => setShowCreateMockServerModal(true)}
        />
      </div>
      <div 
        className="flex-1 overflow-auto transition-all duration-300 ease-in-out z-30"
        data-aos="fade-left"
        data-aos-delay="200"
      >
        {selectedProject ? (
          <ProjectDetail project={selectedProject ? convertApiProject(selectedProject) : null} onUpdateProject={handleUpdateProject} refreshUsage={fetchUsage} />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-10 text-slate-300">
            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-10 text-center shadow-[0_25px_80px_rgba(2,6,23,0.8)]"
              data-aos="zoom-in"
              data-aos-delay="400"
            >
              <div className="absolute inset-0 border border-white/5" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.4em] text-indigo-200">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" />
                  Workspace idle
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-white">No project selected</h2>
                <p className="mt-3 text-sm text-slate-300">
                  {projects.length > 0
                    ? 'Choose a project on the left to continue building, or craft a new mock server.'
                    : 'Create your first API space to design endpoints, configure auth, and collaborate.'}
                </p>
                
                {/* Display account type for authenticated users */}
                {status === 'authenticated' && session?.user && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <p className="text-indigo-200">
                      Account Type: <span className="font-semibold capitalize">{session.user.accountType || 'free'}</span>
                    </p>
                    {session.user.accountType === 'free' && (
                      <p className="mt-2 text-xs text-slate-400">
                        Upgrade to unlock premium features
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-10 grid gap-4 text-left text-xs text-slate-300 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-200">Endpoints</p>
                    <p className="mt-2 text-lg font-semibold text-white">Dynamic</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-200">Security</p>
                    <p className="mt-2 text-lg font-semibold text-white">JWT & Keys</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-200">Sharing</p>
                    <p className="mt-2 text-lg font-semibold text-white">Live Links</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderColor: '#334155'
          }
        }}
      />
      
      {/* Create Mock Server Modal - Rendered at the root level to ensure proper positioning */}
      <CreateMockServerModal
        isOpen={showCreateMockServerModal}
        onClose={() => setShowCreateMockServerModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}