import { Book, Code, Puzzle, Zap, MessageSquare, Users, Star, Wrench, Lock, Globe } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';

export interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
}

export interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const categories: Category[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    description: 'Learn the basics of creating and managing personas'
  },
  {
    id: 'features',
    title: 'Features',
    icon: Zap,
    description: 'Explore the powerful features available in the platform'
  },
  {
    id: 'integration',
    title: 'Integration Guide',
    icon: Puzzle,
    description: 'Learn how to integrate personas into your applications'
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    description: 'Complete API documentation and examples'
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: Star,
    description: 'Tips and guidelines for creating effective personas'
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Lock,
    description: 'Understanding security features and privacy controls'
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    description: 'Connect with other persona creators'
  },
  {
    id: 'avatar-generator',
    title: 'Avatar Generator',
    icon: ImageIcon, 
    description: 'Create custom avatars for your personas'
  },
  {
    id: 'custom-functions',
    title: 'Custom Functions',
    icon: Code,
    description: 'Extend personas with custom JavaScript functions'
  }
];

export const articles: Article[] = [
  {
    id: 'creating-first-persona',
    title: 'Creating Your First Persona',
    description: 'Learn how to create a new persona with custom personality traits, knowledge areas, and communication style.',
    category: 'getting-started',
    content: `# Creating Your First Persona

A persona is an AI agent with a unique personality, knowledge areas, and communication style. This guide will walk you through creating your first persona.

## Prerequisites
- A Persona account
- Basic understanding of AI concepts

## Step 1: Access the Dashboard
1. Log in to your account
2. Click the "Create New Persona" button in the top right

## Step 2: Define Basic Information
- Choose a descriptive name
- Add a clear description
- Upload an avatar (optional)

## Step 3: Configure Personality
- Select personality traits
- Define knowledge areas
- Set communication tone

## Step 4: Add Example Interactions
- Provide sample conversations
- Define expected responses
- Test different scenarios

## Step 5: Set Visibility
- Choose between private, unlisted, or public
- Configure sharing settings
- Set access permissions

## Next Steps
- Test your persona in chat
- Share with others
- Gather feedback and iterate`,
    tags: ['personas', 'basics', 'tutorial'],
    lastUpdated: '2025-05-17'
  },
  {
    id: 'personality-traits',
    title: 'Understanding Personality Traits',
    description: 'Deep dive into personality traits and how they shape your persona\'s behavior.',
    category: 'features',
    content: `# Understanding Personality Traits

Personality traits define how your persona interacts, communicates, and responds to different situations.

## Available Traits
- Friendly
- Professional
- Humorous
- Empathetic
- Direct
- Creative
- Analytical
- Motivational

## Impact on Behavior
Each trait influences:
- Response style
- Language choice
- Problem-solving approach
- Emotional expression

## Combining Traits
- Create balanced combinations
- Avoid conflicting traits
- Test different combinations

## Best Practices
1. Start with 2-3 core traits
2. Add complementary traits
3. Test and refine
4. Gather user feedback`,
    tags: ['personality', 'traits', 'behavior'],
    lastUpdated: '2025-05-16'
  },
  {
    id: 'embedding-guide',
    title: 'Embedding Personas in Your Website',
    description: 'Complete guide to embedding persona chat widgets in any website.',
    category: 'integration',
    content: `# Embedding Personas in Your Website

Learn how to integrate persona chat widgets into your website using our simple embed code.

## Prerequisites
- Public or unlisted persona
- Website with HTML access
- Basic understanding of web development

## Implementation Steps
1. Get embed code from persona settings
2. Add code to your HTML
3. Customize appearance
4. Test functionality

## Customization Options
- Widget size
- Position
- Colors
- Initial message

## Security Considerations
- Rate limiting
- Access controls
- Data privacy

## Example Code
\`\`\`html
<div id="persona-chat"></div>
<script src="https://persona.ai/embed.js"></script>
<script>
  PersonaChat.init({
    personaId: 'your-persona-id',
    theme: 'light'
  });
</script>
\`\`\``,
    tags: ['integration', 'embedding', 'website'],
    lastUpdated: '2025-05-15'
  },
  {
    id: 'api-authentication',
    title: 'API Authentication',
    description: 'Learn how to authenticate with the Persona API and manage access tokens.',
    category: 'api',
    content: `# API Authentication

Secure your API requests using our authentication system.

## Authentication Methods
1. API Keys
2. OAuth 2.0
3. JWT Tokens

## Getting Started
1. Generate API keys
2. Set up authentication
3. Make authenticated requests

## Example Request
\`\`\`javascript
const response = await fetch('https://api.persona.ai/v1/chat', {
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello',
    personaId: 'your-persona-id'
  })
});
\`\`\`

## Security Best Practices
- Rotate keys regularly
- Use environment variables
- Implement rate limiting
- Monitor usage`,
    tags: ['api', 'authentication', 'security'],
    lastUpdated: '2025-05-14'
  },
  {
    id: 'avatar-generator-guide',
    title: 'Using the Avatar Generator',
    description: 'Learn how to create custom avatars for your personas using AI or by uploading your own images.',
    category: 'avatar-generator',
    content: `# Avatar Generator

The Avatar Generator is a powerful feature that allows you to create custom avatars for your personas using AI or by uploading your own images.

## Overview

The Avatar Generator provides two main methods for creating persona avatars:

1. **AI Generation**: Create unique avatars by describing them in natural language
2. **Image Upload**: Upload your own images to use as avatars

## AI Avatar Generation

### How It Works

The AI Avatar Generator uses DALL-E 3 to create high-quality, custom avatars based on your text descriptions. The system is optimized for creating professional-looking profile pictures and avatars.

### Using the AI Generator

1. Navigate to the persona creation or edit screen
2. Click the "Generate" button next to the Avatar URL field
3. In the Avatar Generator modal, select the "AI Generate" tab
4. Enter a detailed description of the avatar you want to create
5. Select a style from the available options
6. Click "Generate Avatar"
7. Once generated, you can download, copy the URL, or use the avatar directly

### Writing Effective Prompts

For best results, include details about:

- **Facial features**: Eyes, hair, skin tone, facial structure
- **Expression**: Smiling, serious, thoughtful
- **Style**: Professional, casual, artistic
- **Lighting**: Soft, dramatic, natural
- **Background**: Simple, gradient, contextual`,
    tags: ['avatar', 'AI', 'customization'],
    lastUpdated: '2025-05-18'
  },
  {
    id: 'custom-functions-guide',
    title: 'Implementing Custom Functions',
    description: 'Learn how to extend your personas with custom JavaScript functions for advanced capabilities.',
    category: 'custom-functions',
    content: `# Custom Functions

Custom Functions allow you to extend your personas with JavaScript code that can be executed during chat interactions. This powerful feature enables your personas to perform calculations, format data, make API calls, and more.

## Overview

Custom Functions are JavaScript functions that:

- Are associated with a specific persona
- Can be called during chat interactions
- Run in a secure, sandboxed environment
- Return structured data that the persona can use in its responses

## Creating Custom Functions

### Access the Function Editor

1. Navigate to your persona's detail page
2. Click the "Functions" button in the top navigation
3. Click "Add Function" to create a new function

### Function Structure

Each function must follow this structure:

\`\`\`javascript
async function execute(input) {
  try {
    // Your code here
    
    // Return success response with result
    return { 
      success: true, 
      result: "Your result here" 
    };
  } catch (error) {
    // Return error response
    return { 
      success: false, 
      error: error.message 
    };
  }
}
\`\`\``,
    tags: ['functions', 'javascript', 'development'],
    lastUpdated: '2025-05-19'
  }
];