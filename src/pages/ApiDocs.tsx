import React, { useState, useEffect, useContext } from 'react';
import { Search, Code, Play, Copy, Check, ChevronRight, Sun, Moon, AlertCircle, Loader2, Key, Info, Bot, FileText, X, Terminal } from 'lucide-react';
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
            avatar: 'https://example.com/avatar.jpg',
            created_at: '2025-05-15T12:00:00Z',
            updated_at: '2025-05-15T12:00:00Z',
            tags: ['technical', 'programming', 'support'],
            personality: ['professional', 'analytical'],
            knowledge: ['JavaScript', 'Python', 'React', 'Node.js'],
            tone: 'professional',
            examples: [
              'How would I implement a linked list in JavaScript?',
              'Can you explain the concept of dependency injection?'
            ],
            visibility: 'public',
            user_id: 'user-id'
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
          description: 'A knowledgeable technical assistant',
          avatar: 'https://example.com/avatar.jpg',
          created_at: '2025-05-15T12:00:00Z',
          updated_at: '2025-05-15T12:00:00Z',
          tags: ['technical', 'programming', 'support'],
          personality: ['professional', 'analytical'],
          knowledge: ['JavaScript', 'Python', 'React', 'Node.js'],
          tone: 'professional',
          examples: [
            'How would I implement a linked list in JavaScript?',
            'Can you explain the concept of dependency injection?'
          ],
          visibility: 'public',
          user_id: 'user-id'
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
        avatar: {
          type: 'string',
          description: 'URL to avatar image'
        },
        tags: {
          type: 'array',
          description: 'Categorization tags'
        },
        personality: {
          type: 'array',
          description: 'Personality traits'
        },
        knowledge: {
          type: 'array',
          description: 'Knowledge areas'
        },
        tone: {
          type: 'string',
          description: 'Communication tone'
        },
        examples: {
          type: 'array',
          description: 'Example interactions'
        },
        instructions: {
          type: 'string',
          description: 'Custom instructions'
        },
        visibility: {
          type: 'string',
          description: 'Visibility setting (private, unlisted, public)'
        },
        voice: {
          type: 'object',
          description: 'Voice settings for text-to-speech'
        }
      }
    },
    responses: {
      '201': {
        description: 'Persona created successfully',
        example: {
          success: true,
          message: 'Persona created successfully',
          persona: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Technical Expert',
            // other persona fields...
          }
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
        },
        avatar: {
          type: 'string',
          description: 'URL to avatar image'
        },
        tags: {
          type: 'array',
          description: 'Categorization tags'
        },
        personality: {
          type: 'array',
          description: 'Personality traits'
        },
        knowledge: {
          type: 'array',
          description: 'Knowledge areas'
        },
        tone: {
          type: 'string',
          description: 'Communication tone'
        },
        examples: {
          type: 'array',
          description: 'Example interactions'
        },
        instructions: {
          type: 'string',
          description: 'Custom instructions'
        },
        visibility: {
          type: 'string',
          description: 'Visibility setting (private, unlisted, public)'
        },
        voice: {
          type: 'object',
          description: 'Voice settings for text-to-speech'
        }
      }
    },
    responses: {
      '200': {
        description: 'Persona updated successfully',
        example: {
          success: true,
          persona: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Updated Technical Expert',
            // other updated persona fields...
          }
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
        },
        conversationId: {
          type: 'string',
          description: 'Optional ID of an existing conversation to continue'
        }
      }
    },
    responses: {
      '200': {
        description: 'Chat response',
        example: {
          message: 'Hello! I would be happy to help with your JavaScript question. What would you like to know?',
          conversationId: '123e4567-e89b-12d3-a456-426614174000'
        }
      }
    }
  },
  {
    id: 'list-conversations',
    method: 'GET',
    path: '/conversations',
    title: 'List Conversations',
    description: 'Retrieve a list of conversations for the authenticated user, optionally filtered by persona.',
    authentication: true,
    responses: {
      '200': {
        description: 'List of conversations',
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            persona_id: '456e7890-e12b-34d5-a678-426614174000',
            title: 'JavaScript Help',
            created_at: '2025-05-15T12:00:00Z',
            updated_at: '2025-05-15T12:05:00Z',
            personas: {
              id: '456e7890-e12b-34d5-a678-426614174000',
              name: 'Technical Expert',
              avatar: 'https://example.com/avatar.jpg'
            }
          }
        ]
      }
    }
  },
  {
    id: 'get-knowledge',
    method: 'GET',
    path: '/knowledge',
    title: 'Get Knowledge Entries',
    description: 'Retrieve knowledge entries for a specific persona.',
    authentication: true,
    responses: {
      '200': {
        description: 'List of knowledge entries',
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            persona_id: '456e7890-e12b-34d5-a678-426614174000',
            title: 'JavaScript Closures',
            description: 'Closures are a fundamental concept in JavaScript...',
            category: 'programming',
            source: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures',
            created_at: '2025-05-15T12:00:00Z',
            updated_at: '2025-05-15T12:00:00Z',
            user_id: 'user-id'
          }
        ]
      }
    }
  },
  {
    id: 'create-knowledge',
    method: 'POST',
    path: '/knowledge',
    title: 'Create Knowledge Entry',
    description: 'Add a new knowledge entry for a persona.',
    authentication: true,
    requestBody: {
      type: 'object',
      properties: {
        persona_id: {
          type: 'string',
          description: 'ID of the persona',
          required: true
        },
        title: {
          type: 'string',
          description: 'Title of the knowledge entry',
          required: true
        },
        description: {
          type: 'string',
          description: 'Content of the knowledge entry',
          required: true
        },
        category: {
          type: 'string',
          description: 'Category of the knowledge entry',
          required: true
        },
        source: {
          type: 'string',
          description: 'Source of the knowledge (URL, reference, etc.)'
        }
      }
    },
    responses: {
      '201': {
        description: 'Knowledge entry created successfully',
        example: {
          success: true,
          entry: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            persona_id: '456e7890-e12b-34d5-a678-426614174000',
            title: 'JavaScript Closures',
            description: 'Closures are a fundamental concept in JavaScript...',
            category: 'programming',
            source: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures',
            created_at: '2025-05-15T12:00:00Z',
            updated_at: '2025-05-15T12:00:00Z',
            user_id: 'user-id'
          }
        }
      }
    }
  },
  {
    id: 'api-docs',
    method: 'GET',
    path: '/docs',
    title: 'API Documentation',
    description: 'Get programmatic API documentation.',
    authentication: false,
    responses: {
      '200': {
        description: 'API Documentation',
        example: {
          title: 'Persona API Reference',
          version: '1.0.0',
          baseUrl: 'https://example.com/functions/v1/api',
          auth: {
            type: 'Bearer',
            description: 'API requests require an API key in the Authorization header.',
            example: 'Authorization: Bearer YOUR_API_KEY'
          },
          endpoints: [
            // List of endpoints...
          ]
        }
      }
    }
  }
];

