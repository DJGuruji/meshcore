'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';

import ProjectPanel from '@/components/ProjectPanel';
import ProjectDetail from '@/components/ProjectDetail';

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseBody: string;
  statusCode: number;
  description?: string;
  requiresAuth?: boolean | null;
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

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Notify header about sidebar state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
      detail: { isOpen: isSidePanelOpen } 
    }));
  }, [isSidePanelOpen]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

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
    } catch (error) {
      toast.error('Failed to create project');
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
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleUpdateProject = async (updatedProject: ApiProject) => {
    try {
      console.log('Updating project:', updatedProject);
      console.log('Authentication state:', updatedProject.authentication);
      
      const response = await axios.put(`/api/projects/${updatedProject._id}`, updatedProject);
      
      console.log('Server response:', response.data);
      
      if (response.data) {
        setProjects(projects.map((project) =>
          project._id === updatedProject._id ? response.data : project
        ));
        setSelectedProject(response.data);
        toast.success('Project updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update project';
      toast.error(errorMessage);
      
      // Revert changes in UI if the API call failed
      if (selectedProject) {
        setSelectedProject({ ...selectedProject });
      }
    }
  };

  // Show hero section for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-slate-900 p-4">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Sadasya
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Create mock servers, test APIs, and boost your development workflow with our powerful suite of tools.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
              <div className="text-yellow-400 text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Mock Server</h3>
              <p className="text-slate-400">
                Create realistic mock APIs in seconds without writing any backend code.
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
              <div className="text-yellow-400 text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">API Tester</h3>
              <p className="text-slate-400">
                Test any REST API endpoint with our intuitive interface and detailed response analysis.
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
              <div className="text-yellow-400 text-3xl mb-3">🛠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Dev Tools</h3>
              <p className="text-slate-400">
                Essential utilities for developers including JSON validators, JWT decoders, and more.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/auth/signin" 
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <Link 
              href="/auth/register" 
              className="px-8 py-3 bg-transparent border-2 border-yellow-400 text-yellow-400 font-medium rounded-lg hover:bg-yellow-400/10 transition-all duration-300"
            >
              Create Account
            </Link>
          </div>
          
          <div className="mt-16 text-slate-500 text-sm">
            <p>Trusted by developers worldwide • 100% Free</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black shadow-lg">
      <div 
        data-aos="fade-right" 
        data-aos-duration="800"
      >
        <ProjectPanel
          projects={projects}
          onProjectClick={(project: ApiProject) => {
            setSelectedProject(project);
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
        />
      </div>
      <div 
        className="flex-1 overflow-auto transition-all duration-300 ease-in-out"
        data-aos="fade-left"
        data-aos-delay="200"
      >
        {selectedProject ? (
          <ProjectDetail project={selectedProject} onUpdateProject={handleUpdateProject} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <div 
              className="max-w-md text-center p-8 rounded-xl bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700"
              data-aos="zoom-in"
              data-aos-delay="400"
            >
              <img 
                src="/globe.svg" 
                alt="API" 
                className="w-24 h-24 mx-auto mb-6 opacity-60 invert"
                data-aos="flip-up"
                data-aos-delay="600"
              />
              <h2 className="text-xl font-medium text-yellow-400 mb-2">No Project Selected</h2>
              <p className="text-slate-400">
                {projects.length > 0 
                  ? 'Select a project from the sidebar or create a new one to get started'
                  : 'Create your first API project to get started'}
              </p>
            </div>
          </div>
        )}
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
    </div>
  );
}