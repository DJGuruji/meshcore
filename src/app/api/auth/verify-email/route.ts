import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid-token', request.url));
    }
    
    // Find user with the verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid-or-expired-token', request.url));
    }
    
    // Update user as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();
    
    // Redirect to sign in page with success message
    return NextResponse.redirect(new URL('/auth/signin?verified=true', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/signin?error=verification-failed', request.url));
  }
}
