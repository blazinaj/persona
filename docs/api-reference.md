# Persona API Reference

## Introduction

The Persona API allows you to programmatically create, manage, and interact with AI personas. This reference provides detailed information about available endpoints, authentication methods, request/response formats, and examples.

## Base URL

All API requests should be made to:

```
https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api
```

## Authentication

### API Keys

The Persona API uses API keys for authentication. You can create and manage your API keys in the [Profile Settings](https://personify.mobi/profile) page.

API keys should be included in the `Authorization` header of your requests:

```
Authorization: Bearer YOUR_API_KEY
```

### Creating API Keys

1. Navigate to your Profile Settings
2. Select the "Security" tab
3. Click "Create API Key"
4. Give your key a name and optional expiration date
5. Copy the key immediately - it will only be shown once

### API Key Best Practices

- Never share your API keys
- Use different keys for different applications
- Set expiration dates for keys when possible
- Rotate keys periodically
- Store keys securely in environment variables

## Rate Limits

The API has the following rate limits:

- 60 requests per minute per API key
- 1000 requests per day for free tier users
- Higher limits for paid subscription plans

## Endpoints

### Personas

#### List Personas

```
GET /personas
```

Retrieves a list of all personas for the authenticated user.

**Response**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Technical Expert",
    "description": "A knowledgeable technical assistant",
    "avatar": "https://example.com/avatar.jpg",
    "created_at": "2025-05-15T12:00:00Z",
    "updated_at": "2025-05-15T12:00:00Z",
    "tags": ["technical", "programming", "support"],
    "personality": ["professional", "analytical"],
    "knowledge": ["JavaScript", "Python", "React", "Node.js"],
    "tone": "professional",
    "examples": [
      "How would I implement a linked list in JavaScript?",
      "Can you explain the concept of dependency injection?"
    ],
    "visibility": "public",
    "user_id": "user-id"
  }
]
```

#### Get Persona

```
GET /personas/:id
```

Retrieves details of a specific persona.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| id   | string | The ID of the persona to retrieve |

**Response**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Technical Expert",
  "description": "A knowledgeable technical assistant",
  "avatar": "https://example.com/avatar.jpg",
  "created_at": "2025-05-15T12:00:00Z",
  "updated_at": "2025-05-15T12:00:00Z",
  "tags": ["technical", "programming", "support"],
  "personality": ["professional", "analytical"],
  "knowledge": ["JavaScript", "Python", "React", "Node.js"],
  "tone": "professional",
  "examples": [
    "How would I implement a linked list in JavaScript?",
    "Can you explain the concept of dependency injection?"
  ],
  "visibility": "public",
  "user_id": "user-id"
}
```

#### Create Persona

```
POST /personas
```

Creates a new persona.

**Request Body**

```json
{
  "name": "Technical Expert",
  "description": "A knowledgeable technical assistant",
  "avatar": "https://example.com/avatar.jpg",
  "tags": ["technical", "programming", "support"],
  "personality": ["professional", "analytical"],
  "knowledge": ["JavaScript", "Python", "React", "Node.js"],
  "tone": "professional",
  "examples": [
    "How would I implement a linked list in JavaScript?",
    "Can you explain the concept of dependency injection?"
  ],
  "visibility": "public"
}
```

**Response**

```json
{
  "success": true
}
```

#### Update Persona

```
PUT /personas/:id
```

Updates an existing persona.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| id   | string | The ID of the persona to update |

**Request Body**

```json
{
  "name": "Updated Technical Expert",
  "description": "An updated knowledgeable technical assistant",
  "avatar": "https://example.com/new-avatar.jpg",
  "tags": ["technical", "programming", "support", "expert"],
  "personality": ["professional", "analytical", "friendly"],
  "knowledge": ["JavaScript", "Python", "React", "Node.js", "TypeScript"],
  "tone": "professional",
  "examples": [
    "How would I implement a linked list in JavaScript?",
    "Can you explain the concept of dependency injection?"
  ],
  "visibility": "public"
}
```

**Response**

```json
{
  "success": true
}
```

#### Delete Persona

```
DELETE /personas/:id
```

Deletes an existing persona.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| id   | string | The ID of the persona to delete |

**Response**

```json
{
  "success": true
}
```

#### Chat with Persona

```
POST /personas/:id/chat
```

Send a message to chat with a specific persona.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| id   | string | The ID of the persona to chat with |

**Request Body**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, can you help me with a JavaScript question?"
    }
  ]
}
```

**Response**

```json
{
  "message": "Hello! I'd be happy to help with your JavaScript question. What would you like to know?"
}
```

### Conversations

#### List Conversations

```
GET /conversations
```

Retrieves a list of all conversations for the authenticated user.

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| persona_id | string | (Optional) Filter conversations by persona ID |

**Response**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "persona_id": "456e7890-e12b-34d5-a678-426614174000",
    "title": "JavaScript Help",
    "created_at": "2025-05-15T12:00:00Z",
    "updated_at": "2025-05-15T12:00:00Z",
    "user_id": "user-id"
  }
]
```

#### Get Conversation

```
GET /conversations/:id
```

Retrieves details of a specific conversation.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| id   | string | The ID of the conversation to retrieve |

**Response**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "persona_id": "456e7890-e12b-34d5-a678-426614174000",
  "title": "JavaScript Help",
  "created_at": "2025-05-15T12:00:00Z",
  "updated_at": "2025-05-15T12:00:00Z",
  "user_id": "user-id",
  "messages": [
    {
      "id": "789e0123-e45b-67d8-a901-426614174000",
      "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "user",
      "content": "Hello, can you help me with a JavaScript question?",
      "created_at": "2025-05-15T12:00:00Z"
    },
    {
      "id": "012e3456-e78b-90d1-a234-426614174000",
      "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "assistant",
      "content": "Hello! I'd be happy to help with your JavaScript question. What would you like to know?",
      "created_at": "2025-05-15T12:00:05Z"
    }
  ]
}
```

## Error Handling

The API returns standard HTTP status codes to indicate the success or failure of a request.

### Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or missing required parameters |
| 401 | Unauthorized - Authentication failed or API key is invalid |
| 403 | Forbidden - The API key doesn't have permission to perform the request |
| 404 | Not Found - The requested resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on the server |

## Code Examples

### JavaScript

```javascript
// List all personas
const fetchPersonas = async () => {
  const response = await fetch('https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api/personas', {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch personas');
  }
  
  return await response.json();
};

// Chat with a persona
const chatWithPersona = async (personaId, messages) => {
  const response = await fetch(`https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api/personas/${personaId}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to chat with persona');
  }
  
  return await response.json();
};
```

### Python

```python
import requests

API_KEY = 'your_api_key'
BASE_URL = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api'

# List all personas
def fetch_personas():
    response = requests.get(
        f'{BASE_URL}/personas',
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    
    response.raise_for_status()
    return response.json()

# Chat with a persona
def chat_with_persona(persona_id, messages):
    response = requests.post(
        f'{BASE_URL}/personas/{persona_id}/chat',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={'messages': messages}
    )
    
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# List all personas
curl 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api/personas' \
  -H 'Authorization: Bearer YOUR_API_KEY'

# Chat with a persona
curl 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/api/personas/YOUR_PERSONA_ID/chat' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello, can you help me with a JavaScript question?"}]}'
```