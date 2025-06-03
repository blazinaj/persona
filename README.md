[![Netlify Status](https://api.netlify.com/api/v1/badges/eb184d28-66a4-4c87-a7a8-67dcaf6e9cbb/deploy-status)](https://app.netlify.com/sites/persona-app/deploys)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3FCF8E?logo=supabase)](https://supabase.com/)

# Persona - AI Agent Creation Platform

Create, customize, and manage AI agents with different personalities and skill sets. Live demo: [View Demo](https://personify.mobi)

## Features

- **Create Custom AI Personas**: Design AI agents with unique personalities, knowledge areas, and communication styles
- **Custom JavaScript Functions**: Add JavaScript functions to extend persona capabilities 
- **Persona Management**: Edit, duplicate, and delete personas
- **Rich Persona Details**: Define traits, knowledge areas, example interactions, and more
- **Embeddable Chat Widget**: Easily embed your public personas into any website
- **Collaborative Spaces**: Create spaces where multiple personas and users can interact
- **End-to-End Encryption**: Optional encryption for private conversations with personas
- **Image Generation**: Generate images using natural language descriptions
- **PDF Generation & Viewing**: Create and view PDF documents and reports
- **Spreadsheet Support**: View and manipulate CSV/tabular data
- **Voice Input/Output**: Use speech recognition and text-to-speech for natural interactions
- **Smart Suggestions**: Context-aware chat suggestions for better interactions
- **Conversation Management**: Save, organize, and continue multiple conversations
- **Message Actions**: Copy messages, download generated files and images
- **Responsive Design**: Fully responsive interface that works on all devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS
- **Code Editor**: Built-in Monaco editor for writing custom functions
- **Type Safety**: Built with TypeScript for enhanced reliability
- **Subscription Plans**: Flexible usage-based pricing with free trial option
- **Memory Management**: Create and manage memories for personas and spaces
- **Knowledge Base**: Add structured knowledge to personas to enhance responses

## Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **PDF Handling**: jsPDF, react-pdf
- **Encryption**: crypto-js
- **Voice**: Web Speech API
- **Backend**: Supabase (Auth, Database, Storage, Functions)
- **Deployment**: Netlify

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/             # Reusable UI components
│   └── chat/           # Chat-related components
├── data/               # Templates and constants
├── hooks/              # Custom React hooks
├── lib/                # Core utilities and services
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Key Features in Detail

### Persona Creation
- Define personality traits, knowledge areas, communication style
- AI assistance for persona creation
- Batch generation of multiple personas
- Voice settings configuration
- Custom instructions for complex behavior

### Chat Features
- Real-time conversations with personas
- End-to-end encrypted messages
- Voice input/output capabilities
- Image generation via text prompts
- PDF document generation
- CSV/table data visualization
- Interactive message elements (buttons, checklists, keywords)
- Conversation history and management
- Smart context-aware suggestions
- Knowledge retrieval from structured data

### Spaces
- Collaborative environments with multiple personas
- Public and private space options
- Custom coordinator instructions
- Member management
- Space memory system for context persistence

### Customization & Extensions
- Custom JavaScript functions for advanced capabilities
- Knowledge base management
- Memory systems for personalized interactions
- API integration for extended functionality

### Security Features
- End-to-end encryption for private chats
- API key management
- Secure authentication and permissions

### User Management
- Public/private profiles
- Followers system
- Persona sharing and discovery
- Usage analytics and stats

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```