import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
  
    
    await connectDB();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Find user and include password for verification
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
  
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }



    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {

      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }



    // Update password (the pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();


    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
