import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { ApiProject } from '@/lib/models';
import { User } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import axios from 'axios';
import cacheService from '@/lib/cacheService';

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
    
    // Try to get cached response first
    const cacheKey = `project_${id}_${session.user.id}`;
    
    try {
      const cachedProject = await cacheService.get(cacheKey);
      if (cachedProject) {
        console.log(`Cache hit for project: ${cacheKey}`);
        return NextResponse.json(cachedProject);
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    await connectDB();
    
    // Check if user is blocked (need to get user first)
    const user = await User.findById(session.user.id);
    if (user && user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
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
    
    // Cache the response for 5 minutes
    try {
      await cacheService.set(cacheKey, projectData, { ttl: 300 }); // 5 minutes
      console.log(`Cached project: ${cacheKey}`);
    } catch (cacheError) {
      console.error('Cache storage error:', cacheError);
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
    
    // Check if user is blocked (user will be fetched later for storage limit check)
    const userCheck = await User.findById(session.user.id);
    if (userCheck && userCheck.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
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
        
        // Handle dataSource field - remove if empty string
        if (cleanEndpoint.dataSource === '') {
          delete cleanEndpoint.dataSource;
        }
        
        return cleanEndpoint;
      });
    }
    
    console.log('Data being saved to database:', JSON.stringify(data, null, 2));
    
    // Get the existing project to calculate size difference
    const existingProject = await ApiProject.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Calculate the size difference between old and new project definitions
    const oldProjectSize = Buffer.byteLength(JSON.stringify(existingProject), 'utf8');
    const newProjectSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    const sizeDifference = newProjectSize - oldProjectSize;
    
    // Get user for storage limit check
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is blocked
    if (user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
    // Check storage limit if the project is getting larger
    if (sizeDifference > 0) {
      const currentUsage = user.storageUsage || 0;
      let maxStorage = 10 * 1024 * 1024; // Default to 10 MB for free tier
      switch (user.accountType) {
        case 'free':
          maxStorage = 10 * 1024 * 1024; // 10 MB
          break;
        case 'freemium':
          maxStorage = 200 * 1024 * 1024; // 200 MB
          break;
        case 'pro':
          maxStorage = 1024 * 1024 * 1024; // 1 GB
          break;
        case 'ultra-pro':
          maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB
          break;
      }
      
      const newTotalUsage = currentUsage + sizeDifference;
      if (newTotalUsage > maxStorage) {
        return NextResponse.json({ 
          error: 'Storage limit exceeded', 
          message: `Updating this project would exceed your storage limit of ${Math.round(maxStorage / (1024 * 1024))} MB for your ${user.accountType} account.`
        }, { status: 400 });
      }
    }
    
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
    
    // Update user's storage usage if project size changed
    if (sizeDifference !== 0) {
      try {
        const currentUsage = user.storageUsage || 0;
        const newUsage = Math.max(0, currentUsage + sizeDifference);
        await User.findByIdAndUpdate(session.user.id, { 
          storageUsage: newUsage 
        });
      } catch (storageError) {
        console.error('Error updating storage usage:', storageError);
      }
    }
    
    // Invalidate cache for this project and user's projects list
    try {
      const projectCacheKey = `project_${id}_${session.user.id}`;
      const userProjectsCacheKey = `user_projects_${session.user.id}`;
      
      await cacheService.del(projectCacheKey);
      await cacheService.del(userProjectsCacheKey);
      
      console.log(`Invalidated cache for project: ${projectCacheKey}`);
      console.log(`Invalidated cache for user projects: ${userProjectsCacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
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
    
    const userDoc = await User.findById(session.user.id);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is blocked
    if (userDoc.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
    const project = await ApiProject.findOneAndDelete({ 
      _id: id, 
      user: session.user.id 
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Update user's storage usage to subtract the project definition size
    try {
      const projectSize = Buffer.byteLength(JSON.stringify(project), 'utf8');
      const currentUsage = userDoc.storageUsage || 0;
      const newUsage = Math.max(0, currentUsage - projectSize);
      await User.findByIdAndUpdate(session.user.id, { 
        storageUsage: newUsage 
      });
    } catch (storageError) {
      console.error('Error updating storage usage:', storageError);
    }
    
    // Invalidate cache for this project and user's projects list
    try {
      const projectCacheKey = `project_${id}_${session.user.id}`;
      const userProjectsCacheKey = `user_projects_${session.user.id}`;
      
      await cacheService.del(projectCacheKey);
      await cacheService.del(userProjectsCacheKey);
      
      console.log(`Invalidated cache for project: ${projectCacheKey}`);
      console.log(`Invalidated cache for user projects: ${userProjectsCacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
