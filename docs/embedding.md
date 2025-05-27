# Embedding Personas in Your Website

This guide explains how to embed Persona chat widgets into any website, allowing your visitors to interact with your public personas.

## Overview

The Persona embedding feature allows you to:

- Add an AI chat widget to any website
- Customize the appearance and behavior of the widget
- Track usage and interactions
- Provide a seamless experience for your visitors

## Prerequisites

Before embedding a persona, ensure:

1. Your persona is set to **Public** or **Unlisted** visibility
2. You have access to edit the HTML of the website where you want to embed the persona

## Getting the Embed Code

1. Navigate to your persona's detail page
2. Click the "Embed" button in the top navigation
3. The embed code will be displayed in a modal window
4. Click "Copy" to copy the code to your clipboard

## Basic Implementation

Add the embed code to your website's HTML where you want the chat widget to appear:

```html
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
      apiKey: 'YOUR_API_KEY'
    });
  };
  document.head.appendChild(script);
})();
</script>
<!-- End Persona Chat Widget -->
```

Replace `YOUR_PERSONA_ID` with your actual persona ID. The API key is automatically included in the generated embed code.

## Customization Options

You can customize the widget by adding options to the `init` function:

```javascript
window.PersonaChat.init({
  personaId: 'YOUR_PERSONA_ID',
  container: 'persona-chat-YOUR_PERSONA_ID',
  apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
  apiKey: 'YOUR_API_KEY',
  theme: 'light',
  position: 'bottom-right',
  width: '350px',
  height: '500px',
  title: 'Chat with My Assistant',
  welcomeMessage: 'Hello! How can I help you today?',
  placeholder: 'Type your message...',
  buttonText: 'Send',
  buttonIcon: true
});
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| personaId | string | *required* | The ID of your persona |
| container | string | *required* | The ID of the container element |
| apiUrl | string | *required* | The API URL |
| apiKey | string | *required* | The API key |
| theme | string | 'light' | Widget theme ('light' or 'dark') |
| position | string | 'bottom-right' | Widget position ('bottom-right', 'bottom-left', 'top-right', 'top-left', or 'inline') |
| width | string | '350px' | Widget width |
| height | string | '500px' | Widget height |
| title | string | 'Chat' | Widget title |
| welcomeMessage | string | '' | Initial message from the assistant |
| placeholder | string | 'Type your message...' | Input placeholder text |
| buttonText | string | 'Send' | Send button text |
| buttonIcon | boolean | true | Whether to show the send icon |

## Advanced Implementation

### Floating Chat Button

To create a floating chat button that opens the widget when clicked:

```html
<!-- Persona Chat Widget -->
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
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#2563eb';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    
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
      personaId: 'YOUR_PERSONA_ID',
      container: 'persona-chat-container',
      apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
      apiKey: 'YOUR_API_KEY',
      position: 'bottom-right',
      width: '350px',
      height: '500px'
    });
  };
  document.head.appendChild(script);
})();
</script>
<!-- End Persona Chat Widget -->
```

### Multiple Personas on One Page

To embed multiple personas on the same page:

```html
<!-- First Persona -->
<div id="persona-chat-FIRST_PERSONA_ID"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
  script.async = true;
  script.onload = function() {
    window.PersonaChat.init({
      personaId: 'FIRST_PERSONA_ID',
      container: 'persona-chat-FIRST_PERSONA_ID',
      apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
      apiKey: 'YOUR_API_KEY',
      title: 'Chat with First Persona'
    });
  };
  document.head.appendChild(script);
})();
</script>

<!-- Second Persona -->
<div id="persona-chat-SECOND_PERSONA_ID"></div>
<script>
(function() {
  // Check if script is already loaded
  if (window.PersonaChat) {
    window.PersonaChat.init({
      personaId: 'SECOND_PERSONA_ID',
      container: 'persona-chat-SECOND_PERSONA_ID',
      apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
      apiKey: 'YOUR_API_KEY',
      title: 'Chat with Second Persona'
    });
  } else {
    const script = document.createElement('script');
    script.src = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js';
    script.async = true;
    script.onload = function() {
      window.PersonaChat.init({
        personaId: 'SECOND_PERSONA_ID',
        container: 'persona-chat-SECOND_PERSONA_ID',
        apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
        apiKey: 'YOUR_API_KEY',
        title: 'Chat with Second Persona'
      });
    };
    document.head.appendChild(script);
  }
})();
</script>
```

## Styling the Widget

### Custom CSS

You can customize the widget's appearance by adding CSS to your website:

```css
/* Chat container */
.persona-chat {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
}

