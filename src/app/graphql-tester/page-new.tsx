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
  response?: any;
}

export default function GraphQLTesterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState('http://localhost:3000/api/tools/graphql-test');
  const [query, setQuery] = useState(`query {
  users {
    id
    name
    email
  }
}`);
  const [variables, setVariables] = useState('{\n  "id": "1"\n}');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ]);
  const [auth, setAuth] = useState<Auth>({
    type: 'none',
    bearerToken: '',
    basicAuth: { username: '', password: '' }
  });
  const [requestName, setRequestName] = useState('Untitled Request');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'query' | 'headers' | 'auth'>('query');
  const [showHistory, setShowHistory] = useState(false);
  
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
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
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
    setResponse(null);

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

      setResponse(res.data);
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        variables,
        url,
        headers,
        auth,
        response: res.data,
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
      toast.error(errorMessage);
      
      // Add error to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        variables,
        url,
        headers,
        auth,
        response: error.response?.data || { error: errorMessage },
        timestamp: new Date().toISOString()
      };

      // Save to history
      try {
        await axios.post('/api/tools/graphql-tester/history', historyItem);
        fetchHistory(); // Refresh history
      } catch (historyError) {
        console.error('Failed to save error to history', historyError);
      }

      setResponse(error.response?.data || { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setUrl(item.url);
    setQuery(item.query);
    setVariables(item.variables);
    setHeaders(item.headers || [{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    setAuth(item.auth || { type: 'none', bearerToken: '', basicAuth: { username: '', password: '' } });
    setResponse(item.response || null);
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
      setQuery(formatted);
    } catch (e) {
      toast.error('Invalid JSON to format');
    }
  };

  const formatVariables = () => {
    try {
      if (variables.trim()) {
        const formatted = JSON.stringify(JSON.parse(variables), null, 2);
        setVariables(JSON.stringify(formatted, null, 2));
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
    setRequestName(request.name);
    setUrl(request.url);
    setQuery(request.query);
    setVariables(request.variables);
    setHeaders(request.headers);
    setAuth(request.auth);
    setResponse(null);
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

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-right" />
      
      {/* Main Layout - Sidebar + Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
          {/* Collections Section */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300">Collections</h2>
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collections.map((collection) => (
                  <div key={collection._id} className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <FolderIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm flex-1 truncate">{collection.name}</span>
                      </div>
                      <div className="flex gap-1">
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
                    </div>
                    {collection.requests.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {collection.requests.map((req, idx) => (
                          <div
                            key={`${collection._id}-${idx}`}
                            className="text-xs p-1 hover:bg-slate-700 rounded cursor-pointer truncate"
                            onClick={() => loadRequestFromCollection(req)}
                          >
                            {req.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environments Section */}
          <div className="p-4 border-b border-slate-700">
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
                      <div key={`${selectedEnvironment._id}-${idx}`} className="text-xs text-slate-300 flex items-start gap-1">
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

          {/* Documentation Section */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-yellow-400 mb-3">GraphQL Tester</h2>
            <div className="text-xs text-slate-400 space-y-2">
              <p>
                Test GraphQL APIs by sending queries with variables.
              </p>
              <div>
                <h3 className="font-medium text-slate-300 mb-1">How to use:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter GraphQL endpoint URL</li>
                  <li>Write your GraphQL query</li>
                  <li>Add variables in JSON format</li>
                  <li>Add headers if needed</li>
                  <li>Configure authentication</li>
                  <li>Click "Send" to execute</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Request Name and URL Input */}
          <div className="p-4 bg-slate-900 border-b border-slate-700">
            <div className="mb-3">
              <input
                type="text"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                placeholder="Request name"
                className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm font-medium"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-graphql-endpoint.com/graphql"
                className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
              />
              <button
                onClick={saveRequestToCollection}
                className="px-4 py-2 bg-slate-700 text-white rounded font-semibold hover:bg-slate-600 transition-colors text-sm"
              >
                Save
              </button>
              <button
                onClick={sendRequest}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <PlayIcon className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700 bg-slate-900">
            <div className="flex gap-1 px-4">
              {(['query', 'headers', 'auth'] as const).map((tab) => (
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
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Activity {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-black p-4">
            {activeTab === 'query' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Query Editor */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-semibold text-yellow-400">Query</h2>
                    <button
                      onClick={formatQuery}
                      className="text-xs text-slate-400 hover:text-yellow-400"
                    >
                      Format
                    </button>
                  </div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="query { users { id name email } }"
                    className="flex-1 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                </div>

                {/* Variables Editor */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-semibold text-yellow-400">Variables</h2>
                    <button
                      onClick={formatVariables}
                      className="text-xs text-slate-400 hover:text-yellow-400"
                    >
                      Format
                    </button>
                  </div>
                  <textarea
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    placeholder='{ "id": "123" }'
                    className="flex-1 p-3 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-yellow-400">Headers</h2>
                  <button
                    onClick={addHeader}
                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3" /> Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={`header-${index}`} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        placeholder="Header name"
                        className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="Header value"
                        className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-yellow-400">Authentication</h2>
                <select
                  value={auth.type}
                  onChange={(e) => setAuth({ ...auth, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>

                {auth.type === 'bearer' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Token</label>
                    <input
                      type="text"
                      value={auth.bearerToken || ''}
                      onChange={(e) => setAuth({ ...auth, bearerToken: e.target.value })}
                      placeholder="Enter your token"
                      className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                    />
                  </div>
                )}

                {auth.type === 'basic' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">Username</label>
                      <input
                        type="text"
                        value={auth.basicAuth?.username || ''}
                        onChange={(e) => setAuth({ 
                          ...auth, 
                          basicAuth: { ...auth.basicAuth!, username: e.target.value } 
                        })}
                        placeholder="Enter your username"
                        className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">Password</label>
                      <input
                        type="password"
                        value={auth.basicAuth?.password || ''}
                        onChange={(e) => setAuth({ 
                          ...auth, 
                          basicAuth: { ...auth.basicAuth!, password: e.target.value } 
                        })}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Response Section */}
          <div className="border-t border-slate-700 bg-slate-900 flex flex-col h-64">
            <div className="p-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-yellow-400">Response</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-black">
              {response ? (
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Send a request to see the response
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Side Panel */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
            <div className="bg-slate-900 w-full max-w-md h-full flex flex-col">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-yellow-400">Activity</h2>
                <div className="flex gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {history.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    No history yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-yellow-400 cursor-pointer"
                        onClick={() => {
                          loadFromHistory(item);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-mono text-yellow-400 truncate">
                            {item.url}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {item.query && item.query.split ? item.query.split('\n')[0] : 'Untitled Request'}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-yellow-400">
                {editingCollection ? 'Edit Collection' : 'Create Collection'}
              </h2>
              <button 
                onClick={() => {
                  setShowCollectionModal(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="My GraphQL Collection"
                  className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Collection description..."
                  className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none h-24"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
              <button 
                onClick={() => {
                  setShowCollectionModal(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }} 
                className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollection}
                disabled={!newCollectionName.trim()}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
              >
                {editingCollection ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Request Modal */}
      {showSaveRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-yellow-400">Save Request to Collection</h2>
              <button 
                onClick={() => setShowSaveRequestModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
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
              <button 
                onClick={() => setShowSaveRequestModal(false)} 
                className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequestToCollection}
                disabled={!selectedCollectionId}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Environment Creation/Edit Modal */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-yellow-400">
                {editingEnvironment ? 'Edit Environment' : 'Create Environment'}
              </h2>
              <button 
                onClick={() => {
                  setShowEnvironmentModal(false);
                  setEditingEnvironment(null);
                  setNewEnvironmentName('');
                  setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Environment Name</label>
                <input
                  type="text"
                  value={newEnvironmentName}
                  onChange={(e) => setNewEnvironmentName(e.target.value)}
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
                  <button onClick={addEnvironmentVariable} className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Add Variable
                  </button>
                </div>
                <div className="space-y-3">
                  {newEnvironmentVariables.map((v, idx) => (
                    <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => updateEnvironmentVariable(idx, 'key', e.target.value)}
                          placeholder="Variable name (e.g., baseUrl, apiKey)"
                          className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                        />
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e) => updateEnvironmentVariable(idx, 'value', e.target.value)}
                          placeholder="Value (e.g., https://api.example.com)"
                          className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-sm"
                        />
                        <button 
                          onClick={() => removeEnvironmentVariable(idx)} 
                          className="text-red-400 hover:text-red-300 px-2"
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
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
              <button 
                onClick={() => {
                  setShowEnvironmentModal(false);
                  setEditingEnvironment(null);
                  setNewEnvironmentName('');
                  setNewEnvironmentVariables([{ key: '', value: '', description: '', enabled: true }]);
                }} 
                className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnvironment}
                disabled={!newEnvironmentName}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
              >
                {editingEnvironment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}