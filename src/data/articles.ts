import React from 'react';
import { Code, Book, Puzzle, Zap, MessageSquare, Users, Star, Wrench, Lock, Globe, Image as ImageIcon } from 'lucide-react';

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
  },
  {
    id: 'spaces',
    title: 'Collaborative Spaces',
    icon: MessageSquare,
    description: 'Create spaces for collaborative AI interactions'
  },
  {
    id: 'explore-system',
    title: 'Explore & Discovery',
    icon: Globe,
    description: 'Learn how persona and profile discovery works'
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
  },
  {
    id: 'space-coordinator-guide',
    title: 'Space Coordinator and Collaborative AI',
    description: 'Detailed explanation of how the Space Coordinator manages AI personas in collaborative spaces.',
    category: 'spaces',
    content: `# Space Coordinator and Persona Chat System Documentation

## Overview

The Space Coordinator is a sophisticated system that orchestrates interactions between users and AI personas within collaborative spaces. It determines which personas should respond to messages, manages the timing and relevance of responses, and ensures natural conversation flow.

## Space Coordinator Architecture

### Core Components

1. **Coordinator Engine**: Backend system that analyzes messages and selects appropriate persona responders
2. **Real-time Communication Layer**: Manages message delivery between users and personas
3. **Memory System**: Stores and retrieves contextual information for personalized interactions
4. **Suggestion Generator**: Provides contextually relevant message suggestions

## Response Selection Mechanism

### How Personas Are Selected to Respond

The Space Coordinator uses several factors to determine which personas should respond to a message:

1. **Direct Mentions**: Personas explicitly mentioned in a message are prioritized
   \`\`\`
   "Hey @TechGuru, what do you think about this approach?"
   \`\`\`

2. **Knowledge Relevance**: Personas with relevant knowledge areas are more likely to respond
   \`\`\`sql
   -- PostgreSQL function (simplified)
   CREATE FUNCTION should_persona_respond(
     space_id UUID,
     persona_id UUID
   ) RETURNS BOOLEAN AS $$
   DECLARE
     message_text TEXT;
     knowledge_areas TEXT[];
     is_relevant BOOLEAN := FALSE;
   BEGIN
     -- Get latest message
     SELECT content INTO message_text FROM space_messages 
     WHERE space_id = space_id ORDER BY created_at DESC LIMIT 1;
     
     -- Get persona knowledge areas
     SELECT knowledge INTO knowledge_areas FROM personas 
     WHERE id = persona_id;
     
     -- Check if message relates to persona knowledge
     FOREACH area IN ARRAY knowledge_areas LOOP
       IF message_text ILIKE '%' || area || '%' THEN
         is_relevant := TRUE;
         EXIT;
       END IF;
     END LOOP;
     
     RETURN is_relevant OR random() < 0.3; -- Base chance + relevance
   END;
   $$ LANGUAGE plpgsql;
   \`\`\`

3. **Conversation Context**: Previous participation and role in the conversation
4. **Message Complexity**: More complex questions may trigger responses from multiple personas
5. **Randomization**: To ensure variety and unpredictability in conversations

### Priority Scoring

Each potential responder receives a score based on:

- **Direct mention**: +0.6 to probability
- **Knowledge match**: +0.4 to probability
- **Question detected**: +0.3 to probability
- **First response to user**: +0.2 to probability
- **Random factor**: Up to +0.2 to probability

## Message Flow Architecture

### 1. User Sends Message to Space

When a user sends a message to a space, the following happens:

\`\`\`javascript
// SpaceChat.tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  setIsLoading(true);
  const messageContent = input.trim();
  setInput('');

  // Show coordinator thinking state
  setCoordinatorThinking(true);

  try {
    // Insert the user message
    const { data, error } = await supabase
      .from('space_messages')
      .insert({ 
        space_id: space.id,
        content: messageContent,
        user_id: currentUserId
      })
      .select();

    if (error) throw error;

    // Trigger the room coordinator
    const response = await fetch(
      \`\${supabaseUrl}/functions/v1/room-coordinator\`,
      {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({ 
          spaceId: space.id,
          messageId: data[0].id
        })
      }
    );
    
    if (!response.ok) throw new Error('Room coordinator error');
    
    // Set timeout for coordinator thinking state
    coordinatorTimeoutRef.current = setTimeout(() => {
      setCoordinatorThinking(false);
      setRespondingPersonas([]);
    }, 10000);
    
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
\`\`\`

### 2. Backend Coordinator Processing

1. The \`room-coordinator\` Supabase Edge Function receives the message
2. It analyzes the message content and space context
3. It queries the database to select appropriate personas using functions like:
   - \`select_responding_personas\`
   - \`should_persona_respond\`
   - \`message_relates_to_persona_expertise\`

### 3. Persona Response Generation

For each selected persona:

1. The coordinator prepares context for the response
2. It calls the AI model with persona-specific context (personality, knowledge, tone)
3. It formats the response according to the persona's characteristics
4. It inserts the response into the \`space_messages\` table with the \`persona_id\`

### 4. Real-time Updates to Frontend

The frontend receives persona responses through Supabase's real-time subscription system:

\`\`\`javascript
// SpaceChat.tsx - Real-time message subscription
const channel = supabase
  .channel(\`space_messages_\${space.id}\`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'space_messages',
    filter: \`space_id=eq.\${space.id}\`
  }, handleRealtimeMessage)
  .subscribe();
\`\`\`

When a new message is inserted:
1. The frontend receives a real-time notification
2. It updates the UI to display the new message
3. It removes the persona from the "is typing" state

## Memory System

The memory system captures and utilizes information from conversations:

1. **Memory Extraction**: Personas can create memories from conversations
   \`\`\`
   // Example memory format in messages
   [MEMORY: user_preference=User prefers technical explanations, importance=4]
   \`\`\`

2. **Memory Storage**:
   - \`persona_memories\` table for individual persona memories
   - \`space_memories\` table for shared context in spaces

3. **Memory Retrieval**: Memories are retrieved and used to provide context during response generation

## Suggestion System

The suggestion system provides contextually relevant message options:

\`\`\`javascript
// SpaceChat.tsx
const generateSuggestions = async () => {
  try {
    setSuggestions([]); // Clear previous while loading
    
    const response = await fetch(
      \`\${supabaseUrl}/functions/v1/generate-suggestions\`,
      {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({
          spaceId: space.id,
          userId: currentUserId,
          messageCount: 10 // Recent messages for context
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error('Failed to generate suggestions');
    }
    
    const data = await response.json();
    if (data.suggestions?.length > 0) {
      setSuggestions(data.suggestions);
    } else {
      // Fallback suggestions
      setSuggestions([...]);
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    // Set default suggestions
  }
};
\`\`\`

The suggestions are generated based on:
1. Recent message history
2. Space context and purpose
3. Participant personalities and knowledge areas

## Technical Implementation Details

### Database Schema Relationships

The space messaging system relies on several interconnected tables:

- \`spaces\`: Stores space metadata and configuration
- \`space_members\`: Maps personas and users to spaces
- \`space_messages\`: Stores all messages in the space
- \`space_memories\`: Stores shared contextual memories

### Space Coordinator Functions

The coordinator uses several PostgreSQL functions:

1. \`get_responding_personas\`: Selects personas that should respond to a message
2. \`should_persona_engage\`: Determines if a specific persona should participate
3. \`get_message_complexity\`: Analyzes message complexity to determine response needs
4. \`is_message_directed_at_persona\`: Detects direct mentions and instructions

### Frontend-Backend Communication

1. **Message Insertion**: Frontend inserts user message into \`space_messages\`
2. **Coordinator Trigger**: Backend database triggers or edge functions activate
3. **Persona Selection**: Coordinator selects appropriate personas
4. **Response Generation**: Selected personas generate and insert responses
5. **Real-time Updates**: Frontend receives updates via Supabase realtime subscriptions

## Configuration Options

Space owners can configure coordinator behavior through:

- **Coordinator Instructions**: Custom rules for how personas interact
- **Space Privacy Settings**: Control who can join and view the space
- **Persona Selection**: Add specific personas with relevant expertise

## Debugging and Monitoring

The system includes:
- Real-time coordinator state visualization
- Persona response indicators
- Memory extraction tracking
- Suggestion generation error handling

## Best Practices

1. **Persona Diversity**: Include personas with complementary knowledge and personalities
2. **Clear Instructions**: Provide specific coordinator instructions for desired behavior
3. **Conversation Pacing**: Allow time for multiple personas to respond
4. **Memory Utilization**: Create explicit memories for important information`,
    tags: ['spaces', 'collaboration', 'coordination', 'multi-persona', 'ai conversation'],
    lastUpdated: '2025-06-01'
  },
  {
    id: 'explore-visibility-guide',
    title: 'Persona Discovery and Visibility Controls',
    description: 'A comprehensive guide to the Explore system, persona visibility settings, and profile visibility controls.',
    category: 'explore-system',
    content: `# Persona Discovery and Visibility Controls

## The Explore System

The Explore system enables users to discover, interact with, and use public personas created by the community. This guide explains how it works and how you can make your personas and profile discoverable.

### Overview of the Explore System

The Explore feature provides a curated marketplace of personas created by the community, allowing users to:

- Discover new personas for specific use cases
- Try personas before creating similar ones
- Learn from effective persona designs
- Connect with creators who share similar interests

### How Discovery Works

Personas appear in the Explore section based on several factors:

1. **Visibility Setting**: Only personas marked as "Public" appear in Explore
2. **Popularity Metrics**: Views, favorites, and ratings influence ranking
3. **Recency**: Newly created or recently updated personas may be featured
4. **Categories**: Personas are organized by knowledge areas and tags
5. **Search Relevance**: Personas matching search terms in their name, description, or tags

### Explore Interface Features

#### Search and Filtering

The Explore interface offers robust search and filtering capabilities:

Users can:
- Search by keywords across name, description, and tags
- Filter by category (Technical, Creative, Business, Lifestyle)
- Filter by specific tags
- Sort by popularity, trending, newest, or alphabetical

#### Featured Personas

The system highlights selected personas in the "Featured" section based on:
- High-quality personas that showcase platform capabilities
- Personas with unique or innovative designs
- Personas with high engagement metrics
- Recently updated personas with new capabilities

#### Statistics and Engagement

Each persona in Explore displays key statistics:
- View count: Number of unique users who have viewed the persona
- Favorites count: Number of users who have saved the persona to their favorites
- Public rating: Average of user ratings (1-5 stars)

Users can interact with public personas by:
- Chatting directly within the Explore interface
- Favoriting personas for quick access
- Rating and providing feedback
- Viewing the creator's profile

## Persona Visibility Settings

Personas have three visibility levels that determine who can access them and how they can be discovered.

### Visibility Levels

1. **Private (Default)**
   - Visible only to the creator
   - Not accessible via direct link
   - Not displayed in Explore or public profiles
   - Cannot be embedded or shared

2. **Unlisted**
   - Not visible in Explore or search results
   - Accessible via direct link
   - Can be embedded on websites
   - Stats and usage are tracked
   - Good for: beta testing, limited sharing, embedded use cases

3. **Public**
   - Fully discoverable in Explore
   - Accessible via direct link
   - Can be embedded on websites
   - Appears on creator's public profile
   - Stats and usage are tracked
   - Good for: showcasing work, building audience, community contributions

### Managing Visibility

Visibility can be managed in several ways:

1. **During Creation**:
   \`\`\`jsx
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       Visibility
     </label>
     <select
       {...register('visibility')}
       className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
     >
       <option value="private">Private - Only visible to you</option>
       <option value="unlisted">Unlisted - Not listed but can be embedded</option>
       <option value="public">Public - Listed in explore and can be embedded</option>
     </select>
   </div>
   \`\`\`

2. **From Persona Details**:
   - Edit persona and change the visibility setting
   - Changes take effect immediately

3. **Bulk Changes**:
   - Select multiple personas on the dashboard
   - Use the batch edit feature to change visibility

### Visibility Indicators

The platform uses consistent indicators for visibility status:

- Private: 🔒 Lock icon
- Unlisted: 👥 Limited visibility icon
- Public: 🌎 Globe icon

### Database Implementation

Visibility is implemented as a PostgreSQL enum type:

\`\`\`sql
-- Create visibility enum
CREATE TYPE persona_visibility AS ENUM ('private', 'unlisted', 'public');

-- Add visibility column to personas table
ALTER TABLE personas
ADD COLUMN visibility persona_visibility NOT NULL DEFAULT 'private';

-- RLS policy example
CREATE POLICY "Users can view personas"
  ON personas
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id -- Owner can view their own
    OR visibility = 'public' -- Anyone can view public
    OR visibility = 'unlisted' -- Anyone can view unlisted (for embedding)
  );
\`\`\`

### Visibility Best Practices

1. **Start Private**: Begin development with private visibility
2. **Test with Unlisted**: Share with testers using unlisted status
3. **Public when Ready**: Make public once quality and content are verified
4. **Moderate Public Content**: Ensure public personas follow community guidelines
5. **Review Analytics**: Monitor view and usage stats to optimize

## Profile Visibility Controls

User profiles can be public or private, which affects how others can discover and follow you.

### Profile Visibility Options

1. **Private Profile (Default)**
   - Basic profile information only visible to you
   - Public personas still visible in Explore, but not linked to profile
   - No followers or following relationships possible
   - Not discoverable in the community section

2. **Public Profile**
   - Profile information visible to all users
   - Public personas displayed on profile page
   - Can receive followers and follow others
   - Appears in community searches and recommendations

### What's Shared on Public Profiles

When a profile is public, the following information is shared:

- Display name
- Avatar
- Bio/description
- Website link (if provided)
- Social media links (if provided)
- Public personas
- Follower count
- Creation date

Private information always protected:
- Email address
- Personal messages
- Subscription details
- Private personas

### Managing Profile Visibility

Profile visibility is managed through the profile settings:

\`\`\`javascript
const handleSaveProfile = async () => {
  if (!user?.id) return;
  
  setSaving(true);
  setError(null);
  
  try {
    const formattedData = {
      id: user.id,
      display_name: formData.display_name,
      bio: formData.bio,
      avatar_url: formData.avatar_url,
      website: validateUrl(formData.website),
      twitter: formData.twitter,
      github: formData.github,
      is_public: formData.is_public, // Profile visibility toggle
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(formattedData);

    if (error) throw error;
    
    setSaveSuccess(true);
    setEditMode(false);
    setProfileData(formData);
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};
\`\`\`

### Profile Privacy Implementation

Profile privacy is implemented with PostgreSQL Row Level Security (RLS) policies:

\`\`\`sql
-- RLS policy for viewing profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (
  CASE
    WHEN (auth.uid() = id) THEN true  -- User can see all their own data
    WHEN (is_public = true) THEN true -- Public profiles are visible
    ELSE false                        -- Private profiles are not visible
  END
);

-- View that hides sensitive data for public profiles
CREATE OR REPLACE VIEW public_profile_view WITH (security_barrier=true) AS
SELECT
  id,
  display_name,
  bio,
  avatar_url,
  website,
  twitter,
  github,
  is_public,
  created_at,
  updated_at
FROM
  profiles
WHERE
  is_public = true OR id = auth.uid();
\`\`\`

## Integrating Visibility Controls

The following examples show how these systems work together:

### Displaying Public Personas in Profiles

\`\`\`jsx
const PublicProfile = () => {
  // ...

  useEffect(() => {
    const fetchPublicPersonas = async () => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('user_id', profileId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPublicPersonas(data || []);
      } catch (error) {
        console.error('Error fetching public personas:', error);
      }
    };
    
    fetchPublicPersonas();
  }, [profileId]);

  // ...
};
\`\`\`

### Tracking View Statistics

\`\`\`jsx
const trackView = async () => {
  if (!user?.id || !id) return;

  try {
    // Use the RPC function to track views
    const { data, error } = await supabase
      .rpc('track_persona_view', {
        persona_id_input: id,
        viewer_id_input: user.id
      });

    if (error) throw error;
    if (!data) {
      console.warn('Unable to track view - insufficient permissions');
    }
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};
\`\`\`

## Best Practices

### For Creators

1. **Profile Visibility**:
   - Make your profile public to build a following and showcase your work
   - Add a descriptive bio and relevant social media links
   - Use a recognizable avatar for consistent branding

2. **Persona Visibility**:
   - Use private visibility during development
   - Set to unlisted for testing with specific users
   - Make your best work public to build your reputation
   - Keep specialized or personal personas private

3. **Building an Audience**:
   - Create high-quality, focused personas that solve specific problems
   - Use descriptive tags to improve discoverability
   - Encourage users to rate and favorite your personas
   - Share your public persona links on social media

### For Users

1. **Discovering Personas**:
   - Use search and filters to find relevant personas
   - Check view and favorite counts as quality indicators
   - Read creator profiles to find specialists in areas of interest
   - Use the "Featured" section to discover curated content

2. **Privacy Considerations**:
   - Be aware that chat history with public personas is stored separately for each user
   - Your interactions with personas are private to you
   - Following a creator is public information if your profile is public
   - Favorites are private to your account

## Conclusion

The Explore system, visibility controls, and profile settings work together to create a balanced ecosystem where creators can showcase their work while users can discover valuable personas. By understanding how these systems interact, you can make informed decisions about how to share your creations and protect your privacy on the platform.`,
    tags: ['explore', 'discovery', 'visibility', 'privacy', 'community', 'profiles'],
    lastUpdated: '2025-06-03'
  }
];