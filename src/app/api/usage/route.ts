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
    
    // Calculate daily requests used (today's count)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const requestsUsed = user.dailyRequests.get(today) || 0;
    
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
    
    return NextResponse.json({
      storageUsed,
      storageLimit,
      requestsUsed,
      requestsLimit,
      accountType: user.accountType || 'free'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}