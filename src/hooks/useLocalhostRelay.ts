/**
 * WebSocket Localhost Relay Hook
 * 
 * Enables testing localhost APIs from production by establishing
 * a WebSocket connection to the relay server.
 * 
 * Security Features:
 * - Secure authentication
 * - Connection validation
 * - Error handling
 * - Rate limiting awareness
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { proxyManager } from '@/lib/proxyManager';

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

export type RelayStatus = 'disconnected' | 'connecting' | 'connected' | 'ready' | 'error';

export function useLocalhostRelay() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<RelayStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection with security enhancements
  useEffect(() => {
    if (!session?.user) {
      return;
    }

    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    setStatus('connecting');
    setError(null);

    // Get relay server URL from environment variable
    const relayUrl = process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'http://localhost:8080';

    // Validate relay URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      setError('Invalid relay server URL');
      setStatus('error');
      return;
    }

    // Extract user ID securely
    const userId = (session.user as any).id || (session.user as any)._id || 'anonymous';
    
    // Validate user ID
    if (userId !== 'anonymous' && (typeof userId !== 'string' || userId.length > 100)) {
      setError('Invalid user ID');
      setStatus('error');
      return;
    }

    const socket = io(relayUrl, {
      path: '/socket.io',
      transports: ['websocket'], // Only use WebSocket for better security
      auth: {
        userId: userId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 10000, // 10 second timeout
      autoConnect: true,
      rejectUnauthorized: process.env.NODE_ENV === 'production', // Validate SSL in production
      secure: relayUrl.startsWith('https'),
      withCredentials: true
    });

    socketRef.current = socket;

    // Connection established
    socket.on('connect', () => {
      console.log('[LocalhostRelay] Connected to WebSocket server');
      reconnectAttempts.current = 0;
      setStatus('connected');
    });

    // Relay ready
    socket.on('localhost:ready', (data) => {
      console.log('[LocalhostRelay] Relay ready:', data.message);
      setStatus('ready');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('[LocalhostRelay] Disconnected:', reason);
      setStatus('disconnected');
      
      // Implement exponential backoff for reconnection
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect
        setStatus('error');
        setError('Server disconnected');
      }
    });

    // Handle errors
    socket.on('connect_error', (err) => {
      console.error('[LocalhostRelay] Connection error:', err.message);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setStatus('error');
        setError(`Connection failed after ${maxReconnectAttempts} attempts: ${err.message}`);
      } else {
        setStatus('connecting');
        setError(`Connection attempt ${reconnectAttempts.current}/${maxReconnectAttempts} failed`);
      }
    });

    // Handle general errors
    socket.on('error', (err) => {
      console.error('[LocalhostRelay] Socket error:', err);
      setStatus('error');
      setError(err.message || 'WebSocket error');
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      socket.removeAllListeners();
    };
  }, [session]);

  // Execute localhost request via relay with validation
  const executeRequest = useCallback(async (request: LocalhostRequest): Promise<LocalhostResponse> => {
    return new Promise((resolve, reject) => {
      // Check if we can execute the request directly via proxy (bypassing relay)
      const canUseProxy = proxyManager.getStatus().active && proxyManager.shouldProxy(request.url);
      
      if (canUseProxy) {
        // Execute directly via proxy manager for better performance
        console.log('[LocalhostRelay] Executing request directly via proxy manager');
        
        proxyManager.executeRequest({
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body
        }).then(result => {
          resolve({
            requestId: request.requestId,
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            body: result.body,
            time: result.time,
            size: result.size,
            timestamp: new Date().toISOString()
          });
        }).catch(error => {
          reject({ 
            error: true, 
            message: error.message || 'Proxy request failed'
          });
        });
        
        return;
      }
      
      // Fall back to relay if proxy is not available
      if (!socketRef.current || status !== 'ready') {
        reject({ 
          error: true, 
          message: 'WebSocket relay not ready. Please wait for connection.' 
        });
        return;
      }

      // Validate request structure
      if (!request || typeof request !== 'object') {
        reject({ 
          error: true, 
          message: 'Invalid request format' 
        });
        return;
      }

      // Validate required fields
      if (!request.requestId || !request.method || !request.url) {
        reject({ 
          error: true, 
          message: 'Missing required fields: requestId, method, url' 
        });
        return;
      }

      // Validate method
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      if (!validMethods.includes(request.method.toUpperCase())) {
        reject({ 
          error: true, 
          message: 'Invalid HTTP method' 
        });
        return;
      }

      // Validate URL format
      try {
        new URL(request.url);
      } catch (e) {
        reject({ 
          error: true, 
          message: 'Invalid URL format' 
        });
        return;
      }

      // Limit request size
      const requestSize = JSON.stringify(request).length;
      if (requestSize > 64 * 1024) { // 64KB limit
        reject({ 
          error: true, 
          message: 'Request too large' 
        });
        return;
      }

      // Add timeout for the request
      const timeoutId = setTimeout(() => {
        reject({ 
          error: true, 
          message: 'Request timeout' 
        });
      }, 30000); // 30 second timeout

      // Send request and wait for response
      socketRef.current.emit('localhost:execute', request, (response: LocalhostResponse) => {
        clearTimeout(timeoutId);
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
          reject({ 
            error: true, 
            message: 'Invalid response format' 
          });
          return;
        }
        
        if (response.error) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  }, [status]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
      setStatus('disconnected');
    }
  }, []);

  return {
    status,
    error,
    isReady: status === 'ready',
    isConnecting: status === 'connecting',
    isConnected: status === 'connected' || status === 'ready',
    executeRequest,
    disconnect,
    socket: socketRef.current // Expose socket for LocalhostBridge
  };
}