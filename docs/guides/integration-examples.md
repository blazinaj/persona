# Integration Examples

This guide provides practical examples of integrating Persona into various applications and platforms. Each example includes code samples, configuration details, and best practices.

## Website Integration

### Basic Website Chat Widget

Add a chat widget to your website that allows visitors to interact with your persona.

#### HTML Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <style>
    /* Optional custom styles for the widget */
    .chat-container {
      max-width: 400px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
  
  <main>
    <section>
      <h2>Chat with our Assistant</h2>
      <div class="chat-container">
        <!-- Persona Chat Widget -->
        <div id="persona-chat-YOUR_PERSONA_ID"></div>
        <script>
        (function() {
          const script = document.createElement('script');
          script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
          script.async = true;
          script.onload = function() {
            window.PersonaChat.init({
              personaId: 'YOUR_PERSONA_ID',
              container: 'persona-chat-YOUR_PERSONA_ID',
              apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
              apiKey: 'YOUR_API_KEY',
              theme: 'light',
              height: '500px'
            });
          };
          document.head.appendChild(script);
        })();
        </script>
        <!-- End Persona Chat Widget -->
      </div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 My Website</p>
  </footer>
</body>
</html>
```

### Floating Chat Button

Create a floating chat button that opens the widget when clicked.

#### HTML & JavaScript Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website with Floating Chat</title>
  <style>
    .chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #2563eb;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    
    .chat-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      z-index: 1000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: none;
    }
  </style>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
  
  <main>
    <section>
      <h2>Main Content</h2>
      <p>This is the main content of the website.</p>
    </section>
  </main>
  
  <!-- Chat Button -->
  <button id="chat-button" class="chat-button">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  </button>
  
  <!-- Chat Container -->
  <div id="chat-container" class="chat-container">
    <div id="persona-chat-YOUR_PERSONA_ID"></div>
  </div>
  
  <script>
    // Load Persona Chat Widget
    (function() {
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = function() {
        window.PersonaChat.init({
          personaId: 'YOUR_PERSONA_ID',
          container: 'persona-chat-YOUR_PERSONA_ID',
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: 'YOUR_API_KEY'
        });
      };
      document.head.appendChild(script);
    })();
    
    // Toggle chat visibility
    document.getElementById('chat-button').addEventListener('click', function() {
      const container = document.getElementById('chat-container');
      const isVisible = container.style.display === 'block';
      container.style.display = isVisible ? 'none' : 'block';
      
      // Change button icon
      this.innerHTML = isVisible
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    });
  </script>
</body>
</html>
```

## React Integration

### React Component

Create a reusable React component for the Persona chat widget.

#### Installation

```bash
npm install --save react react-dom
```

#### Implementation

```jsx
// PersonaChat.jsx
import React, { useEffect, useRef } from 'react';

const PersonaChat = ({
  personaId,
  apiKey,
  theme = 'light',
  height = '500px',
  width = '100%',
  position = 'inline'
}) => {
  const containerRef = useRef(null);
  const scriptLoaded = useRef(false);
  
  useEffect(() => {
    if (scriptLoaded.current) {
      // If script is already loaded, just initialize the widget
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme,
          position
        });
      }
      return;
    }
    
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme,
          position
        });
      }
    };
    document.head.appendChild(script);
    
    // Cleanup
    return () => {
      // Optional: Add cleanup if needed
    };
  }, [personaId, apiKey, theme, position]);
  
  const containerId = `persona-chat-${personaId}`;
  
  return (
    <div 
      id={containerId} 
      ref={containerRef}
      style={{ height, width }}
    ></div>
  );
};

export default PersonaChat;
```

#### Usage

```jsx
// App.jsx
import React from 'react';
import PersonaChat from './PersonaChat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My React App</h1>
      </header>
      
      <main>
        <section>
          <h2>Chat with our Assistant</h2>
          <PersonaChat
            personaId="YOUR_PERSONA_ID"
            apiKey="YOUR_API_KEY"
            theme="light"
            height="500px"
          />
        </section>
      </main>
    </div>
  );
}

export default App;
```

### React Floating Button

Create a floating chat button in React.

```jsx
// FloatingChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import './FloatingChat.css';

const FloatingChat = ({
  personaId,
  apiKey,
  theme = 'light',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const scriptLoaded = useRef(false);
  
  useEffect(() => {
    if (!isOpen) return;
    
    if (scriptLoaded.current) {
      // If script is already loaded, just initialize the widget
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme
        });
      }
      return;
    }
    
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme
        });
      }
    };
    document.head.appendChild(script);
  }, [personaId, apiKey, theme, isOpen]);
  
  const containerId = `persona-chat-${personaId}`;
  
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };
  
  return (
    <>
      <button
        className="floating-chat-button"
        style={getPositionStyles()}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
      
      {isOpen && (
        <div 
          className="floating-chat-container"
          style={{
            ...getPositionStyles(),
            bottom: position.startsWith('bottom') ? '90px' : undefined,
            top: position.startsWith('top') ? '90px' : undefined
          }}
        >
          <div 
            id={containerId} 
            ref={containerRef}
            style={{ height: '100%', width: '100%' }}
          ></div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
```

```css
/* FloatingChat.css */
.floating-chat-button {
  position: fixed;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: background-color 0.2s;
}

.floating-chat-button:hover {
  background-color: #1d4ed8;
}

.floating-chat-container {
  position: fixed;
  width: 350px;
  height: 500px;
  z-index: 1000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: white;
}

@media (max-width: 480px) {
  .floating-chat-container {
    width: calc(100% - 40px);
    height: 400px;
  }
}
```

## Next.js Integration

### Next.js Component

Create a Persona chat component for Next.js applications.

#### Installation

```bash
npm install --save next react react-dom
```

#### Implementation

```jsx
// components/PersonaChat.jsx
'use client'; // For Next.js 13+ App Router

import { useEffect, useRef } from 'react';

const PersonaChat = ({
  personaId,
  apiKey,
  theme = 'light',
  height = '500px',
  width = '100%'
}) => {
  const containerRef = useRef(null);
  const scriptLoaded = useRef(false);
  
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    if (scriptLoaded.current) {
      // If script is already loaded, just initialize the widget
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme
        });
      }
      return;
    }
    
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId,
          container: containerRef.current.id,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey,
          theme
        });
      }
    };
    document.head.appendChild(script);
    
    // Cleanup
    return () => {
      // Optional: Add cleanup if needed
    };
  }, [personaId, apiKey, theme]);
  
  const containerId = `persona-chat-${personaId}`;
  
  return (
    <div 
      id={containerId} 
      ref={containerRef}
      style={{ height, width }}
    ></div>
  );
};

export default PersonaChat;
```

#### Usage in Next.js App Router

```jsx
// app/support/page.jsx
import PersonaChat from '@/components/PersonaChat';

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Customer Support</h1>
      <p className="mb-6">Chat with our support assistant below:</p>
      
      <PersonaChat
        personaId={process.env.NEXT_PUBLIC_PERSONA_ID}
        apiKey={process.env.NEXT_PUBLIC_PERSONA_API_KEY}
        height="600px"
      />
    </div>
  );
}
```

## Vue.js Integration

### Vue Component

Create a Persona chat component for Vue.js applications.

#### Installation

```bash
npm install --save vue
```

#### Implementation

```vue
<!-- PersonaChat.vue -->
<template>
  <div :id="containerId" :style="{ height, width }"></div>
</template>

<script>
export default {
  name: 'PersonaChat',
  props: {
    personaId: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true
    },
    theme: {
      type: String,
      default: 'light'
    },
    height: {
      type: String,
      default: '500px'
    },
    width: {
      type: String,
      default: '100%'
    }
  },
  data() {
    return {
      containerId: `persona-chat-${this.personaId}`,
      scriptLoaded: false
    };
  },
  mounted() {
    this.loadScript();
  },
  methods: {
    loadScript() {
      if (this.scriptLoaded) {
        this.initChat();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        this.initChat();
      };
      document.head.appendChild(script);
    },
    initChat() {
      if (window.PersonaChat) {
        window.PersonaChat.init({
          personaId: this.personaId,
          container: this.containerId,
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: this.apiKey,
          theme: this.theme
        });
      }
    }
  }
};
</script>
```

#### Usage

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <header>
      <h1>My Vue App</h1>
    </header>
    
    <main>
      <section>
        <h2>Chat with our Assistant</h2>
        <PersonaChat
          personaId="YOUR_PERSONA_ID"
          apiKey="YOUR_API_KEY"
          theme="light"
          height="500px"
        />
      </section>
    </main>
  </div>
</template>

<script>
import PersonaChat from './components/PersonaChat.vue';

export default {
  name: 'App',
  components: {
    PersonaChat
  }
};
</script>
```

## API Integration Examples

### Node.js API Client

Create a Node.js client for the Persona API.

#### Installation

```bash
npm install --save node-fetch
```

#### Implementation

```javascript
// personaClient.js
import fetch from 'node-fetch';

class PersonaClient {
  constructor(apiKey, baseUrl = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    const options = {
      method,
      headers
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Personas
  async listPersonas() {
    return this.request('/personas');
  }
  
  async getPersona(personaId) {
    return this.request(`/personas/${personaId}`);
  }
  
  async createPersona(data) {
    return this.request('/personas', 'POST', data);
  }
  
  async updatePersona(personaId, data) {
    return this.request(`/personas/${personaId}`, 'PUT', data);
  }
  
  async deletePersona(personaId) {
    return this.request(`/personas/${personaId}`, 'DELETE');
  }
  
  // Chat
  async chatWithPersona(personaId, messages) {
    return this.request(`/personas/${personaId}/chat`, 'POST', { messages });
  }
  
  // Conversations
  async listConversations(personaId = null) {
    const endpoint = personaId 
      ? `/conversations?persona_id=${personaId}`
      : '/conversations';
    return this.request(endpoint);
  }
  
  async getConversation(conversationId) {
    return this.request(`/conversations/${conversationId}`);
  }
}

export default PersonaClient;
```

#### Usage

```javascript
// app.js
import PersonaClient from './personaClient.js';

const client = new PersonaClient('YOUR_API_KEY');

async function main() {
  try {
    // List all personas
    const personas = await client.listPersonas();
    console.log('My Personas:', personas);
    
    // Chat with a persona
    const chatResponse = await client.chatWithPersona('YOUR_PERSONA_ID', [
      { role: 'user', content: 'Hello, can you help me with a JavaScript question?' }
    ]);
    console.log('Chat Response:', chatResponse);
    
    // Create a new persona
    const newPersona = await client.createPersona({
      name: 'API Created Persona',
      description: 'This persona was created via the API',
      personality: ['friendly', 'helpful'],
      knowledge: ['API usage', 'JavaScript'],
      tone: 'casual',
      visibility: 'private'
    });
    console.log('New Persona:', newPersona);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### Python API Client

Create a Python client for the Persona API.

#### Installation

```bash
pip install requests
```

#### Implementation

```python
# persona_client.py
import requests

class PersonaClient:
    def __init__(self, api_key, base_url='https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        
        if method == 'GET':
            response = requests.get(url, headers=self.headers)
        elif method == 'POST':
            response = requests.post(url, headers=self.headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=self.headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=self.headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    # Personas
    def list_personas(self):
        return self.request('/personas')
    
    def get_persona(self, persona_id):
        return self.request(f'/personas/{persona_id}')
    
    def create_persona(self, data):
        return self.request('/personas', method='POST', data=data)
    
    def update_persona(self, persona_id, data):
        return self.request(f'/personas/{persona_id}', method='PUT', data=data)
    
    def delete_persona(self, persona_id):
        return self.request(f'/personas/{persona_id}', method='DELETE')
    
    # Chat
    def chat_with_persona(self, persona_id, messages):
        return self.request(f'/personas/{persona_id}/chat', method='POST', data={'messages': messages})
    
    # Conversations
    def list_conversations(self, persona_id=None):
        endpoint = f'/conversations?persona_id={persona_id}' if persona_id else '/conversations'
        return self.request(endpoint)
    
    def get_conversation(self, conversation_id):
        return self.request(f'/conversations/{conversation_id}')
```

#### Usage

```python
# app.py
from persona_client import PersonaClient

client = PersonaClient('YOUR_API_KEY')

def main():
    try:
        # List all personas
        personas = client.list_personas()
        print('My Personas:', personas)
        
        # Chat with a persona
        chat_response = client.chat_with_persona('YOUR_PERSONA_ID', [
            {'role': 'user', 'content': 'Hello, can you help me with a Python question?'}
        ])
        print('Chat Response:', chat_response)
        
        # Create a new persona
        new_persona = client.create_persona({
            'name': 'API Created Persona',
            'description': 'This persona was created via the API',
            'personality': ['friendly', 'helpful'],
            'knowledge': ['API usage', 'Python'],
            'tone': 'casual',
            'visibility': 'private'
        })
        print('New Persona:', new_persona)
    except Exception as e:
        print('Error:', str(e))

if __name__ == '__main__':
    main()
```

## Mobile App Integration

### React Native

Integrate Persona into a React Native application using a WebView.

#### Installation

```bash
npm install --save react-native-webview
```

#### Implementation

```jsx
// PersonaChat.jsx
import React, { useState } from 'react';
import { View, Button, StyleSheet, Modal } from 'react-native';
import { WebView } from 'react-native-webview';

const PersonaChat = ({
  personaId,
  apiKey,
  theme = 'light'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Create HTML content for the WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Chat</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        #chat-container {
          height: 100%;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div id="chat-container"></div>
      
      <script>
        // Load Persona Chat Widget
        (function() {
          const script = document.createElement('script');
          script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
          script.async = true;
          script.onload = function() {
            window.PersonaChat.init({
              personaId: '${personaId}',
              container: 'chat-container',
              apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
              apiKey: '${apiKey}',
              theme: '${theme}'
            });
          };
          document.head.appendChild(script);
        })();
      </script>
    </body>
    </html>
  `;
  
  return (
    <View style={styles.container}>
      <Button
        title="Chat with Assistant"
        onPress={() => setIsVisible(true)}
      />
      
      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalHeader}>
          <Button
            title="Close"
            onPress={() => setIsVisible(false)}
          />
        </View>
        
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  webview: {
    flex: 1
  }
});

export default PersonaChat;
```

#### Usage

```jsx
// App.jsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import PersonaChat from './PersonaChat';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My App</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.paragraph}>
          Welcome to my React Native app with Persona integration!
        </Text>
        
        <PersonaChat
          personaId="YOUR_PERSONA_ID"
          apiKey="YOUR_API_KEY"
          theme="light"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 24
  }
});

