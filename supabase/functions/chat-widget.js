// Chat widget JavaScript code
const widgetCode = `
// Persona Chat Widget
(function() {
  // Widget implementation
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
        }
        .persona-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .persona-chat-input {
          border-top: 1px solid #e5e7eb;
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
        }
        .persona-chat-input input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
        .persona-chat-input button {
          padding: 0.5rem 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .persona-chat-input button:hover {
          background: #1d4ed8;
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

      form.onsubmit = async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        // Clear input
        input.value = '';

        try {
          // Send message to chat API
          const response = await fetch(\`\${config.apiUrl}/chat\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${config.apiKey}\`
            },
            body: JSON.stringify({
              message,
              personaId: config.personaId
            })
          });

          if (!response.ok) throw new Error('Failed to send message');

          const data = await response.json();
          
          // Add response to chat
          const messageEl = document.createElement('div');
          messageEl.textContent = data.message;
          messages.appendChild(messageEl);
          messages.scrollTop = messages.scrollHeight;
        } catch (error) {
          console.error('Chat error:', error);
        }
      };
    }
  };

  // Export to window
  window.PersonaChat = PersonaChat;
})();
`;

export default widgetCode;