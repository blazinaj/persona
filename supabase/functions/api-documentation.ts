// Generate API documentation for programmatic use by clients
export function generateApiDocumentation() {
  return {
    title: 'Persona API Reference',
    version: '1.0.0',
    baseUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/api`,
    auth: {
      type: 'Bearer',
      description: 'API requests require an API key in the Authorization header.',
      example: 'Authorization: Bearer YOUR_API_KEY'
    },
    endpoints: [
      {
        path: '/personas',
        methods: ['GET', 'POST'],
        description: 'Manage personas',
        auth: true,
        endpoints: [
          {
            method: 'GET',
            description: 'List all personas for the authenticated user',
            response: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  name: 'string',
                  description: 'string?',
                  avatar: 'string?',
                  tags: 'string[]',
                  personality: 'string[]',
                  knowledge: 'string[]',
                  tone: 'string',
                  examples: 'string[]',
                  visibility: 'string',
                  created_at: 'string',
                  updated_at: 'string'
                }
              }
            }
          },
          {
            method: 'POST',
            description: 'Create a new persona',
            request: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  required: true,
                  description: 'Persona name'
                },
                description: {
                  type: 'string',
                  description: 'Persona description'
                },
                avatar: {
                  type: 'string',
                  description: 'URL to avatar image'
                },
                tags: {
                  type: 'array',
                  items: 'string',
                  description: 'Categorization tags'
                },
                personality: {
                  type: 'array',
                  items: 'string',
                  description: 'Personality traits'
                },
                knowledge: {
                  type: 'array',
                  items: 'string',
                  description: 'Knowledge areas'
                },
                tone: {
                  type: 'string',
                  description: 'Communication tone'
                },
                examples: {
                  type: 'array',
                  items: 'string',
                  description: 'Example interactions'
                },
                instructions: {
                  type: 'string',
                  description: 'Custom instructions'
                },
                visibility: {
                  type: 'string',
                  enum: ['private', 'unlisted', 'public'],
                  description: 'Visibility setting'
                }
              }
            },
            response: {
              type: 'object',
              properties: {
                success: 'boolean',
                message: 'string',
                persona: 'object'
              }
            }
          }
        ]
      },
      {
        path: '/personas/:id',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage a specific persona',
        auth: true,
        params: [
          {
            name: 'id',
            description: 'Persona ID',
            required: true
          }
        ],
        endpoints: [
          {
            method: 'GET',
            description: 'Get a specific persona by ID',
            response: {
              type: 'object',
              properties: {
                id: 'string',
                name: 'string',
                description: 'string?',
                avatar: 'string?',
                // ... other persona properties
              }
            }
          },
          {
            method: 'PUT',
            description: 'Update a specific persona',
            request: {
              type: 'object',
              properties: {
                name: 'string?',
                description: 'string?',
                avatar: 'string?',
                // ... other updateable properties
              }
            },
            response: {
              type: 'object',
              properties: {
                success: 'boolean',
                persona: 'object'
              }
            }
          },
          {
            method: 'DELETE',
            description: 'Delete a specific persona',
            response: {
              type: 'object',
              properties: {
                success: 'boolean'
              }
            }
          }
        ]
      },
      {
        path: '/personas/:id/chat',
        methods: ['POST'],
        description: 'Chat with a persona',
        auth: true,
        params: [
          {
            name: 'id',
            description: 'Persona ID',
            required: true
          }
        ],
        endpoints: [
          {
            method: 'POST',
            description: 'Send a message to a persona',
            request: {
              type: 'object',
              properties: {
                messages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      role: {
                        type: 'string',
                        enum: ['user', 'assistant']
                      },
                      content: 'string'
                    }
                  },
                  description: 'Message history',
                  required: true
                },
                conversationId: {
                  type: 'string',
                  description: 'Optional conversation ID to continue an existing conversation'
                }
              }
            },
            response: {
              type: 'object',
              properties: {
                message: 'string',
                conversationId: 'string'
              }
            }
          }
        ]
      },
      {
        path: '/conversations',
        methods: ['GET'],
        description: 'List conversations',
        auth: true,
        query: [
          {
            name: 'persona_id',
            description: 'Filter by persona ID',
            required: false
          },
          {
            name: 'include_messages',
            description: 'Include messages in the response (true/false)',
            required: false
          },
          {
            name: 'limit',
            description: 'Maximum number of conversations to return',
            required: false
          }
        ],
        endpoints: [
          {
            method: 'GET',
            description: 'List conversations for the authenticated user',
            response: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  persona_id: 'string',
                  title: 'string',
                  created_at: 'string',
                  updated_at: 'string',
                  personas: 'object',
                  chat_messages: 'array?'
                }
              }
            }
          }
        ]
      },
      {
        path: '/knowledge',
        methods: ['GET', 'POST'],
        description: 'Manage knowledge entries',
        auth: true,
        query: [
          {
            name: 'persona_id',
            description: 'Persona ID to fetch knowledge entries for',
            required: true
          }
        ],
        endpoints: [
          {
            method: 'GET',
            description: 'List knowledge entries for a persona',
            response: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  persona_id: 'string',
                  title: 'string',
                  description: 'string',
                  category: 'string',
                  source: 'string?',
                  created_at: 'string',
                  updated_at: 'string'
                }
              }
            }
          },
          {
            method: 'POST',
            description: 'Create a new knowledge entry',
            request: {
              type: 'object',
              properties: {
                persona_id: {
                  type: 'string',
                  required: true,
                  description: 'Persona ID'
                },
                title: {
                  type: 'string',
                  required: true,
                  description: 'Entry title'
                },
                description: {
                  type: 'string',
                  required: true,
                  description: 'Entry description/content'
                },
                category: {
                  type: 'string',
                  required: true,
                  description: 'Entry category'
                },
                source: {
                  type: 'string',
                  description: 'Source of information (optional)'
                }
              }
            },
            response: {
              type: 'object',
              properties: {
                success: 'boolean',
                entry: 'object'
              }
            }
          }
        ]
      },
      {
        path: '/docs',
        methods: ['GET'],
        description: 'Get API documentation',
        auth: false,
        endpoints: [
          {
            method: 'GET',
            description: 'Get documentation for the API',
            response: {
              type: 'object',
              description: 'API documentation'
            }
          }
        ]
      }
    ]
  };
}