export default App;
```

## E-commerce Integration

### Product Support Assistant

Add a product-specific support assistant to an e-commerce product page.

#### HTML Implementation

```html
<div class="product-page">
  <div class="product-info">
    <h1>Wireless Bluetooth Headphones</h1>
    <p class="price">$129.99</p>
    <div class="product-description">
      <p>High-quality wireless headphones with noise cancellation...</p>
      <ul>
        <li>40-hour battery life</li>
        <li>Active noise cancellation</li>
        <li>Bluetooth 5.0 connectivity</li>
        <li>Built-in microphone for calls</li>
      </ul>
    </div>
    <button class="add-to-cart">Add to Cart</button>
  </div>
  
  <div class="product-support">
    <h2>Product Support</h2>
    <p>Have questions about this product? Chat with our product specialist:</p>
    
    <!-- Persona Chat Widget -->
    <div id="persona-chat-YOUR_PERSONA_ID"></div>
    <script>
    (function() {
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = function() {
        window.PersonaChat.init({
          personaId: 'YOUR_PERSONA_ID',
          container: 'persona-chat-YOUR_PERSONA_ID',
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: 'YOUR_API_KEY',
          theme: 'light',
          welcomeMessage: 'Hi there! I can help you with any questions about these wireless headphones. What would you like to know?'
        });
      };
      document.head.appendChild(script);
    })();
    </script>
    <!-- End Persona Chat Widget -->
  </div>
