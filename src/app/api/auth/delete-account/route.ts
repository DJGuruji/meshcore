import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Session user ID:', session.user.id);
    
    await connectDB();
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    // Find user and include password for verification
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      console.log('User not found for ID:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.email);

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      console.log('Password is incorrect');
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    console.log('Password verified successfully');

    // Delete the user account
    await User.findByIdAndDelete(session.user.id);

    console.log('Account deleted successfully');

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
