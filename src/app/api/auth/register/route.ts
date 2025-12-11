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
    
    // Create user with default role, account type, and email verification fields
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // Default role
      accountType: 'free', // Default account type
      emailVerificationToken,
      emailVerificationTokenExpiry
    });
    
    // Send verification email
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${emailVerificationToken}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
          <!-- Header -->
          <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); opacity: 0.8;"></div>
            <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
            <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Welcome to Our Platform!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hello,
            </p>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Thank you for registering with AnyTimeRequest. Please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 30px 0 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #60a5fa; font-size: 14px; text-align: center; margin: 10px 0 0;">
              ${verificationUrl}
            </p>
            
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 20px 0 0;">
              This link will expire in 24 hours.
            </p>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
              If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
              This email was sent to ${email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email Address - AnyTimeRequest',
      html: emailHtml,
    });
    
    // Return user without password
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    
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