</div>
```

### Context-Aware Product Assistant

Pass product information to the chat widget for context-aware responses.

```html
<div class="product-page" id="product-12345">
  <div class="product-info">
    <h1>Wireless Bluetooth Headphones</h1>
    <p class="price">$129.99</p>
    <div class="product-description">
      <p>High-quality wireless headphones with noise cancellation...</p>
    </div>
    <button class="add-to-cart">Add to Cart</button>
  </div>
  
  <div class="product-support">
    <h2>Product Support</h2>
    <div id="persona-chat-container"></div>
    
    <script>
    (function() {
      // Get product information
      const productId = document.querySelector('.product-page').id.replace('product-', '');
      const productName = document.querySelector('.product-info h1').textContent;
      const productPrice = document.querySelector('.price').textContent;
      const productDescription = document.querySelector('.product-description').textContent;
      
      // Create context message
      const contextMessage = {
        role: 'system',
        content: `This conversation is about the following product:
Product ID: ${productId}
Name: ${productName}
Price: ${productPrice}
Description: ${productDescription}

The user is viewing this product page and may have questions about features, compatibility, or usage.`
      };
      
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = function() {
        window.PersonaChat.init({
          personaId: 'YOUR_PERSONA_ID',
          container: 'persona-chat-container',
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: 'YOUR_API_KEY',
          initialMessages: [contextMessage],
          welcomeMessage: `Hi there! I can help you with any questions about the ${productName}. What would you like to know?`
        });
      };
      document.head.appendChild(script);
    })();
    </script>
  </div>
