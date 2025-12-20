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

// Dynamically import CodeEditor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-slate-800 rounded border border-slate-600 animate-pulse"></div>
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

interface FormDataField {
  id?: string;
  key: string;
  value: string;
  enabled: boolean;
  file?: File;
  mode?: 'text' | 'file';
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
    xml?: string;
    text?: string;
    formUrlEncoded?: Array<{ key: string; value: string; enabled: boolean }>;
    formData?: FormDataField[];
    binary?: string;
    binaryFile?: File;
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
}interface TestResult {
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

const generateFieldId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `field_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeFormDataFields = (fields?: FormDataField[]) => {
  if (!fields || fields.length === 0) {
    return fields;
  }

  let updated = false;
  const normalized = fields.map(field => {
    let nextField = field;
    if (!field.id) {
      updated = true;
      nextField = {
        ...nextField,
        id: generateFieldId()
      };
    }
    if (!field.mode) {
      updated = true;
      nextField = {
        ...nextField,
        mode: 'text'
      };
    }
    if (nextField.mode !== 'file' && nextField.file) {
      updated = true;
      nextField = {
        ...nextField,
        file: undefined
      };
    }
    return nextField;
  });

  return updated ? normalized : fields;
};

const normalizeRequest = (request: Request): Request => {
  const normalizedFormData = normalizeFormDataFields(request.body?.formData);
  if (!normalizedFormData || normalizedFormData === request.body.formData) {
    return request;
  }

  return {
    ...request,
    body: {
      ...request.body,
      formData: normalizedFormData
    }
  };
};

const normalizeTabs = (tabs: RequestTab[]) =>
  tabs.map(tab => {
    const normalizedRequest = normalizeRequest(tab.request);
    return normalizedRequest === tab.request ? tab : { ...tab, request: normalizedRequest };
  });

const getFormDataFileKey = (tabId: string, fieldId: string) => `${tabId}::${fieldId}`;

const createEmptyFormDataField = (): FormDataField => ({
  id: generateFieldId(),
  key: '',
  value: '',
  enabled: true,
  mode: 'text'
});

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
          <h2 className="text-base font-semibold tracking-wide text-white">Save Request</h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-5 py-6">
          <div className={sectionCard}>
            <label className={labelStyles}>Collection</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              <option value="">Select a collection</option>
              {collections.map((collection) => (
                <option key={collection._id} value={collection._id}>
                  {collection.name}
                </option>
              ))}
            </select>
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
            onClick={() => onSave(selectedCollectionId)}
            disabled={!selectedCollectionId}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Alt + P', description: 'Switch to Params tab' },
    { key: 'Alt + H', description: 'Switch to Headers tab' },
    { key: 'Alt + B', description: 'Switch to Body tab' },
    { key: 'Alt + A', description: 'Switch to Auth tab' },
    { key: 'Alt + S', description: 'Switch to Scripts tab' },
    { key: 'Alt + T', description: 'Switch to Tests tab' },
    { key: 'Ctrl/Cmd + Enter', description: 'Send request' },
    { key: 'Enter (on URL field)', description: 'Send request' },
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
            <p>Tip: Use Alt + First letter of tab name to switch tabs quickly</p>
          </div>
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
      200: { message: "Success  Your API obeyed!", category: "success" },
      201: { message: "Done! You just built something great.", category: "success" },
      202: { message: "Got it  we're processing your request like a pro.", category: "success" },
      204: { message: "All good  nothing to show, everything to love.", category: "success" },
      
      // Redirects (3xx)
      301: { message: "We've moved permanently! Like a codebase refactor.", category: "redirect" },
      302: { message: "We found it  taking you to the right endpoint.", category: "redirect" },
      304: { message: "Still the same. Why change what's already perfect?", category: "redirect" },
      
      // Client Errors (4xx)
      400: { message: "Your request is confused. Maybe too much coffee?", category: "client-error" },
      401: { message: "Access denied  tokens before glory!", category: "client-error" },
      403: { message: "Nice try, hacker. But not today.", category: "client-error" },
      404: { message: "We looked everywhere  nothing here but 404 ghosts.", category: "client-error" },
      405: { message: "That method doesn't belong here  try another tool.", category: "client-error" },
      408: { message: "Took too long  your API went for a coffee break.", category: "client-error" },
      409: { message: "Conflict detected  merge your data like Git pros do.", category: "client-error" },
      410: { message: "This endpoint packed up and left town.", category: "client-error" },
      413: { message: "That's heavy! Maybe trim it down a bit.", category: "client-error" },
      415: { message: "We don't speak that format. Try JSON, it's fluent.", category: "client-error" },
      418: { message: "Seriously? I'm a teapot, not a server.", category: "client-error" },
      429: { message: "Whoa there! Rate limits exist for a reason. Chill for a sec.", category: "client-error" },
      
      // Server Errors (5xx)
      500: { message: "Something blew up  but that's on us.", category: "server-error" },
      501: { message: "Not built yet  it's still in the dev lab.", category: "server-error" },
      502: { message: "Server relay failed  clouds are moody today.", category: "server-error" },
      503: { message: "Server's napping. Try waking it later.", category: "server-error" },
      504: { message: "The network took a detour  timeout adventure!", category: "server-error" },
      507: { message: "Memory full  like your weekend schedule.", category: "server-error" },
      509: { message: "Whoa! You flooded the pipes. Ease up, champ.", category: "server-error" },
      
      // Bonus
      100: { message: "Keep going  you're doing great.", category: "info" },
      522: { message: "Your request got lost in space.", category: "server-error" },
      530: { message: "Authentication Required.", category: "client-error" },
    };

    return messages[statusCode] || { 
      message: `Status ${statusCode}`, 
      category: statusCode >= 500 ? 'server-error' : statusCode >= 400 ? 'client-error' : statusCode >= 300 ? 'redirect' : 'success'
    };
  };

  // Multi-tab state
  const initialTabs = state.apiTesterTabs.length > 0 ? state.apiTesterTabs : [{
    id: 'tab-1',
    request: {
      name: 'Untitled Request',
      method: 'GET',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users`, // Use BASE_URL from env
      headers: [],
      params: [],
      body: { type: 'none' },
      auth: { type: 'none' },
      preRequestScript: '',
      testScript: ''
    },
    isSaved: false
  }];
  const [requestTabs, setRequestTabs] = useState<RequestTab[]>(() => normalizeTabs(initialTabs));
  const [activeTabId, setActiveTabId] = useState(state.activeApiTesterTabId || 'tab-1');
  const formDataFilesRef = useRef<Record<string, File | undefined>>({});

  // Get current tab data
  const resolvedActiveTab =
    requestTabs.find(tab => tab.id === activeTabId) || requestTabs[0];
  const resolvedActiveTabId = resolvedActiveTab?.id || requestTabs[0]?.id || 'tab-1';
  const currentTab = resolvedActiveTab;
  const currentRequest = currentTab?.request || requestTabs[0].request;

  const getTabKey = (tabId?: string) => tabId || resolvedActiveTabId || 'tab-1';
  const getActiveTabKey = () => getTabKey(currentTab?.id || resolvedActiveTabId);

