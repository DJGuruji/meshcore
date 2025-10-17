import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// WebSocket Echo API (HTTP simulation)
// Note: Real WebSocket requires server-side setup, this provides HTTP alternative

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, type = 'text', delay = 0 } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Simulate delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
    }

    // Echo back the message with metadata
    return NextResponse.json({
      echo: message,
      type,
      timestamp: new Date().toISOString(),
      messageId: `msg_${Date.now()}`,
      metadata: {
        length: typeof message === 'string' ? message.length : JSON.stringify(message).length,
        receivedAt: new Date().toISOString(),
        processingTime: delay
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - WebSocket connection info and examples
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      info: 'WebSocket Echo API - HTTP Simulation',
      description: 'This endpoint simulates WebSocket echo functionality via HTTP POST requests',
      usage: {
        endpoint: '/api/tools/websocket-echo',
        method: 'POST',
        body: {
          message: 'Your message here',
          type: 'text | json | binary',
          delay: 'Optional delay in milliseconds (max 5000)'
        }
      },
      examples: [
        {
          description: 'Simple text echo',
          request: {
            message: 'Hello WebSocket!',
            type: 'text'
          }
        },
        {
          description: 'JSON echo with delay',
          request: {
            message: { user: 'John', action: 'connect' },
            type: 'json',
            delay: 1000
          }
        }
      ],
      realWebSocketSetup: {
        note: 'For real WebSocket support, you would need to set up a WebSocket server',
        libraries: ['ws', 'socket.io'],
        implementation: 'Use Next.js API routes with custom server or external WebSocket server'
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