</div>
```

## WordPress Integration

### WordPress Plugin

Create a simple WordPress plugin for Persona integration.

#### Plugin File Structure

```
persona-chat/
├── persona-chat.php
├── includes/
│   └── widget.php
├── admin/
│   └── settings.php
└── assets/
    └── css/
        └── persona-chat.css
```

#### Main Plugin File

```php
<?php
/**
 * Plugin Name: Persona Chat
 * Description: Integrate Persona AI chat widgets into your WordPress site
 * Version: 1.0.0
 * Author: Your Name
 */

// Exit if accessed directly
if (!defined('ABSPATH')) exit;

// Define plugin constants
define('PERSONA_CHAT_VERSION', '1.0.0');
define('PERSONA_CHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PERSONA_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once PERSONA_CHAT_PLUGIN_DIR . 'includes/widget.php';
require_once PERSONA_CHAT_PLUGIN_DIR . 'admin/settings.php';

// Register activation hook
register_activation_hook(__FILE__, 'persona_chat_activate');

function persona_chat_activate() {
    // Set default options
    add_option('persona_chat_settings', [
        'persona_id' => '',
        'api_key' => '',
        'theme' => 'light',
        'position' => 'bottom-right',
        'welcome_message' => 'Hello! How can I help you today?'
    ]);
}

// Enqueue scripts and styles
function persona_chat_enqueue_scripts() {
    wp_enqueue_style(
        'persona-chat-styles',
        PERSONA_CHAT_PLUGIN_URL . 'assets/css/persona-chat.css',
        [],
        PERSONA_CHAT_VERSION
    );
}
add_action('wp_enqueue_scripts', 'persona_chat_enqueue_scripts');

// Add chat widget to footer
function persona_chat_add_to_footer() {
    $settings = get_option('persona_chat_settings');
    
    if (empty($settings['persona_id']) || empty($settings['api_key'])) {
        return;
    }
    
    $persona_id = esc_attr($settings['persona_id']);
    $api_key = esc_attr($settings['api_key']);
    $theme = esc_attr($settings['theme']);
    $position = esc_attr($settings['position']);
    $welcome_message = esc_attr($settings['welcome_message']);
    
    if ($position === 'inline') {
        // For inline widgets, we'll use shortcodes instead
        return;
    }
    
    ?>
    <div id="persona-chat-button"></div>
    <div id="persona-chat-container" style="display: none;"></div>
    <script>
    (function() {
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = function() {
        // Create button
        const button = document.createElement('button');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        button.className = 'persona-chat-button';
        
        document.getElementById('persona-chat-button').appendChild(button);
        
        // Initialize chat widget
        const container = document.getElementById('persona-chat-container');
        let isOpen = false;
        
        button.addEventListener('click', () => {
          isOpen = !isOpen;
          container.style.display = isOpen ? 'block' : 'none';
          button.innerHTML = isOpen 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        });
        
        window.PersonaChat.init({
          personaId: '<?php echo $persona_id; ?>',
          container: 'persona-chat-container',
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: '<?php echo $api_key; ?>',
          theme: '<?php echo $theme; ?>',
          welcomeMessage: '<?php echo $welcome_message; ?>'
        });
      };
      document.head.appendChild(script);
    })();
    </script>
    <?php
}
add_action('wp_footer', 'persona_chat_add_to_footer');

// Register shortcode for inline chat widget
function persona_chat_shortcode($atts) {
    $settings = get_option('persona_chat_settings');
    
    if (empty($settings['persona_id']) || empty($settings['api_key'])) {
        return '<p>Persona Chat not configured. Please set up your API credentials.</p>';
    }
    
    $atts = shortcode_atts([
        'height' => '500px',
        'theme' => $settings['theme'],
        'welcome_message' => $settings['welcome_message']
    ], $atts);
    
    $persona_id = esc_attr($settings['persona_id']);
    $api_key = esc_attr($settings['api_key']);
    $height = esc_attr($atts['height']);
    $theme = esc_attr($atts['theme']);
    $welcome_message = esc_attr($atts['welcome_message']);
    
    $container_id = 'persona-chat-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo $container_id; ?>" style="height: <?php echo $height; ?>;"></div>
    <script>
    (function() {
      const script = document.createElement('script');
      script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
      script.async = true;
      script.onload = function() {
        window.PersonaChat.init({
          personaId: '<?php echo $persona_id; ?>',
          container: '<?php echo $container_id; ?>',
          apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
          apiKey: '<?php echo $api_key; ?>',
          theme: '<?php echo $theme; ?>',
          position: 'inline',
          welcomeMessage: '<?php echo $welcome_message; ?>'
        });
      };
      document.head.appendChild(script);
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('persona_chat', 'persona_chat_shortcode');
```

#### Settings Page

```php
<?php
// admin/settings.php

// Exit if accessed directly
if (!defined('ABSPATH')) exit;

// Add admin menu
function persona_chat_add_admin_menu() {
    add_options_page(
        'Persona Chat Settings',
        'Persona Chat',
        'manage_options',
        'persona-chat',
        'persona_chat_settings_page'
    );
}
add_action('admin_menu', 'persona_chat_add_admin_menu');

// Register settings
function persona_chat_register_settings() {
    register_setting('persona_chat_settings_group', 'persona_chat_settings');
}
add_action('admin_init', 'persona_chat_register_settings');

// Settings page content
function persona_chat_settings_page() {
    $settings = get_option('persona_chat_settings');
    ?>
    <div class="wrap">
        <h1>Persona Chat Settings</h1>
        
        <form method="post" action="options.php">
            <?php settings_fields('persona_chat_settings_group'); ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row">Persona ID</th>
                    <td>
                        <input type="text" name="persona_chat_settings[persona_id]" value="<?php echo esc_attr($settings['persona_id'] ?? ''); ?>" class="regular-text" />
                        <p class="description">Enter your Persona ID from the Persona platform.</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">API Key</th>
                    <td>
                        <input type="password" name="persona_chat_settings[api_key]" value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>" class="regular-text" />
                        <p class="description">Enter your API key from the Persona platform.</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">Theme</th>
                    <td>
                        <select name="persona_chat_settings[theme]">
                            <option value="light" <?php selected($settings['theme'] ?? 'light', 'light'); ?>>Light</option>
                            <option value="dark" <?php selected($settings['theme'] ?? 'light', 'dark'); ?>>Dark</option>
                        </select>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">Position</th>
                    <td>
                        <select name="persona_chat_settings[position]">
                            <option value="bottom-right" <?php selected($settings['position'] ?? 'bottom-right', 'bottom-right'); ?>>Bottom Right</option>
                            <option value="bottom-left" <?php selected($settings['position'] ?? 'bottom-right', 'bottom-left'); ?>>Bottom Left</option>
                            <option value="inline" <?php selected($settings['position'] ?? 'bottom-right', 'inline'); ?>>Inline (Use Shortcode)</option>
                        </select>
                        <p class="description">If you select "Inline", use the shortcode [persona_chat] to place the chat widget in your content.</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">Welcome Message</th>
                    <td>
                        <textarea name="persona_chat_settings[welcome_message]" rows="3" class="large-text"><?php echo esc_textarea($settings['welcome_message'] ?? 'Hello! How can I help you today?'); ?></textarea>
                        <p class="description">The initial message shown to users when they open the chat.</p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button(); ?>
        </form>
        
        <div class="card">
            <h2>Shortcode Usage</h2>
            <p>Use the following shortcode to add the chat widget to any post or page:</p>
            <code>[persona_chat]</code>
            
            <p>You can customize the widget with these attributes:</p>
            <ul>
                <li><code>height</code> - Height of the widget (default: 500px)</li>
                <li><code>theme</code> - Theme override (light or dark)</li>
                <li><code>welcome_message</code> - Custom welcome message</li>
            </ul>
            
            <p>Example:</p>
            <code>[persona_chat height="600px" theme="dark" welcome_message="Hi there! How can I assist you today?"]</code>
        </div>
    </div>
    <?php
}
```

#### CSS Styles

```css
/* assets/css/persona-chat.css */
.persona-chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.persona-chat-button:hover {
  background-color: #1d4ed8;
}

#persona-chat-container {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  height: 500px;
  z-index: 9999;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: white;
}

@media (max-width: 480px) {
  #persona-chat-container {
    width: calc(100% - 40px);
    height: 400px;
  }
}
```

## Conclusion

These integration examples demonstrate the flexibility of the Persona platform and how it can be incorporated into various applications and websites. By following these patterns, you can create seamless AI chat experiences for your users across different platforms and technologies.

For more advanced integrations or custom solutions, consider using the Persona API directly to build tailored experiences for your specific use case.