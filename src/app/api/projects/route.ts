import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { ApiProject, User } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import { sendProjectCreationConfirmation } from '@/lib/email';

// GET all API projects for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // First, get user to determine account type
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    
    // Get user to determine account type
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}