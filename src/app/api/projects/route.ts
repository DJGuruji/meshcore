import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { ApiProject } from '@/lib/models';
import { authOptions } from '@/lib/auth';

// GET all API projects for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    const projects = await ApiProject.find({ user: session.user.id }).sort({ createdAt: -1 });
    
    // Ensure all projects have authentication objects for backward compatibility
    const processedProjects = projects.map(project => {
      const projectData = project.toObject();
      if (!projectData.authentication) {
        projectData.authentication = {
          enabled: false,
          token: null,
          headerName: 'Authorization',
          tokenPrefix: 'Bearer'
        };
      }
      return projectData;
    });
    
    return NextResponse.json(processedProjects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// CREATE a new API project for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    const data = await request.json();
    
    // Add user ID to the project
    const projectData = {
      ...data,
      user: session.user.id
    };
    
    const project = await ApiProject.create(projectData);
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
