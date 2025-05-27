import React, { useState, useEffect, useContext } from 'react';
import { Search, Code, Play, Copy, Check, ChevronRight, Sun, Moon, AlertCircle, Loader2, Key, Info, Bot, FileText, X } from 'lucide-react';
import { AuthContext } from '../lib/AuthContext';
import Button from '../components/ui/Button';
import { Markdown } from '../components/ui/Markdown';
import { supabase } from '../lib/supabase';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  authentication: boolean;
  requestBody?: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
    }>;
  };
  responses: {
    [key: string]: {
      description: string;
      example: any;
    };
  };
}

const endpoints: Endpoint[] = [
  {
    id: 'list-personas',
    method: 'GET',
    path: '/personas',
    title: 'List Personas',
    description: 'Retrieve a list of all personas for the authenticated user.',
    authentication: true,
    responses: {
      '200': {
        description: 'List of personas',
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Technical Expert',
            description: 'A knowledgeable technical assistant',
            // ... other fields
          }
        ]
      }
    }
  },
  {
    id: 'get-persona',
    method: 'GET',
    path: '/personas/:id',
    title: 'Get Persona',
    description: 'Retrieve details of a specific persona.',
    authentication: true,
    responses: {
      '200': {
        description: 'Persona details',
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Technical Expert',
          description: 'A knowledgeable technical assistant'
        }
      }
    }
  },
  {
    id: 'create-persona',
    method: 'POST',
    path: '/personas',
    title: 'Create Persona',
    description: 'Create a new persona.',
    authentication: true,
    requestBody: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the persona',
          required: true
        },
        description: {
          type: 'string',
          description: 'Description of the persona'
        },
        personality: {
          type: 'array',
          description: 'List of personality traits'
        }
      }
    },
    responses: {
      '200': {
        description: 'Persona created successfully',
        example: {
          success: true
        }
      }
    }
  },
  {
    id: 'chat',
    method: 'POST',
    path: '/personas/:id/chat',
    title: 'Chat with Persona',
    description: 'Send a message to chat with a specific persona.',
    authentication: true,
    requestBody: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Array of chat messages',
          required: true
        }
      }
    },
    responses: {
      '200': {
        description: 'Chat response',
        example: {
          message: 'Hello! How can I help you today?'
        }
      }
    }
  },
  {
    id: 'update-persona',
    method: 'PUT',
    path: '/personas/:id',
    title: 'Update Persona',
    description: 'Update an existing persona.',
    authentication: true,
    requestBody: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the persona'
        },
        description: {
          type: 'string',
          description: 'Description of the persona'
        }
      }
    },
    responses: {
      '200': {
        description: 'Persona updated successfully',
        example: {
          success: true
        }
      }
    }
  },
  {
    id: 'delete-persona',
    method: 'DELETE',
    path: '/personas/:id',
    title: 'Delete Persona',
    description: 'Delete an existing persona.',
    authentication: true,
    responses: {
      '200': {
        description: 'Persona deleted successfully',
        example: {
          success: true
        }
      }
    }
  }
];

const codeExamples: Record<string, Record<string, string>> = {
  'list-personas': {
    javascript: `const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/personas', {
  headers: {
    'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
  }
});

const personas = await response.json();`,
    python: `import requests

response = requests.get(
    '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/personas',
    headers={'Authorization': f'Bearer {SUPABASE_ANON_KEY}'}
)

personas = response.json()`,
    curl: `curl '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/personas' \\
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'`
  }
};

interface ApiKey {
  id: string;
  name: string;
  key: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

const ApiDocs: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [rawRequest, setRawRequest] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'formatted'>('formatted');
  const [showLLMDocs, setShowLLMDocs] = useState(false);

  // State for custom API key input
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState(false);

