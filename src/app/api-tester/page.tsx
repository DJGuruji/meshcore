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
import dynamic from 'next/dynamic';
import { useNavigationState } from '@/contexts/NavigationStateContext';

// Dynamically import LocalhostBridge to avoid SSR issues
const LocalhostBridge = dynamic(() => import('@/components/LocalhostBridge'), { 
  ssr: false,
  loading: () => null
});

const inputStyles =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
const textareaStyles =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
const labelStyles = 'text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200';
const modalShell =
  'w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#050915]/95 text-white shadow-[0_25px_60px_rgba(2,6,23,0.85)] backdrop-blur-2xl';
const modalHeader = 'flex items-center justify-between border-b border-white/5 px-5 py-4';
const modalFooter = 'flex justify-end gap-2 border-t border-white/5 px-5 py-4';
const sectionCard =
  'rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_15px_35px_rgba(2,6,23,0.5)]';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className={`${modalShell} max-h-[90vh] flex flex-col`}>
        <div className={modalHeader}>
          <h2 className="text-base font-semibold tracking-wide text-white">
            {existingEnvironment ? 'Edit Environment' : 'Create Environment'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          <div className={sectionCard}>
            <label className="text-xs uppercase tracking-[0.4em] text-indigo-200">Environment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production, Staging, Development, etc."
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              autoFocus
            />
          </div>
          <div className={sectionCard}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Environment Variables</p>
                <p className="mt-1 text-xs text-slate-300">
                  Use variables like <span className="font-mono text-white">{'{{'}baseUrl{'}}'}</span>/users
                </p>
              </div>
              <button
                onClick={addVariable}
                className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                <PlusIcon className="h-4 w-4" /> Add Variable
              </button>
            </div>
            <div className="space-y-3">
              {variables.map((v, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={v.key}
                      onChange={(e) => updateVariable(idx, 'key', e.target.value)}
                      placeholder="Variable name (e.g., baseUrl)"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
                    />
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
                    />
                    <button
                      onClick={() => removeVariable(idx)}
                      className="rounded-2xl border border-white/10 px-2 py-2 text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                      title="Remove variable"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={v.description || ''}
                    onChange={(e) => updateVariable(idx, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={modalFooter}>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, variables.filter(v => v.key))}
            disabled={!name}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#050915]/95 text-white shadow-[0_25px_60px_rgba(2,6,23,0.85)] backdrop-blur-2xl">
        <div className={modalHeader}>
          <h2 className="text-base font-semibold tracking-wide text-white">
            {existingCollection ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-5 py-6">
          <div className={sectionCard}>
            <label className={labelStyles}>Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Collection"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              autoFocus
            />
          </div>
          <div className={sectionCard}>
            <label className={labelStyles}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Collection description..."
              className={`${textareaStyles} mt-2 h-28`}
            />
          </div>
        </div>
        <div className={modalFooter}>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, description)}
            disabled={!name}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#050915]/95 text-white shadow-[0_25px_60px_rgba(2,6,23,0.85)] backdrop-blur-2xl">
        <div className={modalHeader}>
          <h2 className="text-base font-semibold tracking-wide text-white">Save Request to Collection</h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-5 py-6">
          <div className={sectionCard}>
            <label className={labelStyles}>Select Collection</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
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
            <p className="text-sm text-slate-400">No collections yet. Create one first!</p>
          )}
        </div>
        <div className={modalFooter}>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedCollectionId)}
            disabled={!selectedCollectionId}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
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
  const { state, updateState } = useNavigationState();

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
  const [requestTabs, setRequestTabs] = useState<RequestTab[]>(state.apiTesterTabs.length > 0 ? state.apiTesterTabs : [{
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
  const [activeTabId, setActiveTabId] = useState(state.activeApiTesterTabId || 'tab-1');

  // Get current tab data
  const currentTab = requestTabs.find(tab => tab.id === activeTabId);
  const currentRequest = currentTab?.request || requestTabs[0].request;
  const setCurrentRequest = (request: Request) => {
    const newTabs = requestTabs.map(tab => 
      tab.id === activeTabId ? { ...tab, request, isSaved: false } : tab
    );
    setRequestTabs(newTabs);
    // Save to navigation state
    updateState({ apiTesterTabs: newTabs });
  };

  const [response, setResponse] = useState<any>(currentTab?.response || null);
  const [testResults, setTestResults] = useState<TestResult[]>(currentTab?.testResults || []);
  const [consoleLogs, setConsoleLogs] = useState<any[]>(currentTab?.consoleLogs || []);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'tests'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'info' | 'tests' | 'console' | 'payload'>('body');
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
      
      // Log decision logic for debugging
      console.log('[API Tester] Decision logic:', {
        finalUrl,
        isLocalhost,
        isProductionUI,
        relayReady: localhostRelay.isReady,
        relayStatus: localhostRelay.status
      });
      
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
        mode: 'cors', // Enable CORS mode for better error handling
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
      
      // Check if this is a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          response: {
            data: {
              error: true,
              message: 'CORS Error: ' + error.message + '\n\n' +
                      'This error occurs when the target server does not allow cross-origin requests.\n' +
                      'Possible solutions:\n' +
                      '1. Add CORS headers to your API server\n' +
                      '2. Use the localhost relay for testing local APIs\n' +
                      '3. Run your API server with CORS enabled',
              time: endTime - startTime,
              timestamp: new Date().toISOString()
            }
          }
        };
      }
      
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

  // Helper function to mask sensitive data
  const maskSensitiveData = (data: string): string => {
    if (!data) return '';
    
    // For JSON strings, parse and mask sensitive fields
    if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(data);
        const masked = maskObject(parsed);
        return JSON.stringify(masked, null, 2);
      } catch (e) {
        // If parsing fails, treat as regular string
      }
    }
    
    // For regular strings, mask common sensitive patterns
    return data
      .replace(/(password|pwd|pass|secret|token|key|auth|authorization)(["\s:=]*)[^\s"'&;]*/gi, '$1$2********')
      .replace(/(Bearer\s+)[^\s]+/gi, '$1********')
      .replace(/(Basic\s+)[^\s]+/gi, '$1********')
      .replace(/[a-zA-Z0-9]{32,}/g, '********************************')
      .replace(/[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}/g, '****-****-****-****');
  };

  // Helper function to recursively mask sensitive fields in objects
  const maskObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return maskSensitiveData(obj);
    }
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(item => maskObject(item));
      }
      
      const maskedObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Mask sensitive field names
          if (/(password|pwd|pass|secret|token|key|auth|authorization)/i.test(key)) {
            maskedObj[key] = '********';
          } else {
            maskedObj[key] = maskObject(obj[key]);
          }
        }
      }
      return maskedObj;
    }
    
    return obj;
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
    const newTabs = [...requestTabs, newTab];
    setRequestTabs(newTabs);
    setActiveTabId(newTabId);
    // Save to navigation state
    updateState({ apiTesterTabs: newTabs, activeApiTesterTabId: newTabId });
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
    let newActiveTabId = activeTabId;
    if (tabId === activeTabId) {
      const currentIndex = requestTabs.findIndex(t => t.id === tabId);
      const newActiveTab = newTabs[currentIndex] || newTabs[currentIndex - 1] || newTabs[0];
      newActiveTabId = newActiveTab.id;
      setActiveTabId(newActiveTabId);
    }
    
    // Save to navigation state
    updateState({ apiTesterTabs: newTabs, activeApiTesterTabId: newActiveTabId });
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
    // Save to navigation state
    updateState({ apiTesterTabs: newTabs, activeApiTesterTabId: newTabId });
    toast.success('Tab duplicated');
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-300 shadow-xl shadow-black/60">
          Preparing API tester…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/15 blur-[160px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-500/15 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />
      </div>
      <div className="relative m-4 flex h-[calc(100vh-2rem)] overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_25px_80px_rgba(2,6,23,0.8)] backdrop-blur-2xl">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-72 border-r border-white/10 bg-[#050915]/80 backdrop-blur-xl flex flex-col">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-200">Sadasya</p>
                <h2 className="text-lg font-semibold text-white">API Tester</h2>
              </div>
              <button
                onClick={createNewTab}
                className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
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
                <div className={`flex items-center gap-2 rounded-2xl border border-white/5 px-3 py-1 ${
                  localhostRelay.status === 'ready' ? 'bg-green-900/30 text-green-400' :
                  localhostRelay.status === 'connecting' ? 'bg-yellow-900/30 text-yellow-400' :
                  localhostRelay.status === 'error' ? 'bg-red-900/30 text-red-400' :
                  'bg-white/5 text-slate-300'
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

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            <div className={sectionCard}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Collections</h3>
                <button 
                  onClick={saveCollection} 
                  className="rounded-2xl border border-white/10 p-2 text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
                  title="Create new collection"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              {collections.length === 0 ? (
                <p className="text-xs text-slate-400">No collections yet</p>
              ) : (
                <div className="space-y-1">
                  {collections.map((collection) => (
                    <div
                      key={collection._id}
                      className="rounded-2xl border border-white/5 bg-white/5 p-3 transition hover:border-indigo-400/40 hover:bg-white/10"
                    >
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCollection(collection)}>
                        <FolderIcon className="w-4 h-4 text-indigo-300" />
                        <span className="flex-1 text-sm text-white">{collection.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCollection(collection);
                          }}
                          className="rounded-full p-1 text-indigo-200 transition hover:bg-white/10 hover:text-white"
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
                          className="rounded-full p-1 text-rose-300 transition hover:bg-white/10 hover:text-white"
                          title="Delete collection"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                      {selectedCollection?._id === collection._id && (
                        <div className="ml-6 mt-2 space-y-1">
                          {collection.requests.length === 0 ? (
                            <p className="py-1 text-xs text-slate-400">No requests yet</p>
                          ) : (
                            collection.requests.map((req, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
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
                            className="flex items-center gap-1 py-1 text-xs text-indigo-200 transition hover:text-white"
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

            <div className={sectionCard}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Environments</h3>
                <button 
                  onClick={createEnvironment} 
                  className="rounded-2xl border border-white/10 p-2 text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
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
                className="mb-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              >
                <option className="bg-black/80" value="">No Environment</option>
                {environments.map((env) => (
                  <option key={env._id} value={env._id} className="bg-black/80">
                    {env.name} ({env.variables.length} vars)
                  </option>
                ))}
              </select>

              {/* Environment Details & Actions */}
              {selectedEnvironment && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-200">{selectedEnvironment.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => editEnvironment(selectedEnvironment)}
                        className="rounded-full p-1 text-indigo-200 transition hover:bg-white/10 hover:text-white"
                        title="Edit environment"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteEnvironment(selectedEnvironment._id)}
                        className="rounded-full p-1 text-rose-300 transition hover:bg-white/10 hover:text-white"
                        title="Delete environment"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedEnvironment.variables.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-300">Variables:</div>
                      {selectedEnvironment.variables.slice(0, 3).map((v, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                          <span className="font-mono text-indigo-200">{'{{' + v.key + '}}'}:</span>
                          <span className="flex-1 truncate text-slate-300" title={v.value}>{v.value}</span>
                        </div>
                      ))}
                      {selectedEnvironment.variables.length > 3 && (
                        <div className="text-xs text-slate-400">+{selectedEnvironment.variables.length - 3} more...</div>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#030712]/40 backdrop-blur">
        {/* Tab Bar */}
        <div className="flex items-center overflow-x-auto border-b border-white/5 bg-transparent px-4 scrollbar-thin scrollbar-thumb-slate-700">
          {requestTabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`group flex min-w-[200px] max-w-[260px] items-center gap-3 border-r border-white/5 px-4 py-2 text-xs transition ${
                tab.id === activeTabId
                  ? 'bg-white/10 text-white shadow-inner shadow-black/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {/* Method Badge */}
              <span className={`rounded-full px-2 py-0.5 font-mono ${
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
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Duplicate */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTab(tab.id);
                  }}
                  className="rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                  className="rounded-full p-1 text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300"
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
        <div className="flex-1 flex flex-col border-b border-white/5 overflow-y-auto">
          {/* URL Bar */}
          <div className="border-b border-white/5 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={currentRequest.method}
                onChange={(e) => setCurrentRequest({ ...currentRequest, method: e.target.value })}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 font-semibold text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              >
                <option className="bg-black/80">GET</option>
                <option className="bg-black/80">POST</option>
                <option className="bg-black/80">PUT</option>
                <option className="bg-black/80">PATCH</option>
                <option className="bg-black/80">DELETE</option>
                <option className="bg-black/80">OPTIONS</option>
                <option className="bg-black/80">HEAD</option>
              </select>
              
              <input
                type="text"
                value={currentRequest.url}
                onChange={(e) => setCurrentRequest({ ...currentRequest, url: e.target.value })}
                placeholder="https://api.example.com/endpoint or http://localhost:3000/api"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
              
              <button
                onClick={saveRequestToCollection}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Save
              </button>
              
              <button
                onClick={sendRequest}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayIcon className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 bg-transparent">
            <div className="flex gap-1 px-4">
              {(['params', 'headers', 'body', 'auth', 'scripts', 'tests'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? 'bg-white/10 text-white shadow-inner shadow-black/40'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="flex-1"></div>
              <button
                onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
                className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Activity {history.length > 0 && `(${history.length})`}
              </button>
              <button
                onClick={generateCode}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-white/5 hover:text-white"
              >
                Code
              </button>
            </div>
          </div>

          {/* Tab Content - Will be added in next part */}
          <div className="flex-1 overflow-y-auto bg-white/5 p-4">
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
        <div className="flex-1 flex flex-col overflow-hidden border-l border-white/5 bg-white/5">
          <div className="border-b border-white/5">
            <div className="flex gap-1 px-4">
              {(['body', 'headers', 'info', 'tests', 'console', 'payload'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setResponseTab(tab)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium capitalize transition ${
                    responseTab === tab
                      ? 'bg-white/10 text-white shadow-inner shadow-black/40'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
                <div className="ml-auto flex items-center gap-1">
                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      const responseText = typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                        ? (currentTab?.response?.body || currentTab?.response)
                        : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2);
                      navigator.clipboard.writeText(responseText);
                      toast.success('Response copied to clipboard');
                    }}
                    className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                    className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="Download response"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => toast.success('Filter feature coming soon')}
                    className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
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

          <div className="flex-1 overflow-y-auto bg-black/10 p-4">
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

                {responseTab === 'payload' && (
                  <div className="space-y-6">
                    {/* Request Payload Section */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Request Payload
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Method</div>
                            <div className="text-sm font-mono text-white px-2 py-1 bg-slate-700 rounded">
                              {currentTab?.request.method}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">URL</div>
                            <div className="text-sm font-mono text-white break-all max-w-md px-2 py-1 bg-slate-700 rounded">
                              {currentTab?.request.url}
                            </div>
                          </div>
                        </div>
                        
                        {currentTab?.request.headers && currentTab.request.headers.filter(h => h.enabled).length > 0 && (
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Headers</div>
                            <div className="text-sm bg-slate-700 rounded p-2 max-h-32 overflow-y-auto">
                              {currentTab.request.headers.filter(h => h.enabled).map((header, idx) => (
                                <div key={idx} className="flex gap-2 mb-1 last:mb-0">
                                  <span className="text-indigo-300">{header.key}:</span>
                                  <span className="text-slate-300 break-all">{maskSensitiveData(header.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentTab?.request.params && currentTab.request.params.filter(p => p.enabled).length > 0 && (
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Query Parameters</div>
                            <div className="text-sm bg-slate-700 rounded p-2 max-h-32 overflow-y-auto">
                              {currentTab.request.params.filter(p => p.enabled).map((param, idx) => (
                                <div key={idx} className="flex gap-2 mb-1 last:mb-0">
                                  <span className="text-indigo-300">{param.key}:</span>
                                  <span className="text-slate-300 break-all">{maskSensitiveData(param.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentTab?.request.body && currentTab.request.body.type !== 'none' && (
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Body ({currentTab.request.body.type})</div>
                            <div className="text-sm bg-slate-700 rounded p-2 max-h-32 overflow-y-auto font-mono">
                              <pre className="text-slate-300 whitespace-pre-wrap break-all">
                                {currentTab.request.body.type === 'json' && currentTab.request.body.json 
                                  ? maskSensitiveData(currentTab.request.body.json)
                                  : currentTab.request.body.type === 'raw' && currentTab.request.body.raw
                                  ? maskSensitiveData(currentTab.request.body.raw)
                                  : 'No body content'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Response Data Section */}
                    {currentTab?.response && (
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Response Data
                        </h3>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-4">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Status</div>
                              <div className="text-sm font-mono text-white px-2 py-1 bg-slate-700 rounded">
                                {currentTab.response.status} {currentTab.response.statusText}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Time</div>
                              <div className="text-sm font-mono text-white px-2 py-1 bg-slate-700 rounded">
                                {currentTab.response.time}ms
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Size</div>
                              <div className="text-sm font-mono text-white px-2 py-1 bg-slate-700 rounded">
                                {((currentTab.response.size || 0) / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          
                          {currentTab.response.headers && Object.keys(currentTab.response.headers).length > 0 && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Response Headers</div>
                              <div className="text-sm bg-slate-700 rounded p-2 max-h-32 overflow-y-auto">
                                {Object.entries(currentTab.response.headers).map(([key, value]) => (
                                  <div key={key} className="flex gap-2 mb-1 last:mb-0">
                                    <span className="text-indigo-300">{key}:</span>
                                    <span className="text-slate-300 break-all">{maskSensitiveData(value as string)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {currentTab.response.body && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Response Body</div>
                              <div className="text-sm bg-slate-700 rounded p-2 max-h-40 overflow-y-auto font-mono">
                                <pre className="text-slate-300 whitespace-pre-wrap break-all">
                                  {typeof currentTab.response.body === 'string' 
                                    ? maskSensitiveData(currentTab.response.body)
                                    : maskSensitiveData(JSON.stringify(currentTab.response.body, null, 2))}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#050915]/95 text-white shadow-[0_25px_60px_rgba(2,6,23,0.85)] backdrop-blur-2xl">
            <div className={modalHeader}>
              <h2 className="text-base font-semibold tracking-wide text-white">Code Generation</h2>
              <button
                onClick={() => setShowCodeGen(false)}
                className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="border-b border-white/5 px-5 py-4">
              <select
                value={codeGenLang}
                onChange={(e) => {
                  setCodeGenLang(e.target.value);
                  generateCode();
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              >
                <option value="curl">cURL</option>
                <option value="javascript">JavaScript (Fetch)</option>
                <option value="python">Python (Requests)</option>
                <option value="nodejs">Node.js (Axios)</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto bg-white/5 px-5 py-4">
              <pre className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-indigo-100">
                {generatedCode}
              </pre>
            </div>
            <div className={modalFooter}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  toast.success('Copied to clipboard!');
                }}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
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
    </div>
  );
}
