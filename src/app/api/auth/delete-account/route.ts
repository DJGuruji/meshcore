import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { User, ApiProject, ApiEndpoint, MockServerData, Subscription, Payment } from '@/lib/models';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    
    await connectDB();
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    // Find user and include password for verification
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    // Delete the user account
    // Cascading delete for Enterprise Grade: Clean up all user data
    
    // 1. Find all projects belonging to the user
    const projects = await ApiProject.find({ user: session.user.id });
    const projectIds = projects.map(p => p._id);
    
    if (projectIds.length > 0) {
      // 2. Delete all endpoints for these projects
      await ApiEndpoint.deleteMany({ projectId: { $in: projectIds } });
      
      // 3. Delete all mock data for these projects
      await MockServerData.deleteMany({ projectId: { $in: projectIds } });
      
      // 4. Delete the projects themselves
      await ApiProject.deleteMany({ user: session.user.id });
    }
    
    // 5. Delete subscription and payments
    await Subscription.deleteMany({ user: session.user.id });
    await Payment.deleteMany({ user: session.user.id });

    // 6. Finally, delete the user account
    await User.findByIdAndDelete(session.user.id);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