  useEffect(() => {
    if (selectedEndpoint) {
      setRequestBody(JSON.stringify(selectedEndpoint.requestBody?.properties || {}, null, 2));
    }
  }, [selectedEndpoint]);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      setLoadingKeys(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCopyCode = async (code: string, endpointId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedEndpoint(endpointId);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint || !user) return;

    setIsLoading(true);
    setError(null);
    setResponse('');
    setRawRequest('');
    setRawResponse('');

    try {
      // Replace path parameters with actual values if needed
      let path = selectedEndpoint.path;
      if (path.includes(':id')) {
        // For demo purposes, use a placeholder or the first persona ID if available
        path = path.replace(':id', 'demo-persona-id');
      }
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1${path}`;
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {}
      };
      
      // Add headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': ''
      };

      // Use custom key if enabled, otherwise use selected key
      if (useCustomKey && customApiKey) {
        headers['Authorization'] = `Bearer ${customApiKey}`;
      } else if (selectedApiKey) {
        headers['Authorization'] = `Bearer ${selectedApiKey}`;
      } else {
        // Use the anonymous key if no API key is selected or provided
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers['Authorization'] = `Bearer ${anonKey}`;
        } else {
          throw new Error('No API key provided and no anonymous key available');
        }
      }
      
      options.headers = headers;

      if (selectedEndpoint.method !== 'GET') {
        options.body = requestBody.trim() || '{}';
      }

      // Store raw request information
      setRawRequest(JSON.stringify({
        url,
        method: options.method,
        headers,
        body: options.method !== 'GET' && options.body ? 
          (options.body === '{}' ? {} : JSON.parse(options.body)) : undefined
      }, null, 2));

      const response = await fetch(url, options);
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { text: responseText };
      }
      
      // Store raw response information
      setRawResponse(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseData
      }, null, 2));
      
      if (!response.ok) {
        // Don't throw error here, just show the raw response
        setRawResponse(JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]),
          body: responseData
        }, null, 2));
        
        setError(responseData.error || `Request failed with status ${response.status}`);
        return;
      }

      setResponse(JSON.stringify(responseData, null, 2));
      
      // Also set raw response
      setRawResponse(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseData
      }, null, 2));
      
      // Switch to formatted tab on success
      setActiveTab('formatted');
    } catch (err: any) {
      setError(err.message);
      
      // If we have a response, show it
      if (rawResponse) {
        setActiveTab('response');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate LLM-friendly documentation
  const generateLLMDocs = () => {
    let docs = `# Persona API Documentation\n\n`;
    
    docs += `## Base URL\n\n\`\`\`\n${import.meta.env.VITE_SUPABASE_URL}/functions/v1\n\`\`\`\n\n`;
    
    docs += `## Authentication\n\nAll API requests require authentication using an API key in the Authorization header:\n\n\`\`\`\nAuthorization: Bearer YOUR_API_KEY\n\`\`\`\n\n`;
    
    docs += `## Endpoints\n\n`;
    
    endpoints.forEach(endpoint => {
      docs += `### ${endpoint.title}\n\n`;
      docs += `\`${endpoint.method} ${endpoint.path}\`\n\n`;
      docs += `${endpoint.description}\n\n`;
      
      if (endpoint.authentication) {
        docs += `**Requires Authentication**: Yes\n\n`;
      }
      
      if (endpoint.requestBody) {
        docs += `**Request Body**:\n\n\`\`\`json\n`;
        const exampleBody = {};
        Object.entries(endpoint.requestBody.properties).forEach(([key, prop]) => {
          if (prop.type === 'string') {
            exampleBody[key] = `"example ${key}"`;
          } else if (prop.type === 'array') {
            exampleBody[key] = `["example"]`;
          } else {
            exampleBody[key] = `{}`;
          }
        });
        docs += `${JSON.stringify(exampleBody, null, 2)}\n\`\`\`\n\n`;
      }
      
      docs += `**Response**:\n\n\`\`\`json\n${JSON.stringify(endpoint.responses['200'].example, null, 2)}\n\`\`\`\n\n`;
      
      // Add code example for JavaScript
      if (codeExamples[endpoint.id]?.javascript) {
        docs += `**JavaScript Example**:\n\n\`\`\`javascript\n${codeExamples[endpoint.id].javascript}\n\`\`\`\n\n`;
      }
      
      docs += `---\n\n`;
    });
    
    return docs;
  };

  const handleCopyLLMDocs = async () => {
    try {
      const docs = generateLLMDocs();
      await navigator.clipboard.writeText(docs);
      alert('Documentation copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy documentation:', err);
      alert('Failed to copy documentation');
    }
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              API Documentation
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete reference for the Persona API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Bot size={16} />}
              onClick={() => setShowLLMDocs(!showLLMDocs)}
            >
              LLM-Friendly Docs
            </Button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100'
              } transition-colors`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* LLM-Friendly Documentation Modal */}
        {showLLMDocs && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowLLMDocs(false)} />
              
              <div className="relative w-full max-w-4xl transform rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">LLM-Friendly Documentation</h2>
                  </div>
                  <button
                    onClick={() => setShowLLMDocs(false)}
                    className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                
                <p className="mb-4 text-gray-600">
                  This is a formatted version of the API documentation that's optimized for pasting into LLMs like ChatGPT or Bolt. 
                  Copy this documentation to get better assistance when building against the API.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-[60vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {generateLLMDocs()}
                  </pre>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    leftIcon={<Copy size={16} />}
                    onClick={handleCopyLLMDocs}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className={`w-64 flex-shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-4">
              <div className="relative">
                <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
            <nav className="px-2 pb-4">
              {filteredEndpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full text-left px-4 py-2 rounded-md mb-1 flex items-center justify-between ${
                    selectedEndpoint?.id === endpoint.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Code size={16} />
                    <span className="text-sm font-medium">{endpoint.title}</span>
                  </span>
                  <ChevronRight size={16} className="opacity-50" />
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {selectedEndpoint ? (
              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedEndpoint.title}
                      </h2>
                      <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedEndpoint.description}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEndpoint.method === 'GET'
                        ? 'bg-green-100 text-green-800'
                        : selectedEndpoint.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedEndpoint.method === 'PUT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEndpoint.method}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Endpoint
                    </h3>
                    <code className={`mt-1 block rounded-md p-3 text-sm font-mono ${
                      isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {selectedEndpoint.path}
                    </code>
                  </div>

                  {selectedEndpoint.authentication && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
                      <AlertCircle size={16} />
                      <span>Requires authentication</span>
                    </div>
                  )}
                </div>

                <div className="p-6 border-b border-gray-200">
                  <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Try it out
                  </h3>

                  {selectedEndpoint.requestBody && (
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Request Body
                      </label>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        rows={8}
                        className={`w-full font-mono text-sm p-3 rounded-md ${
                          isDarkMode
                            ? 'bg-gray-900 text-gray-300 border-gray-700'
                            : 'bg-gray-50 text-gray-900 border-gray-300'
                        } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      API Key
                      <span className="ml-1 text-xs text-gray-500">(required for authentication)</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedApiKey}
                            onChange={(e) => {
                              setSelectedApiKey(e.target.value);
                              setUseCustomKey(false);
                            }}
                            className={`w-full pl-10 pr-3 py-2 appearance-none rounded-md ${
                              isDarkMode
                                ? 'bg-gray-900 text-gray-300 border-gray-700'
                                : 'bg-gray-50 text-gray-900 border-gray-300'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500 ${useCustomKey ? 'opacity-50' : ''}`}
                            disabled={loadingKeys || useCustomKey}
                          >
                            <option value="">Use default anonymous key</option>
                            {apiKeys.map(key => (
                              <option key={key.id} value={key.key}>
                                {key.name}
                              </option>
                            ))}
                          </select>
                          <Key size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/profile'}
                        >Manage Keys</Button>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="use-custom-key"
                          checked={useCustomKey}
                          onChange={(e) => setUseCustomKey(e.target.checked)}
                          className={`h-4 w-4 ${
                            isDarkMode
                              ? 'bg-gray-900 border-gray-700 text-blue-600'
                              : 'bg-white border-gray-300 text-blue-600'
                          } rounded focus:ring-blue-500`}
                        />
                        <label
                          htmlFor="use-custom-key"
                          className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Use custom API key
                        </label>
                      </div>
                      
                      {useCustomKey && (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                          </div>
                          <input
                            type="text"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className={`w-full pl-10 pr-3 py-2 rounded-md ${
                              isDarkMode
                                ? 'bg-gray-900 text-gray-300 border-gray-700'
                                : 'bg-gray-50 text-gray-900 border-gray-300'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                      )}
                      
                      <div className={`flex items-start gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        <Info size={14} className="mt-0.5 flex-shrink-0" />
                        <p>
                          API keys are used to authenticate requests. You can use your own key for testing or the default anonymous key for public endpoints. If you're getting authentication errors (401 Invalid JWT), make sure to provide a valid API key or check that your anonymous key is correct.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleTestEndpoint}
                    disabled={isLoading}
                    leftIcon={isLoading ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                  >
                    {isLoading ? 'Sending Request...' : 'Send Request'}
                  </Button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                      <AlertCircle size={16} />
                      <div className="flex-1">
                        <p className="font-medium">{error}</p>
                        {rawResponse && (
                          <p className="text-xs mt-1">See the raw response below for more details.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(rawRequest || rawResponse || response) && (
                    <div className="mt-4">
                      <div className="flex border-b border-gray-200 mb-4">
                        <button
                          onClick={() => setActiveTab('request')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 ${
                            activeTab === 'request'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Raw Request
                        </button>
                        <button
                          onClick={() => setActiveTab('response')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 ${
                            activeTab === 'response'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Raw Response
                        </button>
                        <button
                          onClick={() => setActiveTab('formatted')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 ${
                            activeTab === 'formatted'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Formatted Response
                        </button>
                      </div>
                      
                      {activeTab === 'request' && rawRequest && (
                        <>
                          <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Raw Request
                          </h4>
                          <pre className={`rounded-md p-3 overflow-auto max-h-80 ${
                            isDarkMode
                              ? 'bg-gray-900 text-gray-300'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <code>{rawRequest}</code>
                          </pre>
                        </>
                      )}
                      
                      {activeTab === 'response' && rawResponse && (
                        <>
                          <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Raw Response
                          </h4>
                          <pre className={`rounded-md p-3 overflow-auto max-h-80 ${
                            isDarkMode
                              ? 'bg-gray-900 text-gray-300'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <code>{rawResponse}</code>
                          </pre>
                        </>
                      )}
                      
                      {activeTab === 'formatted' && response && (
                        <>
                          <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Formatted Response
                          </h4>
                          <pre className={`rounded-md p-3 overflow-auto max-h-80 ${
                            isDarkMode
                              ? 'bg-gray-900 text-gray-300'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <code>{response}</code>
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Code Examples
                  </h3>

                  <div className="flex gap-2 mb-4">
                    {['javascript', 'python', 'curl'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          selectedLanguage === lang
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <pre className={`rounded-md p-4 ${
                      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                    }`}>
                      <code className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {codeExamples[selectedEndpoint.id]?.[selectedLanguage]}
                      </code>
                    </pre>
                    <button
                      onClick={() => handleCopyCode(
                        codeExamples[selectedEndpoint.id]?.[selectedLanguage] || '',
                        selectedEndpoint.id
                      )}
                      className={`absolute top-2 right-2 p-2 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {copiedEndpoint === selectedEndpoint.id ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Code size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select an endpoint
                </h3>
                <p>Choose an endpoint from the sidebar to view its documentation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;