/* Chat header */
.persona-chat-header {
  background-color: #4f46e5 !important;
  color: white !important;
}

/* Chat messages from the assistant */
.persona-chat-message.assistant {
  background-color: #f3f4f6 !important;
  border-radius: 12px !important;
}

/* Chat messages from the user */
.persona-chat-message.user {
  background-color: #4f46e5 !important;
  color: white !important;
  border-radius: 12px !important;
}

/* Input area */
.persona-chat-input input {
  border-radius: 20px !important;
}

/* Send button */
.persona-chat-input button {
  background-color: #4f46e5 !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
}
```

### Theme Customization

For more extensive customization, you can create a custom theme:

```javascript
window.PersonaChat.init({
  personaId: 'YOUR_PERSONA_ID',
  container: 'persona-chat-YOUR_PERSONA_ID',
  apiUrl: 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1',
  apiKey: 'YOUR_API_KEY',
  theme: {
    colors: {
      primary: '#4f46e5',
      secondary: '#f3f4f6',
      text: '#111827',
      textInverse: '#ffffff',
      background: '#ffffff',
      border: '#e5e7eb'
    },
    fonts: {
      body: 'Inter, system-ui, sans-serif',
      size: '14px'
    },
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
  }
});
```

## Tracking and Analytics

### Session Tracking

Each chat session is assigned a unique session ID that persists across page reloads. This allows you to track conversations over time.

### Usage Metrics

You can view usage metrics for your embedded personas in the Persona dashboard:

1. Navigate to your persona's detail page
2. Click on the "Analytics" tab
3. View metrics such as:
   - Total sessions
   - Messages per session
   - Average session duration
   - Most common user queries
   - Geographic distribution of users

## Security Considerations

### Cross-Origin Resource Sharing (CORS)

The widget is configured to work across different domains. No additional CORS configuration is needed.

### Data Privacy

- Chat messages are stored in your Persona account
- User sessions are anonymous by default
- No personal information is collected unless explicitly provided by the user

### Rate Limiting

Embedded widgets are subject to the same rate limits as the API:

- 60 requests per minute per widget
- 1000 requests per day for free tier users
- Higher limits for paid subscription plans

## Troubleshooting

### Widget Not Loading

- Check that your persona is set to Public or Unlisted visibility
- Verify that the persona ID in the embed code is correct
- Ensure the script is being loaded from the correct URL
- Check for JavaScript errors in your browser's developer console

### Widget Loads But Doesn't Respond

- Verify that your API key is valid
- Check that your persona is active
- Ensure you haven't exceeded your rate limits
- Look for error messages in the browser console

### Styling Issues

- Inspect the widget elements using your browser's developer tools
- Ensure your CSS selectors are specific enough
- Check for CSS conflicts with your website's existing styles

## Examples

### Simple Blog Integration

```html
<article>
  <h1>My Blog Post</h1>
  <p>This is my blog post content...</p>
  
  <div class="chat-container">
    <h3>Have Questions? Chat with our AI Assistant</h3>
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
          position: 'inline',
          height: '400px'
        });
      };
      document.head.appendChild(script);
    })();
    </script>
  </div>
</article>
```

### E-commerce Product Support

```html
<div class="product-page">
  <div class="product-info">
    <h1>Product Name</h1>
    <p>Product description...</p>
    <button class="buy-button">Add to Cart</button>
  </div>
  
  <div class="product-support">
    <button id="open-chat" class="support-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Product Support
    </button>
    
    <div id="chat-container" style="display: none;">
      <div id="persona-chat-YOUR_PERSONA_ID"></div>
    </div>
    
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
          title: 'Product Support',
          welcomeMessage: 'Hello! I can help you with questions about this product.'
        });
        
        const openChatButton = document.getElementById('open-chat');
        const chatContainer = document.getElementById('chat-container');
        
        openChatButton.addEventListener('click', () => {
          chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
        });
      };
      document.head.appendChild(script);
    })();
    </script>
  </div>
</div>
```

## Support

If you encounter issues with the embedding feature, please contact our support team at support@personify.mobi or visit our [help center](https://personify.mobi/resources).