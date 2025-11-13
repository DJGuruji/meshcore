import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { validateTurnstileToken } from '@/lib/turnstile';
import { sendEmail } from '@/lib/email';
import { generateSecureToken } from '@/lib/tokenUtils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { name, email, password, turnstileToken } = await request.json();
    
    // Validate Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification is required' },
        { status: 400 }
      );
    }
    
    const isTurnstileValid = await validateTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Generate email verification token
    const emailVerificationToken = generateSecureToken();
    const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user with default role and email verification fields
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // Default role
      emailVerificationToken,
      emailVerificationTokenExpiry
    });
    
    // Send verification email
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${emailVerificationToken}`;
    
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937;">Welcome to Our Platform!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html: emailHtml,
    });
    
    // Return user without password
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}