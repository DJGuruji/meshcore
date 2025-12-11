import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { User, ApiProject, MockServerData } from '@/lib/models';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // Get user with storage usage
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate storage usage
    let storageUsed = user.storageUsage || 0;
    
    // Calculate daily requests used in current 24-hour window
    let requestsUsed = 0;
    
    // Check if we need to reset the counter
    const now = new Date();
    const lastReset = user.lastRequestReset ? new Date(user.lastRequestReset) : null;
    
    if (lastReset) {
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
      
      // If less than 24 hours have passed, get the current count
      if (hoursSinceReset < 24) {
        const currentWindowKey = lastReset.toISOString();
        requestsUsed = user.dailyRequests[currentWindowKey] || 0;
      }
      // If 24 hours or more have passed, the count is 0 (will be reset on next API request)
    }
    
    // Calculate limits based on account type
    let storageLimit = 10 * 1024 * 1024; // Default to 10MB for free tier
    let requestsLimit = 300; // Default to 300 for free tier
    
    switch (user.accountType) {
      case 'free':
        storageLimit = 10 * 1024 * 1024; // 10 MB
        requestsLimit = 300;
        break;
      case 'plus':
        storageLimit = 200 * 1024 * 1024; // 200 MB
        requestsLimit = 3000;
        break;
      case 'pro':
        storageLimit = 1024 * 1024 * 1024; // 1 GB
        requestsLimit = 20000;
        break;
      case 'ultra-pro':
        storageLimit = 5 * 1024 * 1024 * 1024; // 5 GB
        requestsLimit = 200000;
        break;
    }
    
    const response = {
      storageUsed,
      storageLimit,
      requestsUsed,
      requestsLimit,
      accountType: user.accountType || 'free'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    // Silently handle errors in production
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}