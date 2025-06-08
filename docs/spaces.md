# Space Coordinator and Persona Chat System Documentation

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
   ```
   "Hey @TechGuru, what do you think about this approach?"
   ```

2. **Knowledge Relevance**: Personas with relevant knowledge areas are more likely to respond
   ```sql
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
   ```

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

```javascript
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
      `${supabaseUrl}/functions/v1/room-coordinator`,
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
```

### 2. Backend Coordinator Processing

1. The `room-coordinator` Supabase Edge Function receives the message
2. It analyzes the message content and space context
3. It queries the database to select appropriate personas using functions like:
   - `select_responding_personas`
   - `should_persona_respond`
   - `message_relates_to_persona_expertise`

### 3. Persona Response Generation

For each selected persona:

1. The coordinator prepares context for the response
2. It calls the AI model with persona-specific context (personality, knowledge, tone)
3. It formats the response according to the persona's characteristics
4. It inserts the response into the `space_messages` table with the `persona_id`

### 4. Real-time Updates to Frontend

The frontend receives persona responses through Supabase's real-time subscription system:

```javascript
// SpaceChat.tsx - Real-time message subscription
const channel = supabase
  .channel(`space_messages_${space.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'space_messages',
    filter: `space_id=eq.${space.id}`
  }, handleRealtimeMessage)
  .subscribe();
```

When a new message is inserted:
1. The frontend receives a real-time notification
2. It updates the UI to display the new message
3. It removes the persona from the "is typing" state

## Memory System

The memory system captures and utilizes information from conversations:

1. **Memory Extraction**: Personas can create memories from conversations
   ```
   // Example memory format in messages
   [MEMORY: user_preference=User prefers technical explanations, importance=4]
   ```

2. **Memory Storage**:
   - `persona_memories` table for individual persona memories
   - `space_memories` table for shared context in spaces

3. **Memory Retrieval**: Memories are retrieved and used to provide context during response generation

## Suggestion System

The suggestion system provides contextually relevant message options:

```javascript
// SpaceChat.tsx
const generateSuggestions = async () => {
  try {
    setSuggestions([]); // Clear previous while loading
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-suggestions`,
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
```

The suggestions are generated based on:
1. Recent message history
2. Space context and purpose
3. Participant personalities and knowledge areas

## Technical Implementation Details

### Database Schema Relationships

The space messaging system relies on several interconnected tables:

- `spaces`: Stores space metadata and configuration
- `space_members`: Maps personas and users to spaces
- `space_messages`: Stores all messages in the space
- `space_memories`: Stores shared contextual memories

### Space Coordinator Functions

The coordinator uses several PostgreSQL functions:

1. `get_responding_personas`: Selects personas that should respond to a message
2. `should_persona_engage`: Determines if a specific persona should participate
3. `get_message_complexity`: Analyzes message complexity to determine response needs
4. `is_message_directed_at_persona`: Detects direct mentions and instructions

### Frontend-Backend Communication

1. **Message Insertion**: Frontend inserts user message into `space_messages`
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
4. **Memory Utilization**: Create explicit memories for important information