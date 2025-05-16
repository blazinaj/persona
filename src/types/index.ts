export type Persona = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  created: Date;
  lastModified: Date;
  tags?: string[];
  personality?: (PersonalityTrait | string)[];
  knowledge?: string[];
  tone?: string;
  examples?: string[];
  visibility: 'private' | 'unlisted' | 'public';
};

export type Conversation = {
  id: string;
  personaId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type PersonalityTrait = 
  | 'friendly'
  | 'professional'
  | 'humorous'
  | 'empathetic'
  | 'direct'
  | 'creative'
  | 'analytical'
  | 'motivational';

export type CommunicationTone =
  | 'formal'
  | 'casual'
  | 'technical'
  | 'supportive'
  | 'enthusiastic'
  | 'neutral';

export type KnowledgeArea =
  | 'programming'
  | 'design'
  | 'business'
  | 'science'
  | 'arts'
  | 'education'
  | 'health'
  | 'technology';

export type Integration = {
  id: string;
  personaId: string;
  name: string;
  description?: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  parameters: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  userId: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  personas: string[]; // IDs of created personas
};

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: Date;
}

export type PersonaTemplate = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  tags: string[];
  personality: PersonalityTrait[];
  knowledge: string[];
  tone: string;
  examples: string[];
};