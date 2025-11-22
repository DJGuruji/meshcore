'use client';

import { useEffect, useState } from 'react';
import { proxyManager } from '@/lib/proxyManager';

export default function ProxyTestPage() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initProxy = async () => {
      try {
        setStatus('initializing');
        const status = await proxyManager.register();
        console.log('Proxy manager status:', status);
        setStatus(status.active ? 'ready' : 'error');
      } catch (err) {
        console.error('Failed to initialize proxy:', err);
        setError('Failed to initialize proxy: ' + (err as Error).message);
        setStatus('error');
      }
    };

    initProxy();
  }, []);

  const testProxy = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      // Test with a sample localhost URL
      const testUrl = 'http://localhost:3000/api/test';
      const response = await proxyManager.executeRequest({
        url: testUrl,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Proxy test failed:', err);
      setError('Proxy test failed: ' + (err as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Client-Side Proxy Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Proxy Status</h2>
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${
              status === 'ready' ? 'bg-green-500' : 
              status === 'error' ? 'bg-red-500' : 
              status === 'initializing' ? 'bg-yellow-500' : 
              'bg-gray-300'
            }`}></div>
            <span className="capitalize">{status}</span>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Proxy</h2>
          <button
            onClick={testProxy}
            disabled={status !== 'ready'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Test Localhost Request
          </button>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}