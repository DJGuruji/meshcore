import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { ApiProject, User } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import { sendProjectCreationConfirmation } from '@/lib/email';
import axios from 'axios';
import cacheService from '@/lib/cacheService';
import mongoose from 'mongoose';

// GET all API projects for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('GET Session user ID:', session.user.id);
    
    // Try to get cached response first
    const cacheKey = `user_projects_${session.user.id}`;
    
    try {
      const cachedProjects = await cacheService.get(cacheKey);
      if (cachedProjects) {
        console.log(`Cache hit for user projects: ${cacheKey}`);
        return NextResponse.json(cachedProjects);
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    await connectDB();
    
    // First, get user to determine account type
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is blocked
    if (user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
    // Find all projects for the user
    const projects = await ApiProject.find({ user: session.user.id }).sort({ createdAt: -1 });
    
    // Filter out expired projects
    const now = new Date();
    const validProjects = projects.filter(project => {
      // If expiresAt is null, project never expires (ultra-pro)
      if (!project.expiresAt) return true;
      // If expiresAt is in the future, project is still valid
      return project.expiresAt > now;
    });
    
    // Update expiration dates for existing projects if user upgraded their account
    const updatePromises = validProjects.map(async (project) => {
      // Only update if the project doesn't have an expiration date (ultra-pro) or if it's about to expire
      if (project.expiresAt && project.expiresAt > now) {
        let newExpiresAt = project.expiresAt;
        
        switch (user.accountType) {
          case 'free':
            // If project was created under a higher tier but user downgraded, set to 2 weeks
            if (project.expiresAt > new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) {
              newExpiresAt = new Date(project.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
            }
            break;
          case 'freemium':
            // If project was created under a higher tier but user downgraded, set to 2 months
            if (project.expiresAt > new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) {
              newExpiresAt = new Date(project.createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);
            }
            break;
          case 'pro':
            // If project was created under a higher tier but user downgraded, set to 1 year
            if (project.expiresAt > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
              newExpiresAt = new Date(project.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
            }
            break;
          case 'ultra-pro':
            // Ultra-pro projects never expire
            newExpiresAt = null;
            break;
        }
        
        // Only update if the expiration date has changed
        if (newExpiresAt !== project.expiresAt) {
          await ApiProject.findByIdAndUpdate(project._id, { expiresAt: newExpiresAt });
        }
      }
      
      return project;
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Re-fetch projects with updated expiration dates
    const updatedProjects = await ApiProject.find({ user: session.user.id }).sort({ createdAt: -1 });
    
    // Filter out expired projects again after updates
    const finalProjects = updatedProjects.filter(project => {
      // If expiresAt is null, project never expires (ultra-pro)
      if (!project.expiresAt) return true;
      // If expiresAt is in the future, project is still valid
      return project.expiresAt > now;
    });
    
    // Ensure all projects have authentication objects for backward compatibility
    const processedProjects = finalProjects.map(project => {
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
    
    // Cache the response for 5 minutes
    try {
      await cacheService.set(cacheKey, processedProjects, { ttl: 300 }); // 5 minutes
      console.log(`Cached user projects: ${cacheKey}`);
    } catch (cacheError) {
      console.error('Cache storage error:', cacheError);
    }
    
    return NextResponse.json(processedProjects);
  } catch (error: unknown) {
    console.error('Project fetch error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Failed to fetch projects', 
        message: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch projects', 
      message: 'Unknown error occurred'
    }, { status: 500 });
  }
}

// CREATE a new API project for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('POST Session user ID:', session.user.id);
    
    await connectDB();
    const data = await request.json();
    
    // Get user to determine account type
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is blocked
    if (user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }
    
    // Check project limit based on account type
    const userProjects = await ApiProject.find({ user: session.user.id });
    const projectCount = userProjects.length;
    
    let maxProjects = 2; // Default to free tier
    switch (user.accountType) {
      case 'free':
        maxProjects = 2;
        break;
      case 'freemium':
        maxProjects = 5;
        break;
      case 'pro':
        maxProjects = 10;
        break;
      case 'ultra-pro':
        // Unlimited projects for ultra-pro
        break;
    }
    
    // Check if user has reached their project limit (except for ultra-pro)
    if (user.accountType !== 'ultra-pro' && projectCount >= maxProjects) {
      return NextResponse.json({ 
        error: 'Project limit reached', 
        message: `You have reached your maximum project limit of ${maxProjects} for your ${user.accountType} account. Please upgrade your account to create more projects.`
      }, { status: 400 });
    }
    
    // Check storage limit - even if storage is full, allow project creation (read-only mode)
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
    
    const currentUsage = user.storageUsage || 0;
    if (currentUsage > maxStorage) {
      // Add a note that the user is in read-only mode
      console.log(`User ${user._id} is in read-only mode due to storage limit exceeded`);
    }
    
    // Calculate the size of the project definition to check against storage limits
    const projectDefinitionSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    const newTotalUsage = currentUsage + projectDefinitionSize;
    
    if (newTotalUsage > maxStorage) {
      return NextResponse.json({ 
        error: 'Storage limit exceeded', 
        message: `Adding this project would exceed your storage limit of ${Math.round(maxStorage / (1024 * 1024))} MB for your ${user.accountType} account.`
      }, { status: 400 });
    }
    
    // Calculate expiration date based on account type
    let expiresAt = null;
    const createdAt = new Date();
    
    switch (user.accountType) {
      case 'free':
        // Expires in 2 weeks
        expiresAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'freemium':
        // Expires in 2 months
        expiresAt = new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);
        break;
      case 'pro':
        // Expires in 1 year
        expiresAt = new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case 'ultra-pro':
        // Never expires
        expiresAt = null;
        break;
      default:
        // Default to free account expiration
        expiresAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    
    // Add user ID and expiration date to the project
    const projectData = {
      ...data,
      user: session.user.id,
      expiresAt
    };
    
    const project = await ApiProject.create(projectData);
    
    // Update user's storage usage to include the project definition size
    try {
      await User.findByIdAndUpdate(session.user.id, { 
        storageUsage: newTotalUsage 
      });
    } catch (storageError) {
      console.error('Error updating storage usage:', storageError);
    }
    
    // Invalidate cache for this user's projects
    try {
      const cacheKey = `user_projects_${session.user.id}`;
      await cacheService.del(cacheKey);
      console.log(`Invalidated cache for user projects: ${cacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }
    
    // Send project creation confirmation email
    if (user.email) {
      try {
        await sendProjectCreationConfirmation(
          user.email,
          project.name,
          user.accountType,
          project.expiresAt
        );
      } catch (emailError) {
        console.error('Failed to send project creation email:', emailError);
      }
    }
    
    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error('Project creation error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check if it's a Mongoose validation error
      if ('errors' in error && error.name === 'ValidationError') {
        const errors: string[] = [];
        Object.keys((error as any).errors).forEach(key => {
          errors.push((error as any).errors[key].message);
        });
        return NextResponse.json({ 
          error: 'Validation failed', 
          details: errors,
          message: 'Please check the project data and try again'
        }, { status: 400 });
      }
      
      // Check if it's a Mongoose cast error
      if (error.name === 'CastError') {
        return NextResponse.json({ 
          error: 'Invalid data format', 
          message: 'Please check the project data and try again'
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create project', 
        message: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create project', 
      message: 'Unknown error occurred'
    }, { status: 500 });
  }
}