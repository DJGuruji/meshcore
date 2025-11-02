'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PlayIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { useLocalhostRelay } from '@/hooks/useLocalhostRelay';
import LocalhostBridge from '@/components/LocalhostBridge';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface Param {
  key: string;
  value: string;
  enabled: boolean;
}

interface Request {
  _id?: string;
  name: string;
  method: string;
  url: string;
  headers: Header[];
  params: Param[];
  body: {
    type: string;
    raw?: string;
    json?: string;
  };
  auth: {
    type: string;
    basic?: { username: string; password: string };
    bearer?: { token: string };
    apiKey?: { key: string; value: string; addTo: string };
  };
  preRequestScript?: string;
  testScript?: string;
  description?: string;
}

interface RequestTab {
  id: string;
  request: Request;
  response?: any;
  testResults?: TestResult[];
  consoleLogs?: any[];
  isSaved: boolean;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface HistoryItem {
  _id: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  timestamp: string;
  requestData?: {
    headers?: Header[];
    params?: Param[];
    body?: any;
    auth?: any;
  };
}

interface Collection {
  _id: string;
  name: string;
  description: string;
  requests: Request[];
}

interface Environment {
  _id: string;
  name: string;
  variables: Array<{ key: string; value: string; enabled: boolean; description?: string }>;
  isGlobal: boolean;
}

function EnvironmentModal({ onClose, onSave, existingEnvironment }: { 
  onClose: () => void; 
  onSave: (name: string, variables: Array<{key: string; value: string; description?: string}>) => void;
  existingEnvironment?: Environment | null;
}) {
  const [name, setName] = useState(existingEnvironment?.name || '');
  const [variables, setVariables] = useState<Array<{key: string; value: string; description?: string}>>(
    existingEnvironment?.variables.length ? existingEnvironment.variables.map((v: any) => ({
      key: v.key,
      value: v.value,
      description: v.description || ''
    })) : [{ key: '', value: '', description: '' }]
  );

  const addVariable = () => setVariables([...variables, { key: '', value: '', description: '' }]);
  const removeVariable = (idx: number) => setVariables(variables.filter((_, i) => i !== idx));
  const updateVariable = (idx: number, field: 'key' | 'value' | 'description', val: string) => {
    const newVars = [...variables];
    newVars[idx][field] = val;
    setVariables(newVars);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-yellow-400">
            {existingEnvironment ? 'Edit Environment' : 'Create Environment'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Environment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production, Staging, Development, etc."
              className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Environment Variables</label>
                <p className="text-xs text-slate-400 mt-1">Use variables in URLs like: {'{{'}baseUrl{'}}'}/users</p>
              </div>
              <button onClick={addVariable} className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                <PlusIcon className="w-4 h-4" /> Add Variable
              </button>
            </div>
            <div className="space-y-3">
              {variables.map((v, idx) => (
                <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={v.key}
                      onChange={(e) => updateVariable(idx, 'key', e.target.value)}
                      placeholder="Variable name (e.g., baseUrl, apiKey)"
                      className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                      placeholder="Value (e.g., https://api.example.com)"
                      className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                    />
                    <button 
                      onClick={() => removeVariable(idx)} 
                      className="text-red-400 hover:text-red-300 px-2"
                      title="Remove variable"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={v.description || ''}
                    onChange={(e) => updateVariable(idx, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">Cancel</button>
          <button
            onClick={() => onSave(name, variables.filter(v => v.key))}
            disabled={!name}
            className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
          >
            {existingEnvironment ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionModal({ onClose, onSave, existingCollection }: { 
  onClose: () => void; 
  onSave: (name: string, description: string) => void;
  existingCollection?: Collection | null;
}) {
  const [name, setName] = useState(existingCollection?.name || '');
  const [description, setDescription] = useState(existingCollection?.description || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-yellow-400">
            {existingCollection ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Collection"
              className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Collection description..."
              className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none h-24"
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">Cancel</button>
          <button
            onClick={() => onSave(name, description)}
            disabled={!name}
            className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
          >
            {existingCollection ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveRequestModal({ onClose, onSave, collections }: { 
  onClose: () => void; 
  onSave: (collectionId: string) => void;
  collections: Collection[];
}) {
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-yellow-400">Save Request to Collection</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Collection</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              autoFocus
            >
              <option value="">Choose a collection...</option>
              {collections.map((collection) => (
                <option key={collection._id} value={collection._id}>
                  {collection.name} ({collection.requests.length} requests)
                </option>
              ))}
            </select>
          </div>
          {collections.length === 0 && (
            <p className="text-sm text-slate-400">
              No collections yet. Create one first!
            </p>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">Cancel</button>
          <button
            onClick={() => onSave(selectedCollectionId)}
            disabled={!selectedCollectionId}
            className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
          >
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApiTesterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Helper function to get engaging status code messages
  const getStatusMessage = (statusCode: number): { message: string; category: string } => {
    const messages: Record<number, { message: string; category: string }> = {
      // Success Responses (2xx)
      200: { message: "Success — Your API obeyed!", category: "success" },
      201: { message: "Done! You just built something great.", category: "success" },
      202: { message: "Got it — we're processing your request like a pro.", category: "success" },
      204: { message: "All good — nothing to show, everything to love.", category: "success" },
      
      // Redirects (3xx)
      301: { message: "We've moved… permanently! Like a codebase refactor.", category: "redirect" },
      302: { message: "We found it — taking you to the right endpoint.", category: "redirect" },
      304: { message: "Still the same. Why change what's already perfect?", category: "redirect" },
      
      // Client Errors (4xx)
      400: { message: "Your request is confused. Maybe too much coffee?", category: "client-error" },
      401: { message: "Access denied — tokens before glory!", category: "client-error" },
      403: { message: "Nice try, hacker. But not today.", category: "client-error" },
      404: { message: "We looked everywhere — nothing here but 404 ghosts.", category: "client-error" },
      405: { message: "That method doesn't belong here — try another tool.", category: "client-error" },
      408: { message: "Took too long — your API went for a coffee break.", category: "client-error" },
      409: { message: "Conflict detected — merge your data like Git pros do.", category: "client-error" },
      410: { message: "This endpoint packed up and left town.", category: "client-error" },
      413: { message: "That's heavy! Maybe trim it down a bit.", category: "client-error" },
      415: { message: "We don't speak that format. Try JSON, it's fluent.", category: "client-error" },
      418: { message: "Seriously? I'm a teapot, not a server.", category: "client-error" },
      429: { message: "Whoa there! Rate limits exist for a reason. Chill for a sec.", category: "client-error" },
      
      // Server Errors (5xx)
      500: { message: "Something blew up — but that's on us.", category: "server-error" },
      501: { message: "Not built yet — it's still in the dev lab.", category: "server-error" },
      502: { message: "Server relay failed — clouds are moody today.", category: "server-error" },
      503: { message: "Server's napping. Try waking it later.", category: "server-error" },
      504: { message: "The network took a detour — timeout adventure!", category: "server-error" },
      507: { message: "Memory full — like your weekend schedule.", category: "server-error" },
      509: { message: "Whoa! You flooded the pipes. Ease up, champ.", category: "server-error" },
      
      // Bonus
      100: { message: "Keep going — you're doing great.", category: "info" },
      522: { message: "Your request got lost in space.", category: "server-error" },
      530: { message: "Authentication Required.", category: "client-error" },
    };

    return messages[statusCode] || { 
      message: `Status ${statusCode}`, 
      category: statusCode >= 500 ? 'server-error' : statusCode >= 400 ? 'client-error' : statusCode >= 300 ? 'redirect' : 'success'
    };
  };

  // Multi-tab state
  const [requestTabs, setRequestTabs] = useState<RequestTab[]>([{
    id: 'tab-1',
    request: {
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: { type: 'none' },
      auth: { type: 'none' },
      preRequestScript: '',
      testScript: ''
    },
    isSaved: false
  }]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Get current tab data
  const currentTab = requestTabs.find(tab => tab.id === activeTabId);
  const currentRequest = currentTab?.request || requestTabs[0].request;
  const setCurrentRequest = (request: Request) => {
    setRequestTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, request, isSaved: false } : tab
    ));
  };

  const [response, setResponse] = useState<any>(currentTab?.response || null);
  const [testResults, setTestResults] = useState<TestResult[]>(currentTab?.testResults || []);
  const [consoleLogs, setConsoleLogs] = useState<any[]>(currentTab?.consoleLogs || []);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'tests'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'info' | 'tests' | 'console'>('body');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeGenLang, setCodeGenLang] = useState('curl');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [showSaveRequestModal, setShowSaveRequestModal] = useState(false);

  // WebSocket Localhost Relay
  const localhostRelay = useLocalhostRelay();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchCollections();
      fetchEnvironments();
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/history');
      setHistory(res.data.history || []);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete('/api/tools/api-tester/history');
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      console.error('Failed to clear history', error);
      toast.error('Failed to clear history');
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/collections');
      setCollections(res.data);
    } catch (error) {
      console.error('Failed to fetch collections', error);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/environments');
      setEnvironments(res.data);
    } catch (error) {
      console.error('Failed to fetch environments', error);
    }
  };

  const sendRequest = async () => {
    if (!currentRequest.url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    
    // Clear current tab's response
    setRequestTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, response: null, testResults: [], consoleLogs: [] }
        : tab
    ));

    try {
      // Run pre-request script if exists
      let preRequestVariables: any = {};
      const currentLogs: any[] = [];
      
      if (currentRequest.preRequestScript) {
        try {
          const scriptRes = await axios.post('/api/tools/api-tester/run-script', {
            type: 'pre-request',
            script: currentRequest.preRequestScript,
            request: currentRequest,
            environment: selectedEnvironment?.variables || []
          });
          preRequestVariables = scriptRes.data.variables || {};
          if (scriptRes.data.logs) {
            currentLogs.push(...scriptRes.data.logs);
          }
        } catch (err) {
          console.error('Pre-request script error:', err);
          toast.error('Pre-request script failed');
        }
      }

      const finalUrl = replaceVariables(currentRequest.url, preRequestVariables);
      let res;
      
      // Check if this is a localhost URL
      const isLocalhost = isLocalhostUrl(finalUrl);
      const isProductionUI = typeof window !== 'undefined' && 
                            !window.location.hostname.includes('localhost') &&
                            !window.location.hostname.includes('127.0.0.1');
      
      // Decision logic:
      // 1. If localhost URL + production UI + relay ready → Use WebSocket relay
      // 2. If localhost URL + development UI → Use client-side fetch
      // 3. If HTTPS URL → Use server-side proxy
      
      if (isLocalhost && isProductionUI && localhostRelay.isReady) {
        // Production + Localhost URL → Use WebSocket Relay!
        toast.loading('Connecting to your local API via secure relay...', { duration: 2000 });
        
        try {
          const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const relayResponse = await localhostRelay.executeRequest({
            requestId,
            method: currentRequest.method,
            url: finalUrl,
            headers: currentRequest.headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
            params: currentRequest.params,
            body: currentRequest.body,
            auth: currentRequest.auth
          });
          
          res = { data: relayResponse };
          toast.success('✅ Localhost request executed via relay!');
        } catch (error: any) {
          throw error;
        }
      } else if (isLocalhost && isProductionUI && !localhostRelay.isReady) {
        // Localhost + Production but relay not ready → Show helpful message
        throw new Error(
          '🔌 WebSocket relay is connecting... Please wait a moment and try again.\n\n' +
          'Or run this app locally for instant localhost testing:\n' +
          '→ npm run dev'
        );
      } else if (isClientSideUrl(finalUrl)) {
        // Client-side: Direct browser request (for localhost in dev, http, local IPs)
        res = await sendClientSideRequest(finalUrl);
      } else {
        // Server-side: Proxy through Next.js API (for https production APIs)
        res = await axios.post('/api/tools/api-tester/send', {
          method: currentRequest.method,
          url: finalUrl,
          headers: currentRequest.headers,
          params: currentRequest.params,
          requestBody: currentRequest.body,
          auth: currentRequest.auth
        });
      }

      const currentTestResults: TestResult[] = [];
      
      // Run test script if exists
      if (currentRequest.testScript && res.data) {
        try {
          const testRes = await axios.post('/api/tools/api-tester/run-script', {
            type: 'test',
            script: currentRequest.testScript,
            request: currentRequest,
            response: res.data,
            environment: selectedEnvironment?.variables || []
          });
          if (testRes.data.tests) {
            currentTestResults.push(...testRes.data.tests);
          }
          if (testRes.data.logs) {
            currentLogs.push(...testRes.data.logs);
          }
        } catch (err) {
          console.error('Test script error:', err);
          toast.error('Test script failed');
        }
      }

      // Update current tab with response, tests, and logs
      setRequestTabs(tabs => tabs.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              request: {
                ...tab.request,
                name: getRequestName(currentRequest.method, currentRequest.url)
              },
              response: res.data,
              testResults: currentTestResults,
              consoleLogs: currentLogs,
              isSaved: false
            }
          : tab
      ));

      toast.success(`Request completed in ${res.data.time}ms`);
      fetchHistory(); // Refresh history
    } catch (error: any) {
      const errorData = error.response?.data || { error: true, message: error.message };
      setRequestTabs(tabs => tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, response: errorData }
          : tab
      ));
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if URL is localhost
  const isLocalhostUrl = (url: string): boolean => {
    try {
      const urlLower = url.toLowerCase();
      
      // Check for localhost, 127.0.0.1, ::1, and local IP addresses
      if (urlLower.includes('localhost')) return true;
      if (urlLower.includes('127.0.0.1')) return true;
      if (urlLower.includes('::1')) return true;
      
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check for local IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (hostname.match(/^192\.168\./) || 
          hostname.match(/^10\./) || 
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  };

  // Auto-detect if URL should use client-side request
  const isClientSideUrl = (url: string): boolean => {
    try {
      const urlLower = url.toLowerCase();
      
      // Check if this is a localhost URL - these should always use client-side fetch
      // regardless of whether we're in production or development
      if (urlLower.includes('localhost')) return true;
      if (urlLower.includes('127.0.0.1')) return true;
      if (urlLower.includes('::1')) return true;
      
      // Check for local IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        if (hostname.match(/^192\.168\./) || 
            hostname.match(/^10\./) || 
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          return true;
        }
      } catch (e) {
        // If URL parsing fails, continue with other checks
      }
      
      // For non-localhost URLs, check if we're in development UI
      const isProductionUI = typeof window !== 'undefined' && 
                            !window.location.hostname.includes('localhost') &&
                            !window.location.hostname.includes('127.0.0.1');
      
      if (isProductionUI) {
        // In production UI, always use server-side proxy for non-localhost URLs
        return false;
      }
      
      // In development UI, use client-side for http:// URLs (not https)
      if (urlLower.startsWith('http://')) return true;
      
      return false; // Use server-side for https and external URLs
    } catch (e) {
      // If URL parsing fails, default to server-side
      return false;
    }
  };

  // Client-side fetch (for localhost and CORS-free endpoints)
  const sendClientSideRequest = async (url: string) => {
    const startTime = Date.now();
    
    try {
      // Build URL with query parameters
      const finalUrl = new URL(url);
      currentRequest.params.filter(p => p.enabled).forEach(p => {
        finalUrl.searchParams.append(p.key, p.value);
      });

      // Build headers
      const requestHeaders: HeadersInit = {};
      currentRequest.headers.filter(h => h.enabled).forEach(h => {
        requestHeaders[h.key] = h.value;
      });

      // Add authentication headers
      if (currentRequest.auth && currentRequest.auth.type !== 'none') {
        switch (currentRequest.auth.type) {
          case 'basic':
            const basicAuth = btoa(`${currentRequest.auth.basic?.username}:${currentRequest.auth.basic?.password}`);
            requestHeaders['Authorization'] = `Basic ${basicAuth}`;
            break;
          
          case 'bearer':
            requestHeaders['Authorization'] = `Bearer ${currentRequest.auth.bearer?.token}`;
            break;
          
          case 'api-key':
            if (currentRequest.auth.apiKey?.addTo === 'header') {
              requestHeaders[currentRequest.auth.apiKey.key] = currentRequest.auth.apiKey.value;
            } else {
              finalUrl.searchParams.append(currentRequest.auth.apiKey?.key || '', currentRequest.auth.apiKey?.value || '');
            }
            break;
        }
      }

      // Build request options
      const requestOptions: RequestInit = {
        method: currentRequest.method.toUpperCase(),
        headers: requestHeaders,
        // Remove mode: 'cors' to allow localhost requests without CORS restrictions
      };

      // Add body for non-GET requests
      if (currentRequest.method !== 'GET' && currentRequest.method !== 'HEAD' && currentRequest.body) {
        if (currentRequest.body.type === 'json' && currentRequest.body.json) {
          requestOptions.body = currentRequest.body.json;
          if (!requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/json';
          }
        } else if (currentRequest.body.type === 'raw' && currentRequest.body.raw) {
          requestOptions.body = currentRequest.body.raw;
        }
      }

      // Send request directly from browser
      const response = await fetch(finalUrl.toString(), requestOptions);
      const endTime = Date.now();

      // Get response body
      const contentType = response.headers.get('content-type') || '';
      let responseBody: any;
      let responseText = '';

      try {
        responseText = await response.text();
        if (contentType.includes('application/json')) {
          responseBody = JSON.parse(responseText);
        } else {
          responseBody = responseText;
        }
      } catch (e) {
        responseBody = responseText;
      }

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Calculate response size
      const responseSize = new Blob([responseText]).size;

      return {
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          time: endTime - startTime,
          size: responseSize,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      const endTime = Date.now();
      throw {
        response: {
          data: {
            error: true,
            message: error.message || 'Client-side request failed',
            time: endTime - startTime,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  };

  const replaceVariables = (text: string, additionalVars: any = {}): string => {
    if (!text) return text;
    let result = text;
    
    // Replace environment variables
    if (selectedEnvironment) {
      selectedEnvironment.variables.forEach(v => {
        if (v.enabled) {
          result = result.replace(new RegExp(`{{${v.key}}}`, 'g'), v.value);
        }
      });
    }
    
    // Replace pre-request script variables
    Object.keys(additionalVars).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), additionalVars[key]);
    });
    
    return result;
  };

  const addHeader = () => {
    setCurrentRequest({
      ...currentRequest,
      headers: [...currentRequest.headers, { key: '', value: '', enabled: true }]
    });
  };

  const addParam = () => {
    setCurrentRequest({
      ...currentRequest,
      params: [...currentRequest.params, { key: '', value: '', enabled: true }]
    });
  };

  // Helper function to generate tab name from URL
  const getRequestName = (method: string, url: string): string => {
    if (!url) return 'Untitled Request';
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Get the last meaningful part of the path
      const parts = pathname.split('/').filter(p => p.length > 0);
      const lastPart = parts[parts.length - 1] || urlObj.hostname;
      
      // Capitalize first letter
      const formatted = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      
      return `${method} ${formatted}`;
    } catch (e) {
      // If URL parsing fails, use the URL as-is (shortened)
      const shortened = url.length > 30 ? url.substring(0, 30) + '...' : url;
      return `${method} ${shortened}`;
    }
  };

  const saveCollection = async () => {
    // Create new empty collection
    setEditingCollection(null);
    setShowCollectionModal(true);
  };

  const handleSaveCollection = async (name: string, description: string) => {
    try {
      if (editingCollection) {
        // Update existing collection
        await axios.put('/api/tools/api-tester/collections', {
          id: editingCollection._id,
          name,
          description
        });
        toast.success('Collection updated!');
      } else {
        // Create new empty collection
        await axios.post('/api/tools/api-tester/collections', {
          name,
          description,
          requests: [] // Empty collection
        });
        toast.success('Collection created!');
      }

      fetchCollections();
      setShowCollectionModal(false);
      setEditingCollection(null);
    } catch (error: any) {
      console.error('Save collection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save collection';
      toast.error(errorMessage);
    }
  };

  const editCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowCollectionModal(true);
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await axios.delete(`/api/tools/api-tester/collections?id=${collectionId}`);
      toast.success('Collection deleted!');
      fetchCollections();
      if (selectedCollection?._id === collectionId) {
        setSelectedCollection(null);
      }
    } catch (error: any) {
      console.error('Delete collection error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete collection');
    }
  };

  const saveRequestToCollection = async () => {
    // Validate that URL is present before saving request
    if (!currentRequest.url || currentRequest.url.trim() === '') {
      toast.error('Please enter a URL before saving request');
      return;
    }
    setShowSaveRequestModal(true);
  };

  const handleSaveRequestToCollection = async (collectionId: string) => {
    try {
      // Get the collection
      const collection = collections.find(c => c._id === collectionId);
      if (!collection) {
        toast.error('Collection not found');
        return;
      }

      // Add current request to collection's requests
      const updatedRequests = [...collection.requests, currentRequest];

      await axios.put('/api/tools/api-tester/collections', {
        id: collectionId,
        requests: updatedRequests
      });

      toast.success('Request saved to collection!');
      fetchCollections();
      setShowSaveRequestModal(false);
    } catch (error: any) {
      console.error('Save request error:', error);
      toast.error(error.response?.data?.message || 'Failed to save request');
    }
  };

  const createEnvironment = async () => {
    setEditingEnvironment(null);
    setShowEnvModal(true);
  };

  const editEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setShowEnvModal(true);
  };

  const deleteEnvironment = async (environmentId: string) => {
    if (!confirm('Are you sure you want to delete this environment? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/tools/api-tester/environments?id=${environmentId}`);
      toast.success('Environment deleted!');
      fetchEnvironments();
      
      // Deselect if current environment was deleted
      if (selectedEnvironment?._id === environmentId) {
        setSelectedEnvironment(null);
      }
    } catch (error: any) {
      console.error('Delete environment error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete environment');
    }
  };

  const handleSaveEnvironment = async (name: string, variables: Array<{key: string; value: string; description?: string}>) => {
    try {
      if (editingEnvironment) {
        // Update existing environment
        await axios.put('/api/tools/api-tester/environments', {
          id: editingEnvironment._id,
          name,
          variables: variables.map(v => ({ ...v, enabled: true })),
        });
        toast.success('Environment updated!');
      } else {
        // Create new environment
        await axios.post('/api/tools/api-tester/environments', {
          name,
          variables: variables.map(v => ({ ...v, enabled: true })),
          isGlobal: false
        });
        toast.success('Environment created!');
      }

      fetchEnvironments();
      setShowEnvModal(false);
      setEditingEnvironment(null);
    } catch (error: any) {
      console.error('Save environment error:', error);
      toast.error(error.response?.data?.message || 'Failed to save environment');
    }
  };

  const generateCode = async () => {
    try {
      const res = await axios.post('/api/tools/api-tester/code-generate', {
        language: codeGenLang,
        request: {
          method: currentRequest.method,
          url: replaceVariables(currentRequest.url),
          headers: currentRequest.headers.filter(h => h.enabled),
          params: currentRequest.params.filter(p => p.enabled),
          body: currentRequest.body,
          auth: currentRequest.auth,
          // Removed GraphQL data
        }
      });
      setGeneratedCode(res.data.code);
      setShowCodeGen(true);
    } catch (error) {
      toast.error('Failed to generate code');
    }
  };

  const loadRequestFromHistory = (historyItem: HistoryItem) => {
    // Auto-fill request details from history
    const newRequest: Request = {
      name: `${historyItem.method} ${new URL(historyItem.url).pathname}`,
      method: historyItem.method,
      url: historyItem.url,
      headers: historyItem.requestData?.headers || [],
      params: historyItem.requestData?.params || [],
      body: historyItem.requestData?.body || { type: 'none' },
      auth: historyItem.requestData?.auth || { type: 'none' },
      preRequestScript: '',
      testScript: ''
    };
    
    setCurrentRequest(newRequest);
    setIsHistorySidebarOpen(false); // Close sidebar after loading
    toast.success('Request loaded from history');
  };

  // Tab management functions
  const createNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: RequestTab = {
      id: newTabId,
      request: {
        name: 'Untitled Request',
        method: 'GET',
        url: '',
        headers: [],
        params: [],
        body: { type: 'none' },
        auth: { type: 'none' },
        preRequestScript: '',
        testScript: ''
      },
      isSaved: false
    };
    setRequestTabs([...requestTabs, newTab]);
    setActiveTabId(newTabId);
    toast.success('New request tab created');
  };

  const closeTab = (tabId: string) => {
    if (requestTabs.length === 1) {
      toast.error('Cannot close the last tab');
      return;
    }

    const tabToClose = requestTabs.find(t => t.id === tabId);
    if (tabToClose && !tabToClose.isSaved && (tabToClose.request.url || tabToClose.request.headers.length > 0)) {
      if (!confirm('This tab has unsaved changes. Close anyway?')) {
        return;
      }
    }

    const newTabs = requestTabs.filter(tab => tab.id !== tabId);
    setRequestTabs(newTabs);
    
    // Switch to another tab if closing active tab
    if (tabId === activeTabId) {
      const currentIndex = requestTabs.findIndex(t => t.id === tabId);
      const newActiveTab = newTabs[currentIndex] || newTabs[currentIndex - 1] || newTabs[0];
      setActiveTabId(newActiveTab.id);
    }
  };

  const duplicateTab = (tabId: string) => {
    const tabToDuplicate = requestTabs.find(t => t.id === tabId);
    if (!tabToDuplicate) return;

    const newTabId = `tab-${Date.now()}`;
    const newTab: RequestTab = {
      id: newTabId,
      request: { ...tabToDuplicate.request, name: `${tabToDuplicate.request.name} (Copy)` },
      response: tabToDuplicate.response,
      testResults: tabToDuplicate.testResults,
      consoleLogs: tabToDuplicate.consoleLogs,
      isSaved: false
    };
    
    const insertIndex = requestTabs.findIndex(t => t.id === tabId) + 1;
    const newTabs = [...requestTabs];
    newTabs.splice(insertIndex, 0, newTab);
    setRequestTabs(newTabs);
    setActiveTabId(newTabId);
    toast.success('Tab duplicated');
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-yellow-400">API Tester</h2>
              <button
                onClick={createNewTab}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors font-semibold"
                title="New request tab"
              >
                <PlusIcon className="w-3 h-3" />
                New Tab
              </button>
            </div>
            
            {/* WebSocket Relay Status */}
            {typeof window !== 'undefined' && 
             !window.location.hostname.includes('localhost') && 
             !window.location.hostname.includes('127.0.0.1') && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                  localhostRelay.status === 'ready' ? 'bg-green-900/30 text-green-400' :
                  localhostRelay.status === 'connecting' ? 'bg-yellow-900/30 text-yellow-400' :
                  localhostRelay.status === 'error' ? 'bg-red-900/30 text-red-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    localhostRelay.status === 'ready' ? 'bg-green-400 animate-pulse' :
                    localhostRelay.status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                    localhostRelay.status === 'error' ? 'bg-red-400' :
                    'bg-slate-500'
                  }`}></div>
                  <span className="font-medium">
                    {localhostRelay.status === 'ready' ? 'Localhost Relay Ready' :
                     localhostRelay.status === 'connecting' ? 'Connecting...' :
                     localhostRelay.status === 'error' ? 'Relay Error' :
                     'Relay Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Collections</h3>
                <button 
                  onClick={saveCollection} 
                  className="text-yellow-400 hover:text-yellow-300"
                  title="Create new collection"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              {collections.length === 0 ? (
                <p className="text-xs text-slate-500">No collections yet</p>
              ) : (
                <div className="space-y-1">
                  {collections.map((collection) => (
                    <div
                      key={collection._id}
                      className="p-2 bg-slate-800 rounded hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCollection(collection)}>
                        <FolderIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm flex-1">{collection.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCollection(collection);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit collection"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(collection._id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete collection"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                      {selectedCollection?._id === collection._id && (
                        <div className="ml-6 mt-1 space-y-1">
                          {collection.requests.length === 0 ? (
                            <p className="text-xs text-slate-500 py-1">No requests yet</p>
                          ) : (
                            collection.requests.map((req, idx) => (
                              <div
                                key={idx}
                                className="text-xs p-1 hover:bg-slate-600 rounded cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentRequest(req);
                                }}
                              >
                                <span className="text-green-400">{req.method}</span> {req.name}
                              </div>
                            ))
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveRequestToCollection();
                            }}
                            className="text-xs text-yellow-400 hover:text-yellow-300 py-1 flex items-center gap-1"
                          >
                            <PlusIcon className="w-3 h-3" /> Add current request
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Environments</h3>
                <button 
                  onClick={createEnvironment} 
                  className="text-yellow-400 hover:text-yellow-300"
                  title="Create new environment"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              <select
                value={selectedEnvironment?._id || ''}
                onChange={(e) => {
                  const env = environments.find(en => en._id === e.target.value);
                  setSelectedEnvironment(env || null);
                }}
                className="w-full p-2 bg-slate-800 rounded text-sm border border-slate-600 focus:border-yellow-400 focus:outline-none mb-2"
              >
                <option value="">No Environment</option>
                {environments.map((env) => (
                  <option key={env._id} value={env._id}>
                    {env.name} ({env.variables.length} vars)
                  </option>
                ))}
              </select>

              {/* Environment Details & Actions */}
              {selectedEnvironment && (
                <div className="bg-slate-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-yellow-400">{selectedEnvironment.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => editEnvironment(selectedEnvironment)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Edit environment"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteEnvironment(selectedEnvironment._id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete environment"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedEnvironment.variables.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 font-medium">Variables:</div>
                      {selectedEnvironment.variables.slice(0, 3).map((v, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                          <span className="text-yellow-400 font-mono">{'{{' + v.key + '}}'}: </span>
                          <span className="text-slate-400 truncate flex-1" title={v.value}>{v.value}</span>
                        </div>
                      ))}
                      {selectedEnvironment.variables.length > 3 && (
                        <div className="text-xs text-slate-500">+{selectedEnvironment.variables.length - 3} more...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className="bg-slate-900 border-b border-slate-700 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
          {requestTabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-4 py-2 border-r border-slate-700 cursor-pointer min-w-[200px] max-w-[250px] ${
                tab.id === activeTabId
                  ? 'bg-black text-yellow-400 border-b-2 border-b-yellow-400'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {/* Method Badge */}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                tab.request.method === 'GET' ? 'bg-green-900/30 text-green-400' :
                tab.request.method === 'POST' ? 'bg-blue-900/30 text-blue-400' :
                tab.request.method === 'PUT' ? 'bg-orange-900/30 text-orange-400' :
                tab.request.method === 'DELETE' ? 'bg-red-900/30 text-red-400' :
                'bg-slate-700 text-slate-300'
              }`}>
                {tab.request.method}
              </span>

              {/* Tab Name */}
              <span className="flex-1 truncate text-sm">
                {tab.request.name || 'Untitled Request'}
                {!tab.isSaved && tab.request.url && <span className="text-yellow-400 ml-1">*</span>}
              </span>

              {/* Tab Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Duplicate */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTab(tab.id);
                  }}
                  className="p-1 hover:bg-slate-700 rounded"
                  title="Duplicate tab"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Close */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-1 hover:bg-red-900/30 hover:text-red-400 rounded"
                  title="Close tab"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Request Section */}
        <div className="flex-1 flex flex-col border-b border-slate-700 overflow-y-auto">
          {/* URL Bar */}
          <div className="p-4 bg-slate-900">
            <div className="flex gap-2">
              <select
                value={currentRequest.method}
                onChange={(e) => setCurrentRequest({ ...currentRequest, method: e.target.value })}
                className="px-4 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-medium"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
                <option>OPTIONS</option>
                <option>HEAD</option>
              </select>
              
              <input
                type="text"
                value={currentRequest.url}
                onChange={(e) => setCurrentRequest({ ...currentRequest, url: e.target.value })}
                placeholder="https://api.example.com/endpoint or http://localhost:3000/api"
                className="flex-1 px-4 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              />
              
              <button
                onClick={saveRequestToCollection}
                className="px-4 py-2 bg-slate-700 text-white rounded font-semibold hover:bg-slate-600 transition-colors"
              >
                Save
              </button>
              
              <button
                onClick={sendRequest}
                disabled={isLoading}
                className="px-6 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700 bg-slate-900">
            <div className="flex gap-1 px-4">
              {(['params', 'headers', 'body', 'auth', 'scripts', 'tests'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="flex-1"></div>
              <button
                onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Activity {history.length > 0 && `(${history.length})`}
              </button>
              <button
                onClick={generateCode}
                className="px-4 py-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Code
              </button>
            </div>
          </div>

          {/* Tab Content - Will be added in next part */}
          <div className="flex-1 p-4 overflow-y-auto bg-black">
            {activeTab === 'params' && (
              <div className="space-y-2">
                <button onClick={addParam} className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                  <PlusIcon className="w-4 h-4" /> Add Parameter
                </button>
                {currentRequest.params.map((param, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => {
                        const newParams = [...currentRequest.params];
                        newParams[idx].enabled = e.target.checked;
                        setCurrentRequest({ ...currentRequest, params: newParams });
                      }}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => {
                        const newParams = [...currentRequest.params];
                        newParams[idx].key = e.target.value;
                        setCurrentRequest({ ...currentRequest, params: newParams });
                      }}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => {
                        const newParams = [...currentRequest.params];
                        newParams[idx].value = e.target.value;
                        setCurrentRequest({ ...currentRequest, params: newParams });
                      }}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const newParams = currentRequest.params.filter((_, i) => i !== idx);
                        setCurrentRequest({ ...currentRequest, params: newParams });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-2">
                <button onClick={addHeader} className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                  <PlusIcon className="w-4 h-4" /> Add Header
                </button>
                {currentRequest.headers.map((header, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => {
                        const newHeaders = [...currentRequest.headers];
                        newHeaders[idx].enabled = e.target.checked;
                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                      }}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => {
                        const newHeaders = [...currentRequest.headers];
                        newHeaders[idx].key = e.target.value;
                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                      }}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => {
                        const newHeaders = [...currentRequest.headers];
                        newHeaders[idx].value = e.target.value;
                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                      }}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const newHeaders = currentRequest.headers.filter((_, i) => i !== idx);
                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'body' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['none', 'json', 'raw'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, type } })}
                      className={`px-3 py-1 rounded text-sm ${
                        currentRequest.body.type === type
                          ? 'bg-yellow-500 text-black'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {currentRequest.body.type === 'json' && (
                  <textarea
                    value={currentRequest.body.json || ''}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, json: e.target.value } })}
                    placeholder='{"key": "value"}'
                    className="w-full h-64 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                )}

                {currentRequest.body.type === 'raw' && (
                  <textarea
                    value={currentRequest.body.raw || ''}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, raw: e.target.value } })}
                    placeholder="Raw text"
                    className="w-full h-64 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                )}
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <select
                  value={currentRequest.auth.type}
                  onChange={(e) => setCurrentRequest({ ...currentRequest, auth: { ...currentRequest.auth, type: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="api-key">API Key</option>
                </select>

                {currentRequest.auth.type === 'bearer' && (
                  <input
                    type="text"
                    value={currentRequest.auth.bearer?.token || ''}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, auth: { ...currentRequest.auth, bearer: { token: e.target.value } } })}
                    placeholder="Token"
                    className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                  />
                )}

                {currentRequest.auth.type === 'basic' && (
                  <>
                    <input
                      type="text"
                      value={currentRequest.auth.basic?.username || ''}
                      onChange={(e) => setCurrentRequest({ ...currentRequest, auth: { ...currentRequest.auth, basic: { ...currentRequest.auth.basic, username: e.target.value, password: currentRequest.auth.basic?.password || '' } } })}
                      placeholder="Username"
                      className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                    <input
                      type="password"
                      value={currentRequest.auth.basic?.password || ''}
                      onChange={(e) => setCurrentRequest({ ...currentRequest, auth: { ...currentRequest.auth, basic: { username: currentRequest.auth.basic?.username || '', password: e.target.value } } })}
                      placeholder="Password"
                      className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'scripts' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pre-request Script</label>
                  <p className="text-xs text-slate-400 mb-2">Execute JavaScript before sending the request. Use pm.environment.set() to set variables.</p>
                  <textarea
                    value={currentRequest.preRequestScript || ''}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, preRequestScript: e.target.value })}
                    placeholder={`// Example:\npm.environment.set("timestamp", Date.now());\npm.variables.set("myVar", "value");`}
                    className="w-full h-48 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Test Script</label>
                  <p className="text-xs text-slate-400 mb-2">Write tests to validate the response using pm.test() and pm.expect().</p>
                  <textarea
                    value={currentRequest.testScript || ''}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, testScript: e.target.value })}
                    placeholder={`// Example:
pm.test("Status code is 200", function() {
  pm.expect(pm.response.status).to.equal(200);
});

pm.test("Response has data", function() {
  pm.expect(pm.response.body).to.have.property("data");
});`}
                    className="w-full h-48 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded p-4">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">Test Documentation</h3>
                  <div className="text-xs text-slate-300 space-y-2">
                    <p><strong>Available pm API:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><code>pm.test(name, fn)</code> - Define a test</li>
                      <li><code>pm.expect(value)</code> - Chai-style assertions</li>
                      <li><code>pm.response.status</code> - Response status code</li>
                      <li><code>pm.response.body</code> - Response body object</li>
                      <li><code>pm.response.headers</code> - Response headers</li>
                      <li><code>pm.response.time</code> - Response time in ms</li>
                      <li><code>pm.environment.get/set/unset(key, value)</code></li>
                      <li><code>pm.variables.get/set(key, value)</code></li>
                    </ul>
                    <p className="mt-2"><strong>Assertion Examples:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><code>pm.expect(value).to.equal(expected)</code></li>
                      <li><code>pm.expect(value).to.be.a('string')</code></li>
                      <li><code>pm.expect(obj).to.have.property('key')</code></li>
                      <li><code>pm.expect(array).to.include(item)</code></li>
                      <li><code>pm.expect(str).to.match(/regex/)</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          <div className="border-b border-slate-700">
            <div className="flex gap-1 px-4">
              {(['body', 'headers', 'info', 'tests', 'console'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setResponseTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    responseTab === tab
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {tab === 'tests' && (currentTab?.testResults || []).length > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      (currentTab?.testResults || []).every(t => t.passed) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {(currentTab?.testResults || []).filter(t => t.passed).length}/{(currentTab?.testResults || []).length}
                    </span>
                  )}
                </button>
              ))}
              {/* Response Action Buttons */}
              {currentTab?.response && (
                <div className="flex gap-1 ml-auto items-center">
                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      const responseText = typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                        ? (currentTab?.response?.body || currentTab?.response)
                        : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2);
                      navigator.clipboard.writeText(responseText);
                      toast.success('Response copied to clipboard');
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    title="Copy response"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Download Button */}
                  <button
                    onClick={() => {
                      const responseText = typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                        ? (currentTab?.response?.body || currentTab?.response)
                        : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2);
                      const blob = new Blob([responseText], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `api-response-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    title="Download response"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => toast.success('Filter feature coming soon')}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    title="Filter response"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {!currentTab?.response ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                Send a request to see the response
              </div>
            ) : (
              <>
                {responseTab === 'body' && (
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                    {typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                      ? (currentTab?.response?.body || currentTab?.response)
                      : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2)}
                  </pre>
                )}

                {responseTab === 'headers' && currentTab?.response?.headers && (
                  <div className="space-y-2">
                    {Object.entries(currentTab.response.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="text-yellow-400">{key}:</span>
                        <span className="text-slate-300">{value as string}</span>
                      </div>
                    ))}
                  </div>
                )}

                {responseTab === 'info' && (
                  <div className="space-y-4">
                    {/* Status Code with Engaging Message */}
                    {currentTab?.response?.status && (() => {
                      const statusInfo = getStatusMessage(currentTab.response.status);
                      const statusCode = currentTab.response.status;
                      
                      return (
                        <div className={`p-4 rounded-lg border-2 ${
                          statusInfo.category === 'success' ? 'bg-green-900/20 border-green-500/50' :
                          statusInfo.category === 'redirect' ? 'bg-blue-900/20 border-blue-500/50' :
                          statusInfo.category === 'client-error' ? 'bg-orange-900/20 border-orange-500/50' :
                          statusInfo.category === 'server-error' ? 'bg-red-900/20 border-red-500/50' :
                          'bg-slate-800/50 border-slate-600'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`text-3xl font-bold ${
                              statusInfo.category === 'success' ? 'text-green-400' :
                              statusInfo.category === 'redirect' ? 'text-blue-400' :
                              statusInfo.category === 'client-error' ? 'text-orange-400' :
                              statusInfo.category === 'server-error' ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {statusCode}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-semibold mb-1 ${
                                statusInfo.category === 'success' ? 'text-green-300' :
                                statusInfo.category === 'redirect' ? 'text-blue-300' :
                                statusInfo.category === 'client-error' ? 'text-orange-300' :
                                statusInfo.category === 'server-error' ? 'text-red-300' :
                                'text-slate-300'
                              }`}>
                                {currentTab.response.statusText}
                              </div>
                              <div className="text-xs italic text-slate-400 border-l-2 border-slate-600 pl-3 py-1">
                                "{statusInfo.message}"
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Response Time</div>
                        <div className="text-lg font-semibold text-yellow-400">
                          {currentTab?.response?.time}ms
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {currentTab?.response?.time < 200 ? 'Lightning fast!' :
                           currentTab?.response?.time < 500 ? 'Pretty quick!' :
                           currentTab?.response?.time < 1000 ? 'Not bad!' :
                           'Could be faster...'}
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Response Size</div>
                        <div className="text-lg font-semibold text-yellow-400">
                          {((currentTab?.response?.size || 0) / 1024).toFixed(2)} KB
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {(currentTab?.response?.size || 0) < 1024 ? 'Tiny payload!' :
                           (currentTab?.response?.size || 0) < 10240 ? 'Compact size!' :
                           (currentTab?.response?.size || 0) < 102400 ? 'Moderate load' :
                           'Heavy response!'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {responseTab === 'tests' && (
                  <div className="space-y-4">
                    {currentTab?.testResults?.map((testResult, index) => (
                      <div key={index} className={`p-4 rounded-lg border-2 ${
                        testResult.passed ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`text-3xl font-bold ${
                            testResult.passed ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {testResult.passed ? '✓' : '✗'}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-semibold mb-1 ${
                              testResult.passed ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {testResult.name}
                            </div>
                            <div className="text-xs italic text-slate-400 border-l-2 border-slate-600 pl-3 py-1">
                              {testResult.error}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {responseTab === 'console' && (
                  <div className="space-y-4">
                    {currentTab?.consoleLogs?.map((log, index) => (
                      <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                          {log}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderColor: '#334155'
          }
        }}
      />

      {/* Code Generation Modal */}
      {showCodeGen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-yellow-400">Code Generation</h2>
              <button onClick={() => setShowCodeGen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-slate-700">
              <select
                value={codeGenLang}
                onChange={(e) => { setCodeGenLang(e.target.value); generateCode(); }}
                className="px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="curl">cURL</option>
                <option value="javascript">JavaScript (Fetch)</option>
                <option value="python">Python (Requests)</option>
                <option value="nodejs">Node.js (Axios)</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-slate-300 font-mono bg-slate-800 p-4 rounded">{generatedCode}</pre>
            </div>
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success('Copied to clipboard!'); }}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History/Activity Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-yellow-400">Activity History</h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No request history yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">URL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Size</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item._id} className="border-b border-slate-700 hover:bg-slate-800">
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 font-medium">
                            {item.method}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300 truncate max-w-md">{item.url}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded ${
                            item.statusCode >= 200 && item.statusCode < 300 ? 'bg-green-900/30 text-green-400' :
                            item.statusCode >= 400 ? 'bg-red-900/30 text-red-400' :
                            'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            {item.statusCode}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">{item.responseTime}ms</td>
                        <td className="px-4 py-2 text-sm text-slate-300">{(item.responseSize / 1024).toFixed(2)} KB</td>
                        <td className="px-4 py-2 text-sm text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity History Side Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isHistorySidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-yellow-400">Activity History</h2>
            <button 
              onClick={() => setIsHistorySidebarOpen(false)} 
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No request history yet</p>
                <p className="text-xs mt-2">Send a request to see it here</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {history.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => loadRequestFromHistory(item)}
                    className="p-3 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700 hover:border-yellow-400"
                  >
                    {/* Method and Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 font-medium text-xs">
                        {item.method}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.statusCode >= 200 && item.statusCode < 300 ? 'bg-green-900/30 text-green-400' :
                        item.statusCode >= 400 ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {item.statusCode}
                      </span>
                    </div>

                    {/* URL */}
                    <div className="text-sm text-slate-300 mb-2 truncate" title={item.url}>
                      {item.url}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{item.responseTime}ms</span>
                      <span>{(item.responseSize / 1024).toFixed(2)} KB</span>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Clear Button */}
          {history.length > 0 && (
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={async () => {
                  if (confirm('Clear all history?')) {
                    await clearHistory();
                  }
                }}
                className="w-full px-4 py-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 transition-colors text-sm"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isHistorySidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsHistorySidebarOpen(false)}
        />
      )}

      {/* Environment Creation/Edit Modal */}
      {showEnvModal && (
        <EnvironmentModal
          onClose={() => {
            setShowEnvModal(false);
            setEditingEnvironment(null);
          }}
          onSave={handleSaveEnvironment}
          existingEnvironment={editingEnvironment}
        />
      )}

      {/* Collection Save Modal */}
      {showCollectionModal && (
        <CollectionModal
          onClose={() => {
            setShowCollectionModal(false);
            setEditingCollection(null);
          }}
          onSave={handleSaveCollection}
          existingCollection={editingCollection}
        />
      )}

      {/* Save Request to Collection Modal */}
      {showSaveRequestModal && (
        <SaveRequestModal
          onClose={() => setShowSaveRequestModal(false)}
          onSave={handleSaveRequestToCollection}
          collections={collections}
        />
      )}

      {/* Localhost Bridge - Listens for WebSocket commands and executes local fetches */}
      <LocalhostBridge 
        socket={localhostRelay.socket} 
        isReady={localhostRelay.isReady} 
      />
    </div>
  );
}
