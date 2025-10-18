import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/tools/api-tester/localhost-relay/stats
 * Get WebSocket relay server statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stats from WebSocket server
    try {
      const { getRelayStats } = require('@/lib/websocket-server');
      const stats = getRelayStats();
      
      return NextResponse.json({
        success: true,
        stats
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'WebSocket server not initialized',
        stats: {
          activeSessions: 0,
          pendingRequests: 0,
          sessions: []
        }
      });
    }

  } catch (error) {
    console.error('[Relay Stats] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
