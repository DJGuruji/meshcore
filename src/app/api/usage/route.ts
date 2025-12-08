import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import { User, ApiProject, MockServerData } from '@/lib/models';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('=== USAGE API DEBUG ===');
    console.log('Session:', session?.user);
    
    if (!session || !session.user) {
      console.log('ERROR: No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // Get user with storage usage
    const user = await User.findById(session.user.id);
    if (!user) {
      console.log('ERROR: User not found with ID:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      accountType: user.accountType,
      storageUsage: user.storageUsage,
      lastRequestReset: user.lastRequestReset,
      dailyRequestsSize: Object.keys(user.dailyRequests || {}).length
    });
    
    // Calculate storage usage
    let storageUsed = user.storageUsage || 0;
    console.log('Storage used (bytes):', storageUsed);
    
    // Calculate daily requests used in current 24-hour window
    let requestsUsed = 0;
    
    // Check if we need to reset the counter
    const now = new Date();
    const lastReset = user.lastRequestReset ? new Date(user.lastRequestReset) : null;
    
    console.log('Last reset:', lastReset);
    console.log('Now:', now);
    
    if (lastReset) {
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
      console.log('Hours since reset:', hoursSinceReset);
      
      // If less than 24 hours have passed, get the current count
      if (hoursSinceReset < 24) {
        const currentWindowKey = lastReset.toISOString();
        requestsUsed = user.dailyRequests[currentWindowKey] || 0;
        console.log('Window key:', currentWindowKey);
        console.log('Requests used:', requestsUsed);
        console.log('All daily requests keys:', Object.keys(user.dailyRequests || {}));
      } else {
        console.log('Reset window expired (>24 hours)');
      }
      // If 24 hours or more have passed, the count is 0 (will be reset on next API request)
    } else {
      console.log('No lastRequestReset found - user has not made any API requests yet');
    }
    
    // Calculate limits based on account type
    let storageLimit = 10 * 1024 * 1024; // Default to 10MB for free tier
    let requestsLimit = 300; // Default to 300 for free tier
    
    switch (user.accountType) {
      case 'free':
        storageLimit = 10 * 1024 * 1024; // 10 MB
        requestsLimit = 300;
        break;
      case 'freemium':
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
    
    console.log('Returning response:', response);
    console.log('=== END USAGE API DEBUG ===\n');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}