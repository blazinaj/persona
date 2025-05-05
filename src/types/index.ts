export type Persona = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  created: Date;
  lastModified: Date;
  tags: string[];
  personality: PersonalityTrait[];
  knowledge: string[];
  tone: string;
  examples: string[];
  isPublic: boolean;
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

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  personas: string[]; // IDs of created personas
};