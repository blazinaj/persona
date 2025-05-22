// Chat widget server implementation
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

// Widget JavaScript code
const widgetCode = `
// Persona Chat Widget
(function() {
  const PersonaChat = {
    init(config) {
      if (!config.personaId || !config.container) {
        console.error('Missing required configuration');
        return;
      }

      // Create widget
      const container = document.getElementById(config.container);
      if (!container) {
        console.error('Container element not found');
        return;
      }

      // Initialize widget UI and handlers
      this.createWidget(container, config);
    },

    createWidget(container, config) {
      // Widget HTML structure
      container.innerHTML = \`
        <div class="persona-chat">
          <div class="persona-chat-header">
            <div class="persona-chat-title">Chat</div>
          </div>
          <div class="persona-chat-messages"></div>
          <form class="persona-chat-input">
            <input type="text" placeholder="Type your message...">
            <button type="submit">Send</button>
          </form>
        </div>
      \`;

      // Add styles
      const styles = document.createElement('style');
      styles.textContent = \`
        .persona-chat {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 400px;
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .persona-chat-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .persona-chat-title {
          font-weight: 600;
          color: #111827;
        }
        .persona-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .persona-chat-message {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          line-height: 1.4;
        }
        .persona-chat-message.user {
          background: #2563eb;
          color: white;
          align-self: flex-end;
        }
        .persona-chat-message.assistant {
          background: #f3f4f6;
          color: #111827;
          align-self: flex-start;
        }
        .persona-chat-input {
          border-top: 1px solid #e5e7eb;
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
          background: white;
        }
        .persona-chat-input input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          outline: none;
        }
        .persona-chat-input input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px #2563eb;
        }
        .persona-chat-input button {
          padding: 0.5rem 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .persona-chat-input button:hover {
          background: #1d4ed8;
        }
        .persona-chat-input button:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }
      \`;
      document.head.appendChild(styles);

      // Initialize chat handlers
      this.initChat(container, config);
    },

    async initChat(container, config) {
      const form = container.querySelector('form');
      const input = container.querySelector('input');
      const messages = container.querySelector('.persona-chat-messages');
      const button = container.querySelector('button');
      
      // Generate unique session ID
      const sessionId = Math.random().toString(36).substring(2);

      const addMessage = (content, role) => {
        const messageEl = document.createElement('div');
        messageEl.className = \`persona-chat-message \${role}\`;
        messageEl.textContent = content;
        messages.appendChild(messageEl);
        messages.scrollTop = messages.scrollHeight;
      };

      form.onsubmit = async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        // Disable input while processing
        input.disabled = true;
        button.disabled = true;

        // Add user message immediately
        addMessage(message, 'user');
        
        // Clear input
        input.value = '';

        try {
          // Send message to chat API
          const response = await fetch(\`\${config.apiUrl}/widget-chat\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${config.apiKey}\`
            },
            body: JSON.stringify({
              message,
              personaId: config.personaId,
              sessionId
            })
          });

          if (!response.ok) throw new Error('Failed to send message');

          const data = await response.json();
          
          // Add response to chat
          addMessage(data.message, 'assistant');
        } catch (error) {
          console.error('Chat error:', error);
          addMessage('Sorry, something went wrong. Please try again.', 'assistant');
        } finally {
          // Re-enable input
          input.disabled = false;
          button.disabled = false;
          input.focus();
        }
      };
    }
  };

  // Export to window
  window.PersonaChat = PersonaChat;
})();
`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Serve widget JavaScript
  return new Response(
    widgetCode,
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000'
      }
    }
  );
});