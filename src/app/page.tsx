'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

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
      router.push('/auth/signin');
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

  // Show loading state or redirect to login
  if (status === 'loading' || status === 'unauthenticated') {
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
