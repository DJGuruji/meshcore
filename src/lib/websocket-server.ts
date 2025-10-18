/**
 * WebSocket Relay Server for Localhost API Testing
 * 
 * This module enables users to test localhost APIs from production
 * by establishing a WebSocket connection between the browser and relay server.
 * 
 * Architecture:
 * 1. User enters localhost URL in production
 * 2. Frontend connects to WebSocket relay
 * 3. Relay sends "performLocalFetch" command back to browser
 * 4. Browser executes fetch() locally and sends response via WebSocket
 * 5. Response displayed in UI
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface LocalhostSession {
  sessionId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  requestCount: number;
}

interface LocalhostRequest {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: any;
  auth?: any;
}

interface LocalhostResponse {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
  size: number;
  timestamp: string;
  error?: boolean;
  message?: string;
}

// Store active sessions
const activeSessions = new Map<string, LocalhostSession>();

// Store pending requests (waiting for browser to execute)
const pendingRequests = new Map<string, {
  requestData: LocalhostRequest;
  resolve: (response: LocalhostResponse) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}>();

export function initializeWebSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/localhost-relay',
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    // Initialize session
    const sessionId = socket.id;
    const userId = (socket.handshake.auth as any)?.userId || 'anonymous';
    
    activeSessions.set(sessionId, {
      sessionId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      requestCount: 0
    });

    // Handle localhost request from frontend
    socket.on('localhost:execute', async (request: LocalhostRequest, callback) => {
      console.log(`[WebSocket] Received localhost request: ${request.method} ${request.url}`);
      
      const session = activeSessions.get(sessionId);
      if (!session) {
        callback({ error: true, message: 'Session not found' });
        return;
      }

      // Update session activity
      session.lastActivity = new Date();
      session.requestCount++;

      // Validate localhost URL
      if (!isLocalhostUrl(request.url)) {
        callback({ 
          error: true, 
          message: 'Only localhost URLs are allowed for relay execution' 
        });
        return;
      }

      try {
        // Create promise to wait for browser response
        const responsePromise = new Promise<LocalhostResponse>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pendingRequests.delete(request.requestId);
            reject({ error: true, message: 'Request timeout - browser did not respond' });
          }, 30000); // 30 second timeout

          pendingRequests.set(request.requestId, {
            requestData: request,
            resolve,
            reject,
            timeout
          });
        });

        // Send command to browser to execute local fetch
        socket.emit('localhost:performFetch', request);

        // Wait for browser response
        const response = await responsePromise;
        callback(response);

      } catch (error: any) {
        console.error('[WebSocket] Request execution error:', error);
        callback({ 
          error: true, 
          message: error.message || 'Failed to execute localhost request' 
        });
      }
    });

    // Handle response from browser (after local fetch)
    socket.on('localhost:fetchComplete', (response: LocalhostResponse) => {
      console.log(`[WebSocket] Received browser response for request: ${response.requestId}`);
      
      const pending = pendingRequests.get(response.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(response);
        pendingRequests.delete(response.requestId);
      }
    });

    // Handle fetch error from browser
    socket.on('localhost:fetchError', (data: { requestId: string; error: string }) => {
      console.error(`[WebSocket] Browser fetch error: ${data.error}`);
      
      const pending = pendingRequests.get(data.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.reject({ error: true, message: data.error });
        pendingRequests.delete(data.requestId);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      
      // Clean up session
      activeSessions.delete(sessionId);
      
      // Reject all pending requests for this session
      pendingRequests.forEach((pending, requestId) => {
        if (requestId.startsWith(sessionId)) {
          clearTimeout(pending.timeout);
          pending.reject({ error: true, message: 'WebSocket connection closed' });
          pendingRequests.delete(requestId);
        }
      });
    });

    // Send ready confirmation
    socket.emit('localhost:ready', { sessionId, message: 'WebSocket relay ready' });
  });

  // Cleanup old sessions every 5 minutes
  setInterval(() => {
    const now = new Date();
    activeSessions.forEach((session, sessionId) => {
      const inactiveMinutes = (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;
      if (inactiveMinutes > 10) {
        console.log(`[WebSocket] Cleaning up inactive session: ${sessionId}`);
        activeSessions.delete(sessionId);
      }
    });
  }, 5 * 60 * 1000);

  console.log('[WebSocket] Localhost relay server initialized');
  
  return io;
}

// Helper to validate localhost URLs
function isLocalhostUrl(url: string): boolean {
  try {
    const urlLower = url.toLowerCase();
    
    // Allow localhost, 127.0.0.1, and local IP addresses
    if (urlLower.includes('localhost')) return true;
    if (urlLower.includes('127.0.0.1')) return true;
    if (urlLower.includes('::1')) return true;
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check for local IP addresses
    if (hostname.match(/^192\.168\./) || 
        hostname.match(/^10\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

// Export session stats for monitoring
export function getRelayStats() {
  return {
    activeSessions: activeSessions.size,
    pendingRequests: pendingRequests.size,
    sessions: Array.from(activeSessions.values()).map(s => ({
      sessionId: s.sessionId,
      userId: s.userId,
      connectedAt: s.connectedAt,
      lastActivity: s.lastActivity,
      requestCount: s.requestCount
    }))
  };
}
