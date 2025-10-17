import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { ApiProject } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// GET a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    await connectDB();
    const project = await ApiProject.findOne({ 
      _id: id, 
      user: session.user.id 
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Ensure authentication object exists for backward compatibility
    const projectData = project.toObject();
    if (!projectData.authentication) {
      projectData.authentication = {
        enabled: false,
        token: null,
        headerName: 'Authorization',
        tokenPrefix: 'Bearer'
      };
    }
    
    return NextResponse.json(projectData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// UPDATE a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    await connectDB();
    const data = await request.json();
    
    console.log('Updating project ID:', id);
    console.log('User ID:', session.user.id);
    console.log('Updating project with data:', JSON.stringify(data, null, 2));
    
    // Validate for duplicate endpoints (same path + method combination)
    if (data.endpoints) {
      const endpointMap = new Map();
      for (const endpoint of data.endpoints) {
        const key = `${endpoint.method}:${endpoint.path}`;
        if (endpointMap.has(key)) {
          return NextResponse.json({ 
            error: 'Duplicate endpoint detected',
            details: `Endpoint ${endpoint.method} ${endpoint.path} already exists in this project`
          }, { status: 400 });
        }
        endpointMap.set(key, true);
      }

      // Clean up endpoint IDs - remove temporary string IDs and let MongoDB generate new ones
      data.endpoints = data.endpoints.map((endpoint: any) => {
        const cleanEndpoint = { ...endpoint };
        // If the ID is a temporary string (starts with 'temp_' or not a valid ObjectId), remove it
        if (typeof cleanEndpoint._id === 'string' && 
            (cleanEndpoint._id.startsWith('temp_') || !mongoose.Types.ObjectId.isValid(cleanEndpoint._id))) {
          delete cleanEndpoint._id;
        }
        return cleanEndpoint;
      });
    }
    
    console.log('Data being saved to database:', JSON.stringify(data, null, 2));
    
    // Build update object explicitly to ensure authentication is saved
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only update fields that are provided
    if (data.name !== undefined) updateData.name = data.name;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.endpoints !== undefined) updateData.endpoints = data.endpoints;
    
    // Handle authentication object explicitly
    if (data.authentication !== undefined) {
      updateData.authentication = data.authentication;
      console.log('Explicitly setting authentication:', data.authentication);
    }
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    
    const project = await ApiProject.findOneAndUpdate(
      { _id: id, user: session.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('Project after update:', JSON.stringify(project, null, 2));
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ 
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    await connectDB();
    const project = await ApiProject.findOneAndDelete({ 
      _id: id, 
      user: session.user.id 
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
