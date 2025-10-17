'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PlayIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

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
  variables: Array<{ key: string; value: string; enabled: boolean }>;
  isGlobal: boolean;
}

function EnvironmentModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, variables: Array<{key: string; value: string}>) => void }) {
  const [name, setName] = useState('');
  const [variables, setVariables] = useState<Array<{key: string; value: string}>>([{ key: '', value: '' }]);

  const addVariable = () => setVariables([...variables, { key: '', value: '' }]);
  const removeVariable = (idx: number) => setVariables(variables.filter((_, i) => i !== idx));
  const updateVariable = (idx: number, field: 'key' | 'value', val: string) => {
    const newVars = [...variables];
    newVars[idx][field] = val;
    setVariables(newVars);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-yellow-400">Create Environment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Environment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production, Staging, etc."
              className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">Variables</label>
              <button onClick={addVariable} className="text-sm text-yellow-400 hover:text-yellow-300">
                + Add Variable
              </button>
            </div>
            <div className="space-y-2">
              {variables.map((v, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={v.key}
                    onChange={(e) => updateVariable(idx, 'key', e.target.value)}
                    placeholder="Variable name"
                    className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                  />
                  <button onClick={() => removeVariable(idx)} className="text-red-400 hover:text-red-300 px-2">
                    ✕
                  </button>
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
            Create
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
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [showSaveRequestModal, setShowSaveRequestModal] = useState(false);

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

      const res = await axios.post('/api/tools/api-tester/send', {
        method: currentRequest.method,
        url: replaceVariables(currentRequest.url, preRequestVariables),
        headers: currentRequest.headers,
        params: currentRequest.params,
        requestBody: currentRequest.body,
        auth: currentRequest.auth
      });

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
    setShowEnvModal(true);
  };

  const handleCreateEnvironment = async (name: string, variables: Array<{key: string; value: string}>) => {
    try {
      await axios.post('/api/tools/api-tester/environments', {
        name,
        variables: variables.map(v => ({ ...v, enabled: true, description: '' })),
        isGlobal: false
      });

      toast.success('Environment created!');
      fetchEnvironments();
      setShowEnvModal(false);
    } catch (error: any) {
      console.error('Create environment error:', error);
      toast.error(error.response?.data?.message || 'Failed to create environment');
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
          auth: currentRequest.auth
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
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
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
                <button onClick={createEnvironment} className="text-yellow-400 hover:text-yellow-300">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              <select
                value={selectedEnvironment?._id || ''}
                onChange={(e) => {
                  const env = environments.find(en => en._id === e.target.value);
                  setSelectedEnvironment(env || null);
                }}
                className="w-full p-2 bg-slate-800 rounded text-sm border border-slate-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="">No Environment</option>
                {environments.map((env) => (
                  <option key={env._id} value={env._id}>
                    {env.name}
                  </option>
                ))}
              </select>
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
                placeholder="https://api.example.com/endpoint"
                className="flex-1 px-4 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
              />
              
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
                    {JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2)}
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
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-yellow-400">Status:</span>
                      <span className="text-slate-300">{currentTab?.response?.status} {currentTab?.response?.statusText}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-400">Time:</span>
                      <span className="text-slate-300">{currentTab?.response?.time}ms</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-400">Size:</span>
                      <span className="text-slate-300">{((currentTab?.response?.size || 0) / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                )}

                {responseTab === 'tests' && (
                  <div className="space-y-2">
                    {(currentTab?.testResults || []).length === 0 ? (
                      <div className="text-slate-500 text-sm">No tests run. Add test scripts in the Tests tab.</div>
                    ) : (
                      (currentTab?.testResults || []).map((test, idx) => (
                        <div key={idx} className={`p-3 rounded border ${
                          test.passed 
                            ? 'bg-green-900/20 border-green-500/30' 
                            : 'bg-red-900/20 border-red-500/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                              {test.passed ? '✓' : '✗'}
                            </span>
                            <span className="text-sm text-slate-200">{test.name}</span>
                          </div>
                          {test.error && (
                            <div className="mt-2 text-xs text-red-300 font-mono">{test.error}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {responseTab === 'console' && (
                  <div className="space-y-1">
                    {(currentTab?.consoleLogs || []).length === 0 ? (
                      <div className="text-slate-500 text-sm">No console output</div>
                    ) : (
                      (currentTab?.consoleLogs || []).map((log, idx) => (
                        <div key={idx} className="text-xs font-mono">
                          <span className="text-slate-500">[{log.type}]</span>{' '}
                          <span className="text-slate-300">
                            {typeof log.message === 'object' ? JSON.stringify(log.message) : String(log.message)}
                          </span>
                        </div>
                      ))
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
                onClick={() => {
                  if (confirm('Clear all history?')) {
                    setHistory([]);
                    toast.success('History cleared');
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

      {/* Environment Creation Modal */}
      {showEnvModal && (
        <EnvironmentModal
          onClose={() => setShowEnvModal(false)}
          onSave={handleCreateEnvironment}
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
    </div>
  );
}
