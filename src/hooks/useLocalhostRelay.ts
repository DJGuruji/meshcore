/**
 * WebSocket Localhost Relay Hook
 * 
 * Enables testing localhost APIs from production by establishing
 * a WebSocket connection to the relay server.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

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

  // Initialize WebSocket connection
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

    const socket = io({
      path: '/api/localhost-relay',
      transports: ['websocket', 'polling'],
      auth: {
        userId: (session.user as any).id || (session.user as any)._id || 'anonymous'
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection established
    socket.on('connect', () => {
      console.log('[LocalhostRelay] Connected to WebSocket server');
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
    });

    // Handle errors
    socket.on('connect_error', (err) => {
      console.error('[LocalhostRelay] Connection error:', err.message);
      setStatus('error');
      setError(err.message);
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [session]);

  // Execute localhost request via relay
  const executeRequest = useCallback(async (request: LocalhostRequest): Promise<LocalhostResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || status !== 'ready') {
        reject({ 
          error: true, 
          message: 'WebSocket relay not ready. Please wait for connection.' 
        });
        return;
      }

      // Send request and wait for response
      socketRef.current.emit('localhost:execute', request, (response: LocalhostResponse) => {
        if (response.error) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  }, [status]);

  return {
    status,
    error,
    isReady: status === 'ready',
    isConnecting: status === 'connecting',
    isConnected: status === 'connected' || status === 'ready',
    executeRequest
  };
}