// Get the base URL from environment variables with fallback
const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    console.error('VITE_SUPABASE_URL environment variable is not set');
    return '';
  }
  return url;
};

const codeExamples: Record<string, Record<string, string>> = {
  'list-personas': {
    javascript: `const fetchPersonas = async (apiKey) => {
  const response = await fetch('${getSupabaseUrl()}/functions/v1/api/personas', {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch personas');
  }
  
  return await response.json();
};`,
    python: `import requests

def fetch_personas(api_key):
    response = requests.get(
        '${getSupabaseUrl()}/functions/v1/api/personas',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl '${getSupabaseUrl()}/functions/v1/api/personas' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
  },
  'get-persona': {
    javascript: `const fetchPersona = async (apiKey, personaId) => {
  const response = await fetch(\`${getSupabaseUrl()}/functions/v1/api/personas/\${personaId}\`, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch persona');
  }
  
  return await response.json();
};`,
    python: `import requests

def fetch_persona(api_key, persona_id):
    response = requests.get(
        f'${getSupabaseUrl()}/functions/v1/api/personas/{persona_id}',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl '${getSupabaseUrl()}/functions/v1/api/personas/YOUR_PERSONA_ID' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
  },
  'create-persona': {
    javascript: `const createPersona = async (apiKey, personaData) => {
  const response = await fetch('${getSupabaseUrl()}/functions/v1/api/personas', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(personaData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create persona');
  }
  
  return await response.json();
};

// Example usage:
const newPersona = {
  name: 'Technical Writer',
  description: 'Helps with documentation and technical writing',
  tags: ['writing', 'documentation'],
  personality: ['professional', 'analytical'],
  knowledge: ['technical writing', 'documentation', 'markdown'],
  tone: 'professional',
  visibility: 'private'
};`,
    python: `import requests

def create_persona(api_key, persona_data):
    response = requests.post(
        '${getSupabaseUrl()}/functions/v1/api/personas',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=persona_data
    )
    
    response.raise_for_status()
    return response.json()

# Example usage:
new_persona = {
    "name": "Technical Writer",
    "description": "Helps with documentation and technical writing",
    "tags": ["writing", "documentation"],
    "personality": ["professional", "analytical"],
    "knowledge": ["technical writing", "documentation", "markdown"],
    "tone": "professional",
    "visibility": "private"
}`,
    curl: `curl -X POST '${getSupabaseUrl()}/functions/v1/api/personas' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Technical Writer",
    "description": "Helps with documentation and technical writing",
    "tags": ["writing", "documentation"],
    "personality": ["professional", "analytical"],
    "knowledge": ["technical writing", "documentation", "markdown"],
    "tone": "professional",
    "visibility": "private"
  }'`
  },
  'update-persona': {
    javascript: `const updatePersona = async (apiKey, personaId, updateData) => {
  const response = await fetch(\`${getSupabaseUrl()}/functions/v1/api/personas/\${personaId}\`, {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update persona');
  }
  
  return await response.json();
};

// Example usage:
const updates = {
  name: 'Updated Technical Writer',
  description: 'Expert in technical documentation',
  visibility: 'unlisted'
};`,
    python: `import requests

def update_persona(api_key, persona_id, update_data):
    response = requests.put(
        f'${getSupabaseUrl()}/functions/v1/api/personas/{persona_id}',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=update_data
    )
    
    response.raise_for_status()
    return response.json()

# Example usage:
updates = {
    "name": "Updated Technical Writer",
    "description": "Expert in technical documentation",
    "visibility": "unlisted"
}`,
    curl: `curl -X PUT '${getSupabaseUrl()}/functions/v1/api/personas/YOUR_PERSONA_ID' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Updated Technical Writer",
    "description": "Expert in technical documentation",
    "visibility": "unlisted"
  }'`
  },
  'delete-persona': {
    javascript: `const deletePersona = async (apiKey, personaId) => {
  const response = await fetch(\`${getSupabaseUrl()}/functions/v1/api/personas/\${personaId}\`, {
    method: 'DELETE',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete persona');
  }
  
  return await response.json();
};`,
    python: `import requests

def delete_persona(api_key, persona_id):
    response = requests.delete(
        f'${getSupabaseUrl()}/functions/v1/api/personas/{persona_id}',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl -X DELETE '${getSupabaseUrl()}/functions/v1/api/personas/YOUR_PERSONA_ID' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
  },
  'chat': {
    javascript: `const chatWithPersona = async (apiKey, personaId, messages, conversationId = null) => {
  const response = await fetch(\`${getSupabaseUrl()}/functions/v1/api/personas/\${personaId}/chat\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      conversationId
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to chat with persona');
  }
  
  return await response.json();
};

// Example usage:
const messages = [
  { role: 'user', content: 'Hello, can you help me with a JavaScript question?' }
];`,
    python: `import requests

def chat_with_persona(api_key, persona_id, messages, conversation_id=None):
    payload = {
        "messages": messages,
    }
    
    if conversation_id:
        payload["conversationId"] = conversation_id
    
    response = requests.post(
        f'${getSupabaseUrl()}/functions/v1/api/personas/{persona_id}/chat',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=payload
    )
    
    response.raise_for_status()
    return response.json()

# Example usage:
messages = [
    {"role": "user", "content": "Hello, can you help me with a JavaScript question?"}
]`,
    curl: `curl -X POST '${getSupabaseUrl()}/functions/v1/api/personas/YOUR_PERSONA_ID/chat' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, can you help me with a JavaScript question?"}
    ]
  }'`
  },
  'list-conversations': {
    javascript: `const fetchConversations = async (apiKey, personaId = null, includeMessages = false) => {
  let url = '${getSupabaseUrl()}/functions/v1/api/conversations';
  
  // Add query parameters if provided
  const params = new URLSearchParams();
  if (personaId) {
    params.append('persona_id', personaId);
  }
  if (includeMessages) {
    params.append('include_messages', 'true');
  }
  
  if (params.toString()) {
    url += \`?\${params.toString()}\`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch conversations');
  }
  
  return await response.json();
};`,
    python: `import requests

def fetch_conversations(api_key, persona_id=None, include_messages=False):
    url = '${getSupabaseUrl()}/functions/v1/api/conversations'
    
    # Add query parameters if provided
    params = {}
    if persona_id:
        params['persona_id'] = persona_id
    if include_messages:
        params['include_messages'] = 'true'
    
    response = requests.get(
        url,
        headers={'Authorization': f'Bearer {api_key}'},
        params=params
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl '${getSupabaseUrl()}/functions/v1/api/conversations' \\
  -H 'Authorization: Bearer YOUR_API_KEY'

# With query parameters:
curl '${getSupabaseUrl()}/functions/v1/api/conversations?persona_id=YOUR_PERSONA_ID&include_messages=true' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
  },
  'get-knowledge': {
    javascript: `const fetchKnowledgeEntries = async (apiKey, personaId) => {
  const url = \`${getSupabaseUrl()}/functions/v1/api/knowledge?persona_id=\${personaId}\`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch knowledge entries');
  }
  
  return await response.json();
};`,
    python: `import requests

def fetch_knowledge_entries(api_key, persona_id):
    response = requests.get(
        f'${getSupabaseUrl()}/functions/v1/api/knowledge',
        headers={'Authorization': f'Bearer {api_key}'},
        params={'persona_id': persona_id}
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl '${getSupabaseUrl()}/functions/v1/api/knowledge?persona_id=YOUR_PERSONA_ID' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
  },
  'create-knowledge': {
    javascript: `const createKnowledgeEntry = async (apiKey, entryData) => {
  const response = await fetch('${getSupabaseUrl()}/functions/v1/api/knowledge', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create knowledge entry');
  }
  
  return await response.json();
};

// Example usage:
const newEntry = {
  persona_id: 'YOUR_PERSONA_ID',
  title: 'JavaScript Closures',
  description: 'Closures are a fundamental concept in JavaScript...',
  category: 'programming',
  source: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures'
};`,
    python: `import requests

def create_knowledge_entry(api_key, entry_data):
    response = requests.post(
        '${getSupabaseUrl()}/functions/v1/api/knowledge',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=entry_data
    )
    
    response.raise_for_status()
    return response.json()

# Example usage:
new_entry = {
    "persona_id": "YOUR_PERSONA_ID",
    "title": "JavaScript Closures",
    "description": "Closures are a fundamental concept in JavaScript...",
    "category": "programming",
    "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures"
}`,
    curl: `curl -X POST '${getSupabaseUrl()}/functions/v1/api/knowledge' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "persona_id": "YOUR_PERSONA_ID",
    "title": "JavaScript Closures",
    "description": "Closures are a fundamental concept in JavaScript...",
    "category": "programming",
    "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures"
  }'`
  },
  'api-docs': {
    javascript: `const fetchApiDocs = async (apiKey) => {
  const response = await fetch('${getSupabaseUrl()}/functions/v1/api/docs', {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch API documentation');
  }
  
  return await response.json();
};`,
    python: `import requests

def fetch_api_docs(api_key):
    response = requests.get(
        '${getSupabaseUrl()}/functions/v1/api/docs',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    
    response.raise_for_status()
    return response.json()`,
    curl: `curl '${getSupabaseUrl()}/functions/v1/api/docs' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`
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
      if (selectedEndpoint.requestBody?.properties) {
        // Create a template JSON object with all properties
        const template: Record<string, any> = {};
        Object.entries(selectedEndpoint.requestBody.properties).forEach(([key, prop]) => {
          if (prop.type === 'string') {
            template[key] = "";
          } else if (prop.type === 'array') {
            template[key] = [];
          } else if (prop.type === 'object') {
            template[key] = {};
          } else if (prop.type === 'number') {
            template[key] = 0;
          } else if (prop.type === 'boolean') {
            template[key] = false;
          }
          
          // Add "REQUIRED" marker for required fields
          if (prop.required) {
            const comment = prop.type === 'string' ? '/* REQUIRED */' : '// REQUIRED';
            if (prop.type === 'string') {
              template[key] = comment;
            } else {
              template[`${key}${comment}`] = template[key];
              delete template[key];
            }
          }
        });
        
        setRequestBody(JSON.stringify(template, null, 2));
      } else {
        setRequestBody('');
      }
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
      // Validate environment variable
      const supabaseUrl = getSupabaseUrl();
      if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured. Please check your environment variables.');
      }

      // Build the request details
      let path = selectedEndpoint.path;
      if (path.includes(':id')) {
        // For demo purposes, use a placeholder or the first persona ID if available
        path = path.replace(':id', 'demo-persona-id');
      }
      
      // Construct the complete URL using absolute path
      const url = `${supabaseUrl}/functions/v1/api${path}`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // For authenticated endpoints, require a proper API key
      if (selectedEndpoint.authentication) {
        // Use custom key if enabled, otherwise use selected key
        if (useCustomKey && customApiKey) {
          headers['Authorization'] = `Bearer ${customApiKey}`;
        } else if (selectedApiKey) {
          headers['Authorization'] = `Bearer ${selectedApiKey}`;
        } else {
          throw new Error('This endpoint requires authentication. Please provide an API key or create one in Settings > API Keys.');
        }
      } else {
        // For non-authenticated endpoints, we can use the anonymous key if available
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers['Authorization'] = `Bearer ${anonKey}`;
        }
      }

      // Prepare request body
      let bodyData: any = undefined;
      if (selectedEndpoint.method !== 'GET' && requestBody.trim()) {
        try {
          bodyData = JSON.parse(requestBody.trim());
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      } else if (selectedEndpoint.method !== 'GET') {
        bodyData = {};
      }

      // Store raw request information
      const requestDetails = {
        url,
        method: selectedEndpoint.method,
        headers,
        body: bodyData
      };

      setRawRequest(JSON.stringify(requestDetails, null, 2));

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
        ...(bodyData && { body: JSON.stringify(bodyData) })
      };

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, { 
          ...options, 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        // Try to get response text
        let responseText = '';
        let responseData: any = null;
        
        try {
          responseText = await response.text();
          if (responseText) {
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              responseData = { text: responseText };
            }
          } else {
            responseData = { message: 'Empty response' };
          }
        } catch (e) {
          responseData = { error: 'Failed to read response', details: e.message };
        }
        
        // Store raw response information
        const responseDetails = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]),
          body: responseData
        };
        
        setRawResponse(JSON.stringify(responseDetails, null, 2));
        
        if (!response.ok) {
          setError(`Request failed with status ${response.status}: ${responseData?.error || responseData?.message || 'Unknown error'}`);
          setActiveTab('response');
        } else {
          setResponse(JSON.stringify(responseData, null, 2));
          setActiveTab('formatted');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. The API endpoint may not be available or is taking too long to respond.');
        } else {
          throw fetchError;
        }
      }
      
    } catch (err: any) {
      // Network error or other fetch failure
      const errorDetails = {
        error: 'Network Error',
        message: err.message,
        type: err.name,
        details: 'This typically indicates a network connectivity issue, CORS problem, the endpoint is not available, or the Supabase Edge Functions are not deployed.'
      };
      
      setRawResponse(JSON.stringify({
        status: 'Network Error',
        error: errorDetails
      }, null, 2));
      
      setError(`Network Error: ${err.message}`);
      setActiveTab('response');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate LLM-friendly documentation
  const generateLLMDocs = () => {
    const supabaseUrl = getSupabaseUrl();
    let docs = `# Persona API Documentation\n\n`;
    
    docs += `## Base URL\n\n\`\`\`\n${supabaseUrl}/functions/v1/api\n\`\`\`\n\n`;
    
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
          } else if (prop.type === 'object') {
            exampleBody[key] = `{}`;
          } else {
            exampleBody[key] = `{}`;
          }
        });
        docs += `${JSON.stringify(exampleBody, null, 2)}\n\`\`\`\n\n`;
      }
      
      const responseExample = endpoint.responses['200'] || endpoint.responses['201'];
      if (responseExample) {
        docs += `**Response**:\n\n\`\`\`json\n${JSON.stringify(responseExample.example, null, 2)}\n\`\`\`\n\n`;
      }
      
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
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the current Supabase URL for display
  const currentSupabaseUrl = getSupabaseUrl();

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

        {/* Environment variable check */}
        {!currentSupabaseUrl && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={16} />
              <p className="font-medium">Configuration Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">
              VITE_SUPABASE_URL environment variable is not set. API testing will not work properly.
            </p>
          </div>
        )}

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
                      {currentSupabaseUrl || 'SUPABASE_URL_NOT_SET'}/functions/v1/api{selectedEndpoint.path}
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
                  
                  {selectedEndpoint.authentication && (
                    <div className="mt-4">
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        API Key
                        <span className="ml-1 text-xs text-red-500">(required for this endpoint)</span>
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
                              <option value="">Select an API key</option>
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
                            onClick={() => window.location.href = '/settings?tab=api'}
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
                            This endpoint requires authentication with a valid API key. You can create API keys in Settings &gt; API Keys.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleTestEndpoint}
                    disabled={isLoading || !currentSupabaseUrl || (selectedEndpoint.authentication && !selectedApiKey && !customApiKey)}
                    leftIcon={isLoading ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                    className="mt-4"
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
                          disabled={!response}
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
                        {codeExamples[selectedEndpoint.id]?.[selectedLanguage] || 
                         "// Code example not available for this endpoint and language combination."}
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
                <Terminal size={48} className="mx-auto mb-4 opacity-50" />
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