const registerFormDataFile = (fieldId?: string, file?: File, tabId?: string) => {
  if (!fieldId) return;
  const cacheKey = getFormDataFileKey(getTabKey(tabId || getActiveTabKey()), fieldId);
  if (!file) {
    delete formDataFilesRef.current[cacheKey];
      return;
    }
    formDataFilesRef.current[cacheKey] = file;
  };

  const clearFormDataFilesForTab = (tabId?: string) => {
    const targetTabId = getTabKey(tabId || getActiveTabKey());
    const prefix = `${targetTabId}::`;
    Object.keys(formDataFilesRef.current).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete formDataFilesRef.current[key];
      }
    });
  };

  const getCachedFormDataFile = (field: FormDataField, tabKey: string) => {
    if (field.file instanceof File) {
      return field.file;
    }
    if (!field.id) {
      return undefined;
    }
    return formDataFilesRef.current[getFormDataFileKey(tabKey, field.id)];
  };

  const syncFormDataFilesForRequest = (request: Request, tabId?: string) => {
    const targetTabId = getTabKey(tabId || getActiveTabKey());
    if (request.body?.type !== 'form-data' || !request.body.formData?.length) {
      clearFormDataFilesForTab(targetTabId);
      return;
    }

    const validIds = new Set(
      request.body.formData
        .map((field) => field.id)
        .filter((id): id is string => Boolean(id))
    );
    const prefix = `${targetTabId}::`;
    Object.keys(formDataFilesRef.current).forEach((key) => {
      if (key.startsWith(prefix)) {
        const fieldId = key.slice(prefix.length);
        if (!validIds.has(fieldId)) {
          delete formDataFilesRef.current[key];
        }
      }
    });
  };

  const setCurrentRequest = (request: Request) => {
    const normalizedRequest = normalizeRequest(request);
    syncFormDataFilesForRequest(normalizedRequest, resolvedActiveTabId);

    const newTabs = requestTabs.map(tab => 
      tab.id === resolvedActiveTabId ? { ...tab, request: normalizedRequest, isSaved: false } : tab
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
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'tests docs'>('params');
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [responseSectionHeight, setResponseSectionHeight] = useState(400); // Default height
  const [isResizing, setIsResizing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // WebSocket Localhost Relay
  const localhostRelay = useLocalhostRelay();

  useEffect(() => {
    if (!requestTabs.length) return;
    const hasActive = requestTabs.some(tab => tab.id === activeTabId);
    if (!hasActive) {
      const fallbackId = requestTabs[0].id;
      setActiveTabId(fallbackId);
      updateState({ activeApiTesterTabId: fallbackId });
    }
  }, [requestTabs, activeTabId, updateState]);

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
      
      // Ctrl/Cmd + Alt + P = Params
      if (e.key.toLowerCase() === 'p' && e.altKey) {
        e.preventDefault();
        setActiveTab('params');
      }
      // Ctrl/Cmd + Alt + H = Headers
      else if (e.key.toLowerCase() === 'h' && e.altKey) {
        e.preventDefault();
        setActiveTab('headers');
      }
      // Ctrl/Cmd + Alt + B = Body
      else if (e.key.toLowerCase() === 'b' && e.altKey) {
        e.preventDefault();
        setActiveTab('body');
      }
      // Ctrl/Cmd + Alt + A = Auth
      else if (e.key.toLowerCase() === 'a' && e.altKey) {
        e.preventDefault();
        setActiveTab('auth');
      }
      // Ctrl/Cmd + Alt + S = Scripts
      else if (e.key.toLowerCase() === 's' && e.altKey) {
        e.preventDefault();
        setActiveTab('scripts');
      }
      // Ctrl/Cmd + Alt + T = Tests
      else if (e.key.toLowerCase() === 't' && e.altKey) {
        e.preventDefault();
        setActiveTab('tests docs');
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

  // Mouse event handlers for resizing the response section
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new height based on mouse position
      const newHeight = window.innerHeight - e.clientY;
      
      // Limit height to between 200px and 75% of viewport height
      const maxHeight = window.innerHeight * 0.75;
      const minHeight = 200;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setResponseSectionHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);



  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/history');
      setHistory(res.data.history || []);
    } catch (error) {
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete('/api/tools/api-tester/history');
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/collections');
      setCollections(res.data);
    } catch (error) {
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await axios.get('/api/tools/api-tester/environments');
      setEnvironments(res.data);
    } catch (error) {
    }
  };

  const sendRequest = async () => {
    if (!currentRequest.url) {
      toast.error('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(currentRequest.url);
    } catch (e) {
      toast.error('Please enter a valid URL (e.g., http://localhost:3000/api/users)');
      return;
    }

    // Check for localhost URLs without paths - show warning but allow request to proceed
    const urlObj = new URL(currentRequest.url);
    const isLocalhost = (
      urlObj.hostname === 'localhost' ||
      urlObj.hostname === '127.0.0.1' ||
      urlObj.hostname === '[::1]'
    );
  

    setIsLoading(true);
    
    // Helper function to create clean body with ONLY active type's data (like Postman)
    const createCleanBody = (body: any) => {
      const cleanBody: any = { type: body.type };
      
      switch (body.type) {
        case 'json':
          cleanBody.json = body.json;
          break;
        case 'xml':
          cleanBody.xml = body.xml;
          break;
        case 'text':
          cleanBody.text = body.text;
          break;
        case 'raw':
          cleanBody.raw = body.raw;
          break;
        case 'form-data':
          cleanBody.formData = body.formData;
          break;
        case 'x-www-form-urlencoded':
          cleanBody.formUrlEncoded = body.formUrlEncoded;
          break;
        case 'binary':
          cleanBody.binary = body.binary;
          cleanBody.binaryFile = body.binaryFile;
          break;
        case 'none':
        default:
          // No body data needed
          break;
      }
      
      return cleanBody;
    };

    
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
    // 1. If localhost URL + production UI + relay ready  Use WebSocket relay
    // 2. If localhost URL + development UI  Use client-side fetch
    // 3. If HTTPS URL  Use server-side proxy
    
    if (isLocalhost && isProductionUI && localhostRelay.isReady) {
      // Production + Localhost URL  Use WebSocket Relay!
      toast.loading('Connecting to your local API via secure relay...', { duration: 2000 });
      
      try {
        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const relayResponse = await localhostRelay.executeRequest({
          requestId,
          method: currentRequest.method,
          url: finalUrl,
          headers: currentRequest.headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
          params: currentRequest.params,
          body: createCleanBody(currentRequest.body),  // Use clean body
          auth: currentRequest.auth
        });
        
        res = { data: relayResponse };
        toast.success(' Localhost request executed via zero-config relay!');
      } catch (error: any) {
        throw error;
      }
    } else if (isLocalhost) {
      // Localhost URL in any environment - Check if we need to use file upload endpoint
      const hasFiles = hasFileUploads(currentRequest);
      
      if (hasFiles) {
        // Use file upload endpoint even for localhost URLs when files are involved
        toast.loading('Routing localhost request with file uploads...', { duration: 2000 });
        
        // Create FormData for file uploads
        const formData = new FormData();
        
        // Add request metadata as JSON string
        const requestMetadata = {
          method: currentRequest.method,
          url: finalUrl,
          headers: currentRequest.headers.filter(h => h.enabled).map(h => ({ key: h.key, value: h.value })),
          params: currentRequest.params.filter(p => p.enabled),
          auth: currentRequest.auth
        };
        
        formData.append('request', JSON.stringify(requestMetadata));
        formData.append('bodyType', currentRequest.body.type);
        
        // Handle form-data body
        if (currentRequest.body.type === 'form-data' && currentRequest.body.formData) {
          currentRequest.body.formData.filter(f => f.enabled).forEach(field => {
            if (field.mode === 'file' && field.value.startsWith('[FILE] ')) {
              // Get actual file from cache
              const file = getCachedFormDataFile(field, getActiveTabKey());
              if (file) {
                formData.append(field.key, file, file.name);
              } else {
                formData.append(field.key, '');
              }
            } else {
              formData.append(field.key, field.value);
            }
          });
        } 
        // Handle binary body
        else if (currentRequest.body.type === 'binary' && currentRequest.body.binaryFile) {
          formData.append('binaryFile', currentRequest.body.binaryFile);
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        res = await axios.post('/api/tools/api-tester/send-with-files', formData, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(' Localhost request with files executed via proxy!');
      } else {
        // Localhost URL in any environment  Try direct client-side fetch
        toast.loading('Testing localhost API directly...', { duration: 2000 });
        
        try {
          // Fallback 1: Try direct fetch with CORS mode
          const fetchOptions: RequestInit = {
            method: currentRequest.method,
            headers: currentRequest.headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
          };
          
          const methodAllowsBody = currentRequest.method !== 'GET' && currentRequest.method !== 'HEAD';
          if (methodAllowsBody && currentRequest.body && currentRequest.body.type !== 'none') {
            if (currentRequest.body.type === 'json') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
              fetchOptions.body = currentRequest.body.json;
            } else if (currentRequest.body.type === 'xml') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/xml';
              fetchOptions.body = currentRequest.body.xml;
            } else if (currentRequest.body.type === 'text') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'text/plain';
              fetchOptions.body = currentRequest.body.text;
            } else if (currentRequest.body.type === 'raw') {
              fetchOptions.body = currentRequest.body.raw;
            }
          }
          
          const response = await fetch(finalUrl, fetchOptions);
          
          // Parse response
          const contentType = response.headers.get('content-type') || '';
          let body;
          if (contentType.includes('application/json')) {
            body = await response.json();
          } else {
            body = await response.text();
          }
          
          res = {
            data: {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body,
              time: 0, // We don't have timing info from direct fetch
              size: 0 // We don't have size info from direct fetch
            }
          };
          
          toast.success(' Localhost request executed directly!');
        } catch (fetchError) {
          
          // Final fallback: Try fetch with no-cors mode (limited functionality)
          const fetchOptions: RequestInit = {
            method: currentRequest.method,
            headers: currentRequest.headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
            mode: 'no-cors' // This will limit what we can read from the response
          };
          
          const methodAllowsBody = currentRequest.method !== 'GET' && currentRequest.method !== 'HEAD';
          if (methodAllowsBody && currentRequest.body && currentRequest.body.type !== 'none') {
            if (currentRequest.body.type === 'json') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
              fetchOptions.body = currentRequest.body.json;
            } else if (currentRequest.body.type === 'xml') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/xml';
              fetchOptions.body = currentRequest.body.xml;
            } else if (currentRequest.body.type === 'text') {
              (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'text/plain';
              fetchOptions.body = currentRequest.body.text;
            } else if (currentRequest.body.type === 'raw') {
              fetchOptions.body = currentRequest.body.raw;
            }
          }
          
          const response = await fetch(finalUrl, fetchOptions);
          
          // With no-cors mode, we can't read most response data
          res = {
            data: {
              status: response.status,
              statusText: response.statusText,
              headers: {}, // Can't read headers in no-cors mode
              body: 'Response body not accessible due to CORS restrictions', // Can't read body in no-cors mode
              time: 0,
              size: 0
            }
          };
          
          toast.success(' Localhost request executed with limited CORS access!');
        }
      }    } else {
      // Non-localhost URL - Check if we need to use file upload endpoint
      const hasFiles = hasFileUploads(currentRequest);
      
      if (hasFiles) {
        // Use file upload endpoint
        toast.loading('Routing request with file uploads...', { duration: 2000 });
        
        // Create FormData for file uploads
        const formData = new FormData();
        
        // Add request metadata as JSON string
        const requestMetadata = {
          method: currentRequest.method,
          url: finalUrl,
          headers: currentRequest.headers.filter(h => h.enabled).map(h => ({ key: h.key, value: h.value })),
          params: currentRequest.params.filter(p => p.enabled),
          auth: currentRequest.auth
        };
        
        formData.append('request', JSON.stringify(requestMetadata));
        formData.append('bodyType', currentRequest.body.type);
        
        // Handle form-data body
        if (currentRequest.body.type === 'form-data' && currentRequest.body.formData) {
          currentRequest.body.formData.filter(f => f.enabled).forEach(field => {
            if (field.mode === 'file' && field.value.startsWith('[FILE] ')) {
              // Get actual file from cache
              const file = getCachedFormDataFile(field, getActiveTabKey());
              if (file) {
                formData.append(field.key, file, file.name);
              } else {
                formData.append(field.key, '');
              }
            } else {
              formData.append(field.key, field.value);
            }
          });
        } 
        // Handle binary body
        else if (currentRequest.body.type === 'binary' && currentRequest.body.binaryFile) {
          formData.append('binaryFile', currentRequest.body.binaryFile);
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        res = await axios.post('/api/tools/api-tester/send-with-files', formData, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(' Request with files executed via proxy!');
      } else {
        // Use regular endpoint for non-file requests
        toast.loading('Routing request through secure proxy...', { duration: 2000 });

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        const requestData = {
          method: currentRequest.method,
          url: finalUrl,
          headers: currentRequest.headers.filter(h => h.enabled).map(h => ({ key: h.key, value: h.value })),
          params: currentRequest.params.filter(p => p.enabled),
          body: createCleanBody(currentRequest.body),  // Send ONLY the active type's data
          auth: currentRequest.auth
        };


        res = await axios.post('/api/tools/api-tester/send', requestData, {
          signal: abortControllerRef.current.signal
        });
        toast.success(' Request executed via proxy!');
      }
    }
    // Ensure we have a response
    if (!res) {
      throw new Error('Failed to execute request - no response received');
    }

    // Process response
    const processedResponse = {
      ...res.data,
      timestamp: new Date().toISOString()
    };

    // Save to history
    try {
      await axios.post('/api/tools/api-tester/history', {
        method: currentRequest.method,
        url: finalUrl,
        statusCode: processedResponse.status,
        responseTime: processedResponse.time,
        responseSize: processedResponse.size,
        timestamp: processedResponse.timestamp,
        requestData: {
          headers: currentRequest.headers,
          params: currentRequest.params,
          body: createCleanBody(currentRequest.body),  // Use clean body
          auth: currentRequest.auth
        }
      });
      fetchHistory(); // Refresh history
    } catch (historyError) {
    }


    // Update tab with response
    setRequestTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, response: processedResponse, consoleLogs: currentLogs }
        : tab
    ));

    // Set response for current tab
    setResponse(processedResponse);
    
    // Run test script if exists
    if (currentRequest.testScript) {
      try {
        const testRes = await axios.post('/api/tools/api-tester/run-script', {
          type: 'test',
          script: currentRequest.testScript,
          request: currentRequest,
          response: processedResponse,
          environment: selectedEnvironment?.variables || []
        });
        
        const results = testRes.data.results || [];
        setTestResults(results);
        
        // Update tab with test results
        setRequestTabs(tabs => tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, testResults: results }
            : tab
        ));
        
        // Show test results summary
        const passedTests = results.filter((r: any) => r.passed).length;
        const totalTests = results.length;
        if (totalTests > 0) {
          toast.success(`Tests: ${passedTests}/${totalTests} passed`);
        }
      } catch (err) {
        toast.error('Test script failed');
      }
    }

  } catch (error: any) {

    // Check if the error is due to cancellation
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      // Request was cancelled, don't show error
    } else {
      // Show error in response area
      const errorResponse = {
        error: true,
        message: error.response?.data?.message || error.message || 'Request failed',
        timestamp: new Date().toISOString()
      };

      setRequestTabs(tabs => tabs.map(tab =>
        tab.id === activeTabId
          ? { ...tab, response: errorResponse }
          : tab
      ));

      setResponse(errorResponse);

      // Show user-friendly error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Request failed - check console for details');
      }
    }
  } finally {
    setIsLoading(false);
    // Clean up the abort controller
    abortControllerRef.current = null;
  }
};

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast('Request cancelled', { icon: '⚠️' });
    }
  };

  // Helper to check if request contains file uploads
  const hasFileUploads = (request: Request): boolean => {
    // Check form-data body type
    if (request.body?.type === 'form-data' && request.body.formData) {
      return request.body.formData.some(field => 
        field.mode === 'file' && field.value && field.value.startsWith('[FILE] ')
      );
    }
    
    // Check binary body type
    if (request.body?.type === 'binary' && request.body.binary) {
      return request.body.binary.startsWith('[FILE] ');
    }
    
    return false;
  };  // Helper to check if URL is localhost
  const isLocalhostUrl = (url: string): boolean => {    try {
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
        } else if (currentRequest.body.type === 'xml' && currentRequest.body.xml) {
          requestOptions.body = currentRequest.body.xml;
          if (!requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/xml';
          }
        } else if (currentRequest.body.type === 'text' && currentRequest.body.text) {
          requestOptions.body = currentRequest.body.text;
          if (!requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'text/plain';
          }
        } else if (currentRequest.body.type === 'raw' && currentRequest.body.raw) {
          requestOptions.body = currentRequest.body.raw;
        } else if (currentRequest.body.type === 'form-data' && currentRequest.body.formData) {
          const formData = new FormData();
          const tabKey = getActiveTabKey();
          // Remove any manually set Content-Type so browser can attach proper multipart boundary
          Object.keys(requestHeaders).forEach((headerKey) => {
            if (headerKey.toLowerCase() === 'content-type') {
              delete requestHeaders[headerKey];
            }
          });

          currentRequest.body.formData.forEach((field) => {
            if (!field.enabled || !field.key) {
              return;
            }

            if (field.mode === 'file') {
              const file = getCachedFormDataFile(field, tabKey);
              if (file) {
                formData.append(field.key, file, file.name);
              } else {
                formData.append(field.key, '');
              }
            } else {
              formData.append(field.key, typeof field.value === 'string' ? field.value : '');
            }
          });

          requestOptions.body = formData;
        } else if (currentRequest.body.type === 'x-www-form-urlencoded' && currentRequest.body.formUrlEncoded) {
          const urlEncoded = new URLSearchParams();
          currentRequest.body.formUrlEncoded.filter((f: any) => f.enabled).forEach((f: any) => {
            urlEncoded.append(f.key, f.value);
          });
          requestOptions.body = urlEncoded;
          if (!requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        } else if (currentRequest.body.type === 'binary' && currentRequest.body.binary) {
          // For binary data, we'll treat it as a base64 string that needs to be decoded
          try {
            const binaryData = atob(currentRequest.body.binary);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            requestOptions.body = bytes;
          } catch (e) {
            // If not valid base64, send as-is
            requestOptions.body = currentRequest.body.binary;
          }
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

    clearFormDataFilesForTab(tabId);

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
      request: normalizeRequest({ ...tabToDuplicate.request, name: `${tabToDuplicate.request.name} (Copy)` }),
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
          Preparing API tester
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
                <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-200">AnyTimeRequest</p>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#040714]/70 backdrop-blur">
        {/* Tab Bar */}
        <div className="flex items-center overflow-x-auto border-b border-white/5 bg-[#050c1f]/80 px-4 scrollbar-thin scrollbar-thumb-slate-700">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendRequest();
                  }
                }}
                placeholder="https://api.example.com/endpoint or http://localhost:3000/api"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
              <button
                onClick={saveRequestToCollection}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:text-white"
              >
                Save
              </button>
              
              {isLoading ? (
                <button
                  onClick={cancelRequest}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:scale-[1.01]"
                >
                  <span className="w-4 h-4 flex items-center justify-center">×</span>
                  Cancel
                </button>
              ) : (
                <button
                  onClick={sendRequest}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01]"
                >
                  <PlayIcon className="w-4 h-4" />
                  Send
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 bg-[#050c1f]/80">
            <div className="flex gap-1 px-4">
              {(['params', 'headers', 'body', 'auth', 'scripts', 'tests docs'] as const).map((tab) => {
                // Create keyboard shortcut hint
                const shortcut = tab === 'params' ? 'Alt+P' : 
                               tab === 'headers' ? 'Alt+H' : 
                               tab === 'body' ? 'Alt+B' : 
                               tab === 'auth' ? 'Alt+A' : 
                               tab === 'scripts' ? 'Alt+S' : 'Alt+T';
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium capitalize transition ${
                      activeTab === tab
                        ? 'bg-white/10 text-white shadow-inner shadow-black/40'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                    title={`Switch to ${tab} tab (${shortcut})`}
                  >
                    {tab}
                  </button>
                );
              })}
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
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-white/5 hover:text-white"
                title="Keyboard Shortcuts"
              >
                ⌨️
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
                <div className="flex gap-2 flex-wrap">
                  {(['none', 'json', 'xml', 'text', 'raw', 'form-data', 'x-www-form-urlencoded', 'binary'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        // Initialize the appropriate body structure when switching types
                        const newBody = { ...currentRequest.body, type };
                        
                        // Initialize form arrays if needed
                        if (type === 'form-data' && !newBody.formData) {
                          newBody.formData = [createEmptyFormDataField()];
                        }
                        
                        if (type === 'x-www-form-urlencoded' && !newBody.formUrlEncoded) {
                          newBody.formUrlEncoded = [{ key: '', value: '', enabled: true }];
                        }
                        
                        // Initialize xml field if needed
                        if (type === 'xml' && !newBody.xml) {
                          newBody.xml = '';
                        }
                        
                        // Initialize text field if needed
                        if (type === 'text' && !newBody.text) {
                          newBody.text = '';
                        }
                        
                        // Initialize json field if needed
                        if (type === 'json' && !newBody.json) {
                          newBody.json = '';
                        }
                        
                        // Initialize raw field if needed
                        if (type === 'raw' && !newBody.raw) {
                          newBody.raw = '';
                        }
                        
                        setCurrentRequest({ ...currentRequest, body: newBody });
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        currentRequest.body.type === type
                          ? 'bg-yellow-500 text-black'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type === 'x-www-form-urlencoded' ? 'Form-encode' : type}
                    </button>
                  ))}
                </div>

                {currentRequest.body.type === 'json' && (
                  <div className="w-full" style={{ height: '300px' }}>
                    <CodeEditor
                      value={currentRequest.body.json || ''}
                      onChange={(value) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, json: value } })}
                      language="json"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}

                {currentRequest.body.type === 'xml' && (
                  <div className="w-full" style={{ height: '300px' }}>
                    <CodeEditor
                      value={currentRequest.body.xml || ''}
                      onChange={(value) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, xml: value } })}
                      language="xml"
                      placeholder="<root>\n  <element>value</element>\n</root>"
                    />
                  </div>
                )}

                {currentRequest.body.type === 'text' && (
                  <div className="w-full" style={{ height: '300px' }}>
                    <CodeEditor
                      value={currentRequest.body.text || ''}
                      onChange={(value) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, text: value } })}
                      language="text"
                      placeholder="Plain text content"
                    />
                  </div>
                )}

                {currentRequest.body.type === 'raw' && (
                  <div className="w-full" style={{ height: '300px' }}>
                    <CodeEditor
                      value={currentRequest.body.raw || ''}
                      onChange={(value) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, raw: value } })}
                      language="text"
                      placeholder="Raw text"
                    />
                  </div>
                )}

                {currentRequest.body.type === 'form-data' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-slate-300">Form Data</h3>
                      <button
                        onClick={() => {
                          const newFormData = [...(currentRequest.body.formData || []), createEmptyFormDataField()];
                          setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                        }}
                        className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" /> Add Field
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(currentRequest.body.formData || []).map((field, idx) => {
                        const fieldId = field.id || `field-${idx}`;
                        return (
                          <div key={fieldId} className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => {
                                const newFormData = [...(currentRequest.body.formData || [])];
                                newFormData[idx] = { ...newFormData[idx], enabled: e.target.checked };
                                setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                              }}
                              className="w-4 h-4"
                            />
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => {
                                const newFormData = [...(currentRequest.body.formData || [])];
                                newFormData[idx] = { ...newFormData[idx], key: e.target.value };
                                setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                              }}
                              placeholder="Key"
                              className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                            />
                            <select
                              value={field.mode || 'text'}
                              onChange={(e) => {
                                const nextMode = (e.target.value === 'file' ? 'file' : 'text') as 'text' | 'file';
                                const newFormData = [...(currentRequest.body.formData || [])];
                                const nextId = newFormData[idx]?.id || generateFieldId();
                                const updatedField: FormDataField = {
                                  ...newFormData[idx],
                                  id: nextId,
                                  mode: nextMode
                                };
                                if (nextMode === 'file') {
                                  updatedField.value = '';
                                  updatedField.file = undefined;
                                } else {
                                  updatedField.value = newFormData[idx]?.mode === 'text' ? (newFormData[idx]?.value || '') : '';
                                  updatedField.file = undefined;
                                }
                                registerFormDataFile(nextId, undefined);
                                newFormData[idx] = updatedField;
                                setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                              }}
                              className="px-2 py-2 bg-slate-800 rounded border border-slate-600 text-xs uppercase tracking-wider text-slate-300 focus:border-yellow-400 focus:outline-none"
                            >
                              <option value="text">Text</option>
                              <option value="file">File</option>
                            </select>
                            {/* File upload option for form-data */}
                            <div className="flex-1 flex gap-2">
                              {field.mode === 'file' ? (
                                <>
                                  <input
                                    type="text"
                                    value={field.value}
                                    readOnly
                                    placeholder="No file selected"
                                    className="flex-1 px-3 py-2 bg-slate-900 rounded border border-slate-600 text-slate-300 focus:border-yellow-400 focus:outline-none"
                                  />
                                  <label className="flex items-center justify-center px-3 py-2 bg-slate-700 rounded border border-slate-600 hover:bg-slate-600 cursor-pointer text-xs text-slate-200">
                                    Choose File
                                    <input
                                      type="file"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          const file = e.target.files[0];
                                          const newFormData = [...(currentRequest.body.formData || [])];
                                          const nextId = newFormData[idx]?.id || generateFieldId();
                                          const updatedField: FormDataField = {
                                            ...newFormData[idx],
                                            id: nextId,
                                            mode: 'file',
                                            value: `[FILE] ${file.name}`,
                                            file
                                          };
                                          newFormData[idx] = updatedField;
                                          registerFormDataFile(nextId, file);
                                          setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </>
                              ) : (
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => {
                                    const newFormData = [...(currentRequest.body.formData || [])];
                                    newFormData[idx] = { ...newFormData[idx], value: e.target.value, mode: 'text' };
                                    setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                                  }}
                                  placeholder="Value"
                                  className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                                />
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const existingFormData = currentRequest.body.formData || [];
                                const fieldToRemove = existingFormData[idx];
                                if (fieldToRemove?.id) {
                                  registerFormDataFile(fieldToRemove.id, undefined);
                                }
                                const newFormData = existingFormData.filter((_, i) => i !== idx);
                                setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formData: newFormData } });
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}                {currentRequest.body.type === 'x-www-form-urlencoded' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-slate-300">URL Encoded Form</h3>
                      <button
                        onClick={() => {
                          const newFormUrlEncoded = [...(currentRequest.body.formUrlEncoded || []), { key: '', value: '', enabled: true }];
                          setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formUrlEncoded: newFormUrlEncoded } });
                        }}
                        className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" /> Add Field
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(currentRequest.body.formUrlEncoded || []).map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => {
                              const newFormUrlEncoded = [...(currentRequest.body.formUrlEncoded || [])];
                              newFormUrlEncoded[idx].enabled = e.target.checked;
                              setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formUrlEncoded: newFormUrlEncoded } });
                            }}
                            className="w-4 h-4"
                          />
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => {
                              const newFormUrlEncoded = [...(currentRequest.body.formUrlEncoded || [])];
                              newFormUrlEncoded[idx].key = e.target.value;
                              setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formUrlEncoded: newFormUrlEncoded } });
                            }}
                            placeholder="Key"
                            className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => {
                              const newFormUrlEncoded = [...(currentRequest.body.formUrlEncoded || [])];
                              newFormUrlEncoded[idx].value = e.target.value;
                              setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formUrlEncoded: newFormUrlEncoded } });
                            }}
                            placeholder="Value"
                            className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const newFormUrlEncoded = (currentRequest.body.formUrlEncoded || []).filter((_, i) => i !== idx);
                              setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, formUrlEncoded: newFormUrlEncoded } });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentRequest.body.type === 'binary' && (
                  <div className="space-y-3">
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Binary Data</h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Select a file to upload as binary data
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentRequest.body.binary || ''}
                          onChange={(e) => setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, binary: e.target.value } })}
                          placeholder="File path or base64 encoded data"
                          className="flex-1 px-3 py-2 bg-slate-900 rounded border border-slate-600 focus:border-yellow-400 focus:outline-none text-xs font-mono"
                          readOnly
                        />
                        <label className="flex items-center justify-center px-3 py-2 bg-slate-700 rounded border border-slate-600 hover:bg-slate-600 cursor-pointer">
                          <span className="text-xs text-slate-300">Choose File</span>
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                // Store file reference for actual upload
                                setCurrentRequest({ ...currentRequest, body: { ...currentRequest.body, binary: `[FILE] ${file.name}`, binaryFile: file } });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}              </div>
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Pre-request Script</label>
                    <p className="text-xs text-slate-400 mb-2">Execute JavaScript before sending the request. Use pm.environment.set() to set variables.</p>
                    <div className="w-full" style={{ height: '300px' }}>
                      <CodeEditor
                        value={currentRequest.preRequestScript || ''}
                        onChange={(value) => setCurrentRequest({ ...currentRequest, preRequestScript: value })}
                        language="javascript"
                        placeholder={`// Example:
pm.environment.set("timestamp", Date.now());
pm.variables.set("myVar", "value");`}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Test Script</label>
                    <p className="text-xs text-slate-400 mb-2">Write tests to validate the response using pm.test() and pm.expect().</p>
                    <div className="w-full" style={{ height: '300px' }}>
                      <CodeEditor
                        value={currentRequest.testScript || ''}
                        onChange={(value) => setCurrentRequest({ ...currentRequest, testScript: value })}
                        language="javascript"
                        placeholder={`// Example:
pm.test("Status code is 200", function() {
  pm.expect(pm.response.status).to.equal(200);
});

pm.test("Response has data", function() {
  pm.expect(pm.response.body).to.have.property("data");
});`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tests docs' && (
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
        <div className="flex flex-col overflow-hidden border-l border-white/5 bg-white/5" style={{ height: `${responseSectionHeight}px` }}>
          {/* Resize Handle */}
          <div 
            className="h-2 cursor-row-resize bg-white/10 hover:bg-indigo-400/40 transition-colors flex items-center justify-center"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="w-8 h-1 bg-slate-500 rounded-full"></div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
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
                    <div className="space-y-4">
                      {/* Status Info */}
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`text-2xl font-bold ${
                                  statusInfo.category === 'success' ? 'text-green-400' :
                                  statusInfo.category === 'redirect' ? 'text-blue-400' :
                                  statusInfo.category === 'client-error' ? 'text-orange-400' :
                                  statusInfo.category === 'server-error' ? 'text-red-400' :
                                  'text-slate-400'
                                }`}>
                                  Status: {statusCode} {currentTab.response.statusText}
                                </div>
                              </div>
                              <div className="text-xs text-white/60">
                                Size: {currentTab?.response?.size || 0} Bytes • Time: {currentTab?.response?.time || 0} ms
                              </div>
                            </div>
                            <div className="mt-2 text-sm italic text-slate-400 border-l-2 border-slate-600 pl-3 py-1">
                              "{statusInfo.message}"
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="w-full" style={{ height: `${responseSectionHeight - 200}px` }}>
                        <CodeEditor
                          value={typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                            ? (currentTab?.response?.body || currentTab?.response)
                            : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2)}
                          onChange={() => {}} // Read-only, no-op
                          language="json"
                          readOnly={true}
                        />
                      </div>
                    </div>
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

                  {responseTab === 'headers' && currentTab?.response?.headers && (
                    <div className="space-y-4">
                      {Object.entries(currentTab?.response?.headers).map(([key, value], index) => (
                        <div key={index} className="p-4 rounded-lg border-2 bg-gray-900/20 border-gray-500/50">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl font-bold text-gray-400">
                              {key}
                            </div>
                            <div className="text-3xl font-bold text-gray-400">
                              {value as string}
                            </div>
                          </div>
                        </div>
                      ))}
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
                        <div className="w-full" style={{ height: '200px' }}>
                          <CodeEditor
                            value={JSON.stringify({
                              method: currentRequest.method,
                              url: currentRequest.url,
                              headers: currentRequest.headers.filter(h => h.enabled),
                              body: currentRequest.body
                            }, null, 2)}
                            onChange={() => {}}
                            language="json"
                            readOnly={true}
                          />
                        </div>
                      </div>
                      
                      {/* Response Payload Section */}
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Response Payload
                        </h3>
                        <div className="w-full" style={{ height: '200px' }}>
                          <CodeEditor
                            value={typeof (currentTab?.response?.body || currentTab?.response) === 'string' 
                              ? (currentTab?.response?.body || currentTab?.response)
                              : JSON.stringify(currentTab?.response?.body || currentTab?.response, null, 2)}
                            onChange={() => {}}
                            language="json"
                            readOnly={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
            <div className="flex gap-2">
              {history.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm('Clear all history?')) {
                      await clearHistory();
                    }
                  }}
                  className="rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-400/40 hover:text-white"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsHistorySidebarOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                  ✕
              </button>
            </div>
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

        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isHistorySidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsHistorySidebarOpen(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal
          onClose={() => setShowKeyboardShortcuts(false)}
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
