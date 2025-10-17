'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { 
  CodeBracketSquareIcon, 
  KeyIcon, 
  GlobeAltIcon, 
  CubeIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  SignalIcon,
  DocumentTextIcon,
  ServerStackIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  endpoint: string;
  method: string;
  color: string;
  category: string;
}

const tools: Tool[] = [
  {
    id: 'json-validator',
    name: 'JSON Validator & Transformer',
    description: 'Validate, beautify, minify, flatten JSON. Convert to CSV/XML.',
    icon: CodeBracketSquareIcon,
    endpoint: '/api/tools/json-validator',
    method: 'POST',
    color: 'bg-blue-500',
    category: 'Data Processing'
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and verify JWT tokens with signature validation.',
    icon: KeyIcon,
    endpoint: '/api/tools/jwt-decoder',
    method: 'POST',
    color: 'bg-purple-500',
    category: 'Security'
  },
  {
    id: 'meta-inspector',
    name: 'Meta Tag Inspector',
    description: 'Fetch and parse meta tags, OpenGraph, and Twitter cards from URLs.',
    icon: GlobeAltIcon,
    endpoint: '/api/tools/meta-inspector',
    method: 'POST',
    color: 'bg-green-500',
    category: 'Web Tools'
  },
  {
    id: 'skeleton-generator',
    name: 'UI Skeleton Generator',
    description: 'Auto-generate Tailwind CSS skeleton loaders for various UI components.',
    icon: CubeIcon,
    endpoint: '/api/tools/skeleton-generator',
    method: 'POST',
    color: 'bg-yellow-500',
    category: 'UI/UX'
  },
  {
    id: 'placeholder',
    name: 'Placeholder API',
    description: 'Generate placeholder text, images, avatars, charts, and mock data.',
    icon: PhotoIcon,
    endpoint: '/api/tools/placeholder',
    method: 'GET',
    color: 'bg-pink-500',
    category: 'Development'
  },
  {
    id: 'ai-chat',
    name: 'Fake AI Chat',
    description: 'Simulate AI chatbot responses for testing chat interfaces.',
    icon: ChatBubbleLeftRightIcon,
    endpoint: '/api/tools/ai-chat',
    method: 'POST',
    color: 'bg-indigo-500',
    category: 'AI/ML'
  },
  {
    id: 'websocket-echo',
    name: 'WebSocket Echo',
    description: 'HTTP-based WebSocket echo simulation for testing live streams.',
    icon: SignalIcon,
    endpoint: '/api/tools/websocket-echo',
    method: 'POST',
    color: 'bg-red-500',
    category: 'Real-time'
  },
  {
    id: 'api-docs',
    name: 'REST API Doc Builder',
    description: 'Generate and manage REST API documentation with try-it-out feature.',
    icon: DocumentTextIcon,
    endpoint: '/api/tools/api-docs',
    method: 'GET/POST',
    color: 'bg-teal-500',
    category: 'Documentation'
  },
  {
    id: 'edge-tester',
    name: 'Edge Function Tester',
    description: 'Test and simulate serverless edge functions with custom code.',
    icon: ServerStackIcon,
    endpoint: '/api/tools/edge-tester',
    method: 'POST',
    color: 'bg-orange-500',
    category: 'Serverless'
  },
  {
    id: 'api-tester',
    name: 'API Tester (Postman Clone)',
    description: 'Full-featured API testing tool with collections, environments, and authentication.',
    icon: ServerStackIcon,
    endpoint: '/api-tester',
    method: 'APP',
    color: 'bg-purple-500',
    category: 'API Testing'
  }
];

// Tool Test Modal Component
interface ToolTestModalProps {
  tool: Tool;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  testResult: any;
  setTestResult: (result: any) => void;
}

