/**
 * Localhost Fetch Bridge Component
 * 
 * This component runs in the browser and listens for WebSocket commands
 * to execute local fetch requests.
 * 
 * Updated to work with server-side localhost request execution
 */

'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface LocalhostRequest {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: any;
  auth?: any;
}

interface Props {
  socket: Socket | null;
  isReady: boolean;
}

export default function LocalhostBridge({ socket, isReady }: Props) {
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !isReady) {
      console.log('[LocalhostBridge] Not registering listener - socket or not ready', { socket: !!socket, isReady });
      return;
    }

    console.log('[LocalhostBridge] Registering listener for localhost:performFetch');
    
    // Listen for performFetch commands from relay server
    const handlePerformFetch = async (request: LocalhostRequest) => {
      console.log('[LocalhostBridge] Received localhost:performFetch command', request);
      
      // With the new server-side implementation, we don't need to execute anything locally
      // The server will handle the request directly, so we just acknowledge receipt
      console.log('[LocalhostBridge] Server will handle request directly - no local execution needed');
    };

    // Register listener
    socket.on('localhost:performFetch', handlePerformFetch);

    // Cleanup
    return () => {
      console.log('[LocalhostBridge] Cleaning up listener');
      socket.off('localhost:performFetch', handlePerformFetch);
    };
  }, [socket, isReady]);

  // This component doesn't render anything visible
  return null;
}