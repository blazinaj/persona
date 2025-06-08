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
  instructions?: string;
  voice?: {
    gender?: 'male' | 'female' | 'neutral';
    age?: 'young' | 'middle-aged' | 'elderly';
    accent?: string;
    pitch?: number;
    rate?: number;
  };
  visibility: 'private' | 'unlisted' | 'public';
  knowledgeEntries?: KnowledgeEntry[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  navigate?: (path: string) => void;
  isFavorited?: boolean;
  viewCount?: number;
  onToggleFavorite?: (id: string) => void;
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
  | 'neutral'
  | 'wise'
  | 'calm'
  | 'sarcastic'
  | 'efficient';

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
  isEncrypted?: boolean;
  originalContent?: string;
  wasEncrypted?: boolean;
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

export type KnowledgeEntry = {
  id: string;
  personaId: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type KnowledgeCategory = 
  | 'skills'
  | 'experiences'
  | 'facts'
  | 'preferences'
  | 'concepts'
  | 'procedures'
  | 'references'
  | 'custom';

export type Space = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  coordinatorInstructions?: string;
  members: SpaceMember[];
  inviteCode?: string;
  inviteCodeEnabled?: boolean;
  inviteCodeExpiresAt?: Date;
};

export type SpaceMember = {
  id: string;
  spaceId: string;
  personaId?: string;
  userId?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  personas?: Persona;
  profiles?: any;
};

export type SpaceMessage = {
  id: string;
  spaceId: string;
  content: string;
  personaId?: string;
  userId?: string;
  createdAt: Date;
  senderName?: string;
  senderAvatar?: string;
  isPersona?: boolean;
};

export type Memory = {
  id: string;
  personaId?: string;
  spaceId?: string;
  memoryKey: string;
  memoryValue: string;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
  createdByPersonaId?: string;
  createdByUserId?: string;
};

export interface SpreadsheetData {
  headers: string[];
  rows: string[][];
  rawCsv?: string;
}

export interface PDFDocument {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
  metadata?: {
    author?: string;
    date?: string;
    subject?: string;
    keywords?: string[];
  };
}

export interface EncryptionSettings {
  enabled: boolean;
  keyHash?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_public?: boolean;
  onboarding_completed?: boolean;
  role?: string;
  primary_intention?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpaceInvitation {
  id: string;
  spaceId: string;
  spaceName: string;
  role: 'admin' | 'member';
  createdAt: Date;
  expiresAt?: Date;
  createdByName?: string;
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requiresAuth: boolean;
  requestBody?: object;
  responseBody: object;
}