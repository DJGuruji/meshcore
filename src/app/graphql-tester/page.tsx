'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlayIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { useNavigationState } from '@/contexts/NavigationStateContext';
import CodeEditor from '@/components/CodeEditor';

const inputStyles =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';
const textareaStyles =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white font-mono placeholder-slate-400 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/40';
const labelStyles = 'text-[10px] font-semibold uppercase tracking-[0.4em] text-indigo-200';
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

interface Auth {
  type: string;
  bearerToken?: string;
  basicAuth?: { username: string; password: string };
}

interface GraphQLRequest {
  id?: string;
  name: string;
  query: string;
  variables: string;
  url: string;
  headers: Header[];
  auth: Auth;
}

interface Collection {
  _id: string;
  name: string;
  description: string;
  requests: GraphQLRequest[];
}

interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

interface Environment {
  _id: string;
  name: string;
  variables: EnvironmentVariable[];
  isGlobal: boolean;
}

interface HistoryItem {
  id: string;
  query: string;
  variables: string;
  url: string;
  headers: Header[];
  auth: Auth;
  timestamp: string;
  response?: {
    data: any;
    time: number;
    size: number;
    timestamp: string;
    status: number;
    statusText: string;
  };
}

interface Tab {
  id: string;
  name: string;
  url: string;
  query: string;
  variables: string;
  headers: Header[];
  auth: Auth;
  response: {
    data: any;
    time: number;
    size: number;
    timestamp: string;
    status: number;
    statusText: string;
  } | null;
}