function ToolTestModal({ tool, isOpen, onClose, isLoading, setIsLoading, testResult, setTestResult }: ToolTestModalProps) {
  const [formData, setFormData] = useState<any>({});

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      let response;
      
      switch (tool.id) {
        case 'json-validator':
          response = await axios.post(tool.endpoint, {
            json: formData.json || '{}',
            action: formData.action || 'validate'
          });
          break;
          
        case 'jwt-decoder':
          response = await axios.post(tool.endpoint, {
            token: formData.token || '',
            secret: formData.secret
          });
          break;
          
        case 'meta-inspector':
          response = await axios.post(tool.endpoint, {
            url: formData.url || ''
          });
          break;
          
        case 'skeleton-generator':
          response = await axios.post(tool.endpoint, {
            type: formData.type || 'card',
            count: parseInt(formData.count || '3'),
            options: formData.options ? JSON.parse(formData.options) : {}
          });
          break;
          
        case 'placeholder':
          const params = new URLSearchParams();
          if (formData.type) params.append('type', formData.type);
          if (formData.count) params.append('count', formData.count);
          if (formData.width) params.append('width', formData.width);
          if (formData.height) params.append('height', formData.height);
          response = await axios.get(`${tool.endpoint}?${params.toString()}`);
          break;
          
        case 'ai-chat':
          response = await axios.post(tool.endpoint, {
            message: formData.message || 'Hello!',
            conversationId: formData.conversationId,
            model: formData.model || 'gpt-3.5-turbo'
          });
          break;
          
        case 'websocket-echo':
          response = await axios.post(tool.endpoint, {
            message: formData.message || 'Test message',
            type: formData.type || 'text',
            delay: parseInt(formData.delay || '0')
          });
          break;
          
        case 'api-docs':
          if (formData.action === 'get') {
            response = await axios.get(tool.endpoint);
          } else {
            response = await axios.post(tool.endpoint, {
              name: formData.name || 'Test API',
              description: formData.description,
              version: formData.version || '1.0.0',
              baseUrl: formData.baseUrl,
              endpoints: formData.endpoints ? JSON.parse(formData.endpoints) : []
            });
          }
          break;
          
        case 'edge-tester':
          response = await axios.post(tool.endpoint, {
            code: formData.code || 'async function handler(event, context) { return { statusCode: 200, body: JSON.stringify({ message: "Hello!" }) }; }',
            runtime: formData.runtime || 'nodejs',
            event: formData.event ? JSON.parse(formData.event) : {},
            context: formData.context ? JSON.parse(formData.context) : {},
            timeout: parseInt(formData.timeout || '5000')
          });
          break;
          
        default:
          response = await axios.get(tool.endpoint);
      }
      
      setTestResult(response.data);
      toast.success('Test completed successfully!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Test failed';
      setTestResult({ error: errorMsg, details: error.response?.data });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (tool.id) {
      case 'json-validator':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">JSON Input</label>
              <textarea
                value={formData.json || ''}
                onChange={(e) => setFormData({ ...formData, json: e.target.value })}
                placeholder='{"name":"John","age":30}'
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none min-h-[120px] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Action</label>
              <select
                value={formData.action || 'validate'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="validate">Validate</option>
                <option value="beautify">Beautify</option>
                <option value="minify">Minify</option>
                <option value="flatten">Flatten</option>
                <option value="toCSV">Convert to CSV</option>
                <option value="toXML">Convert to XML</option>
              </select>
            </div>
          </>
        );
        
      case 'jwt-decoder':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">JWT Token</label>
              <textarea
                value={formData.token || ''}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none min-h-[100px] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Secret (optional, for verification)</label>
              <input
                type="text"
                value={formData.secret || ''}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="your-secret-key"
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </>
        );
        
      case 'meta-inspector':
        return (
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">Website URL</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>
        );
        
      case 'skeleton-generator':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Skeleton Type</label>
              <select
                value={formData.type || 'card'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="card">Card</option>
                <option value="list">List</option>
                <option value="table">Table</option>
                <option value="text">Text</option>
                <option value="avatar">Avatar</option>
                <option value="image">Image</option>
                <option value="form">Form</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Count</label>
              <input
                type="number"
                value={formData.count || '3'}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </>
        );
        
      case 'placeholder':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Type</label>
              <select
                value={formData.type || 'user'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="user">User</option>
                <option value="product">Product</option>
                <option value="post">Post</option>
                <option value="image">Image</option>
                <option value="avatar">Avatar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Count</label>
              <input
                type="number"
                value={formData.count || '5'}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </>
        );
        
      case 'ai-chat':
        return (
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">Your Message</label>
            <textarea
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Hello, how can you help me?"
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none min-h-[100px]"
            />
          </div>
        );
        
      case 'websocket-echo':
        return (
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">Message</label>
            <textarea
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Test message"
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none min-h-[100px]"
            />
          </div>
        );
        
      case 'edge-tester':
        return (
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">Function Code</label>
            <textarea
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="async function handler(event, context) { return { statusCode: 200, body: JSON.stringify({ message: 'Hello!' }) }; }"
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-400 focus:outline-none min-h-[150px] font-mono text-sm"
            />
          </div>
        );
        
      default:
        return (
          <div className="text-slate-400 text-center py-4">
            Click "Test" to try this tool
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${tool.color} p-2 rounded-lg`}>
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <Dialog.Title className="text-xl font-bold text-white">
                {tool.name}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Endpoint</div>
              <div className="text-yellow-400 font-mono text-sm">{tool.endpoint}</div>
              <div className="text-slate-500 text-xs mt-1">{tool.method}</div>
            </div>

            <div className="space-y-4">
              {renderForm()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTest}
                disabled={isLoading}
                className="flex-1 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>

            {testResult && (
              <div className="mt-6">
                <div className="text-sm font-medium text-yellow-400 mb-2">Result:</div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-auto max-h-96">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function ToolsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(tools.map(t => t.category)))];
  const filteredTools = selectedCategory === 'All' 
    ? tools 
    : tools.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">Developer Tools</h1>
          <p className="text-slate-400">
            A unified platform with {tools.length} powerful development tools accessible with single sign-on
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-black font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <div
              key={tool.id}
              className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-yellow-500 transition-all hover:shadow-xl hover:shadow-yellow-500/20 cursor-pointer group"
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${tool.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {tool.method}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-yellow-400 transition-colors">
                {tool.name}
              </h3>

              <p className="text-slate-400 text-sm mb-4">
                {tool.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  {tool.endpoint}
                </span>
                <span className="text-xs bg-slate-700/50 text-yellow-400 px-2 py-1 rounded">
                  {tool.category}
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
                <button 
                  onClick={() => {
                    if (tool.method === 'APP') {
                      // Navigate to dedicated page for full apps
                      window.location.href = tool.endpoint;
                    } else {
                      // Open modal for API tools
                      setSelectedTool(tool);
                      setIsModalOpen(true);
                      setTestResult(null);
                    }
                  }}
                  className="flex-1 bg-yellow-500 text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
                >
                  {tool.method === 'APP' ? 'Open' : 'Try It'}
                </button>
                <button 
                  onClick={() => window.open(`${tool.endpoint}`, '_blank')}
                  className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                >
                  Docs
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{tools.length}</div>
            <div className="text-slate-400 text-sm">Total Tools</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{categories.length - 1}</div>
            <div className="text-slate-400 text-sm">Categories</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">∞</div>
            <div className="text-slate-400 text-sm">Requests/Month</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-green-400 mb-2">99.9%</div>
            <div className="text-slate-400 text-sm">Uptime</div>
          </div>
        </div>
      </div>

      {/* Tool Testing Modal */}
      {selectedTool && (
        <ToolTestModal
          tool={selectedTool}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTool(null);
            setTestResult(null);
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          testResult={testResult}
          setTestResult={setTestResult}
        />
      )}

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
    </div>
  );
}
