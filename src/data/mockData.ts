import { Persona, User } from '../types';

export const mockPersonas: Persona[] = [
  {
    id: '1',
    name: 'Technical Assistant',
    description: 'A helpful AI that specializes in programming and technical support.',
    avatar: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    created: new Date('2023-05-15'),
    lastModified: new Date('2023-06-20'),
    tags: ['technical', 'programming', 'support'],
    personality: ['professional', 'analytical'],
    knowledge: ['JavaScript', 'Python', 'React', 'Node.js'],
    tone: 'professional',
    examples: [
      'How would I implement a linked list in JavaScript?',
      'Can you explain the concept of dependency injection?'
    ],
    isPublic: true
  },
  {
    id: '2',
    name: 'Creative Writing Coach',
    description: 'An AI assistant that helps with creative writing and storytelling.',
    avatar: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    created: new Date('2023-04-10'),
    lastModified: new Date('2023-06-18'),
    tags: ['creative', 'writing', 'storytelling'],
    personality: ['creative', 'motivational', 'friendly'],
    knowledge: ['Fiction writing', 'Poetry', 'Character development', 'Plot structures'],
    tone: 'inspirational',
    examples: [
      'How can I develop a compelling antagonist?',
      'Give me some ideas for a sci-fi story set in the distant future.'
    ],
    isPublic: false
  },
  {
    id: '3',
    name: 'Fitness Trainer',
    description: 'An AI coach that provides workout routines and fitness advice.',
    avatar: 'https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    created: new Date('2023-03-22'),
    lastModified: new Date('2023-06-15'),
    tags: ['fitness', 'health', 'wellness'],
    personality: ['motivational', 'direct', 'empathetic'],
    knowledge: ['Exercise science', 'Nutrition', 'Weight training', 'Cardio workouts'],
    tone: 'encouraging',
    examples: [
      'Can you suggest a weekly workout routine for a beginner?',
      'What should I eat before and after a workout?'
    ],
    isPublic: true
  }
];

export const mockUser: User = {
  id: 'user1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  personas: ['1', '2', '3']
};