export default function GraphQLTesterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { state, updateState } = useNavigationState();

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

  // Tab management
  const [tabs, setTabs] = useState<Tab[]>(state.graphQlTesterTabs.length > 0 ? state.graphQlTesterTabs : [
    {
      id: 'tab-1',
      name: 'Untitled Request',
      url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/tools/graphql-test`,
      query: `query {
  users {
    id
    name
    email
  }
}`,
      variables: '{\n  "id": "1"\n}',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true }
      ],
      auth: {
        type: 'none',
        bearerToken: '',
        basicAuth: { username: '', password: '' }
      },
      response: null
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(state.activeGraphQlTesterTabId || 'tab-1');

  // Get current tab data
  const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const {
    name: requestName,
    url,
    query,
    variables,
    headers,
    auth,
    response
  } = currentTab;

  // Update current tab
  const updateCurrentTab = (updates: Partial<Tab>) => {
    const newTabs = tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    );
    setTabs(newTabs);
    // Save to navigation state
    updateState({ graphQlTesterTabs: newTabs });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'query' | 'codeql' | 'auth'>('query');
  const [responseTab, setResponseTab] = useState<'body' | 'info'>('body');
  const [showHistory, setShowHistory] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Collections and Environments
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showSaveRequestModal, setShowSaveRequestModal] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  
  // Environment management
  const [showEnvironmentModal, setShowEnvironmentModal] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [newEnvironmentVariables, setNewEnvironmentVariables] = useState<Array<{key: string; value: string; description?: string; enabled: boolean}>>([{ key: '', value: '', description: '', enabled: true }]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchCollections();
      fetchEnvironments();
      fetchHistory();
    }
  }, [status, router]);

  // Keyboard shortcuts for switching tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when modifier keys are pressed
      if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
      
      // Ctrl/Cmd + Alt + Q = Query
      if (e.key.toLowerCase() === 'q' && e.altKey) {
        e.preventDefault();
        setActiveTab('query');
      }
      // Ctrl/Cmd + Alt + C = CodeQL
      else if (e.key.toLowerCase() === 'c' && e.altKey) {
        e.preventDefault();
        setActiveTab('codeql');
      }
      // Ctrl/Cmd + Alt + A = Auth
      else if (e.key.toLowerCase() === 'a' && e.altKey) {
        e.preventDefault();
        setActiveTab('auth');
      }
      // Ctrl/Cmd + Enter = Send Request
      else if (e.key === 'Enter' && !e.altKey) {
        e.preventDefault();
        sendRequest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTab]);

  const fetchCollections = async () => {
    try {
      const res = await axios.get('/api/tools/graphql-tester/collections');
      setCollections(res.data);
    } catch (error) {
      console.error('Failed to fetch collections', error);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await axios.get('/api/tools/graphql-tester/environments');
      setEnvironments(res.data);
    } catch (error) {
      console.error('Failed to fetch environments', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/tools/graphql-tester/history');
      setHistory(res.data.history || []);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const addHeader = () => {
    updateCurrentTab({
      headers: [...headers, { key: '', value: '', enabled: true }]
    });
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    updateCurrentTab({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    updateCurrentTab({
      headers: headers.filter((_, i) => i !== index)
    });
  };

  const replaceVariables = (text: string): string => {
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
    
    return result;
  };

  const sendRequest = async () => {
    if (!url) {
      toast.error('Please enter a GraphQL endpoint URL');
      return;
    }

    setIsLoading(true);
    updateCurrentTab({ response: null });

    // Track request timing
    const startTime = Date.now();

    try {
      // Parse variables
      let parsedVariables = {};
      const finalVariables = replaceVariables(variables);
      if (finalVariables.trim()) {
        try {
          parsedVariables = JSON.parse(finalVariables);
        } catch (e) {
          toast.error('Invalid JSON in variables');
          setIsLoading(false);
          return;
        }
      }

      // Build headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add custom headers
      headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          const finalKey = replaceVariables(header.key);
          const finalValue = replaceVariables(header.value);
          requestHeaders[finalKey] = finalValue;
        }
      });

      // Add auth headers
      if (auth.type === 'bearer' && auth.bearerToken) {
        requestHeaders['Authorization'] = `Bearer ${replaceVariables(auth.bearerToken)}`;
      } else if (auth.type === 'basic' && auth.basicAuth?.username && auth.basicAuth?.password) {
        const credentials = `${replaceVariables(auth.basicAuth.username)}:${replaceVariables(auth.basicAuth.password)}`;
        requestHeaders['Authorization'] = `Basic ${btoa(credentials)}`;
      }

      // Build request body
      const requestBody = {
        query: replaceVariables(query),
        variables: parsedVariables
      };

      // Send request
      const res = await axios.post(replaceVariables(url), requestBody, {
        headers: requestHeaders
      });

      // Calculate timing and size
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const responseSize = new Blob([JSON.stringify(res.data)]).size;

      updateCurrentTab({ 
        response: {
          data: res.data,
          time: responseTime,
          size: responseSize,
          timestamp: new Date().toISOString(),
          status: res.status,
          statusText: res.statusText
        }
      });
      setResponseTab('body');
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        variables,
        url,
        headers,
        auth,
        response: {
          data: res.data,
          time: responseTime,
          size: responseSize,
          timestamp: new Date().toISOString(),
          status: res.status,
          statusText: res.statusText
        },
        timestamp: new Date().toISOString()
      };

      // Save to history
      try {
        await axios.post('/api/tools/graphql-tester/history', historyItem);
        fetchHistory(); // Refresh history
      } catch (error) {
        console.error('Failed to save to history', error);
      }

      toast.success('Request sent successfully!');
    } catch (error: any) {
      console.error('Request failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'Request failed';
      
      // Calculate timing even for errors
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Estimate error response size
      const errorSize = new Blob([JSON.stringify(error.response?.data || { error: errorMessage })]).size;

      // Add error to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        variables,
        url,
        headers,
        auth,
        response: {
          data: error.response?.data || { error: errorMessage },
          time: responseTime,
          size: errorSize,
          timestamp: new Date().toISOString(),
          status: error.response?.status || 500,
          statusText: error.response?.statusText || 'Internal Server Error'
        },
        timestamp: new Date().toISOString()
      };

      // Save to history
      try {
        await axios.post('/api/tools/graphql-tester/history', historyItem);
        fetchHistory(); // Refresh history
      } catch (historyError) {
        console.error('Failed to save error to history', historyError);
      }

      updateCurrentTab({ 
        response: {
          data: error.response?.data || { error: errorMessage },
          time: responseTime,
          size: errorSize,
          timestamp: new Date().toISOString(),
          status: error.response?.status || 500,
          statusText: error.response?.statusText || 'Internal Server Error'
        }
      });
      setResponseTab('body');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    updateCurrentTab({
      url: item.url,
      query: item.query,
      variables: item.variables,
      headers: item.headers || [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      auth: {
        type: item.auth?.type || 'none',
        bearerToken: item.auth?.bearerToken || '',
        basicAuth: item.auth?.basicAuth || { username: '', password: '' }
      },
      response: item.response || null
    });
    toast.success('Request loaded from history');
  };

  const clearHistory = async () => {
    try {
      await axios.delete('/api/tools/graphql-tester/history');
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      console.error('Failed to clear history', error);
      toast.error('Failed to clear history');
    }
  };

  const formatQuery = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(query), null, 2);
      updateCurrentTab({ query: formatted });
    } catch (e) {
      toast.error('Invalid JSON to format');
    }
  };

  const formatVariables = () => {
    try {
      if (variables.trim()) {
        const formatted = JSON.stringify(JSON.parse(variables), null, 2);
        updateCurrentTab({ variables: JSON.stringify(formatted, null, 2) });
      }
    } catch (e) {
      toast.error('Invalid JSON to format');
    }
  };

  const saveCollection = async () => {
    setShowCollectionModal(true);
  };

  const handleSaveCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    try {
      if (editingCollection) {
        // Update existing collection
        await axios.put('/api/tools/graphql-tester/collections', {
          id: editingCollection._id,
          name: newCollectionName,
          description: newCollectionDescription
        });
        toast.success('Collection updated!');
      } else {
        // Create new empty collection
        await axios.post('/api/tools/graphql-tester/collections', {
          name: newCollectionName,
          description: newCollectionDescription,
          requests: [] // Empty collection
        });
        toast.success('Collection created!');
      }

      fetchCollections();
      setShowCollectionModal(false);
      setEditingCollection(null);
      setNewCollectionName('');
      setNewCollectionDescription('');
    } catch (error: any) {
      console.error('Save collection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save collection';
      toast.error(errorMessage);
    }
  };

  const saveRequestToCollection = async () => {
    if (!requestName || requestName.trim() === '') {
      toast.error('Please enter a request name');
      return;
    }
    setShowSaveRequestModal(true);
  };

  const handleSaveRequestToCollection = async () => {
    if (!selectedCollectionId) {
      toast.error('Please select a collection');
      return;
    }

    try {
      const collection = collections.find(c => c._id === selectedCollectionId);
      if (!collection) {
        toast.error('Collection not found');
        return;
      }

      const request: GraphQLRequest = {
        name: requestName,
        query,
        variables,
        url,
        headers,
        auth
      };

      const updatedRequests = [...collection.requests, request];

      await axios.put('/api/tools/graphql-tester/collections', {
        id: selectedCollectionId,
        requests: updatedRequests
      });

      toast.success('Request saved to collection!');
      fetchCollections();
      setShowSaveRequestModal(false);
      setSelectedCollectionId('');
    } catch (error: any) {
      console.error('Save request error:', error);
      toast.error(error.response?.data?.message || 'Failed to save request');
    }
  };

  const loadRequestFromCollection = (request: GraphQLRequest) => {
    updateCurrentTab({
      name: request.name,
      url: request.url,
      query: request.query,
      variables: request.variables,
      headers: request.headers,
      auth: {
        type: request.auth?.type || 'none',
        bearerToken: request.auth?.bearerToken || '',
        basicAuth: request.auth?.basicAuth || { username: '', password: '' }
      },
      response: null
    });
    toast.success('Request loaded from collection');
  };

  const editCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDescription(collection.description || '');
    setShowCollectionModal(true);
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await axios.delete(`/api/tools/graphql-tester/collections?id=${collectionId}`);
      toast.success('Collection deleted!');
      fetchCollections();
    } catch (error: any) {
      console.error('Delete collection error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete collection');
    }
  };

  const createEnvironment = () => {
    setEditingEnvironment(null);
    setNewEnvironmentName('');
    setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
    setShowEnvironmentModal(true);
  };

  const editEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setNewEnvironmentName(environment.name);
    setNewEnvironmentVariables(environment.variables.map(v => ({ ...v })));
    setShowEnvironmentModal(true);
  };

  const deleteEnvironment = async (environmentId: string) => {
    if (!confirm('Are you sure you want to delete this environment?')) {
      return;
    }

    try {
      await axios.delete(`/api/tools/graphql-tester/environments?id=${environmentId}`);
      toast.success('Environment deleted!');
      fetchEnvironments();
      if (selectedEnvironment?._id === environmentId) {
        setSelectedEnvironment(null);
      }
    } catch (error: any) {
      console.error('Delete environment error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete environment');
    }
  };

  const handleSaveEnvironment = async () => {
    if (!newEnvironmentName.trim()) {
      toast.error('Please enter an environment name');
      return;
    }

    try {
      if (editingEnvironment) {
        // Update existing environment
        await axios.put('/api/tools/graphql-tester/environments', {
          id: editingEnvironment._id,
          name: newEnvironmentName,
          variables: newEnvironmentVariables.filter(v => v.key)
        });
        toast.success('Environment updated!');
      } else {
        // Create new environment
        await axios.post('/api/tools/graphql-tester/environments', {
          name: newEnvironmentName,
          variables: newEnvironmentVariables.filter(v => v.key),
          isGlobal: false
        });
        toast.success('Environment created!');
      }

      fetchEnvironments();
      setShowEnvironmentModal(false);
      setEditingEnvironment(null);
      setNewEnvironmentName('');
      setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
    } catch (error: any) {
      console.error('Save environment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save environment';
      toast.error(errorMessage);
    }
  };

  const addEnvironmentVariable = () => {
    setNewEnvironmentVariables([...newEnvironmentVariables, { key: '', value: '', description: '', enabled: true }]);
  };

  const removeEnvironmentVariable = (idx: number) => {
    setNewEnvironmentVariables(newEnvironmentVariables.filter((_, i) => i !== idx));
  };

  const updateEnvironmentVariable = (idx: number, field: 'key' | 'value' | 'description' | 'enabled', val: string | boolean) => {
    const newVars = [...newEnvironmentVariables];
    (newVars[idx] as any)[field] = val;
    setNewEnvironmentVariables(newVars);
  };

  // Tab management functions
  const createNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab = {
      id: newTabId,
      name: 'Untitled Request',
      url: 'http://localhost:3000/api/tools/graphql-test',
      query: `query {
  users {
    id
    name
    email
  }
}`,
      variables: '{\n  "id": "1"\n}',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true }
      ],
      auth: {
        type: 'none',
        bearerToken: '',
        basicAuth: { username: '', password: '' }
      },
      response: null
    };
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTabId(newTabId);
    // Save to navigation state
    updateState({ graphQlTesterTabs: newTabs, activeGraphQlTesterTabId: newTabId });
    toast.success('New request tab created');
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) {
      toast.error('Cannot close the last tab');
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If we closed the active tab, switch to the first tab
    let newActiveTabId = activeTabId;
    if (tabId === activeTabId) {
      newActiveTabId = newTabs[0].id;
      setActiveTabId(newActiveTabId);
    }
    
    // Save to navigation state
    updateState({ graphQlTesterTabs: newTabs, activeGraphQlTesterTabId: newActiveTabId });
    
    toast.success('Tab closed');
  };

  const updateTabName = (tabId: string, name: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, name } : tab
    ));
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-300 shadow-xl shadow-black/60">
          Preparing CodeQL workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <Toaster position="top-right" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/15 blur-[160px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-500/15 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />
      </div>

      {/* Main Layout - Sidebar + Content */}
      <div className="relative m-4 flex h-[calc(100vh-2rem)] overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_25px_80px_rgba(2,6,23,0.8)] backdrop-blur-2xl">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 bg-[#050915]/80 backdrop-blur-xl flex flex-col">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-200">EchoStorm</p>
                <h2 className="text-lg font-semibold text-white">CodeQL</h2>
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
          </div>

          {/* Collections Section */}
          <div className="border-b border-white/5 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className={labelStyles}>Collections</p>
              <button
                onClick={saveCollection}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 p-1 text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
                title="Create new collection"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {collections.length === 0 ? (
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                No collections yet
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {collections.map((collection) => (
                  <div
                    key={collection._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-indigo-400/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-1 items-center gap-2">
                        <div className="rounded-2xl bg-indigo-500/20 p-2">
                          <FolderIcon className="h-4 w-4 text-indigo-200" />
                        </div>
                        <span className="flex-1 truncate text-sm font-medium text-white">
                          {collection.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCollection(collection);
                          }}
                          className="rounded-2xl border border-white/10 p-1 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                          title="Edit collection"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(collection._id);
                          }}
                          className="rounded-2xl border border-white/10 p-1 text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                          title="Delete collection"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {collection.requests.length > 0 && (
                      <div className="ml-8 mt-2 space-y-1">
                        {collection.requests.map((req, idx) => (
                          <button
                            key={`${collection._id}-${idx}`}
                            className="w-full truncate rounded-2xl px-2 py-1 text-left text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                            onClick={() => loadRequestFromCollection(req)}
                          >
                            {req.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environments Section */}
          <div className="border-b border-white/5 px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className={labelStyles}>Environments</p>
              <button
                onClick={createEnvironment}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 p-1 text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
                title="Create new environment"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <select
              value={selectedEnvironment?._id || ''}
              onChange={(e) => {
                const env = environments.find(en => en._id === e.target.value);
                setSelectedEnvironment(env || null);
              }}
              className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
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
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    {selectedEnvironment.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => editEnvironment(selectedEnvironment)}
                      className="rounded-2xl border border-white/10 p-1 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                      title="Edit environment"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteEnvironment(selectedEnvironment._id)}
                      className="rounded-2xl border border-white/10 p-1 text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                      title="Delete environment"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {selectedEnvironment.variables.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-300">Variables</div>
                    {selectedEnvironment.variables.slice(0, 3).map((v, idx) => (
                      <div key={`${selectedEnvironment._id}-${idx}`} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-indigo-200">{`{{${v.key}}}`}</span>
                        <span className="flex-1 truncate text-slate-300" title={v.value}>
                          {v.value}
                        </span>
                      </div>
                    ))}
                    {selectedEnvironment.variables.length > 3 && (
                      <div className="text-xs text-slate-500">
                        +{selectedEnvironment.variables.length - 3} more…
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

       
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#040714]/70 backdrop-blur">
          {/* Tab Bar */}
          <div className="flex items-center overflow-x-auto border-b border-white/5 bg-[#050c1f]/80 scrollbar-thin scrollbar-thumb-white/10">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`group flex min-w-[200px] max-w-[250px] items-center gap-2 border-r border-white/5 px-4 py-2 text-sm transition cursor-pointer ${
                  tab.id === activeTabId
                    ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                    : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => {
                  setActiveTabId(tab.id);
                  // Save to navigation state
                  updateState({ activeGraphQlTesterTabId: tab.id });
                }}
              >
                {/* Tab Name */}
                <span className="flex-1 truncate text-sm">
                  {tab.name || 'Untitled Request'}
                </span>

                {/* Close Tab */}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-900/40 hover:text-red-300 group-hover:opacity-100"
                    title="Close tab"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={createNewTab}
              className="p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="New tab"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Request Name and URL Input */}
          <div className="border-b border-white/5 bg-[#050c1f]/80 px-6 py-5">
            <div className="mb-3">
              <input
                type="text"
                value={requestName}
                onChange={(e) => updateCurrentTab({ name: e.target.value })}
                placeholder="Request name"
                className={`${inputStyles} font-semibold`}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => updateCurrentTab({ url: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendRequest();
                  }
                }}
                placeholder="https://your-graphql-endpoint.com/graphql"
                className={`${inputStyles} flex-1`}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveRequestToCollection}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400/40 hover:bg-white/5"
                >
                  Save
                </button>
                <button
                  onClick={sendRequest}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <PlayIcon className="h-4 w-4" />
                  {isLoading ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 bg-[#040a1d]/80">
            <div className="flex gap-1 px-6">
              {(['query', 'codeql', 'auth'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${
                    activeTab === tab
                      ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'codeql' ? 'CodeQL' : tab}
                </button>
              ))}
              <div className="flex-1"></div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Activity {history.length > 0 && `(${history.length})`}
              </button>
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-white/5 hover:text-white"
                title="Keyboard Shortcuts"
              >
                ⌨️
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-transparent px-6 py-6">
            {activeTab === 'query' && (
              <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-2">
                <div className={`${sectionCard} flex flex-col`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={labelStyles}>Query</p>
                    <button
                      onClick={formatQuery}
                      className="text-xs font-semibold text-indigo-200 transition hover:text-white"
                    >
                      Format
                    </button>
                  </div>
                  <div className="flex-1">
                    <CodeEditor
                      value={query}
                      onChange={(value) => updateCurrentTab({ query: value })}
                      language="javascript"
                      placeholder="query { users { id name email } }"
                      className="h-full"
                    />
                  </div>
                </div>

                <div className={`${sectionCard} flex flex-col`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={labelStyles}>Variables</p>
                    <button
                      onClick={formatVariables}
                      className="text-xs font-semibold text-indigo-200 transition hover:text-white"
                    >
                      Format
                    </button>
                  </div>
                  <div className="flex-1">
                    <CodeEditor
                      value={variables}
                      onChange={(value) => updateCurrentTab({ variables: value })}
                      language="json"
                      placeholder='{ "id": "123" }'
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'codeql' && (
              <div className={sectionCard}>
                <div className="mb-4 flex items-center justify-between">
                  <p className={labelStyles}>CodeQL Headers</p>
                  <button
                    onClick={addHeader}
                    className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {headers.map((header, index) => (
                    <div key={index} className="grid grid-cols-12 items-center gap-2 rounded-[20px] border border-white/10 bg-white/5 p-3">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        placeholder="Key"
                        className={`${inputStyles} col-span-4`}
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="Value"
                        className={`${inputStyles} col-span-5`}
                      />
                      <div className="col-span-3 flex items-center justify-end gap-3 text-xs">
                        <label className="inline-flex items-center gap-2 text-slate-200">
                          <input
                            type="checkbox"
                            checked={header.enabled}
                            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-400 focus:ring-indigo-400/40"
                          />
                          Enabled
                        </label>
                        <button
                          onClick={() => removeHeader(index)}
                          className="rounded-2xl border border-white/10 p-1 text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                          title="Remove header"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className={sectionCard}>
                <div className="mb-4 flex flex-wrap gap-2">
                  {['none', 'bearer', 'basic'].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateCurrentTab({ auth: { ...auth, type: type as Auth['type'] } })}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${auth.type === type ? 'bg-white/15 text-white shadow-inner shadow-white/10' : 'border border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {auth.type === 'bearer' && (
                  <div>
                    <label className={`${labelStyles} mb-2 block`}>Token</label>
                    <input
                      type="text"
                      value={auth.bearerToken || ''}
                      onChange={(e) => updateCurrentTab({ auth: { ...auth, bearerToken: e.target.value } })}
                      placeholder="Enter your token"
                      className={inputStyles}
                    />
                  </div>
                )}

                {auth.type === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className={`${labelStyles} mb-2 block`}>Username</label>
                      <input
                        type="text"
                        value={auth.basicAuth?.username || ''}
                        onChange={(e) =>
                          updateCurrentTab({
                            auth: {
                              ...auth,
                              basicAuth: { ...auth.basicAuth!, username: e.target.value }
                            }
                          })}
                        placeholder="Enter your username"
                        className={inputStyles}
                      />
                    </div>
                    <div>
                      <label className={`${labelStyles} mb-2 block`}>Password</label>
                      <input
                        type="password"
                        value={auth.basicAuth?.password || ''}
                        onChange={(e) =>
                          updateCurrentTab({
                            auth: {
                              ...auth,
                              basicAuth: { ...auth.basicAuth!, password: e.target.value }
                            }
                          })}
                        placeholder="Enter your password"
                        className={inputStyles}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Response Section */}
          <div className="flex h-72 flex-col border-t border-white/5 bg-[#050c1f]/80">
            <div className="border-b border-white/5">
              <div className="flex items-center gap-2 px-6 py-3">
                {(['body', 'info'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResponseTab(tab)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${
                      responseTab === tab
                        ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                {response && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
                        toast.success('Response copied to clipboard');
                      }}
                      className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                      title="Copy response"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `graphql-response-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                      title="Download response"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-black/40 px-6 py-4">
              {!response ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Send a request to see the response
                </div>
              ) : (
                <>
                  {responseTab === 'body' && (
                    <div className="h-full space-y-4">
                      {/* Status Info */}
                      {response.status && (() => {
                        const statusInfo = getStatusMessage(response.status);
                        return (
                          <div
                            className={`rounded-3xl border px-4 py-3 text-sm shadow-inner ${
                              statusInfo.category === 'success'
                                ? 'border-green-500/40 bg-green-500/10 text-green-200'
                                : statusInfo.category === 'redirect'
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                                : statusInfo.category === 'client-error'
                                ? 'border-orange-500/40 bg-orange-500/10 text-orange-200'
                                : 'border-red-500/40 bg-red-500/10 text-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">Status: {response.status} {response.statusText}</div>
                              <div className="text-xs text-white/60">
                                Size: {response.size} Bytes • Time: {response.time} ms
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-white">{statusInfo.message}</div>
                          </div>
                        );
                      })()}
                      
                      <CodeEditor
                        value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                        onChange={() => {}} // Read-only
                        language="json"
                        readOnly={true}
                        className="h-full"
                      />
                    </div>
                  )}

                  {responseTab === 'info' && (
                    <div className="space-y-4">
                      {response.status && (() => {
                        const statusInfo = getStatusMessage(response.status);
                        return (
                          <div
                            className={`rounded-3xl border px-4 py-3 text-sm shadow-inner ${
                              statusInfo.category === 'success'
                                ? 'border-green-500/40 bg-green-500/10 text-green-200'
                                : statusInfo.category === 'redirect'
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                                : statusInfo.category === 'client-error'
                                ? 'border-orange-500/40 bg-orange-500/10 text-orange-200'
                                : 'border-red-500/40 bg-red-500/10 text-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">{response.status}</div>
                              <div className="text-xs text-white/60">
                                {response.statusText} • {response.time}ms • {(response.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-white">{statusInfo.message}</div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 gap-3 text-xs text-slate-200 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-slate-400">Response Time</div>
                          <div className="text-lg font-semibold text-white">{response.time}ms</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-slate-400">Payload Size</div>
                          <div className="text-lg font-semibold text-white">
                            {(response.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>

                      {response.timestamp && (
                        <div className="text-xs text-slate-400">
                          Recorded at {new Date(response.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        {/* History Side Panel */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur">
            <div className="flex h-full w-full max-w-md flex-col rounded-l-[32px] border border-white/10 bg-[#050915]/95 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div>
                  <p className={labelStyles}>Activity</p>
                  <h2 className="text-lg font-semibold text-white">Recent Runs</h2>
                </div>
                <div className="flex gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {history.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No history yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          loadFromHistory(item);
                          setShowHistory(false);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-indigo-400/40"
                      >
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="truncate text-sm font-semibold text-white" title={item.url}>
                          {item.url}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-300">
                          {item.query && item.query.split ? item.query.split('\\n')[0] : 'Untitled Request'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collection Creation Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className={`${modalShell} max-w-md`}>
            <div className={modalHeader}>
              <div>
                <p className={labelStyles}>
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {editingCollection ? 'Edit Collection' : 'New Collection'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
                className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 px-5 py-6">
              <div className={sectionCard}>
                <label className={`${labelStyles} mb-2 block`}>Collection Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="My CodeQL Collection"
                  className={inputStyles}
                  autoFocus
                />
              </div>
              <div className={sectionCard}>
                <label className={`${labelStyles} mb-2 block`}>Description (Optional)</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Give your collection some context"
                  className={`${textareaStyles} h-24`}
                />
              </div>
            </div>
            <div className={modalFooter}>
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollection}
                disabled={!newCollectionName.trim()}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {editingCollection ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Request Modal */}
      {showSaveRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className={`${modalShell} max-w-md`}>
            <div className={modalHeader}>
              <div>
                <p className={labelStyles}>Save Request</p>
                <h2 className="text-lg font-semibold text-white">Add to Collection</h2>
              </div>
              <button
                onClick={() => setShowSaveRequestModal(false)}
                className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 px-5 py-6">
              <div className={sectionCard}>
                <label className={`${labelStyles} mb-2 block`}>Select Collection</label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className={inputStyles}
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
                <p className="text-sm text-slate-300">
                  No collections yet. Create one first!
                </p>
              )}
            </div>
            <div className={modalFooter}>
              <button
                onClick={() => setShowSaveRequestModal(false)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequestToCollection}
                disabled={!selectedCollectionId}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal
          onClose={() => setShowKeyboardShortcuts(false)}
        />
      )}

      {/* Environment Creation/Edit Modal */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className={`${modalShell} max-w-3xl max-h-[90vh] flex flex-col`}>
            <div className={modalHeader}>
              <div>
                <p className={labelStyles}>
                  {editingEnvironment ? 'Update Environment' : 'Create Environment'}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {editingEnvironment ? 'Edit Environment' : 'New Environment'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowEnvironmentModal(false);
                  setEditingEnvironment(null);
                  setNewEnvironmentName('');
                  setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
                }}
                className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              <div className={sectionCard}>
                <label className={`${labelStyles} mb-2 block`}>Environment Name</label>
                <input
                  type="text"
                  value={newEnvironmentName}
                  onChange={(e) => setNewEnvironmentName(e.target.value)}
                  placeholder="Production, Staging, Development, etc."
                  className={inputStyles}
                  autoFocus
                />
              </div>
              <div className={sectionCard}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className={labelStyles}>Environment Variables</label>
                    <p className="text-xs text-slate-300 mt-1">Use variables in URLs like: {'{{'}baseUrl{'}}'}/users</p>
                  </div>
                  <button onClick={addEnvironmentVariable} className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/40 hover:text-white">
                    <PlusIcon className="w-4 h-4" /> Add Variable
                  </button>
                </div>
                <div className="space-y-3">
                  {newEnvironmentVariables.map((v, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => updateEnvironmentVariable(idx, 'key', e.target.value)}
                          placeholder="Variable name (e.g., baseUrl, apiKey)"
                          className={inputStyles}
                        />
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e) => updateEnvironmentVariable(idx, 'value', e.target.value)}
                          placeholder="Value (e.g., https://api.example.com)"
                          className={inputStyles}
                        />
                        <button
                          onClick={() => removeEnvironmentVariable(idx)}
                          className="rounded-2xl border border-white/10 px-2 text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                          title="Remove variable"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={v.description || ''}
                        onChange={(e) => updateEnvironmentVariable(idx, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className={`${inputStyles} text-xs`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={modalFooter}>
              <button
                onClick={() => {
                  setShowEnvironmentModal(false);
                  setEditingEnvironment(null);
                  setNewEnvironmentName('');
                  setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
                }}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnvironment}
                disabled={!newEnvironmentName}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {editingEnvironment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      </div>
  );
}

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Ctrl/Cmd + Enter', description: 'Send request' },
    { key: 'Enter (on URL field)', description: 'Send request' },
    { key: 'Ctrl/Cmd + Alt + Q', description: 'Switch to Query tab' },
    { key: 'Ctrl/Cmd + Alt + C', description: 'Switch to CodeQL tab' },
    { key: 'Ctrl/Cmd + Alt + A', description: 'Switch to Auth tab' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#050915]/95 text-white shadow-[0_25px_60px_rgba(2,6,23,0.85)] backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-base font-semibold tracking-wide text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-sm text-slate-300">{shortcut.description}</span>
                <kbd className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-semibold text-white">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Tip: Use Ctrl/Cmd + Enter to send requests, or Ctrl/Cmd + Alt + Letter to switch tabs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
