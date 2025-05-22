import { Book, Code, Puzzle, Zap, MessageSquare, Users, Star, Wrench, Lock, Globe } from 'lucide-react';

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
  }
];